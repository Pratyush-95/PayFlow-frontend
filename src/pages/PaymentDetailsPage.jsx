
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  CreditCard,
  CalendarDays,
  Hash,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import api from '../lib/api.js';
import './PaymentDetailsPage.css';

const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount ?? 0));

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusClass = (status) => {
  switch (String(status ?? '').toUpperCase()) {
    case 'SUCCESS':
      return 'payment-detail-status-success';
    case 'PENDING':
      return 'payment-detail-status-pending';
    case 'FAILED':
      return 'payment-detail-status-failed';
    default:
      return 'payment-detail-status-default';
  }
};

export default function PaymentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadPayment = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get(
          `/payments/${encodeURIComponent(id)}`
        );

        if (!cancelled) {
          setPayment(response.data);
        }
      } catch (err) {
        if (cancelled) return;

        if (err.response?.status === 401) {
          sessionStorage.removeItem('payflow_token');
          sessionStorage.removeItem('payflow_email');
          navigate('/login');
          return;
        }

        setError(
          err.response?.data?.message ||
            'Payment details could not be loaded.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPayment();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const copyValue = async (label, value) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(label);
      window.setTimeout(() => setCopiedField(''), 1800);
    } catch {
      setError('Unable to copy. Please select and copy the value manually.');
    }
  };

  return (
    <main className="payment-details-page">
      <header className="payment-details-header">
        <button
          className="payment-details-back"
          onClick={() => navigate('/transactions')}
        >
          <ArrowLeft size={18} />
          Back to transactions
        </button>

        <div className="payment-details-heading">
          <div className="payment-details-heading-icon">
            <CreditCard size={24} />
          </div>
          <div>
            <h1>Payment Details</h1>
            <p>View the details of this payment record.</p>
          </div>
        </div>
      </header>

      <section className="payment-details-content">
        {loading ? (
          <div className="payment-details-state">
            <RefreshCw size={22} className="payment-details-spinner" />
            <p>Loading payment details…</p>
          </div>
        ) : error ? (
          <div className="payment-details-error" role="alert">
            <AlertCircle size={22} />
            <div>
              <strong>Unable to load payment</strong>
              <p>{error}</p>
              <button onClick={() => navigate('/transactions')}>
                Return to transactions
              </button>
            </div>
          </div>
        ) : payment ? (
          <>
            <section className="payment-details-overview">
              <div>
                <span className="payment-details-eyebrow">
                  Payment amount
                </span>
                <h2>
                  {formatCurrency(
                    payment.amount,
                    payment.currency || 'INR'
                  )}
                </h2>
                <p>{payment.description || 'Payment'}</p>
              </div>

              <span
                className={`payment-detail-status ${statusClass(
                  payment.status
                )}`}
              >
                {payment.status || 'UNKNOWN'}
              </span>
            </section>

            <section className="payment-details-card">
              <div className="payment-details-card-heading">
                <Hash size={19} />
                <h2>Payment Information</h2>
              </div>

              <div className="payment-details-list">
                <div className="payment-details-item">
                  <span>Payment ID</span>
                  <div className="payment-details-value">
                    <strong>{payment.id || '—'}</strong>
                    {payment.id && (
                      <button
                        title="Copy payment ID"
                        aria-label="Copy payment ID"
                        onClick={() => copyValue('Payment ID', payment.id)}
                      >
                        <Copy size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="payment-details-item">
                  <span>Razorpay Order ID</span>
                  <div className="payment-details-value">
                    <strong>{payment.razorpayOrderId || '—'}</strong>
                    {payment.razorpayOrderId && (
                      <button
                        title="Copy Razorpay Order ID"
                        aria-label="Copy Razorpay Order ID"
                        onClick={() =>
                          copyValue(
                            'Razorpay Order ID',
                            payment.razorpayOrderId
                          )
                        }
                      >
                        <Copy size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="payment-details-item">
                  <span>Razorpay Payment ID</span>
                  <div className="payment-details-value">
                    <strong>{payment.razorpayPaymentId || 'Not available'}</strong>
                    {payment.razorpayPaymentId && (
                      <button
                        title="Copy Razorpay Payment ID"
                        aria-label="Copy Razorpay Payment ID"
                        onClick={() =>
                          copyValue(
                            'Razorpay Payment ID',
                            payment.razorpayPaymentId
                          )
                        }
                      >
                        <Copy size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="payment-details-item">
                  <span>Currency</span>
                  <strong>{payment.currency || 'INR'}</strong>
                </div>

                <div className="payment-details-item">
                  <span>Description</span>
                  <strong>{payment.description || '—'}</strong>
                </div>

                <div className="payment-details-item">
                  <span>Created at</span>
                  <strong>{formatDate(payment.createdAt)}</strong>
                </div>

                {payment.failureReason && (
                  <div className="payment-details-item payment-details-failure">
                    <span>Failure reason</span>
                    <strong>{payment.failureReason}</strong>
                  </div>
                )}
              </div>
            </section>

            <section className="payment-details-security">
              <ShieldCheck size={20} />
              <div>
                <strong>Secure payment record</strong>
                <p>
                  These details were retrieved from your authenticated
                  PayFlow backend.
                </p>
              </div>
            </section>

            {copiedField && (
              <p className="payment-details-copy-message" role="status">
                {copiedField} copied.
              </p>
            )}
          </>
        ) : null}
      </section>
    </main>
  );
}
