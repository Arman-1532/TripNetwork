import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AgencyDashboard = () => {
  const [profile, setProfile] = useState({
    agencyName: '',
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
  const [availableRequests, setAvailableRequests] = useState([]);
  const [loadingMy, setLoadingMy] = useState(true);
  const [loadingReq, setLoadingReq] = useState(true);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    // Seed form from local user
    setProfile({
      agencyName: user.agencyName || user.agency_name || '',
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
      const res = await api.packages.getMyPackages();
      if (res?.success) setMyPackages(res.data || []);
    } finally {
      setLoadingMy(false);
    }
  };

  const loadAvailableRequests = async () => {
    setLoadingReq(true);
    try {
      const res = await api.customRequests.getAvailable();
      if (res?.success) setAvailableRequests(res.data || []);
    } finally {
      setLoadingReq(false);
    }
  };

  useEffect(() => {
    loadMyPackages();
    loadAvailableRequests();
  }, []);

  const onUpdateProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await api.__raw.users.updateProfile(profile);
      if (res?.data?.success) {
        setSuccess('Agency info updated');
        await refreshMe();
      } else {
        setError(res?.data?.message || 'Update failed');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Update failed');
    }
  };

  const [pkgForm, setPkgForm] = useState({
    title: '',
    destination: '',
    origin: '',
    price: '',
    travel_medium: 'BUS',
    description: ''
  });

  const onPostPackage = async (e) => {
    e.preventDefault();
    setPosting(true);
    setError(null);
    setSuccess(null);

    try {
      const body = {
        ...pkgForm,
        price: Number(pkgForm.price)
      };
      const res = await api.__raw.packages.create(body);
      if (res?.data?.success) {
        setSuccess('Package posted (pending approval)');
        setPkgForm({ title: '', destination: '', origin: '', price: '', travel_medium: 'BUS', description: '' });
        await loadMyPackages();
      } else {
        setError(res?.data?.message || 'Failed to post package');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to post package');
    } finally {
      setPosting(false);
    }
  };

  const onBid = async (reqPkg) => {
    const amount = window.prompt('Enter quote amount (BDT)');
    if (!amount) return;
    const message = window.prompt('Enter offer details');
    if (!message) return;

    try {
      const res = await api.customRequests.bid(reqPkg.package_id, {
        amount: Number(amount),
        message
      });
      if (res?.success) {
        setSuccess('Quote submitted');
        await loadAvailableRequests();
      } else {
        setError(res?.message || 'Failed to submit quote');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit quote');
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-black text-on-surface">Agency Dashboard</h1>
        <p className="text-sm text-on-surface-variant dark:text-white/80">Manage your travel packages</p>
      </div>

      {error && <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-sm">{error}</div>}
      {success && <div className="p-3 rounded-2xl bg-primary-container/30 text-on-primary-container text-sm font-medium">{success}</div>}

      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-on-surface dark:text-white">Agency Information</h2>
        <form onSubmit={onUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Agency Name</label>
              <input className="w-full bg-surface-container-low text-on-surface rounded-2xl px-4 py-3 border border-outline-variant/10" value={profile.agencyName} onChange={(e) => setProfile(p => ({ ...p, agencyName: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Contact Name</label>
              <input required className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Phone</label>
              <input className="w-full bg-surface-container-low text-on-surface rounded-2xl px-4 py-3 border border-outline-variant/10" value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Trade License ID</label>
              <input className="w-full bg-surface-container-low text-on-surface rounded-2xl px-4 py-3 border border-outline-variant/10" value={profile.tradeLicenseId} onChange={(e) => setProfile(p => ({ ...p, tradeLicenseId: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Website</label>
              <input type="url" className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={profile.website} onChange={(e) => setProfile(p => ({ ...p, website: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant dark:text-white">Address</label>
            <textarea className="w-full bg-surface-container-low text-on-surface rounded-2xl px-4 py-3 border border-outline-variant/10 min-h-24" value={profile.address} onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))} />
          </div>

          <button className="bg-primary text-on-primary font-bold px-6 py-3 rounded-2xl">Update Agency Info</button>
        </form>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-on-surface dark:text-white">Post New Travel Package</h2>
        <form onSubmit={onPostPackage} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Package Title</label>
              <input required className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={pkgForm.title} onChange={(e) => setPkgForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Destination</label>
              <input required className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={pkgForm.destination} onChange={(e) => setPkgForm(p => ({ ...p, destination: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Origin</label>
              <input className="w-full bg-surface-container-low text-on-surface rounded-2xl px-4 py-3 border border-outline-variant/10" value={pkgForm.origin} onChange={(e) => setPkgForm(p => ({ ...p, origin: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Price (BDT)</label>
              <input required type="number" min="0" className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={pkgForm.price} onChange={(e) => setPkgForm(p => ({ ...p, price: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Travel Medium</label>
              <select className="w-full bg-surface-container-low text-on-surface rounded-2xl px-4 py-3 border border-outline-variant/10" value={pkgForm.travel_medium} onChange={(e) => setPkgForm(p => ({ ...p, travel_medium: e.target.value }))}>
                <option value="BUS">BUS</option>
                <option value="AIR">AIR</option>
                <option value="TRAIN">TRAIN</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant dark:text-white">Description</label>
            <textarea className="w-full bg-surface-container-low text-on-surface rounded-2xl px-4 py-3 border border-outline-variant/10 min-h-24" value={pkgForm.description} onChange={(e) => setPkgForm(p => ({ ...p, description: e.target.value }))} />
          </div>

          <button disabled={posting} className="bg-primary text-on-primary font-bold px-6 py-3 rounded-2xl disabled:opacity-50">
            {posting ? 'Posting...' : 'Post Package'}
          </button>
        </form>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-on-surface dark:text-white">Available Custom Trip Requests</h2>
        {loadingReq ? (
          <div className="text-sm text-on-surface-variant dark:text-white/80">Fetching requests...</div>
        ) : availableRequests.length === 0 ? (
          <div className="text-sm text-on-surface-variant dark:text-white/80">No custom trip requests available right now.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableRequests.map((r) => {
              let meta = {};
              try { meta = JSON.parse(r.description); } catch {}
              return (
                <div key={r.package_id} className="border border-outline-variant/10 rounded-2xl p-4 bg-surface-container-low">
                  <div className="font-black text-on-surface">{r.title}</div>
                  <div className="text-xs text-on-surface-variant dark:text-white/80">Requested by: {r.traveler_name || 'Traveler'}</div>
                  <div className="text-sm text-on-surface-variant dark:text-white/80 mt-2">
                    <div><b>Budget:</b> ৳{meta.budget ?? 'N/A'}</div>
                    <div><b>People:</b> {meta.numPeople ?? 'N/A'}</div>
                    <div><b>Date:</b> {meta.departureDate ?? 'Anytime'}</div>
                  </div>
                  <button onClick={() => onBid(r)} className="mt-3 bg-primary text-on-primary px-4 py-2 rounded-xl font-bold text-sm">Submit Quote</button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-on-surface dark:text-white">My Posted Travel Packages</h2>
        {loadingMy ? (
          <div className="text-sm text-on-surface-variant dark:text-white/80">Loading...</div>
        ) : myPackages.length === 0 ? (
          <div className="text-sm text-on-surface-variant dark:text-white/80">No packages posted yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPackages.map((p) => (
              <div key={p.package_id} className="border border-outline-variant/10 rounded-2xl p-4 bg-surface-container-low">
                <div className="font-black text-on-surface">{p.title}</div>
                <div className="text-xs text-on-surface-variant dark:text-white/80">{p.origin ? `${p.origin} → ` : ''}{p.destination}</div>
                <div className="text-sm text-primary font-black mt-2">৳{p.price}</div>
                <div className="text-xs text-on-surface-variant dark:text-white/80">Status: {p.status}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AgencyDashboard;
