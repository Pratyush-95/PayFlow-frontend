
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Clock3,
  CreditCard,
  RefreshCw,
  Search,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import './NotificationsPage.css';

const formatDate = (value) => {
  if (!value) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const getItems = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

export default function NotificationsPage() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [listResponse, countResponse] = await Promise.all([
        api.get('/notifications', {
          params: { filter },
        }),
        api.get('/notifications/unread-count'),
      ]);

      setNotifications(getItems(listResponse.data));
      setUnreadCount(Number(countResponse.data?.unreadCount ?? 0));
    } catch (err) {
      if (err.response?.status === 401) {
        sessionStorage.removeItem('payflow_token');
        sessionStorage.removeItem('payflow_email');
        navigate('/login');
        return;
      }

      setError(
        err.response?.data?.message ||
          'Could not load notifications. Check the backend API and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [filter, navigate]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filteredNotifications = useMemo(() => {
    const search = query.trim().toLowerCase();

    return notifications.filter((item) =>
      [
        item.title,
        item.message,
        item.type,
        item.id,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(search)
        )
    );
  }, [notifications, query]);

  const markAsRead = async (notification) => {
    if (notification.read || busyId) return;

    setBusyId(notification.id);
    setError('');
    setNotice('');

    try {
      await api.patch(`/notifications/${notification.id}/read`);
      setNotice('Notification marked as read.');
      await loadNotifications();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not mark this notification as read.'
      );
    } finally {
      setBusyId('');
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;

    setMarkingAll(true);
    setError('');
    setNotice('');

    try {
      await api.patch('/notifications/read-all');
      setNotice('All notifications marked as read.');
      await loadNotifications();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Could not mark all notifications as read.'
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const typeIcon = (type) => {
    switch (String(type || '').toUpperCase()) {
      case 'REFUND':
        return <RotateCcw size={21} />;
      case 'SECURITY':
        return <ShieldCheck size={21} />;
      default:
        return <CreditCard size={21} />;
    }
  };

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <button
          type="button"
          className="notifications-back"
          onClick={() => navigate('/dashboard')}
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="notifications-title-wrap">
          <span className="notifications-eyebrow">
            ACCOUNT ACTIVITY
          </span>
          <h1>Notifications</h1>
          <p>Stay up to date with your payment activity.</p>
        </div>

        <button
          type="button"
          className="notifications-refresh"
          onClick={loadNotifications}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? 'notifications-spin' : ''}
          />
          Refresh
        </button>
      </header>

      {error && (
        <div className="notifications-alert error" role="alert">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="notifications-alert success" role="status">
          <CheckCircle2Fallback />
          <span>{notice}</span>
        </div>
      )}

      <section className="notifications-summary">
        <div className="notifications-summary-icon">
          <Bell size={25} />
        </div>
        <div>
          <span>Unread notifications</span>
          <strong>{loading ? '—' : unreadCount}</strong>
          <p>
            {unreadCount === 0
              ? 'You are all caught up.'
              : 'Review your unread account updates.'}
          </p>
        </div>

        <button
          type="button"
          className="notifications-mark-all"
          onClick={markAllAsRead}
          disabled={markingAll || unreadCount === 0}
        >
          <CheckCheck size={17} />
          {markingAll ? 'Updating…' : 'Mark all as read'}
        </button>
      </section>

      <section className="notifications-panel">
        <div className="notifications-panel-heading">
          <div>
            <h2>Activity feed</h2>
            <p>Notifications from your authenticated account.</p>
          </div>
          <span className="notifications-count">
            {filteredNotifications.length} items
          </span>
        </div>

        <div className="notifications-toolbar">
          <div className="notifications-tabs">
            <button
              type="button"
              className={filter === 'ALL' ? 'active' : ''}
              onClick={() => setFilter('ALL')}
            >
              All
            </button>
            <button
              type="button"
              className={filter === 'UNREAD' ? 'active' : ''}
              onClick={() => setFilter('UNREAD')}
            >
              Unread
              {unreadCount > 0 && (
                <span className="notifications-tab-count">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <label className="notifications-search">
            <Search size={17} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notifications..."
            />
          </label>
        </div>

        {loading ? (
          <div className="notifications-empty">
            <RefreshCw size={25} className="notifications-spin" />
            <h3>Loading notifications</h3>
            <p>Connecting to your account activity.</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            <Bell size={30} />
            <h3>
              {error
                ? 'Notifications unavailable'
                : query
                  ? 'No matching notifications'
                  : filter === 'UNREAD'
                    ? 'No unread notifications'
                    : 'No notifications yet'}
            </h3>
            <p>
              {error
                ? 'Check that the backend notification endpoints are running.'
                : 'Payment and refund notifications will appear here when your backend creates them.'}
            </p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((item) => (
             <article
  key={item.id}
  className={`notification-item ${
    item.isRead ? 'is-read' : 'is-unread'
  }`}
>
                <div className="notification-item-icon">
                  {typeIcon(item.type)}
                </div>

                <div className="notification-item-content">
                  <div className="notification-item-heading">
                    <h3>{item.title}</h3>
                    {!item.isRead && (
                      <span className="notification-unread-dot" />
                    )}
                  </div>

                  <p>{item.message}</p>

                  <div className="notification-item-meta">
                    <span className="notification-type">
                      {item.type || 'PAYMENT'}
                    </span>
                    <span>
                      <Clock3 size={13} />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>

                {!item.isRead && (
                  <button
                    type="button"
                    className="notification-read-button"
                    onClick={() => markAsRead(item)}
                    disabled={Boolean(busyId)}
                    title="Mark as read"
                  >
                    <Check size={17} />
                    <span>
                      {busyId === item.id ? 'Saving…' : 'Mark read'}
                    </span>
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function CheckCircle2Fallback() {
  return <CheckCheck size={19} />;
}
