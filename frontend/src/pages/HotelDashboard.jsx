import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const HotelDashboard = () => {
  const [profile, setProfile] = useState({
    hotelName: '',
    hotelLocation: '',
    name: '',
    phone: '',
    tradeLicenseId: '',
    address: '',
    website: ''
  });

  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [myPackages, setMyPackages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loadingMy, setLoadingMy] = useState(true);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    setProfile({
      hotelName: user.hotelName || user.hotel_name || '',
      hotelLocation: user.hotelLocation || user.location || user.hotelLocation || '',
      name: user.name || '',
      phone: user.phone || '',
      tradeLicenseId: user.tradeLicenseId || user.trade_license_id || '',
      address: user.address || '',
      website: user.website || ''
    });
  }, [user]);

  const refreshMe = async () => {
    const res = await api.auth.me();
    if (res?.success) {
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
  };

  const loadMyPackages = async () => {
    setLoadingMy(true);
    try {
      const res = await api.__raw.hotels.myPackages();
      if (res?.data?.success) setMyPackages(res.data.data || []);
    } finally {
      setLoadingMy(false);
    }
  };

  useEffect(() => {
    loadMyPackages();
  }, []);

  const startEdit = (pkg) => {
    setEditingId(pkg.package_id);
    setEditForm({
      title: pkg.title || '',
      destination: pkg.destination || '',
      price: pkg.price || '',
      description: pkg.description || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (packageId) => {
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        title: editForm.title,
        destination: editForm.destination,
        price: Number(editForm.price),
        description: editForm.description
      };
      const res = await api.packages.update(packageId, payload);
      if (res?.success) {
        setSuccess('Package updated');
        setEditingId(null);
        setEditForm({});
        await loadMyPackages();
      } else {
        setError(res?.message || 'Failed to update package');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update package');
    }
  };

  const onPostOffering = async (e) => {
    e.preventDefault();
    setPosting(true);
    setError(null);
    setSuccess(null);

    try {
      const description = JSON.stringify({
        country: offering.country,
        city: offering.city,
        area: offering.area,
        fullAddress: offering.fullAddress,
        roomType: offering.roomType,
        bedType: offering.bedType,
        fullDescription: offering.fullDescription,
      });

      const body = {
        title: offering.shortTitle,
        destination: offering.city,
        price: Number(offering.price),
        description
      };

      const res = await api.__raw.hotels.createPackage(body);
      if (res?.data?.success) {
        setSuccess('Offering posted (pending approval)');
        setOffering({ country: '', city: '', area: '', fullAddress: '', roomType: 'Single', price: '', bedType: '', fullDescription: '', shortTitle: '' });
        await loadMyPackages();
      } else {
        setError(res?.data?.message || 'Failed to post offering');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to post offering');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-black text-on-surface dark:text-black">Hotel Dashboard</h1>
        <p className="text-sm text-on-surface-variant dark:text-black/80">Manage your offerings</p>
      </div>

      {error && <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-sm">{error}</div>}
      {success && <div className="p-3 rounded-2xl bg-primary-container/30 text-on-surface dark:text-white text-sm">{success}</div>}

      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-on-surface dark:text-white">Hotel Profile</h2>
          <p className="text-sm text-on-surface-variant dark:text-white/80">View and update your profile on a separate page.</p>
        </div>
        <div>
          <button onClick={() => navigate('/provider/hotel/profile')} className="bg-primary text-on-primary font-bold px-6 py-3 rounded-2xl">Open Profile</button>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-on-surface dark:text-white">Post Hotel Offering</h2>
        <form onSubmit={onPostOffering} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Country</label>
              <input required className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={offering.country} onChange={(e) => setOffering(o => ({ ...o, country: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">City</label>
              <input required className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={offering.city} onChange={(e) => setOffering(o => ({ ...o, city: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Area</label>
              <input className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={offering.area} onChange={(e) => setOffering(o => ({ ...o, area: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Full Address</label>
              <input required className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={offering.fullAddress} onChange={(e) => setOffering(o => ({ ...o, fullAddress: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Room Type</label>
              <select className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={offering.roomType} onChange={(e) => setOffering(o => ({ ...o, roomType: e.target.value }))}>
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Suite">Suite</option>
                <option value="Deluxe">Deluxe</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Price (BDT)</label>
              <input required type="number" min="0" className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={offering.price} onChange={(e) => setOffering(o => ({ ...o, price: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Bed Type</label>
              <input className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={offering.bedType} onChange={(e) => setOffering(o => ({ ...o, bedType: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant dark:text-white">Detailed Description</label>
            <textarea required className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10 min-h-24" value={offering.fullDescription} onChange={(e) => setOffering(o => ({ ...o, fullDescription: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant dark:text-white">Short Title</label>
            <input required className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={offering.shortTitle} onChange={(e) => setOffering(o => ({ ...o, shortTitle: e.target.value }))} />
          </div>

          <button disabled={posting} className="bg-primary text-on-primary font-bold px-6 py-3 rounded-2xl disabled:opacity-50">
            {posting ? 'Posting...' : 'Post Offering'}
          </button>
        </form>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-on-surface dark:text-white">My Posted Hotel Packages</h2>
        {loadingMy ? (
          <div className="text-sm text-on-surface-variant dark:text-white/80">Loading...</div>
        ) : myPackages.length === 0 ? (
          <div className="text-sm text-on-surface-variant dark:text-white/80">No packages posted yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPackages.map((p) => (
              <div key={p.package_id} className="border border-outline-variant/10 rounded-2xl p-4 bg-surface-container-low">
                {editingId === p.package_id ? (
                  <div className="space-y-3">
                    <input className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2" value={editForm.title} onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))} />
                    <input className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2" value={editForm.destination} onChange={(e) => setEditForm(f => ({ ...f, destination: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2" value={editForm.price} onChange={(e) => setEditForm(f => ({ ...f, price: e.target.value }))} />
                    </div>
                    <textarea className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2" value={editForm.description} onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(p.package_id)} className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold">Save</button>
                      <button onClick={cancelEdit} className="px-4 py-2 rounded-xl bg-surface">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="font-black text-on-surface">{p.title}</div>
                    <div className="text-xs text-on-surface-variant dark:text-white/80">{p.destination}</div>
                    <div className="text-sm text-primary font-black mt-2">৳{p.price}</div>
                    <div className="text-xs text-on-surface-variant dark:text-white/80">Status: {p.status}</div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => startEdit(p)} className="px-3 py-2 rounded-xl bg-surface text-on-surface border">Edit</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HotelDashboard;
