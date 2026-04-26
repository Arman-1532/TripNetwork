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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 max-w-md w-full p-6 shadow-2xl shadow-black/20">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Eye className="text-primary" size={24} />
              Booking Details
            </h2>
            
            {isRefundNotification(selectedNotification) && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50">
                <p className="text-sm font-black text-amber-700 dark:text-amber-300 flex items-center gap-2 mb-1">
                  <RotateCcw size={16} /> Refund Request
                </p>
                <p className="text-xs text-amber-800/80 dark:text-amber-400/90 leading-relaxed">This traveler is requesting a refund. Please review and process accordingly.</p>
              </div>
            )}
            
            {isCustomRequestNotification(selectedNotification) && (
              <div className="mb-6 p-4 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
                <p className="text-sm font-bold text-primary mb-3">Custom travel request notification.</p>
                <button
                  onClick={() => goToCustomRequest(selectedNotification)}
                  className="w-full bg-primary text-on-primary py-2.5 rounded-xl text-sm font-black hover:bg-primary-dim transition-all shadow-md shadow-primary/20"
                >
                  View Request Details
                </button>
              </div>
            )}
 
            <div className="space-y-5 mb-8">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-1">Package / Request</p>
                  <p className="text-sm text-slate-900 dark:text-white font-bold">{selectedNotification.package_title}</p>
                </div>
 
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-1">Traveler</p>
                    <p className="text-sm text-slate-900 dark:text-white font-bold">{selectedNotification.traveler_name}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-1">Size</p>
                    <p className="text-sm text-slate-900 dark:text-white font-bold">{selectedNotification.num_travelers} Person(s)</p>
                  </div>
                </div>
 
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-1">Contact Email</p>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">{selectedNotification.traveler_email}</p>
                </div>
 
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-1">Phone Number</p>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">{selectedNotification.traveler_phone}</p>
                </div>
 
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mb-1">Received At</p>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">{formatDate(selectedNotification.created_at)}</p>
                </div>
              </div>
            </div>
 
            <button
              onClick={() => setShowDetails(false)}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
