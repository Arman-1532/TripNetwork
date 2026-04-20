import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api } from '../services/api';
import AgencyProfile from './agency/AgencyProfile';
import AgencyPostPackage from './agency/AgencyPostPackage';
import AgencyCustomRequests from './agency/AgencyCustomRequests';
import AgencyMyPackages from './agency/AgencyMyPackages';

const AgencyDashboard = () => {
  // ─── Shared State ────────────────────────────────────────────────────────────
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
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [availableRequests, setAvailableRequests] = useState([]);
  const [loadingMy, setLoadingMy] = useState(true);
  const [loadingReq, setLoadingReq] = useState(true);

  const [pkgForm, setPkgForm] = useState({
    title: '',
    destination: '',
    origin: '',
    price: '',
    travel_medium: 'BUS',
    description: ''
  });

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  // ─── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    setProfile({
      agencyName: user.agencyName || user.agency_name || '',
      name: user.name || '',
      phone: user.phone || '',
      tradeLicenseId: user.tradeLicenseId || user.trade_license_id || '',
      address: user.address || '',
      website: user.website || ''
    });
  }, [user]);

  useEffect(() => {
    loadMyPackages();
    loadAvailableRequests();
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const clearMessages = () => { setError(null); setSuccess(null); };

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

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const onUpdateProfile = async (e) => {
    e.preventDefault();
    clearMessages();
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

  const onPostPackage = async (e) => {
    e.preventDefault();
    setPosting(true);
    clearMessages();
    try {
      const body = { ...pkgForm, price: Number(pkgForm.price) };
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
    clearMessages();
    try {
      const res = await api.customRequests.bid(reqPkg.package_id, { amount: Number(amount), message });
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

  const startEdit = (pkg) => {
    setEditingId(pkg.package_id);
    setEditForm({
      title: pkg.title || '',
      destination: pkg.destination || '',
      origin: pkg.origin || '',
      price: pkg.price || '',
      travel_medium: pkg.travel_medium || 'BUS',
      description: pkg.description || ''
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async (packageId) => {
    clearMessages();
    try {
      const payload = {
        title: editForm.title,
        destination: editForm.destination,
        origin: editForm.origin,
        price: Number(editForm.price),
        travel_medium: editForm.travel_medium,
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

  return (
    <div className="space-y-6">
      {/* Nested Routes */}
      <Routes>
        <Route index element={<Navigate to="profile" replace />} />
        <Route
          path="profile"
          element={
            <AgencyProfile
              profile={profile}
              setProfile={setProfile}
              onUpdateProfile={onUpdateProfile}
              error={error}
              success={success}
            />
          }
        />
        <Route
          path="post"
          element={
            <AgencyPostPackage
              pkgForm={pkgForm}
              setPkgForm={setPkgForm}
              onPostPackage={onPostPackage}
              posting={posting}
              error={error}
              success={success}
            />
          }
        />
        <Route
          path="requests"
          element={
            <AgencyCustomRequests
              availableRequests={availableRequests}
              loadingReq={loadingReq}
              onBid={onBid}
              error={error}
              success={success}
            />
          }
        />
        <Route
          path="packages"
          element={
            <AgencyMyPackages
              myPackages={myPackages}
              loadingMy={loadingMy}
              editingId={editingId}
              editForm={editForm}
              setEditForm={setEditForm}
              startEdit={startEdit}
              cancelEdit={cancelEdit}
              saveEdit={saveEdit}
              error={error}
              success={success}
            />
          }
        />
      </Routes>
    </div>
  );
};

export default AgencyDashboard;
