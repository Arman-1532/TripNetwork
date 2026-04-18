import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const InvoicesPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-on-surface">Invoices</h1>
        <p className="text-sm text-on-surface-variant">Payment and booking records.</p>
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
      ) : bookings.length === 0 ? (
        <div className="text-sm text-on-surface-variant">No invoices found.</div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-slate-900 border border-outline-variant/10 rounded-3xl">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-container-low">
              <tr className="text-left">
                <th className="p-4">Booking</th>
                <th className="p-4">Type</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.booking_id} className="border-t border-outline-variant/10">
                  <td className="p-4">#{b.booking_id}</td>
                  <td className="p-4">{b.booking_type}</td>
                  <td className="p-4">৳{b.total_price}</td>
                  <td className="p-4">{b.payment_status || b.booking_status}</td>
                  <td className="p-4">{new Date(b.created_at).toLocaleString()}</td>
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
