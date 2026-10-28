
import './DashboardPage.css';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  Bell,
  CreditCard,
  Download,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Wallet,
  RefreshCw,
  AlertCircle,
  Clock3,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import api from '../lib/api.js';

const initialSummary = {
  totalPayments: 0,
  successfulPayments: 0,
  pendingPayments: 0,
  failedPayments: 0,
  totalAmount: 0,
  successfulAmount: 0,
};

const formatCurrency = (amount, currency = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount ?? 0));
  } catch {
    return `${currency} ${Number(amount ?? 0).toFixed(2)}`;
  }
};

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusClass = (status) => {
  switch (String(status ?? '').toUpperCase()) {
    case 'SUCCESS':
      return 'status-success';
    case 'PENDING':
      return 'status-pending';
    case 'FAILED':
      return 'status-failed';
    default:
      return 'status-default';
  }
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(initialSummary);
  const [transactions, setTransactions] = useState([]);
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const email =
    sessionStorage.getItem('payflow_email') || 'Merchant account';

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [summaryResponse, paymentsResponse] = await Promise.all([
        api.get('/payments/summary'),
        api.get('/payments', {
          params: { page: 0, size: 10 },
        }),
      ]);

      const summaryData = summaryResponse.data ?? {};
      const paymentsData = paymentsResponse.data ?? {};

      setSummary({
        totalPayments: Number(summaryData.totalPayments ?? 0),
        successfulPayments: Number(
          summaryData.successfulPayments ?? 0
        ),
        pendingPayments: Number(summaryData.pendingPayments ?? 0),
        failedPayments: Number(summaryData.failedPayments ?? 0),
        totalAmount: Number(summaryData.totalAmount ?? 0),
        successfulAmount: Number(
          summaryData.successfulAmount ?? 0
        ),
      });

      const records = Array.isArray(paymentsData)
        ? paymentsData
        : Array.isArray(paymentsData.content)
          ? paymentsData.content
          : [];

      setTransactions(records);
    } catch (err) {
      console.error('Dashboard API error:', err);

      if (err.response?.status === 401) {
        sessionStorage.removeItem('payflow_token');
        sessionStorage.removeItem('payflow_email');
        navigate('/login');
        return;
      }

      setError(
        err.response?.data?.message ||
          'Dashboard data could not be loaded. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredTransactions = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return transactions;

    return transactions.filter((payment) =>
      [
        payment.id,
        payment.razorpayOrderId,
        payment.description,
        payment.status,
        payment.currency,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(search)
        )
    );
  }, [transactions, query]);

  const logout = () => {
    sessionStorage.removeItem('payflow_token');
    sessionStorage.removeItem('payflow_email');
    navigate('/login');
  };

  // Every card navigates to the relevant transaction list.
  const statCards = [
    {
      key: 'total',
      label: 'Total Payment Amount',
      value: formatCurrency(summary.totalAmount),
      detail: `${summary.totalPayments.toLocaleString('en-IN')} total payments`,
      helper: 'View all transactions',
      icon: Wallet,
      route: '/transactions',
      className: 'stat-total',
      badge: 'Overview',
    },
    {
      key: 'success',
      label: 'Successful Payments',
      value: summary.successfulPayments.toLocaleString('en-IN'),
      detail: `${formatCurrency(summary.successfulAmount)} successful amount`,
      helper: 'View successful transactions',
      icon: CheckCircle2,
      route: '/transactions?status=SUCCESS',
      className: 'stat-success',
      badge: 'Successful',
    },
    {
      key: 'pending',
      label: 'Pending Payments',
      value: summary.pendingPayments.toLocaleString('en-IN'),
      detail: 'Awaiting final confirmation',
      helper: 'Review pending transactions',
      icon: Clock3,
      route: '/transactions?status=PENDING',
      className: 'stat-pending',
      badge: 'Awaiting',
    },
    {
      key: 'failed',
      label: 'Failed Payments',
      value: summary.failedPayments.toLocaleString('en-IN'),
      detail: 'Payments marked as failed',
      helper: 'Review failed transactions',
      icon: XCircle,
      route: '/transactions?status=FAILED',
      className: 'stat-failed',
      badge: 'Failed',
    },
  ];

  const handleStatCardKeyDown = (event, route) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(route);
    }
  };

  const exportTransactions = () => {
    const header = [
      'Payment ID',
      'Description',
      'Amount',
      'Currency',
      'Status',
      'Created At',
    ];

    const rows = filteredTransactions.map((payment) => [
      payment.id ?? '',
      payment.description ?? '',
      payment.amount ?? '',
      payment.currency ?? '',
      payment.status ?? '',
      payment.createdAt ?? '',
    ]);

    const csvCell = (value) =>
      `"${String(value).replace(/"/g, '""')}"`;

    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'payflow-recent-transactions.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-shell">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${menu ? 'open' : ''}`}>
        <div className="dashboard-brand">
          <Logo />
        </div>

        <nav className="dashboard-nav">
          <button
            type="button"
            className="dashboard-nav-item active"
            onClick={() => navigate('/dashboard')}
          >
            <Activity size={18} />
            Dashboard
          </button>

          <button
            type="button"
            className="dashboard-nav-item"
            onClick={() => navigate('/transactions')}
          >
            <CreditCard size={18} />
            Transactions
          </button>

          <button
            type="button"
            className="dashboard-nav-item"
            onClick={() => navigate('/payment-tools')}
          >
            <Wallet size={18} />
            Payment Tools
          </button>

          <button
            type="button"
            className="dashboard-nav-item"
            onClick={() => navigate('/refunds')}
          >
            <RefreshCw size={18} />
            Refunds
          </button>

          <button
            type="button"
            className="dashboard-nav-item"
            onClick={() => navigate('/settings')}
          >
            <Settings size={18} />
            Settings
          </button>

          <button
            type="button"
            className="dashboard-nav-item"
            onClick={() => navigate('/create-payment')}
          >
            <Plus size={20} />
            <span>Create Payment</span>
          </button>

          <button
  type="button"
  className="dashboard-nav-item"
  onClick={() => navigate('/notifications')}
>
  <Bell size={18} />
  <span>Notifications</span>
</button>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-user">
            <div className="dashboard-avatar">
              {email.charAt(0).toUpperCase()}
            </div>

            <div className="dashboard-user-info">
              <strong>Merchant</strong>
              <span>{email}</span>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-nav-item"
            onClick={logout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-menu-button"
            onClick={() => setMenu((current) => !current)}
            aria-label="Toggle navigation"
            aria-expanded={menu}
          >
            <Menu size={21} />
          </button>

          <div className="dashboard-topbar-title">
            <span>Merchant Dashboard</span>
            <small>Overview of your payment activity</small>
          </div>

          <div className="dashboard-topbar-actions">
            <button
              type="button"
              className="dashboard-icon-button"
              onClick={loadDashboard}
              title="Refresh dashboard"
              aria-label="Refresh dashboard"
              disabled={loading}
            >
              <RefreshCw size={18} />
            </button>

            <button
              type="button"
              className="dashboard-icon-button"
              onClick={() => navigate('/settings')}
              title="Settings and preferences"
              aria-label="Open settings"
            >
              <Bell size={18} />
            </button>
          </div>
        </header>

        <section className="dashboard-content">
          {/* Page heading */}
          <div className="dashboard-heading">
            <div>
              <h1>Dashboard Overview</h1>
              <p>Here is what is happening with your payments.</p>
            </div>

            <button
              type="button"
              className="dashboard-primary-button"
              onClick={() => navigate('/create-payment')}
            >
              <Plus size={17} />
              Create Payment
            </button>

            
          </div>

          {error && (
            <div className="dashboard-error" role="alert">
              <AlertCircle size={19} />
              <span>{error}</span>
              <button type="button" onClick={loadDashboard}>
                Retry
              </button>
            </div>
          )}

          {/* Clickable payment statistics */}
          <section
            className="dashboard-stats-section"
            aria-label="Payment statistics"
          >
            <div className="dashboard-stats-intro">
              <div>
                <h2>Payment Overview</h2>
                <p>
                  Select any card to view its related transactions.
                </p>
              </div>

              <span className="dashboard-live-indicator">
                <span className="dashboard-live-dot" />
                Backend data
              </span>
            </div>

            <div className="dashboard-stats-grid">
              {statCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article
                    key={card.key}
                    className={`dashboard-stat-card dashboard-stat-card-clickable ${card.className}`}
                    role="link"
                    tabIndex={0}
                    aria-label={`${card.label}. ${card.helper}`}
                    title={card.helper}
                    onClick={() => navigate(card.route)}
                    onKeyDown={(event) =>
                      handleStatCardKeyDown(event, card.route)
                    }
                  >
                    <div className="dashboard-stat-top">
                      <span className="dashboard-stat-label">
                        {card.label}
                      </span>

                      <span className="dashboard-stat-icon">
                        <Icon size={23} />
                      </span>
                    </div>

                    <div className="dashboard-stat-badge">
                      {card.badge}
                    </div>

                    <strong className="dashboard-stat-value">
                      {loading ? 'Loading…' : card.value}
                    </strong>

                    <p className="dashboard-stat-detail">
                      {card.detail}
                    </p>

                    <div className="dashboard-stat-card-footer">
                      <span>{card.helper}</span>
                      <span
                        className="dashboard-stat-arrow"
                        aria-hidden="true"
                      >
                        <ArrowRight size={18} />
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Recent transactions */}
          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <h2>Recent Transactions</h2>
                <p>Latest payments received from your backend.</p>
              </div>

              <button
                type="button"
                className="dashboard-secondary-button"
                onClick={() => navigate('/transactions')}
              >
                View all
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="dashboard-table-toolbar">
              <div className="dashboard-search">
                <Search size={17} />

                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search payments..."
                  aria-label="Search payments"
                />
              </div>

              <button
                type="button"
                className="dashboard-secondary-button"
                onClick={exportTransactions}
                disabled={filteredTransactions.length === 0}
              >
                <Download size={16} />
                Export visible
              </button>
            </div>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Payment</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="dashboard-table-message">
                        Loading transactions…
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="dashboard-table-message">
                        {error
                          ? 'Transactions could not be loaded.'
                          : query
                            ? 'No matching payments found.'
                            : 'No payments found yet.'}
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          <strong>
                            {payment.id
                              ? `#${String(payment.id).slice(0, 8)}`
                              : '—'}
                          </strong>

                          <small className="dashboard-payment-subtitle">
                            {payment.razorpayOrderId || 'Payment record'}
                          </small>
                        </td>

                        <td>{payment.description || 'Payment'}</td>

                        <td>{formatDate(payment.createdAt)}</td>

                        <td className="dashboard-amount">
                          {formatCurrency(
                            payment.amount,
                            payment.currency || 'INR'
                          )}
                        </td>

                        <td>
                          <span
                            className={`dashboard-status ${getStatusClass(
                              payment.status
                            )}`}
                          >
                            {payment.status || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="dashboard-table-footer">
              Showing {filteredTransactions.length} of{' '}
              {transactions.length} loaded payments
            </div>
          </section>

          {/* Security / data note */}
          <div className="dashboard-security-note">
            <ShieldCheck size={19} />

            <div>
              <strong>Payment data from your account</strong>
              <p>
                Dashboard figures are loaded from the authenticated payment
                APIs. Only the latest 10 payments are shown in this table.
                Payment status cards open the corresponding transaction filter.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
