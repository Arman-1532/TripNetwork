import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const HotelProfile = () => {
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
      // update local form state so the page shows current values
      const u = res.data.user;
      setProfile({
        hotelName: u.hotelName || u.hotel_name || '',
        hotelLocation: u.hotelLocation || u.location || u.hotelLocation || '',
        name: u.name || '',
        phone: u.phone || '',
        tradeLicenseId: u.tradeLicenseId || u.trade_license_id || '',
        address: u.address || '',
        website: u.website || ''
      });
      return res;
    }
    return res;
  };

  const onUpdateProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setPosting(true);
      const res = await api.__raw.users.updateProfile(profile);
      if (res?.data?.success) {
        setSuccess('Hotel info updated');
        const refreshed = await refreshMe();
        // if refresh failed, inform user
        if (!refreshed?.success) {
          setError('Updated but failed to refresh profile from server. Please reload.');
        }
      } else {
        setError(res?.data?.message || 'Update failed');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Update failed');
    } finally {
      setPosting(false);
    }
  };

  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-black text-on-surface dark:text-on-surface">Profile</h1>
        <p className="text-sm text-on-surface-variant dark:text-on-surface-variant">View and update your hotel profile information</p>
      </div>

      {error && <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-sm">{error}</div>}
      {success && <div className="p-3 rounded-2xl bg-primary-container/30 text-on-surface dark:text-white text-sm">{success}</div>}

      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-on-surface dark:text-white">Hotel Information</h2>
        <form onSubmit={onUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Hotel Name</label>
              <input className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={profile.hotelName} onChange={(e) => setProfile(p => ({ ...p, hotelName: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Hotel Location</label>
              <input className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={profile.hotelLocation} onChange={(e) => setProfile(p => ({ ...p, hotelLocation: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Contact Name</label>
              <input required className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Phone</label>
              <input className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Trade License ID</label>
              <input className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={profile.tradeLicenseId} onChange={(e) => setProfile(p => ({ ...p, tradeLicenseId: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Website</label>
              <input type="url" className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={profile.website} onChange={(e) => setProfile(p => ({ ...p, website: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant dark:text-white">Address</label>
            <textarea className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10 min-h-24" value={profile.address} onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))} />
          </div>

          <div className="flex items-center gap-3">
            <button disabled={posting} className="bg-primary text-on-primary font-bold px-6 py-3 rounded-2xl disabled:opacity-50">{posting ? 'Updating...' : 'Update Hotel Info'}</button>
            <button type="button" onClick={() => navigate('/provider/hotel')} className="px-6 py-3 rounded-2xl bg-surface text-on-surface border border-outline-variant/10">Back</button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default HotelProfile;
