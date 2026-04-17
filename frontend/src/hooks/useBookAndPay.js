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
        throw new Error(bookingRes?.message || 'Failed to create booking');
      }

      const bookingId = bookingRes.data.bookingId;

      const payRes = await api.payment.init(bookingId);
      if (!payRes?.success || !payRes?.url) {
        throw new Error(payRes?.message || 'Failed to initiate payment');
      }

      // Redirect to SSLCommerz hosted gateway
      window.location.assign(payRes.url);
      return { bookingId };
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Booking/payment failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { bookAndPay, loading, error };
}

