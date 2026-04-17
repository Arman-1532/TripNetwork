import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import useBookAndPay from '../hooks/useBookAndPay';

export default function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const { bookAndPay, loading: booking, error: bookError } = useBookAndPay();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.hotels.getById(id);
        if (res?.success) setHotel(res.data);
        else setError(res?.message || 'Failed to load hotel');
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load hotel');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const details = useMemo(() => {
    if (!hotel) return null;
    try {
      return typeof hotel.description === 'string' ? JSON.parse(hotel.description) : hotel.description;
    } catch {
      return null;
    }
  }, [hotel]);

  const onBook = async () => {
    if (!hotel) return;
    await bookAndPay({
      booking_type: 'PACKAGE',
      package_id: hotel.package_id,
      num_people: 1,
      total_price: Number(hotel.price) || 0,
    });
  };

  if (loading) return <div className="text-sm text-on-surface-variant">Loading...</div>;
  if (error) return <div className="text-sm bg-error-container text-on-error-container p-3 rounded-2xl">{error}</div>;
  if (!hotel) return <div className="text-sm text-on-surface-variant">Not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface">{hotel.title}</h1>
          <div className="text-sm text-on-surface-variant">{hotel.destination}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-on-surface-variant">Price / night</div>
          <div className="text-2xl font-black text-primary">৳{hotel.price}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-outline-variant/10 rounded-3xl p-6 space-y-3">
        <div className="font-extrabold text-on-surface">Hotel Information</div>
        {details ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-on-surface-variant">City:</span> {details.city || hotel.destination}</div>
            <div><span className="text-on-surface-variant">Area:</span> {details.area || '—'}</div>
            <div><span className="text-on-surface-variant">Room Type:</span> {details.roomType || '—'}</div>
            <div><span className="text-on-surface-variant">Bed Type:</span> {details.bedType || '—'}</div>
            <div className="md:col-span-2"><span className="text-on-surface-variant">Address:</span> {details.fullAddress || '—'}</div>
            <div className="md:col-span-2"><span className="text-on-surface-variant">Description:</span> {details.fullDescription || '—'}</div>
          </div>
        ) : (
          <div className="text-sm text-on-surface-variant whitespace-pre-line">{hotel.description}</div>
        )}
      </div>

      {bookError && <div className="text-sm bg-error-container text-on-error-container p-3 rounded-2xl">{bookError}</div>}

      <div className="flex gap-3">
        <button
          type="button"
          className="rounded-2xl border border-outline-variant/20 px-4 py-2"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        <button
          type="button"
          disabled={booking}
          className="rounded-2xl bg-primary text-on-primary font-bold px-5 py-2 disabled:opacity-50"
          onClick={onBook}
        >
          {booking ? 'Processing...' : 'Book & Pay'}
        </button>
      </div>
    </div>
  );
}

