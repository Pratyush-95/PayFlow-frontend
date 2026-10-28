
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  CreditCard,
  ReceiptText,
  Search,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock3,
  XCircle,
  Wrench,
} from 'lucide-react';
import api from '../lib/api.js';
import './PaymentToolsPage.css';

const formatMoney = (amount, currency = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount ?? 0));
  } catch {
    return `${currency} ${amount ?? 0}`;
  }
};

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
};

function getStatusIcon(status) {
  switch (String(status || '').toUpperCase()) {
    case 'SUCCESS':
      return CheckCircle2;
    case 'PENDING':
    case 'CREATED':
      return Clock3;
    case 'FAILED':
      return XCircle;
    default:
      return Clock3;
  }
}

export default function PaymentToolsPage() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const loadPayments = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError('');

    try {
      const response = await api.get('/payments', {
        params: { page: 0, size: 5 },
      });

      const data = response.data;
      const records = Array.isArray(data)
        ? data
        : data?.content ?? data?.items ?? [];

      setPayments(records);
    } catch (err) {
      if (err.response?.status === 401) {
        sessionStorage.removeItem('payflow_token');
        sessionStorage.removeItem('payflow_email');
        navigate('/login');
        return;
      }

      setError(
        err.response?.data?.message ||
          'Unable to load recent payments from the backend.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const searchPayment = async (event) => {
    event.preventDefault();

    const id = paymentId.trim();
    if (!id) {
      setSearchError('Enter a payment ID first.');
      return;
    }

    setSearching(true);
    setSearchError('');

    try {
      const response = await api.get(
        `/payments/${encodeURIComponent(id)}`
      );

      const foundPayment = response.data;

      if (foundPayment?.id) {
        navigate(`/transactions/${foundPayment.id}`);
      } else {
        setSearchError('The backend did not return a valid payment ID.');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        sessionStorage.removeItem('payflow_token');
        sessionStorage.removeItem('payflow_email');
        navigate('/login');
        return;
      }

      setSearchError(
        err.response?.data?.message ||
          'Payment not found. Check the full internal payment ID.'
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <main className="payment-tools-page">
      <header className="payment-tools-header">
        <button
          className="payment-tools-back"
          onClick={() => navigate('/dashboard')}
          type="button"
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="payment-tools-heading-row">
          <div>
            <h1>Payment Tools</h1>
            <p>Manage payment creation, history and payment lookup.</p>
          </div>

          <button
            className="pt-secondary-button"
            onClick={() => loadPayments(true)}
            disabled={refreshing}
            type="button"
          >
            <RefreshCw
              size={17}
              className={refreshing ? 'pt-spin' : ''}
            />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      <section className="payment-tools-content">
        <div className="pt-welcome-card">
          <div className="pt-welcome-icon">
            <Wrench size={25} />
          </div>
          <div>
            <h2>Your payment workspace</h2>
            <p>
              Create payment orders, inspect existing transactions and
              review their latest status.
            </p>
          </div>
        </div>

        <div className="pt-tools-grid">
          <article className="pt-tool-card">
            <div className="pt-tool-icon pt-icon-green">
              <Plus size={23} />
            </div>
            <span className="pt-tool-eyebrow">PAYMENTS</span>
            <h2>Create Payment</h2>
            <p>
              Enter an amount, create a Razorpay order and open checkout.
            </p>
            <button
              className="pt-primary-button"
              onClick={() => navigate('/create-payment')}
              type="button"
            >
              Create a payment <ArrowRight size={17} />
            </button>
          </article>

          <article className="pt-tool-card">
            <div className="pt-tool-icon pt-icon-blue">
              <ReceiptText size={23} />
            </div>
            <span className="pt-tool-eyebrow">HISTORY</span>
            <h2>Transactions</h2>
            <p>
              Browse payment history, filter statuses and inspect
              individual payment records.
            </p>
            <button
              className="pt-secondary-button"
              onClick={() => navigate('/transactions')}
              type="button"
            >
              View transactions <ArrowRight size={17} />
            </button>
          </article>

          <article className="pt-tool-card">
            <div className="pt-tool-icon pt-icon-purple">
              <ShieldCheck size={23} />
            </div>
            <span className="pt-tool-eyebrow">VERIFICATION</span>
            <h2>Payment Lookup</h2>
            <p>
              Find a payment by its internal PayFlow payment ID.
            </p>

            <form className="pt-lookup-form" onSubmit={searchPayment}>
              <label htmlFor="pt-payment-id">Payment ID</label>
              <div className="pt-lookup-input">
                <Search size={17} />
                <input
                  id="pt-payment-id"
                  value={paymentId}
                  onChange={(event) => setPaymentId(event.target.value)}
                  placeholder="Enter payment UUID"
                  required
                />
              </div>

              {searchError && (
                <div className="pt-inline-error" role="alert">
                  <AlertCircle size={15} />
                  <span>{searchError}</span>
                </div>
              )}

              <button
                className="pt-secondary-button"
                type="submit"
                disabled={searching}
              >
                {searching ? 'Searching…' : 'Find payment'}
                <ArrowRight size={17} />
              </button>
            </form>
          </article>
        </div>

        <section className="pt-recent-card">
          <div className="pt-recent-heading">
            <div>
              <h2>Recent Payments</h2>
              <p>Latest records fetched from your authenticated backend.</p>
            </div>

            <button
              className="pt-text-button"
              onClick={() => navigate('/transactions')}
              type="button"
            >
              View all <ArrowRight size={16} />
            </button>
          </div>

          {error && (
            <div className="pt-error-banner" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button
                onClick={() => loadPayments(true)}
                type="button"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="pt-empty-state">
              <RefreshCw size={22} className="pt-spin" />
              <p>Loading payments…</p>
            </div>
          ) : !error && payments.length === 0 ? (
            <div className="pt-empty-state">
              <CreditCard size={27} />
              <h3>No payments yet</h3>
              <p>Create your first payment to see it here.</p>
              <button
                className="pt-primary-button"
                onClick={() => navigate('/create-payment')}
                type="button"
              >
                Create payment <ArrowRight size={17} />
              </button>
            </div>
          ) : !error ? (
            <div className="pt-table-wrap">
              <table className="pt-table">
                <thead>
                  <tr>
                    <th>Payment</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const StatusIcon = getStatusIcon(payment.status);

                    return (
                      <tr key={payment.id}>
                        <td>
                          <strong>
                            {payment.id
                              ? `#${String(payment.id).slice(0, 8)}`
                              : '—'}
                          </strong>
                          <small>
                            {payment.razorpayOrderId || 'Payment order'}
                          </small>
                        </td>
                        <td>{payment.description || 'Payment'}</td>
                        <td>{formatDate(payment.createdAt)}</td>
                        <td className="pt-amount">
                          {formatMoney(payment.amount, payment.currency)}
                        </td>
                        <td>
                          <span
                            className={`pt-status pt-status-${String(
                              payment.status || 'unknown'
                            ).toLowerCase()}`}
                          >
                            <StatusIcon size={14} />
                            {payment.status || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="pt-row-link"
                            onClick={() =>
                              navigate(`/transactions/${payment.id}`)
                            }
                            type="button"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
