import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Eye, RotateCcw } from 'lucide-react';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const isCustomRequestNotification = (notification) =>
    String(notification?.package_title || '').toLowerCase().startsWith('new custom request:');

  const isRefundNotification = (notification) =>
    notification?.notification_type === 'REFUND';

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.notifications.getAll();
      if (res?.success) {
        setNotifications(res.data || []);
      } else {
        setError(res?.message || 'Failed to load notifications');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await api.notifications.getUnreadCount();
      if (res?.success) {
        setUnreadCount(res.data?.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  const markAsRead = async (notificationId) => {
    try {
      const res = await api.notifications.markAsRead(notificationId);
      if (res?.success) {
        setNotifications(prev =>
          prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
        );
        await loadUnreadCount();
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await api.notifications.markAllAsRead();
      if (res?.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const viewDetails = async (notification) => {
    try {
      const res = await api.notifications.getDetails(notification.notification_id);
      if (res?.success) {
        setSelectedNotification(res.data);
        setShowDetails(true);
        // Mark as read when viewing details
        if (!notification.is_read) {
          await markAsRead(notification.notification_id);
        }
      }
    } catch (err) {
      console.error('Failed to load notification details:', err);
    }
  };

  const goToCustomRequest = async (notification) => {
    if (!notification?.is_read) {
      await markAsRead(notification.notification_id);
    }
    setShowDetails(false);
    navigate('/provider/agency/requests');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="text-sm text-on-surface-variant">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-on-surface flex items-center gap-2">
            <Bell size={28} />
            Notifications
          </h1>
          <p className="text-sm text-on-surface-variant">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="bg-primary text-on-primary px-4 py-2 rounded-2xl text-sm font-bold hover:bg-primary-dim transition-colors flex items-center gap-2"
          >
            <CheckCheck size={18} />
            Mark All as Read
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-sm">
          {error}
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto text-on-surface-variant opacity-20 mb-4" />
            <p className="text-on-surface-variant">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.notification_id}
              className={`p-4 rounded-2xl border transition-all ${
                notification.is_read
                  ? 'bg-surface-container border-outline-variant/10'
                  : 'bg-primary/5 border-primary/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-on-surface">
                      {isRefundNotification(notification)
                        ? `Refund Request: ${notification.package_title}`
                        : isCustomRequestNotification(notification)
                          ? notification.package_title
                          : `New Booking: ${notification.package_title}`}
                    </h3>
                    {isRefundNotification(notification) && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">
                        <RotateCcw size={10} /> Refund
                      </span>
                    )}
                    {!notification.is_read && (
                      <span className="bg-primary text-on-primary text-xs px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface-variant mb-2">
                    Traveler: <strong>{notification.traveler_name}</strong>
                  </p>
                  <p className="text-xs text-on-surface-variant mb-2">
                    📅 {formatDate(notification.created_at)}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-on-surface-variant">Email:</span>{' '}
                      <span className="text-on-surface font-medium">{notification.traveler_email}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">Phone:</span>{' '}
                      <span className="text-on-surface font-medium">{notification.traveler_phone}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant">Travelers:</span>{' '}
                      <span className="text-on-surface font-medium">{notification.num_travelers}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isCustomRequestNotification(notification) && (
                    <button
                      onClick={() => goToCustomRequest(notification)}
                      className="bg-primary text-on-primary px-3 py-2 rounded-xl hover:bg-primary-dim transition-colors text-xs font-bold"
                      title="Go to custom request"
                    >
                      View Request
                    </button>
                  )}
                  <button
                    onClick={() => viewDetails(notification)}
                    className="bg-primary text-on-primary p-2 rounded-xl hover:bg-primary-dim transition-colors"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.notification_id)}
                      className="bg-on-surface text-white p-2 rounded-xl hover:bg-on-surface-variant transition-colors"
                      title="Mark as Read"
                    >
                      <Check size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedNotification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6">
            <h2 className="text-xl font-black text-on-surface mb-4">Booking Details</h2>
            {isRefundNotification(selectedNotification) && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2 mb-1">
                  <RotateCcw size={14} /> Refund Request
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">This traveler is requesting a refund. Please review and process accordingly.</p>
              </div>
            )}
            {isCustomRequestNotification(selectedNotification) && (
              <div className="mb-4 p-3 rounded-2xl bg-primary/10 border border-primary/20">
                <p className="text-sm font-bold text-primary mb-2">This is a custom travel request notification.</p>
                <button
                  onClick={() => goToCustomRequest(selectedNotification)}
                  className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-dim transition-colors"
                >
                  View Request
                </button>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs text-on-surface-variant uppercase font-bold">Package</p>
                <p className="text-on-surface font-bold">{selectedNotification.package_title}</p>
              </div>

              <div>
                <p className="text-xs text-on-surface-variant uppercase font-bold">Traveler Name</p>
                <p className="text-on-surface">{selectedNotification.traveler_name}</p>
              </div>

              <div>
                <p className="text-xs text-on-surface-variant uppercase font-bold">Email</p>
                <p className="text-on-surface">{selectedNotification.traveler_email}</p>
              </div>

              <div>
                <p className="text-xs text-on-surface-variant uppercase font-bold">Phone</p>
                <p className="text-on-surface">{selectedNotification.traveler_phone}</p>
              </div>

              <div>
                <p className="text-xs text-on-surface-variant uppercase font-bold">Number of Travelers</p>
                <p className="text-on-surface font-bold">{selectedNotification.num_travelers}</p>
              </div>

              <div>
                <p className="text-xs text-on-surface-variant uppercase font-bold">Booking Date</p>
                <p className="text-on-surface">{formatDate(selectedNotification.created_at)}</p>
              </div>
            </div>

            <button
              onClick={() => setShowDetails(false)}
              className="w-full bg-primary text-on-primary py-3 rounded-2xl font-bold hover:bg-primary-dim transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
