import React, { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api } from '../services/api';
import HotelProfilePage from './hotel/HotelProfilePage';
import HotelPostOffering from './hotel/HotelPostOffering';
import HotelMyPackages from './hotel/HotelMyPackages';

const HotelDashboard = () => {
  // ─── Shared State ────────────────────────────────────────────────────────────
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

  const [offering, setOffering] = useState({
    country: '', city: '', area: '', fullAddress: '',
    roomType: 'Single', price: '', bedType: '', fullDescription: '', shortTitle: '',
    image_url: ''
  });

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);

  // ─── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    setProfile({
      hotelName: user.hotelName || user.hotel_name || '',
      hotelLocation: user.hotelLocation || user.location || '',
      name: user.name || '',
      phone: user.phone || '',
      tradeLicenseId: user.tradeLicenseId || user.trade_license_id || '',
      address: user.address || '',
      website: user.website || ''
    });
  }, [user]);

  useEffect(() => { loadMyPackages(); }, []);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const clearMessages = () => { setError(null); setSuccess(null); };

  const refreshMe = async () => {
    const res = await api.auth.me();
    if (res?.success) {
      localStorage.setItem('user', JSON.stringify(res.data.user));
      const u = res.data.user;
      setProfile({
        hotelName: u.hotelName || u.hotel_name || '',
        hotelLocation: u.hotelLocation || u.location || '',
        name: u.name || '',
        phone: u.phone || '',
        tradeLicenseId: u.tradeLicenseId || u.trade_license_id || '',
        address: u.address || '',
        website: u.website || ''
      });
    }
    return res;
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

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const onUpdateProfile = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      setPosting(true);
      const res = await api.__raw.users.updateProfile(profile);
      if (res?.data?.success) {
        setSuccess('Hotel info updated');
        await refreshMe();
      } else {
        setError(res?.data?.message || 'Update failed');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Update failed');
    } finally {
      setPosting(false);
    }
  };

  const onPostOffering = async (e) => {
    e.preventDefault();
    setPosting(true);
    clearMessages();
    try {
      const description = JSON.stringify({
        country: offering.country, city: offering.city, area: offering.area,
        fullAddress: offering.fullAddress, roomType: offering.roomType,
        bedType: offering.bedType, fullDescription: offering.fullDescription,
      });
      const body = { 
        title: offering.shortTitle, 
        destination: offering.city, 
        price: Number(offering.price), 
        image_url: offering.image_url,
        description 
      };
      const res = await api.__raw.hotels.createPackage(body);
      if (res?.data?.success) {
        setSuccess('Offering posted successfully');
        setOffering({ 
          country: '', city: '', area: '', fullAddress: '', 
          roomType: 'Single', price: '', bedType: '', 
          fullDescription: '', shortTitle: '', image_url: '' 
        });
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

  const startEdit = (pkg) => {
    setEditingId(pkg.package_id);
    // Parse the description to extract all the detailed fields
    let descData = { country: '', city: '', area: '', fullAddress: '', roomType: '', bedType: '', fullDescription: '' };
    try {
      if (typeof pkg.description === 'string') {
        descData = JSON.parse(pkg.description);
      } else {
        descData = pkg.description;
      }
    } catch (e) {
      console.log('Could not parse description');
    }

    setEditForm({
      shortTitle: pkg.title || '',
      destination: pkg.destination || '',
      price: pkg.price || '',
      country: descData.country || '',
      city: descData.city || '',
      area: descData.area || '',
      fullAddress: descData.fullAddress || '',
      roomType: descData.roomType || 'Single',
      bedType: descData.bedType || '',
      fullDescription: descData.fullDescription || '',
      image_url: pkg.image_url || ''
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const saveEdit = async (packageId) => {
    clearMessages();
    try {
      // Reconstruct the description with all fields
      const description = JSON.stringify({
        country: editForm.country,
        city: editForm.city,
        area: editForm.area,
        fullAddress: editForm.fullAddress,
        roomType: editForm.roomType,
        bedType: editForm.bedType,
        fullDescription: editForm.fullDescription,
      });
      const payload = {
        title: editForm.shortTitle,
        destination: editForm.destination,
        price: Number(editForm.price),
        image_url: editForm.image_url,
        description: description
      };
      const res = await api.packages.update(packageId, payload);
      if (res?.success) {
        setSuccess('Offering updated successfully');
        setEditingId(null);
        setEditForm({});
        await loadMyPackages();
      } else {
        setError(res?.message || 'Failed to update offering');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update offering');
    }
  };

  const onDeletePackage = async (packageId) => {
    if (!window.confirm('Are you sure you want to delete this offering?')) return;
    clearMessages();
    try {
      const res = await api.packages.delete(packageId);
      if (res?.success) {
        setSuccess('Offering deleted successfully');
        await loadMyPackages();
      } else {
        setError(res?.message || 'Failed to delete offering');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete offering');
    }
  };

  // ─── Shared props bundles ─────────────────────────────────────────────────────
  const sharedProps = { error, success };

  return (
    <Routes>
      <Route index element={<Navigate to="profile" replace />} />
      <Route
        path="profile"
        element={
          <HotelProfilePage
            profile={profile} setProfile={setProfile}
            onUpdateProfile={onUpdateProfile} posting={posting}
            {...sharedProps}
          />
        }
      />
      <Route
        path="post"
        element={
          <HotelPostOffering
            offering={offering} setOffering={setOffering}
            onPostOffering={onPostOffering} posting={posting}
            {...sharedProps}
          />
        }
      />
      <Route
        path="packages"
        element={
          <HotelMyPackages
            myPackages={myPackages} loadingMy={loadingMy}
            editingId={editingId} editForm={editForm} setEditForm={setEditForm}
            startEdit={startEdit} cancelEdit={cancelEdit} saveEdit={saveEdit}
            onDeletePackage={onDeletePackage}
            {...sharedProps}
          />
        }
      />
    </Routes>
  );
};

export default HotelDashboard;
