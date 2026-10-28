
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  KeyRound,
  MailCheck,
  LoaderCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import api from '../lib/api.js';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(
    sessionStorage.getItem('payflow_email') || ''
  );
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await api.post('/auth/forgot-password', {
        email: email.trim(),
      });

      setStep('verify-otp');
      setMessage(
        'If the email is registered, a reset OTP has been sent. Check your inbox and spam folder.'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to request a reset OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/auth/verify-reset-otp', {
        email: email.trim(),
        otp: otp.trim(),
      });

      const token = response.data?.resetToken;

      if (!token) {
        setError(
          'OTP verification response did not contain a reset token.'
        );
        return;
      }

      // Keep the verified token separately from the email OTP.
      setResetToken(token);
      setStep('new-password');
      setMessage('OTP verified successfully. Choose your new password.');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Invalid or expired OTP. Please check the code and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!resetToken) {
      setError('Please verify your OTP before resetting the password.');
      setStep('verify-otp');
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      setError('Password must contain between 8 and 72 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        resetToken,
        newPassword,
      });

      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      setResetToken('');
      setStep('success');
      setMessage(
        'Your password has been reset successfully. You can now log in.'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Password reset failed. The reset token may have expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  const goBackToEmail = () => {
    setStep('email');
    setOtp('');
    setResetToken('');
    setError('');
    setMessage('');
  };

  return (
    <main className="forgot-password-page">
      <section className="forgot-password-card">
        <button
          type="button"
          className="forgot-back-button"
          onClick={() => navigate('/login')}
        >
          <ArrowLeft size={18} />
          Back to login
        </button>

        <div className="forgot-icon">
          {step === 'email' ? (
            <MailCheck size={25} />
          ) : step === 'verify-otp' ? (
            <ShieldCheck size={25} />
          ) : step === 'success' ? (
            <CheckCircle2 size={25} />
          ) : (
            <KeyRound size={25} />
          )}
        </div>

        <h1>
          {step === 'email' && 'Forgot password?'}
          {step === 'verify-otp' && 'Verify your OTP'}
          {step === 'new-password' && 'Create new password'}
          {step === 'success' && 'Password updated'}
        </h1>

        <p>
          {step === 'email' &&
            'Enter your registered email address to receive a password reset OTP.'}
          {step === 'verify-otp' &&
            'Enter the OTP sent to your registered email address.'}
          {step === 'new-password' &&
            'Your OTP is verified. Set a strong new password for your account.'}
          {step === 'success' &&
            'Your password has been changed. Sign in with your new password.'}
        </p>

        {message && (
          <div className="forgot-message" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="forgot-error" role="alert">
            {error}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleRequestOtp}>
            <label htmlFor="reset-email">Email address</label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              maxLength={255}
              required
            />

            <button
              type="submit"
              className="forgot-submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle className="forgot-spinner" size={18} />
                  Sending OTP...
                </>
              ) : (
                'Send reset OTP'
              )}
            </button>
          </form>
        )}

        {step === 'verify-otp' && (
          <form onSubmit={handleVerifyOtp}>
            <label htmlFor="otp-email">Email address</label>
            <input
              id="otp-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              maxLength={255}
              required
            />

            <label htmlFor="reset-otp">Email OTP</label>
            <input
              id="reset-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter OTP from your email"
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              minLength={6}
              maxLength={6}
              required
            />

            <button
              type="submit"
              className="forgot-submit-button"
              disabled={loading}
            >
              {loading ? 'Verifying OTP...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              className="forgot-back-login-button"
              disabled={loading}
              onClick={goBackToEmail}
            >
              Request a new OTP
            </button>
          </form>
        )}

        {step === 'new-password' && (
          <form onSubmit={handleResetPassword}>
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />

            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />

            <button
              type="submit"
              className="forgot-submit-button"
              disabled={loading}
            >
              {loading ? 'Updating password...' : 'Update password'}
            </button>
          </form>
        )}

        {step === 'success' && (
          <button
            type="button"
            className="forgot-submit-button"
            onClick={() => navigate('/login')}
          >
            Go to login
          </button>
        )}
      </section>
    </main>
  );
}
