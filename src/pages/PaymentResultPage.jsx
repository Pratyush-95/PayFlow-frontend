import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock3,
  ArrowRight,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import api from '../lib/api.js';
import './PaymentResultPage.css';

const RESULT_CONFIG = {
  success: {
    title: 'Payment Successful',
    subtitle: 'Your payment has been verified by PayFlow.',
    Icon: CheckCircle2,
    className: 'result-success',
  },
  failed: {
    title: 'Payment Failed',
    subtitle: 'The payment was not completed successfully.',
    Icon: XCircle,
    className: 'result-failed',
  },
  pending: {
    title: 'Payment Pending',
    subtitle: 'The final payment status has not been confirmed yet.',
    Icon: Clock3,
    className: 'result-pending',
  },
};

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

export default function PaymentResultPage({ result = 'pending' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [payment, setPayment] = useState(location.state?.payment ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const config = RESULT_CONFIG[result] ?? RESULT_CONFIG.pending;
  const { Icon } = config;

  useEffect(() => {
    let cancelled = false;

    const verifyDisplayedResult = async () => {
      const paymentId =
        location.state?.paymentId ||
        location.state?.payment?.id ||
        new URLSearchParams(location.search).get('paymentId');

      if (!paymentId) {
        if (result === 'success') {
          setError(
            'A verified payment reference was not provided. Open Transactions to confirm the latest status.'
          );
        }
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await api.get(
          `/payments/${encodeURIComponent(paymentId)}`
        );

        if (cancelled) return;

        const currentPayment = response.data;
        setPayment(currentPayment);

        // Never show a success screen unless the backend says SUCCESS.
        if (result === 'success' && currentPayment.status !== 'SUCCESS') {
          navigate('/payment-pending', {
            replace: true,
            state: { payment: currentPayment, paymentId: currentPayment.id },
          });
          return;
        }

        // The current payment record is authoritative.
        if (result === 'failed' && currentPayment.status === 'SUCCESS') {
          navigate('/payment-success', {
            replace: true,
            state: { payment: currentPayment, paymentId: currentPayment.id },
          });
          return;
        }

        if (
          result === 'pending' &&
          currentPayment.status === 'SUCCESS'
        ) {
          navigate('/payment-success', {
            replace: true,
            state: { payment: currentPayment, paymentId: currentPayment.id },
          });
          return;
        }

        if (
          result === 'pending' &&
          currentPayment.status === 'FAILED'
        ) {
          navigate('/payment-failed', {
            replace: true,
            state: { payment: currentPayment, paymentId: currentPayment.id },
          });
        }
      } catch (err) {
        if (cancelled) return;

        if (err.response?.status === 401) {
          sessionStorage.removeItem('payflow_token');
          sessionStorage.removeItem('payflow_email');
          navigate('/login', { replace: true });
          return;
        }

        setError(
          'We could not refresh the payment status. Check Transactions before retrying the payment.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    verifyDisplayedResult();

    return () => {
      cancelled = true;
    };
  }, [location.state, location.search, navigate, result]);

  const paymentId =
    payment?.id ||
    location.state?.paymentId ||
    new URLSearchParams(location.search).get('paymentId');

  return (
    <main className="payment-result-page">
      <section className={`payment-result-card ${config.className}`}>
        <div className="payment-result-brand">
          <span className="payment-result-logo">P</span>
          <span>PayFlow<span className="payment-result-dot">.</span></span>
        </div>

        <div className="payment-result-icon">
          {loading ? <RefreshCw className="result-spin" size={38} /> : <Icon size={42} />}
        </div>

        <h1>{loading ? 'Checking payment status…' : config.title}</h1>
        <p className="payment-result-subtitle">
          {loading
            ? 'Please wait while we check the latest status with your backend.'
            : config.subtitle}
        </p>

        {payment && (
          <div className="payment-result-details">
            <div className="payment-result-amount">
              <span>Payment amount</span>
              <strong>
                {formatMoney(payment.amount, payment.currency || 'INR')}
              </strong>
            </div>

            <div className="payment-result-detail-row">
              <span>Description</span>
              <strong>{payment.description || 'PayFlow Payment'}</strong>
            </div>

            <div className="payment-result-detail-row">
              <span>Payment status</span>
              <strong>{payment.status || 'Unknown'}</strong>
            </div>

            <div className="payment-result-detail-row">
              <span>Payment reference</span>
              <strong className="result-reference">
                {paymentId || 'Not available'}
              </strong>
            </div>
          </div>
        )}

        {error && (
          <div className="payment-result-error" role="alert">
            {error}
          </div>
        )}

        {result === 'pending' && (
          <div className="payment-result-note">
            <ShieldCheck size={17} />
            Avoid paying again until you have checked the latest transaction status.
          </div>
        )}

        <div className="payment-result-actions">
          <button
            className="payment-result-primary"
            onClick={() => navigate('/transactions')}
            type="button"
          >
            <ReceiptText size={17} />
            View transactions
            <ArrowRight size={16} />
          </button>

          <button
            className="payment-result-secondary"
            onClick={() => navigate('/dashboard')}
            type="button"
          >
            <LayoutDashboard size={17} />
            Back to dashboard
          </button>

          {result === 'failed' && (
            <button
              className="payment-result-text-button"
              onClick={() => navigate('/create-payment')}
              type="button"
            >
              Try a new payment
            </button>
          )}

          {result === 'pending' && paymentId && (
            <button
              className="payment-result-text-button"
              onClick={() =>
                navigate(`/transactions/${paymentId}`)
              }
              type="button"
            >
              Open payment details
            </button>
          )}
        </div>

        <footer className="payment-result-footer">
          <ShieldCheck size={15} />
          Status is based on your PayFlow backend response.
        </footer>
      </section>
    </main>
  );
}