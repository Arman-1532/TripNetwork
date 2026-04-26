import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { FileText, Building2, RotateCcw } from 'lucide-react';

const InvoicesPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refundingId, setRefundingId] = useState(null);

  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const paymentStatus = query.get('payment');
  const tranId = query.get('tran_id');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.bookings.getAll();
        if (res?.success) {
          setBookings(res.data || []);
        } else {
          setBookings([]);
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRefund = async (booking) => {
    if (!window.confirm(`Request a refund for this booking?\n\nPackage: ${booking.package_title || 'N/A'}\nAmount: ৳${booking.total_price}\n\nThe agency will be notified immediately.`)) return;
    setRefundingId(booking.booking_id);
    try {
      const res = await api.bookings.requestRefund(booking.booking_id);
      if (res?.success) {
        // Optimistically update local state so UI reflects change instantly
        setBookings(prev =>
          prev.map(b =>
            b.booking_id === booking.booking_id
              ? { ...b, booking_status: 'REFUND_REQUESTED' }
              : b
          )
        );
      } else {
        alert(res?.message || 'Failed to submit refund request.');
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to submit refund request.');
    } finally {
      setRefundingId(null);
    }
  };

  const visibleBookings = useMemo(
    () => bookings.filter((b) => String(b?.booking_status || '').toUpperCase() !== 'PENDING'),
    [bookings]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200/90 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50 to-slate-100/70 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-6 md:p-7 shadow-sm">
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary dark:text-black px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-3">
          <FileText size={14} />
          Billing Center
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Invoices</h1>
        <p className="text-sm text-violet-700 dark:text-black-300 mt-1">Confirmed payment and booking records.</p>
      </div>

      {paymentStatus === 'fail' && (
        <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-sm">
          Payment failed{tranId ? ` (Tran: ${tranId})` : ''}.
        </div>
      )}

      {paymentStatus === 'cancel' && (
        <div className="p-3 rounded-2xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/10">
          Payment cancelled{tranId ? ` (Tran: ${tranId})` : ''}.
        </div>
      )}

      {!paymentStatus && tranId && (
        <div className="p-3 rounded-2xl bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 text-sm border border-green-400">
          Payment success (Tran: {tranId}).
        </div>
      )}

      {error && <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-sm">{error}</div>}

      {loading ? (
        <div className="text-sm text-on-surface-variant">Loading...</div>
      ) : visibleBookings.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container p-4 text-sm text-on-surface-variant">
          No invoices found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <table className="min-w-full text-sm text-slate-800 dark:text-slate-100">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200">
              <tr className="text-left">
                <th className="p-4">#</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Type</th>
                <th className="p-4">Package / Flight</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {visibleBookings.map((b, idx) => (
                <tr key={b.booking_id} className="border-t border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="p-4 font-semibold">#{idx + 1}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                      <Building2 size={13} />
                      {b.provider_name || 'TripNetwork Partner'}
                    </span>
                  </td>
                  <td className="p-4">
                    {b.booking_type === 'FLIGHT' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        ✈ Flight
                      </span>
                    ) : (b.booking_type === 'HOTEL' || b.provider_type === 'HOTEL') ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                        🏨 Hotel
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                        📦 Package
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-700 dark:text-slate-200">
                    {(b.booking_type === 'PACKAGE' || b.booking_type === 'HOTEL') && b.package_title
                      ? <span className="font-medium">{b.package_title}</span>
                      : b.booking_type === 'FLIGHT' && (b.airline_name || b.flight_number)
                        ? <span className="font-medium">{[b.airline_name, b.flight_number].filter(Boolean).join(' ')}</span>
                        : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="p-4 font-black text-indigo-700 dark:text-indigo-300">৳{b.total_price}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{new Date(b.created_at).toLocaleString()}</td>
                  <td className="p-4">
                    {(b.booking_type === 'PACKAGE' || b.booking_type === 'HOTEL') && b.booking_status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleRefund(b)}
                        disabled={refundingId === b.booking_id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {refundingId === b.booking_id ? (
                          <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />Requesting...</span>
                        ) : (
                          <><RotateCcw size={12} />Request Refund</>
                        )}
                      </button>
                    )}
                    {b.booking_status === 'REFUND_REQUESTED' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                        <RotateCcw size={12} /> Refund Requested
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
