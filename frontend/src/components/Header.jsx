import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { api } from '../services/api';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isTravelerDashboard = location.pathname === '/traveler' || location.pathname === '/';
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

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
    // Load unread notifications for providers
    if (user?.role?.toLowerCase() === 'provider') {
      loadUnreadCount();
    }
  }, [user?.role, loadUnreadCount]);

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const isProvider = user?.role?.toLowerCase() === 'provider';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl flex items-center justify-between px-8 py-4 shadow-sm dark:shadow-none font-headline antialiased border-b border-outline-variant/5">
      <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        Welcome to TripNetwork
      </div>

      <div className="flex items-center gap-3">
        {isProvider && (
          <button
            onClick={handleNotificationClick}
            className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-on-primary font-extrabold shadow-lg shadow-primary/20 hover:bg-primary-dim transition-colors"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={20} className="stroke-[2.5]" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
