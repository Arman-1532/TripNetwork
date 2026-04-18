import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Edit3,
  Receipt,
  LogOut,
  Plane,
  Building2,
  Hotel,
  MessageSquareText,
  Shield
} from 'lucide-react';

const Sidebar = ({ user, activeTab, setActiveTab, onLogout }) => {
  const navigate = useNavigate();

  const role = (user?.role || '').toLowerCase();
  const providerType = (user?.providerType || '').toUpperCase();

  const menuItems = useMemo(() => {
    if (role === 'admin') {
      return [
        { id: 'admin', label: 'Admin Dashboard', icon: Shield, path: '/admin' },
      ];
    }

    if (role === 'provider' && providerType === 'AGENCY') {
      return [
        { id: 'agencyDashboard', label: 'Agency Dashboard', icon: Building2, path: '/provider/agency' },
        { id: 'chat', label: 'Chat', icon: MessageSquareText, path: '/chat' },
      ];
    }

    if (role === 'provider' && providerType === 'HOTEL') {
      return [
        { id: 'hotelDashboard', label: 'Hotel Dashboard', icon: Hotel, path: '/provider/hotel' },
        { id: 'hotelProfile', label: 'Profile', icon: Edit3, path: '/provider/hotel/profile' },
      ];
    }

    // Traveler (default)
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { id: 'custom', label: 'Custom Request', icon: Edit3, path: '/custom-request' },
      { id: 'invoices', label: 'Invoices', icon: Receipt, path: '/invoices' },
      { id: 'chat', label: 'Chat', icon: MessageSquareText, path: '/chat' },
    ];
  }, [role, providerType]);

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 dark:bg-slate-950 flex flex-col p-6 gap-y-2 font-headline text-sm font-medium z-50 border-r border-outline-variant/10">
      <div className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2">
        <Plane className="text-primary" size={24} />
        <span>TripNetwork</span>
      </div>

      <div className="flex items-center gap-4 mb-8 p-2 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-outline-variant/5">
        <div className="w-10 h-10 rounded-full bg-primary-container overflow-hidden flex items-center justify-center text-on-primary-container font-bold">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div>
          <p className="font-bold text-on-surface truncate max-w-[120px]">{user?.name || (role === 'admin' ? 'Admin' : 'User')}</p>
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">
            {role === 'admin'
              ? 'Administrator'
              : role === 'provider'
                ? (providerType === 'AGENCY' ? 'Agency Provider' : providerType === 'HOTEL' ? 'Hotel Provider' : 'Provider')
                : 'Premium Member'}
          </p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              navigate(item.path);
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out ${
              activeTab === item.id
                ? 'bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-outline-variant/10'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/30'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-outline-variant/10 flex flex-col gap-y-1">
        <button className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-on-surface transition-colors">


        </button>

        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-2 text-error hover:text-red-700 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
