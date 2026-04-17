import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const CustomRequestPage = () => {
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('');
  const [numPeople, setNumPeople] = useState(1);
  const [departureDate, setDepartureDate] = useState('');
  const [description, setDescription] = useState('');

  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadMyRequests = async () => {
    try {
      const res = await api.customRequests.getMyRequests();
      if (res?.success) setMyRequests(res.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadMyRequests();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        destination,
        budget: budget ? Number(budget) : undefined,
        num_people: Number(numPeople),
        departure_date: departureDate,
        description
      };

      const res = await api.customRequests.create(payload);
      if (res?.success) {
        setSuccess(res.message || 'Request submitted');
        setDestination('');
        setBudget('');
        setNumPeople(1);
        setDepartureDate('');
        setDescription('');
        await loadMyRequests();
      } else {
        setError(res?.message || 'Failed to submit request');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-on-surface">Custom Request</h1>
        <p className="text-sm text-on-surface-variant">Submit a custom trip request to agencies.</p>
      </div>

      <form onSubmit={onSubmit} className="bg-white dark:bg-slate-900 border border-outline-variant/10 rounded-3xl p-6 space-y-4">
        {error && <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-sm">{error}</div>}
        {success && <div className="p-3 rounded-2xl bg-primary-container/30 text-on-surface text-sm">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant">Destination</label>
            <input className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={destination} onChange={(e) => setDestination(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant">Budget</label>
            <input className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={budget} onChange={(e) => setBudget(e.target.value)} type="number" min="0" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant">People</label>
            <input className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={numPeople} onChange={(e) => setNumPeople(e.target.value)} type="number" min="1" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant">Departure date</label>
            <input className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} type="date" required />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-on-surface-variant">Description</label>
          <textarea className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10 min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Trip preferences, hotels, activities..." />
        </div>

        <button disabled={loading} className="bg-primary text-on-primary font-bold px-6 py-3 rounded-2xl disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit request'}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold text-on-surface">My Requests</h2>
        {myRequests.length === 0 ? (
          <div className="text-sm text-on-surface-variant">No custom requests yet.</div>
        ) : (
          <div className="space-y-3">
            {myRequests.map((r) => (
              <div key={r.package_id} className="bg-white dark:bg-slate-900 border border-outline-variant/10 rounded-2xl p-4">
                <div className="font-bold text-on-surface">{r.title}</div>
                <div className="text-xs text-on-surface-variant">Status: {r.status}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomRequestPage;

