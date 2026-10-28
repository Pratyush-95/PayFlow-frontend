
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import api from '../lib/api.js';
import './CreatePaymentPage.css';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });

export default function CreatePaymentPage() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [description, setDescription] = useState('PayFlow Payment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [createdPayment, setCreatedPayment] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setMessage('');
    setCreatedPayment(null);

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Load Razorpay Checkout.
      const scriptLoaded = await loadRazorpay();

      if (!scriptLoaded) {
        throw new Error(
          'Razorpay Checkout could not load. Check your internet connection.'
        );
      }

      // Step 2: Create an order through the authenticated backend.
      const response = await api.post('/payments', {
        amount: numericAmount,
        currency,
        description: description.trim() || 'PayFlow Payment',
      });

      const order = response.data ?? {};
      setCreatedPayment(order);

      // Match these fields with your RazorpayCheckoutResponse DTO.
      const orderId =
        order.razorpayOrderId ||
        order.orderId ||
        order.id;

      const key =
        order.keyId ||
        order.razorpayKeyId ||
        order.key;

      const orderAmount = order.amount;
      const orderCurrency = order.currency || currency;

      if (!orderId || !key || orderAmount == null) {
        setMessage(
          'Order created, but checkout details are missing. Check RazorpayCheckoutResponse on the backend.'
        );
        return;
      }

      // Step 3: Open Razorpay Checkout.
      const checkout = new window.Razorpay({
        key,
        amount: orderAmount,
        currency: orderCurrency,
        name: 'PayFlow',
        description: description.trim() || 'PayFlow Payment',
        order_id: orderId,

        // Step 4: Verify payment on the backend.
        handler: async (checkoutResponse) => {
          setError('');
          setMessage('Verifying payment with PayFlow…');

          try {
            const verifyResponse = await api.post('/payments/verify', {
              razorpayOrderId: checkoutResponse.razorpay_order_id,
              razorpayPaymentId: checkoutResponse.razorpay_payment_id,
              razorpaySignature: checkoutResponse.razorpay_signature,
            });

            const verifiedPayment = verifyResponse.data;

            setCreatedPayment(verifiedPayment);

            const status = String(
              verifiedPayment?.status || ''
            ).toUpperCase();

            // Only navigate to success if backend verification confirms SUCCESS.
            if (status === 'SUCCESS' && verifiedPayment?.id) {
              navigate('/payment-success', {
                state: {
                  paymentId: verifiedPayment.id,
                  payment: verifiedPayment,
                },
              });
              return;
            }

            if (status === 'FAILED' && verifiedPayment?.id) {
              navigate('/payment-failed', {
                state: {
                  paymentId: verifiedPayment.id,
                  payment: verifiedPayment,
                },
              });
              return;
            }

            if (verifiedPayment?.id) {
              navigate('/payment-pending', {
                state: {
                  paymentId: verifiedPayment.id,
                  payment: verifiedPayment,
                },
              });
              return;
            }

            // Do not claim success if the backend response is incomplete.
            setMessage(
              'Verification response received, but the payment reference is missing. Check Transactions for the latest status.'
            );
          } catch (verificationError) {
            if (verificationError.response?.status === 401) {
              sessionStorage.removeItem('payflow_token');
              sessionStorage.removeItem('payflow_email');
              navigate('/login');
              return;
            }

            setError(
              verificationError.response?.data?.message ||
                'Payment verification could not be confirmed. Check Transactions before retrying.'
            );
          }
        },

        modal: {
          ondismiss: () => {
            setMessage(
              'Checkout closed. The payment may still be pending. Check Transactions before attempting another payment.'
            );
          },
        },

        theme: {
          color: '#bfff83',
        },
      });

      // Step 5: Handle checkout payment failures.
      checkout.on('payment.failed', (failure) => {
        setError(
          failure.error?.description ||
            'Razorpay reported a payment failure. Check Transactions for the backend status.'
        );
      });

      checkout.open();
    } catch (err) {
      if (err.response?.status === 401) {
        sessionStorage.removeItem('payflow_token');
        sessionStorage.removeItem('payflow_email');
        navigate('/login');
        return;
      }

      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to create payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="create-payment-page">
      <header className="create-payment-header">
        <button
          className="create-payment-back"
          type="button"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="create-payment-title">
          <div className="create-payment-icon">
            <CreditCard size={23} />
          </div>

          <div>
            <h1>Create Payment</h1>
            <p>Create an order and open Razorpay Checkout.</p>
          </div>
        </div>
      </header>

      <section className="create-payment-content">
        <form
          className="create-payment-card"
          onSubmit={handleSubmit}
        >
          <h2>Payment details</h2>
          <p>Enter the amount and description for this payment.</p>

          <label htmlFor="create-amount">Amount</label>

          <div className="create-payment-amount-row">
            <select
              aria-label="Currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              disabled={loading}
            >
              <option value="INR">INR ₹</option>
              <option value="USD">USD $</option>
            </select>

            <input
              id="create-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Enter amount"
              required
              disabled={loading}
            />
          </div>

          <label htmlFor="create-description">Description</label>

          <input
            id="create-description"
            type="text"
            maxLength={200}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is this payment for?"
            disabled={loading}
          />

          {error && (
            <div
              className="create-payment-alert error"
              role="alert"
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div
              className="create-payment-alert success"
              role="status"
            >
              <ShieldCheck size={18} />
              <span>{message}</span>
            </div>
          )}

          <button
            className="create-payment-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Preparing checkout…' : 'Create & Pay'}
          </button>

          <div className="create-payment-secure-note">
            <ShieldCheck size={17} />
            Payment verification is handled by your backend.
          </div>
        </form>

        {createdPayment && (
          <section className="create-payment-result">
            <h2>Backend response</h2>

            <p>
              Order reference:{' '}
              <strong>
                {createdPayment.razorpayOrderId ||
                  createdPayment.orderId ||
                  createdPayment.id ||
                  'Created'}
              </strong>
            </p>

            {createdPayment.status && (
              <p>
                Status: <strong>{createdPayment.status}</strong>
              </p>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
