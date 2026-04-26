import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Shield, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { api } from '../services/api';
import UserSearchAndBlock from '../components/UserSearchAndBlock';

const AdminDashboardPage = ({ onLogout }) => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'search'
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const loadPending = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.admin.pendingProviders();
      if (!res?.success) {
        setError(res?.message || 'Failed to fetch pending providers');
        setPending([]);
        return;
      }
      setPending(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e?.message || 'Failed to fetch pending providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Role safeguard: Only fetch if the user is an admin
    const role = (user?.role || '').toLowerCase();
    if (role === 'admin') {
      loadPending();
    } else {
      console.warn('⚠️ AdminDashboardPage mounted by non-admin user. Skipping fetch.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAction = async (id, action) => {
    try {
      setActingId(id);
      setError(null);
      const res = action === 'approve'
        ? await api.admin.approveProvider(id)
        : await api.admin.rejectProvider(id);

      if (!res?.success) {
        setError(res?.message || 'Action failed');
        return;
      }

      await loadPending();
    } catch (e) {
      setError(e?.message || 'Action failed');
    } finally {
      setActingId(null);
    }
  };


  return (
    <div className="space-y-8 min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-black dark:text-white flex items-center gap-3">
            <Shield className="text-blue-600 dark:text-blue-400" /> Admin Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Manage provider applications and user accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-black dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => onLogout?.()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white dark:bg-slate-900 rounded-2xl p-2 w-fit border border-gray-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'pending'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          Pending Approvals
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'search'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
        >
          Search & Block Users
        </button>
      </div>

      {/* Pending Approvals Tab */}
      {activeTab === 'pending' && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xl">
          <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex items-center justify-between">
            <div className="font-extrabold text-black dark:text-white text-lg">Pending Approvals</div>
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Signed in as: {user?.name || 'Admin'}</div>
          </div>

          <div className="p-8">
            {error && (
              <div className="flex items-center gap-3 p-4 mb-6 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-2xl text-sm border border-red-200 dark:border-red-800">
                <AlertCircle size={20} /> {error}
              </div>
            )}

            {loading && pending.length === 0 ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : pending.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
                <Shield size={48} className="mx-auto text-gray-300 dark:text-slate-700 mb-4" />
                <div className="text-sm font-bold text-gray-500 dark:text-gray-400">No pending approvals found at the moment.</div>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-8 px-8">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400">
                      <th className="pb-4 px-4 font-black uppercase tracking-widest text-[10px]">Name / Org</th>
                      <th className="pb-4 px-4 font-black uppercase tracking-widest text-[10px]">Type</th>
                      <th className="pb-4 px-4 font-black uppercase tracking-widest text-[10px]">Contact</th>
                      <th className="pb-4 px-4 font-black uppercase tracking-widest text-[10px]">License / NID</th>
                      <th className="pb-4 px-4 font-black uppercase tracking-widest text-[10px]">Actions</th>
                      <th className="pb-4 px-4 font-black uppercase tracking-widest text-[10px] text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {pending.map((p) => {
                      const orgName = p.provider_type === 'HOTEL' ? p.hotel_name : p.agency_name;
                      const typeLabel = p.provider_type;
                      return (
                        <tr key={p.user_id} className="group hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-5 px-4">
                            <div className="font-extrabold text-black dark:text-white text-base">{orgName || p.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{p.name}</div>
                          </td>
                          <td className="py-5 px-4">
                            <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-slate-800 text-black dark:text-white border border-gray-200 dark:border-slate-700">
                              {typeLabel}
                            </span>
                          </td>
                          <td className="py-5 px-4">
                            <div className="text-black dark:text-white font-bold">{p.email}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{p.phone || '—'}</div>
                          </td>
                          <td className="py-5 px-4">
                            <div className="text-black dark:text-white font-mono text-xs">{p.trade_license_id || '—'}</div>
                          </td>
                          <td className="py-5 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                disabled={actingId === p.user_id}
                                onClick={() => handleAction(p.user_id, 'approve')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-xs disabled:opacity-50 transition-colors shadow-sm"
                              >
                                <CheckCircle2 size={16} /> Approve
                              </button>
                              <button
                                disabled={actingId === p.user_id}
                                onClick={() => handleAction(p.user_id, 'reject')}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs disabled:opacity-50 transition-colors shadow-sm"
                              >
                                <XCircle size={16} /> Reject
                              </button>
                            </div>
                          </td>
                          <td className="py-5 px-4 text-right">
                            <button
                              onClick={() => navigate(`/admin/request/${p.user_id}`)}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-black dark:text-white font-black text-xs hover:bg-gray-200 dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-700"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search & Block Users Tab */}
      {activeTab === 'search' && (
        <UserSearchAndBlock
          onUserBlocked={(user) => {
            console.log('User blocked:', user);
            // Optionally reload pending list or show a notification
          }}
          onUserUnblocked={(user) => {
            console.log('User unblocked:', user);
            // Optionally reload or show notification
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
