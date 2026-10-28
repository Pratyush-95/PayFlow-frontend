
import { useCallback, useEffect, useState } from 'react';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import './TransactionsPage.css';

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
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function TransactionsPage() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({
    totalPages: 0,
    totalElements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = { page, size: 10 };

      if (status) {
        params.status = status;
      }

      const response = await api.get('/payments', { params });
      const data = response.data ?? {};

      const records = Array.isArray(data)
        ? data
        : Array.isArray(data.content)
          ? data.content
          : [];

      setPayments(records);
      setPageInfo({
        totalPages: Number(data.totalPages ?? (records.length ? 1 : 0)),
        totalElements: Number(data.totalElements ?? records.length),
      });
    } catch (err) {
      console.error('Transactions API error:', err);

      if (err.response?.status === 401) {
        sessionStorage.removeItem('payflow_token');
        sessionStorage.removeItem('payflow_email');
        navigate('/login');
        return;
      }

      setError(
        err.response?.data?.message ||
          'Transactions could not be loaded. Please try again.'
      );
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, navigate]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const filteredPayments = payments.filter((payment) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return [
      payment.id,
      payment.razorpayOrderId,
      payment.description,
      payment.status,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const logout = () => {
    sessionStorage.removeItem('payflow_token');
    sessionStorage.removeItem('payflow_email');
    navigate('/login');
  };

  return (
    <div className="transactions-page">
      <header className="transactions-header">
        <button
          className="transactions-icon-button"
          onClick={() => navigate('/dashboard')}
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="transactions-header-title">
          <h1>Transactions</h1>
          <p>View and manage your payment history.</p>
        </div>

        <button
          className="transactions-secondary-button"
          onClick={loadPayments}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <main className="transactions-content">
        <section className="transactions-summary">
          <div className="transactions-summary-icon">
            <CreditCard size={22} />
          </div>
          <div>
            <span>Records on this page</span>
            <strong>{loading ? '…' : filteredPayments.length}</strong>
            <small>
              {pageInfo.totalElements} records matching the selected status
              across all pages
            </small>
          </div>
        </section>

        <section className="transactions-panel">
          <div className="transactions-panel-heading">
            <div>
              <h2>Payment History</h2>
              <p>Data is fetched from your authenticated backend.</p>
            </div>
          </div>

          <div className="transactions-toolbar">
            <label className="transactions-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search ID or description..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <select
              className="transactions-status-filter"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(0);
              }}
              aria-label="Filter by payment status"
            >
              <option value="">All statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {error && (
            <div className="transactions-error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={loadPayments}>Retry</button>
            </div>
          )}

          <div className="transactions-table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="transactions-message">
                      Loading payments…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="transactions-message">
                      Could not load payment records.
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="transactions-message">
                      {search
                        ? 'No payments match your search on this page.'
                        : 'No payment records found.'}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr
  key={payment.id}
  className="transactions-clickable-row"
  tabIndex={0}
  role="link"
  aria-label={`View payment ${payment.id}`}
  onClick={() => navigate(`/transactions/${payment.id}`)}
  onKeyDown={(event) => {
    if (event.key === 'Enter') {
      navigate(`/transactions/${payment.id}`);
    }
  }}
>
                      <td>
                        <strong>
                          {payment.id
                            ? `#${String(payment.id).slice(0, 8)}`
                            : '—'}
                        </strong>
                        <small>
                          {payment.razorpayOrderId || 'Internal payment'}
                        </small>
                      </td>

                      <td>{payment.description || 'Payment'}</td>

                      <td>{formatDate(payment.createdAt)}</td>

                      <td className="transactions-amount">
                        {formatCurrency(
                          payment.amount,
                          payment.currency || 'INR'
                        )}
                      </td>

                      <td>
                        <span
                          className={`transactions-status transactions-status-${String(
                            payment.status || 'unknown'
                          ).toLowerCase()}`}
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

          <footer className="transactions-pagination">
            <span>
              Page {page + 1} of {Math.max(pageInfo.totalPages, 1)}
            </span>

            <div>
              <button
                className="transactions-secondary-button"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={loading || page === 0}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                className="transactions-secondary-button"
                onClick={() =>
                  setPage((current) => current + 1)
                }
                disabled={
                  loading ||
                  pageInfo.totalPages === 0 ||
                  page + 1 >= pageInfo.totalPages
                }
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </footer>
        </section>

        <button
          className="transactions-logout-button"
          onClick={logout}
        >
          Logout
        </button>
      </main>
    </div>
  );
}
