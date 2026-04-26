import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowLeft, AlertCircle, Shield } from 'lucide-react';
import { api } from '../services/api';

const AdminRequestDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null); // 'approved' | 'rejected'

  useEffect(() => {
    const load = async () => {
      // Role safeguard
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser.role?.toLowerCase() !== 'admin') {
        console.warn('⚠️ AdminRequestDetail mounted by non-admin user. Skipping fetch.');
        return;
      }

      try {
        setLoading(true);
        const res = await api.admin.pendingProviders();
        if (res?.success) {
          const found = (Array.isArray(res.data) ? res.data : []).find(
            (p) => String(p.user_id) === String(userId)
          );
          setProvider(found || null);
        } else {
          setError(res?.message || 'Failed to load request');
        }
      } catch (e) {
        setError(e?.message || 'Failed to load request');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleAction = async (action) => {
    try {
      setActing(true);
      setError(null);
      const res = action === 'approve'
        ? await api.admin.approveProvider(userId)
        : await api.admin.rejectProvider(userId);
      if (!res?.success) {
        setError(res?.message || 'Action failed');
        return;
      }
      setDone(action === 'approve' ? 'approved' : 'rejected');
    } catch (e) {
      setError(e?.message || 'Action failed');
    } finally {
      setActing(false);
    }
  };

  const orgName = provider?.provider_type === 'HOTEL' ? provider?.hotel_name : provider?.agency_name;

  return (
    <div className="space-y-6 max-w-3xl mx-auto min-h-screen bg-gray-50 dark:bg-slate-950 p-4 sm:p-6">
      {/* Back */}
      <button
        onClick={() => navigate('/admin')}
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors font-medium"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : !provider ? (
        <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={18} /> Request not found or already processed.
        </div>
      ) : done ? (
        <div className={`p-6 rounded-3xl text-center space-y-3 ${done === 'approved' ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'}`}>
          <div className={`text-2xl font-black ${done === 'approved' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {done === 'approved' ? '✓ Application Approved' : '✗ Application Rejected'}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {orgName || provider.name} has been {done}.
          </p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Header card with action buttons */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-blue-600 dark:text-blue-400" />
                <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black tracking-wider uppercase bg-gray-100 dark:bg-slate-800 text-black dark:text-white border border-gray-200 dark:border-slate-700">
                  {provider.provider_type}
                </span>
              </div>
              <h1 className="text-2xl font-black text-black dark:text-white">{orgName || provider.name}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{provider.email}</p>
            </div>

            {/* Accept / Reject */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                disabled={acting}
                onClick={() => handleAction('approve')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black disabled:opacity-50 text-sm transition-colors shadow-lg shadow-green-600/10"
              >
                <CheckCircle2 size={18} />
                {acting ? 'Wait...' : 'Approve'}
              </button>
              <button
                disabled={acting}
                onClick={() => handleAction('reject')}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black disabled:opacity-50 text-sm transition-colors shadow-lg shadow-red-600/10"
              >
                <XCircle size={18} />
                {acting ? 'Wait...' : 'Reject'}
              </button>
            </div>
          </div>

          {/* Detail fields */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-6 sm:p-8 space-y-8 shadow-sm">
            <h2 className="text-lg font-extrabold text-black dark:text-white border-b border-gray-100 dark:border-slate-800 pb-4">Application Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <Field label="Contact Name" value={provider.name} />
              <Field label="Email" value={provider.email} />
              <Field label="Phone" value={provider.phone} />
              <Field label="Provider Type" value={provider.provider_type} />
              {provider.provider_type === 'AGENCY'
                ? <Field label="Agency Name" value={provider.agency_name} />
                : <Field label="Hotel Name" value={provider.hotel_name} />}
              {provider.provider_type === 'HOTEL' && (
                <Field label="Hotel Location" value={provider.hotel_location || provider.hotelLocation} />
              )}
              <Field label="Trade License / NID" value={provider.trade_license_id} />
              <Field label="Website" value={provider.website} link={true} />
              <div className="sm:col-span-2">
                <Field label="Address" value={provider.address} />
              </div>
              {provider.created_at && (
                <Field label="Submitted At" value={new Date(provider.created_at).toLocaleString()} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Field = ({ label, value, link }) => (
  <div className="space-y-1.5">
    <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">{label}</div>
    <div className="text-sm font-bold text-black dark:text-white">
      {value
        ? link
          ? <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-all transition-colors">{value}</a>
          : <span className="break-words leading-relaxed">{value}</span>
        : <span className="text-gray-400 dark:text-gray-600 font-medium italic">Not provided</span>
      }
    </div>
  </div>
);

export default AdminRequestDetail;
