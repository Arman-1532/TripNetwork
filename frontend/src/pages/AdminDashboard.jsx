import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Shield, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { api } from '../services/api';

const AdminDashboardPage = ({ onLogout }) => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

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
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const toggleDetails = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-on-surface flex items-center gap-3">
            <Shield className="text-primary" /> Admin Dashboard
          </h1>
          <p className="text-sm text-on-surface-variant">
            Approve or reject provider applications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low border border-outline-variant/10 text-on-surface font-bold hover:bg-surface-container transition-colors"
          >
            <RefreshCw size={18} /> Refresh
          </button>
          <button
            onClick={() => onLogout?.()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-error text-on-error font-bold hover:opacity-90 transition-opacity"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-outline-variant/10 overflow-hidden shadow-2xl">
        <div className="px-8 py-5 border-b border-outline-variant/10 bg-surface flex items-center justify-between">
          <div className="font-extrabold text-on-surface">Pending Approvals</div>
          <div className="text-xs text-on-surface-variant">Signed in as: {user?.name || 'Admin'}</div>
        </div>

        <div className="p-6">
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-error-container text-on-error-container rounded-2xl text-sm">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 rounded-2xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : pending.length === 0 ? (
            <div className="text-sm text-on-surface-variant dark:text-white/80">No pending approvals found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-on-surface-variant dark:text-white/80">
                    <th className="py-3 px-2">Name / Org</th>
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2">Email</th>
                    <th className="py-3 px-2">License / NID</th>
                    <th className="py-3 px-2">Address</th>
                    <th className="py-3 px-2">Website</th>
                    <th className="py-3 px-2">Actions</th>
                    <th className="py-3 px-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((p) => {
                    const orgName = p.provider_type === 'HOTEL' ? p.hotel_name : p.agency_name;
                    const typeLabel = p.provider_type;
                    return (
                      <React.Fragment key={p.user_id}>
                        <tr className="border-t border-outline-variant/10">
                          <td className="py-4 px-2">
                            <div className="font-extrabold text-on-surface dark:text-white">{orgName || p.name}</div>
                            <div className="text-xs text-on-surface-variant dark:text-white/70">{p.name}</div>
                          </td>
                          <td className="py-4 px-2">
                            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-black bg-surface-container text-on-surface border border-outline-variant/20">
                              {typeLabel}
                            </span>
                          </td>
                          <td className="py-4 px-2">
                            <div className="text-on-surface dark:text-white">{p.email}</div>
                            <div className="text-xs text-on-surface-variant dark:text-white/70">{p.phone || '—'}</div>
                          </td>
                          <td className="py-4 px-2 text-on-surface dark:text-white">{p.trade_license_id || '—'}</td>
                          <td className="py-4 px-2 text-on-surface dark:text-white">{p.address || '—'}</td>
                          <td className="py-4 px-2 text-on-surface dark:text-white">{p.website ? (<a className="text-primary underline" href={p.website} target="_blank" rel="noreferrer">{p.website}</a>) : '—'}</td>
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-2">
                              <button
                                disabled={actingId === p.user_id}
                                onClick={() => handleAction(p.user_id, 'approve')}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white font-black disabled:opacity-50"
                              >
                                <CheckCircle2 size={16} /> Approve
                              </button>
                              <button
                                disabled={actingId === p.user_id}
                                onClick={() => handleAction(p.user_id, 'reject')}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white font-black disabled:opacity-50"
                              >
                                <XCircle size={16} /> Reject
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <button
                              onClick={() => toggleDetails(p.user_id)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container text-on-surface font-black hover:bg-surface-container-high"
                            >
                              {expandedId === p.user_id ? 'Hide' : 'Details'}
                            </button>
                          </td>
                        </tr>
                        {expandedId === p.user_id && (
                          <tr className="bg-surface-container/40">
                            <td colSpan={10} className="py-4 px-4 text-sm text-on-surface-variant">
                              <div className="grid grid-cols-2 gap-4">
                                <div><strong>Provider Type:</strong> {p.provider_type}</div>
                                <div><strong>License / NID:</strong> {p.trade_license_id || '—'}</div>
                                <div><strong>Agency / Hotel:</strong> {p.agency_name || p.hotel_name || '—'}</div>
                                <div><strong>Address:</strong> {p.address || '—'}</div>
                                <div className="col-span-2"><strong>Website:</strong> {p.website ? (<a className="text-primary underline" href={p.website} target="_blank" rel="noreferrer">{p.website}</a>) : '—'}</div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
