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
  Shield,
  Bell
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
        { id: 'agencyProfile', label: 'Profile', icon: Edit3, path: '/provider/agency/profile' },
        { id: 'agencyPost', label: 'Post Package', icon: Plane, path: '/provider/agency/post' },
        { id: 'agencyRequests', label: 'Custom Requests', icon: MessageSquareText, path: '/provider/agency/requests' },
        { id: 'agencyPackages', label: 'My Packages', icon: Building2, path: '/provider/agency/packages' },
        { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
        { id: 'chat', label: 'Chat', icon: MessageSquareText, path: '/chat' },
      ];
    }

    if (role === 'provider' && providerType === 'HOTEL') {
      return [
        { id: 'hotelProfile', label: 'Profile', icon: Edit3, path: '/provider/hotel/profile' },
        { id: 'hotelPost', label: 'Post Offering', icon: Hotel, path: '/provider/hotel/post' },
        { id: 'hotelPackages', label: 'My Offerings', icon: Building2, path: '/provider/hotel/packages' },
        { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
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
    <aside className="h-screen w-64 fixed left-0 top-0 bg-gray-50 dark:bg-slate-950 flex flex-col p-6 gap-y-2 font-headline text-sm font-medium z-50 border-r border-gray-200 dark:border-slate-800">
      <div className="text-xl font-black text-black dark:text-white mb-8 flex items-center gap-2">
        <Plane className="text-blue-600 dark:text-blue-400" size={24} />
        <span>TripNetwork</span>
      </div>

      <div className="flex items-center gap-4 mb-8 p-3 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-gray-200/50 dark:border-slate-800/50 shadow-sm backdrop-blur-md">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 overflow-hidden flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-black dark:text-white truncate">{user?.name || (role === 'admin' ? 'Admin' : 'User')}</p>
          <p className="text-[10px] uppercase tracking-widest font-black text-gray-500 dark:text-gray-400">
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
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-bold ${activeTab === item.id
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-gray-200 dark:ring-slate-700'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-slate-800/50 hover:text-black dark:hover:text-white'
              }`}
          >
            <item.icon size={20} className={activeTab === item.id ? 'stroke-[3px]' : 'stroke-[2px]'} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-gray-200 dark:border-slate-800 flex flex-col gap-y-1">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-bold"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
