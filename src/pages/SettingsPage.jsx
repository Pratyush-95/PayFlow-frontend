
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UserRound,
  ShieldCheck,
  Bell,
  Palette,
  LogOut,
  CheckCircle2,
  Info,
  KeyRound,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import './SettingsPage.css';

const getSavedPreferences = () => {
  try {
    const saved = localStorage.getItem('payflow_preferences');

    return saved
      ? JSON.parse(saved)
      : {
          paymentAlerts: true,
          securityAlerts: true,
          compactView: false,
        };
  } catch {
    return {
      paymentAlerts: true,
      securityAlerts: true,
      compactView: false,
    };
  }
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem('payflow_email') || '';

  const [preferences, setPreferences] = useState(getSavedPreferences);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updatePreference = (key, value) => {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));
    setSaved(false);
  };

  const savePreferences = () => {
    try {
      localStorage.setItem(
        'payflow_preferences',
        JSON.stringify(preferences)
      );
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('payflow_token');
    sessionStorage.removeItem('payflow_email');
    navigate('/login');
  };

  const openForgotPassword = () => {
    navigate('/forgot-password');
  };

  const requestDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const initial = email ? email.charAt(0).toUpperCase() : 'M';

  return (
    <main className="settings-page">
      <header className="settings-header">
        <button
          type="button"
          className="settings-back"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="settings-heading">
          <h1>Settings</h1>
          <p>Manage your account and dashboard preferences.</p>
        </div>
      </header>

      <section className="settings-content">
        {/* Merchant account */}
        <div className="settings-section-title">
          <UserRound size={20} />
          <div>
            <h2>Merchant account</h2>
            <p>Your currently signed-in PayFlow account.</p>
          </div>
        </div>

        <section className="settings-card settings-profile-card">
          <div className="settings-avatar">{initial}</div>

          <div className="settings-profile-info">
            <span className="settings-label">Merchant email</span>
            <strong>{email || 'Email not available'}</strong>

            <span className="settings-account-status">
              <CheckCircle2 size={15} />
              Signed in
            </span>
          </div>

          <span className="settings-readonly-badge">Account</span>
        </section>

        {/* Preferences */}
        <div className="settings-section-title">
          <Bell size={20} />
          <div>
            <h2>Preferences</h2>
            <p>Choose how the dashboard behaves on this browser.</p>
          </div>
        </div>

        <section className="settings-card settings-preferences-card">
          <div className="settings-preference-row">
            <div className="settings-preference-icon">
              <Bell size={19} />
            </div>

            <div className="settings-preference-copy">
              <strong>Payment alerts</strong>
              <p>Preference for payment-related notifications.</p>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={preferences.paymentAlerts}
                onChange={(event) =>
                  updatePreference('paymentAlerts', event.target.checked)
                }
              />
              <span className="settings-switch-track" />
            </label>
          </div>

          <div className="settings-preference-row">
            <div className="settings-preference-icon">
              <ShieldCheck size={19} />
            </div>

            <div className="settings-preference-copy">
              <strong>Security alerts</strong>
              <p>Preference for security-related notifications.</p>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={preferences.securityAlerts}
                onChange={(event) =>
                  updatePreference('securityAlerts', event.target.checked)
                }
              />
              <span className="settings-switch-track" />
            </label>
          </div>

          <div className="settings-preference-row">
            <div className="settings-preference-icon">
              <Palette size={19} />
            </div>

            <div className="settings-preference-copy">
              <strong>Compact view preference</strong>
              <p>Save your preference for a more compact layout.</p>
            </div>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={preferences.compactView}
                onChange={(event) =>
                  updatePreference('compactView', event.target.checked)
                }
              />
              <span className="settings-switch-track" />
            </label>
          </div>

          <div className="settings-save-row">
            {saved && (
              <span className="settings-saved-message" role="status">
                <CheckCircle2 size={16} />
                Preferences saved on this browser.
              </span>
            )}

            <button
              type="button"
              className="settings-primary-button"
              onClick={savePreferences}
            >
              Save preferences
            </button>
          </div>
        </section>

        {/* Security and session */}
        <div className="settings-section-title">
          <ShieldCheck size={20} />
          <div>
            <h2>Security &amp; session</h2>
            <p>Manage your account security and current session.</p>
          </div>
        </div>

        <section className="settings-card settings-security-card">
          <div className="settings-security-info">
            <div className="settings-preference-icon">
              <ShieldCheck size={20} />
            </div>

            <div>
              <strong>Authenticated session</strong>
              <p>
                PayFlow sends your saved access token with authenticated API
                requests.
              </p>
            </div>
          </div>

          <div className="settings-info-note">
            <Info size={17} />
            Password reset and account deletion require their respective
            backend endpoints to be implemented.
          </div>

          <div className="settings-account-actions">
            <button
              type="button"
              className="settings-password-button"
              onClick={openForgotPassword}
            >
              <KeyRound size={17} />
              Forgot password
            </button>

            <button
              type="button"
              className="settings-delete-button"
              onClick={requestDeleteAccount}
            >
              <Trash2 size={17} />
              Delete account
            </button>
          </div>

          <button
            type="button"
            className="settings-logout-button"
            onClick={logout}
          >
            <LogOut size={17} />
            Log out of PayFlow
          </button>
        </section>
      </section>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div
          className="settings-modal-backdrop"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <section
            className="settings-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="settings-delete-icon">
              <AlertTriangle size={25} />
            </div>

            <h2 id="delete-account-title">Delete account?</h2>

            <p>
              You are requesting deletion of your PayFlow account
              {email ? ` (${email})` : ''}. This action can be irreversible.
            </p>

            <p className="settings-delete-warning">
              Account deletion is not connected to the backend yet.
              No account or payment data has been deleted.
            </p>

            <div className="settings-modal-actions">
              <button
                type="button"
                className="settings-cancel-button"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="settings-delete-confirm-button"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Got it
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
