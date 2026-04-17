import React, { useMemo, useState } from 'react';
import { Mail, Lock, User, Phone, LogIn, Plane, Building2, Hotel, MapPin, Globe, IdCard } from 'lucide-react';
import { api } from '../services/api';

const RegisterPage = ({ onRegisterSuccess, onBackToLogin }) => {
  // Roles must match legacy + backend createUser(): traveler | travel_agency | hotel_representative
  const [role, setRole] = useState('traveler');

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Traveler fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Provider common fields
  const [tradeLicenseId, setTradeLicenseId] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [nid, setNid] = useState(''); // Collected for parity with legacy UI (backend currently ignores it)

  // Agency fields
  const [agencyName, setAgencyName] = useState('');

  // Hotel fields
  const [hotelName, setHotelName] = useState('');

  const isTraveler = role === 'traveler';
  const isAgency = role === 'travel_agency';
  const isHotel = role === 'hotel_representative';

  const requiredMissing = useMemo(() => {
    if (!email || !password) return true;
    if (isTraveler) return !name;
    if (isAgency) return !agencyName || !tradeLicenseId || !address;
    if (isHotel) return !hotelName || !tradeLicenseId || !address;
    return true;
  }, [email, password, isTraveler, isAgency, isHotel, name, agencyName, hotelName, tradeLicenseId, address]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        role,
        email,
        password,
      };

      if (isTraveler) {
        payload.name = name;
        payload.phone = phone;
      }

      if (isAgency) {
        payload.agencyName = agencyName;
        payload.tradeLicenseId = tradeLicenseId;
        payload.address = address;
        payload.phone = phone;
        if (website) payload.website = website;
        if (nid) payload.nid = nid;
      }

      if (isHotel) {
        payload.hotelName = hotelName;
        payload.tradeLicenseId = tradeLicenseId;
        payload.address = address;
        payload.phone = phone;
        if (website) payload.website = website;
        if (nid) payload.nid = nid;
      }

      const res = await api.auth.register(payload);
      if (res?.success) {
        const msg = isTraveler
          ? 'Registration successful. You can now login.'
          : 'Registration successful. Your account is pending approval.';
        setSuccess(res?.message || msg);
        onRegisterSuccess?.(res);
        return;
      }

      setError(res?.message || 'Registration failed');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6 font-body">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tertiary rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 glass-effect bg-white/40 dark:bg-slate-900/40 p-10 rounded-[2.5rem] border border-outline-variant/10 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 mb-6">
            <Plane size={32} />
          </div>
          <h1 className="text-4xl font-black font-headline tracking-tight text-on-surface">Create Account</h1>
          <p className="text-on-surface-variant dark:text-white/80 font-medium">Join The Curator</p>
        </div>

        {error && (
          <div className="p-4 bg-error-container/10 border border-error/20 text-error-dim rounded-2xl text-xs font-bold text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-primary-container/30 border border-outline-variant/10 text-on-surface dark:text-white rounded-2xl text-xs font-bold text-center">
            {success}
          </div>
        )}

        {(isAgency || isHotel) && (
          <div className="p-4 bg-surface-container-low border border-outline-variant/10 rounded-2xl text-xs font-bold text-on-surface dark:text-white/90">
            Note: Providers require admin approval before they can login.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-white/90 pl-4">Account Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('traveler')}
                className={`px-3 py-3 rounded-2xl border text-xs font-black transition-colors ${isTraveler ? 'bg-primary text-white border-primary' : 'bg-white/70 dark:bg-slate-900/40 border-outline-variant/10 text-on-surface dark:text-white'}`}
              >
                Traveler
              </button>
              <button
                type="button"
                onClick={() => setRole('travel_agency')}
                className={`px-3 py-3 rounded-2xl border text-xs font-black transition-colors flex items-center justify-center gap-2 ${isAgency ? 'bg-primary text-white border-primary' : 'bg-white/70 dark:bg-slate-900/40 border-outline-variant/10 text-on-surface dark:text-white'}`}
              >
                <Building2 size={16} /> Agency
              </button>
              <button
                type="button"
                onClick={() => setRole('hotel_representative')}
                className={`px-3 py-3 rounded-2xl border text-xs font-black transition-colors flex items-center justify-center gap-2 ${isHotel ? 'bg-primary text-white border-primary' : 'bg-white/70 dark:bg-slate-900/40 border-outline-variant/10 text-on-surface dark:text-white'}`}
              >
                <Hotel size={16} /> Hotel
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-white/90 pl-4">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                <Mail size={18} />
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                placeholder="your@email.com"
                type="email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-white/90 pl-4">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                <Lock size={18} />
              </span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                placeholder="Minimum 6 characters"
                type="password"
                minLength={6}
                required
              />
            </div>
          </div>

          {isTraveler && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-white/90 pl-4">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                    <User size={18} />
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-white/90 pl-4">Phone Number (optional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                    <Phone size={18} />
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                    placeholder="+1234567890"
                    type="tel"
                  />
                </div>
              </div>
            </div>
          )}

          {(isAgency || isHotel) && (
            <div className="space-y-4">
              {isAgency && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-white/90 pl-4">Agency Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                      <Building2 size={18} />
                    </span>
                    <input
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                      placeholder="Adventure Travel Co."
                      required
                    />
                  </div>
                </div>
              )}

              {isHotel && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-white/90 pl-4">Hotel Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                      <Hotel size={18} />
                    </span>
                    <input
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                      placeholder="Grand Hotel"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-white/90 pl-4">NID (optional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                    <IdCard size={18} />
                  </span>
                  <input
                    value={nid}
                    onChange={(e) => setNid(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-white/90 pl-4">Trade License ID</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                    <IdCard size={18} />
                  </span>
                  <input
                    value={tradeLicenseId}
                    onChange={(e) => setTradeLicenseId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                    placeholder="TL-2024-001"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-white/90 pl-4">Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                    <MapPin size={18} />
                  </span>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                    placeholder="123 Main St, City, Country"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-white/90 pl-4">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                    <Phone size={18} />
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                    placeholder="+1234567890"
                    type="tel"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-white/90 pl-4">Website (optional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                    <Globe size={18} />
                  </span>
                  <input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || requiredMissing}
            className="w-full bg-primary text-white py-4 rounded-full font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group mt-4 h-14 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Register</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full mt-2 py-3 rounded-full font-bold text-on-surface dark:text-white/90 hover:underline"
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

