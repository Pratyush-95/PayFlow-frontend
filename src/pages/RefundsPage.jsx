
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  RotateCcw,
  ReceiptText,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  IndianRupee,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import './RefundsPage.css';

const getItems = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.refunds)) return data.refunds;
  return [];
};

const money = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDate = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
};

const getStatus = (status) => String(status || 'PENDING').toUpperCase();

function StatusBadge({ status }) {
  const normalized = getStatus(status);

  const icon =
    normalized === 'PROCESSED' || normalized === 'SUCCESS'
      ? <CheckCircle2 size={15} />
      : normalized === 'FAILED'
        ? <XCircle size={15} />
        : <Clock3 size={15} />;

  return (
    <span className={`refund-status refund-status-${normalized.toLowerCase()}`}>
      {icon}
      {normalized}
    </span>
  );
}

export default function RefundsPage() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadRefundData = useCallback(async () => {
    setLoading(true);
    setError('');
    setNotice('');

    try {
      // Load authenticated merchant's payments.
      const paymentResponse = await api.get('/payments', {
        params: { page: 0, size: 100 },
      });

      const paymentItems = getItems(paymentResponse.data);
      setPayments(paymentItems);

      // Refund history is available per payment in the current backend.
      const refundResults = await Promise.all(
        paymentItems.map(async (payment) => {
          if (!payment.id) return [];

          try {
            const response = await api.get(
              `/payments/${payment.id}/refunds`
            );

            return getItems(response.data).map((refund) => ({
              ...refund,
              paymentId: payment.id,
              paymentDescription:
                payment.description || 'PayFlow Payment',
              paymentAmount: payment.amount,
              currency: payment.currency || 'INR',
            }));
          } catch (requestError) {
            // Do not hide the entire page if one payment's history fails.
            console.error(
              `Could not load refunds for payment ${payment.id}`,
              requestError
            );
            return [];
          }
        })
      );

      const allRefunds = refundResults.flat().sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );

      setRefunds(allRefunds);

      setSelectedPaymentId((current) => {
        if (current && paymentItems.some((p) => p.id === current)) {
          return current;
        }
        return paymentItems.find(
          (p) => getStatus(p.status) === 'SUCCESS'
        )?.id || '';
      });
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('payflow_token');
        sessionStorage.removeItem('payflow_email');
        navigate('/login');
        return;
      }

      setError(
        requestError.response?.data?.message ||
          'Could not load payment data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadRefundData();
  }, [loadRefundData]);

  const selectedPayment = payments.find(
    (payment) => payment.id === selectedPaymentId
  );

  const eligiblePayments = payments.filter(
    (payment) => getStatus(payment.status) === 'SUCCESS'
  );

  const filteredRefunds = useMemo(() => {
    const search = query.trim().toLowerCase();

    return refunds.filter((refund) => {
      const status = getStatus(refund.status);
      const matchesStatus =
        statusFilter === 'ALL' || status === statusFilter;

      const searchable = [
        refund.id,
        refund.razorpayRefundId,
        refund.paymentId,
        refund.paymentDescription,
        refund.reason,
        status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && searchable.includes(search);
    });
  }, [refunds, query, statusFilter]);

  const processedCount = refunds.filter(
    (refund) => getStatus(refund.status) === 'PROCESSED'
  ).length;

  const pendingCount = refunds.filter(
    (refund) => getStatus(refund.status) === 'PENDING'
  ).length;

  const failedCount = refunds.filter(
    (refund) => getStatus(refund.status) === 'FAILED'
  ).length;

  const processedAmount = refunds
    .filter((refund) => getStatus(refund.status) === 'PROCESSED')
    .reduce((total, refund) => total + Number(refund.amount || 0), 0);

  const handleRefund = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!selectedPaymentId) {
      setError('Select a successful payment first.');
      return;
    }

    if (getStatus(selectedPayment?.status) !== 'SUCCESS') {
      setError('Only successful payments can be refunded.');
      return;
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid refund amount greater than zero.');
      return;
    }

    if (!window.confirm(
      `Submit a refund request for ${money(
        numericAmount,
        selectedPayment?.currency || 'INR'
      )}?`
    )) {
      return;
    }

    setSubmitting(true);

    try {
      // UUID satisfies the backend's 16–100 character idempotency-key rule.
      const idempotencyKey = crypto.randomUUID();

      await api.post(
        `/payments/${selectedPaymentId}/refunds`,
        {
          amount: numericAmount,
          reason: reason.trim() || 'Customer refund request',
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        }
      );

      setNotice(
        'Refund request submitted. Its status will appear after the backend response is refreshed.'
      );
      setAmount('');
      setReason('');
      await loadRefundData();
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        sessionStorage.removeItem('payflow_token');
        sessionStorage.removeItem('payflow_email');
        navigate('/login');
        return;
      }

      setError(
        requestError.response?.data?.message ||
          'Refund request failed. Check the payment and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="refunds-page">
      <header className="refunds-header">
        <button
          className="refunds-icon-button"
          type="button"
          onClick={() => navigate('/dashboard')}
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="refunds-heading">
          <span className="refunds-eyebrow">PAYMENT MANAGEMENT</span>
          <h1>Refunds</h1>
          <p>Review refund history and submit refund requests.</p>
        </div>

        <button
          className="refunds-refresh-button"
          type="button"
          onClick={loadRefundData}
          disabled={loading}
        >
          <RefreshCw size={17} className={loading ? 'refunds-spin' : ''} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="refunds-alert refunds-alert-error" role="alert">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="refunds-alert refunds-alert-success" role="status">
          <CheckCircle2 size={19} />
          <span>{notice}</span>
        </div>
      )}

      <section className="refunds-stats">
        <article className="refunds-stat-card">
          <span className="refunds-stat-icon"><ReceiptText size={21} /></span>
          <p>Total refund records</p>
          <h2>{loading ? '—' : refunds.length}</h2>
          <span>Refunds returned by your backend</span>
        </article>

        <article className="refunds-stat-card processed">
          <span className="refunds-stat-icon"><CheckCircle2 size={21} /></span>
          <p>Processed refunds</p>
          <h2>{loading ? '—' : processedCount}</h2>
          <span>{money(processedAmount)} processed</span>
        </article>

        <article className="refunds-stat-card pending">
          <span className="refunds-stat-icon"><Clock3 size={21} /></span>
          <p>Pending refunds</p>
          <h2>{loading ? '—' : pendingCount}</h2>
          <span>Awaiting final status</span>
        </article>

        <article className="refunds-stat-card failed">
          <span className="refunds-stat-icon"><XCircle size={21} /></span>
          <p>Failed refunds</p>
          <h2>{loading ? '—' : failedCount}</h2>
          <span>Requests marked failed</span>
        </article>
      </section>

      <section className="refunds-layout">
        <form className="refunds-form-card" onSubmit={handleRefund}>
          <div className="refunds-card-heading">
            <span className="refunds-form-icon"><RotateCcw size={21} /></span>
            <div>
              <h2>Issue a refund</h2>
              <p>Choose a successful payment to refund.</p>
            </div>
          </div>

          <label htmlFor="refund-payment">Payment</label>
          <select
            id="refund-payment"
            value={selectedPaymentId}
            onChange={(event) => {
              setSelectedPaymentId(event.target.value);
              setAmount('');
            }}
            disabled={loading || submitting}
            required
          >
            <option value="">Select a successful payment</option>
            {eligiblePayments.map((payment) => (
              <option key={payment.id} value={payment.id}>
                {payment.description || 'PayFlow Payment'} —{' '}
                {money(payment.amount, payment.currency)} —{' '}
                {String(payment.id).slice(0, 8)}
              </option>
            ))}
          </select>

          {selectedPayment && (
            <div className="refunds-payment-summary">
              <span>Selected payment amount</span>
              <strong>
                {money(selectedPayment.amount, selectedPayment.currency)}
              </strong>
              <small>Payment ID: {selectedPayment.id}</small>
            </div>
          )}

          <label htmlFor="refund-amount">Refund amount</label>
          <div className="refunds-amount-input">
            <IndianRupee size={18} />
            <input
              id="refund-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Enter amount"
              disabled={!selectedPayment || submitting}
              required
            />
          </div>

          <label htmlFor="refund-reason">Reason (optional)</label>
          <textarea
            id="refund-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={250}
            placeholder="Describe why this refund is being requested"
            rows={3}
            disabled={submitting}
          />

          <button
            className="refunds-submit-button"
            type="submit"
            disabled={
              loading ||
              submitting ||
              !selectedPayment ||
              getStatus(selectedPayment?.status) !== 'SUCCESS'
            }
          >
            <RotateCcw size={18} />
            {submitting ? 'Submitting refund…' : 'Submit refund request'}
          </button>

          <p className="refunds-secure-note">
            Refunds are processed by your backend through Razorpay. Final status
            depends on the backend response and subsequent reconciliation.
          </p>

          {!loading && eligiblePayments.length === 0 && (
            <p className="refunds-inline-note">
              No successful payments are available for refund.
            </p>
          )}
        </form>

        <section className="refunds-history-card">
          <div className="refunds-history-heading">
            <div>
              <h2>Refund history</h2>
              <p>Refund records loaded from your backend.</p>
            </div>
            <span className="refunds-record-count">
              {filteredRefunds.length} records
            </span>
          </div>

          <div className="refunds-filters">
            <div className="refunds-search">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search refund or payment ID..."
                aria-label="Search refund history"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter refunds by status"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSED">Processed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {loading ? (
            <div className="refunds-empty-state">
              <RefreshCw size={24} className="refunds-spin" />
              <h3>Loading refund history</h3>
              <p>Fetching payment and refund records.</p>
            </div>
          ) : filteredRefunds.length === 0 ? (
            <div className="refunds-empty-state">
              <ReceiptText size={30} />
              <h3>No refunds found</h3>
              <p>
                {refunds.length === 0
                  ? 'No refund records were returned for your payments yet.'
                  : 'Try changing your search or status filter.'}
              </p>
            </div>
          ) : (
            <div className="refunds-table-wrap">
              <table className="refunds-table">
                <thead>
                  <tr>
                    <th>Refund</th>
                    <th>Payment</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRefunds.map((refund, index) => (
                    <tr key={refund.id || refund.razorpayRefundId || index}>
                      <td>
                        <strong>
                          {String(refund.id || '—').slice(0, 12)}
                        </strong>
                        <small>
                          {refund.razorpayRefundId || refund.reason || 'Refund'}
                        </small>
                      </td>
                      <td>
                        <strong>{refund.paymentDescription}</strong>
                        <small>{refund.paymentId}</small>
                      </td>
                      <td className="refunds-amount-cell">
                        {money(refund.amount, refund.currency)}
                      </td>
                      <td>{formatDate(refund.createdAt)}</td>
                      <td><StatusBadge status={refund.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
