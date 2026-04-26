import { useCallback, useState } from 'react';
import { api } from '../services/api';

// Unified booking -> payment redirect flow.
// Supports: FLIGHT, PACKAGE (including HOTEL packages booked as PACKAGE).

export default function useBookAndPay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bookAndPay = useCallback(async (bookingPayload) => {
    setLoading(true);
    setError(null);

    try {
      const bookingRes = await api.bookings.create(bookingPayload);
      if (!bookingRes?.success || !bookingRes?.data?.bookingId) {
        const msg = bookingRes?.message || 'Failed to create booking';
        setError(msg);
        return Promise.reject(new Error(msg));
      }

      const bookingId = bookingRes.data.bookingId;

      const payRes = await api.payment.init(bookingId);
      if (!payRes?.success || !payRes?.url) {
        const msg = payRes?.message || 'Failed to initiate payment';
        setError(msg);
        return Promise.reject(new Error(msg));
      }

      // Redirect to payment gateway in the SAME tab.
      window.location.assign(payRes.url);

      return { bookingId };
    } catch (e) {
      // Prefer detailed server message if available
      const serverMsg = e?.response?.data?.message || e?.message || 'Booking/payment failed';
      setError(serverMsg);
      // Re-throw so callers can react if needed
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { bookAndPay, loading, error };
}
