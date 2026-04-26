import React, { useState, useMemo } from 'react';
import { User, FileText, IdCard, Phone, Mail, X, ArrowRight, Plus, Minus } from 'lucide-react';

const PassengerDetailsModal = ({
  offer,
  numPassengers = 1,
  onConfirm,
  onCancel,
  loading = false
}) => {
  // Initialize passengers array based on numPassengers
  const initialPassengers = useMemo(() => {
    return Array(numPassengers).fill(null).map(() => ({
      fullName: '',
      passportNumber: '',
      nidNumber: '',
      phoneNumber: '',
      email: ''
    }));
  }, [numPassengers]);

  const [passengers, setPassengers] = useState(initialPassengers);
  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState({});

  // Calculate unit price and total price
  const unitPrice = Number(offer?.price?.total || 0);
  const totalPrice = useMemo(() => {
    return unitPrice * passengers.length;
  }, [unitPrice, passengers.length]);

  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);

    // Clear error for this field
    if (errors[`${index}-${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`${index}-${field}`];
      setErrors(newErrors);
    }
  };

  const addPassenger = () => {
    const MAX_PASSENGERS = 9;
    if (passengers.length < MAX_PASSENGERS) {
      setPassengers([...passengers, {
        fullName: '',
        passportNumber: '',
        nidNumber: '',
        phoneNumber: '',
        email: ''
      }]);
      setActiveTab(passengers.length); // Switch to the new passenger tab
    }
  };

  const removePassenger = () => {
    if (passengers.length > 1) {
      const updated = passengers.slice(0, -1);
      setPassengers(updated);
      setActiveTab(Math.max(0, activeTab - 1)); // Switch to previous tab if needed

      // Clear errors for removed passenger
      const newErrors = { ...errors };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`${passengers.length - 1}-`)) {
          delete newErrors[key];
        }
      });
      setErrors(newErrors);
    }
  };

  const validatePassengers = () => {
    const newErrors = {};
    passengers.forEach((p, idx) => {
      if (!p.fullName.trim()) newErrors[`${idx}-fullName`] = 'Full name is required';
      if (!p.passportNumber.trim()) newErrors[`${idx}-passportNumber`] = 'Passport number is required';
      if (!p.nidNumber.trim()) newErrors[`${idx}-nidNumber`] = 'NID number is required';
      if (!p.phoneNumber.trim()) newErrors[`${idx}-phoneNumber`] = 'Phone number is required';
      if (!p.email.trim()) newErrors[`${idx}-email`] = 'Email is required';
      if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) {
        newErrors[`${idx}-email`] = 'Invalid email format';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validatePassengers()) {
      await onConfirm(passengers);
    }
  };

  const itinerary = offer?.itineraries?.[0];
  const seg0 = itinerary?.segments?.[0];
  const segLast = itinerary?.segments?.[itinerary?.segments?.length - 1];
  const from = seg0?.departure?.iataCode;
  const to = segLast?.arrival?.iataCode;
  const dep = seg0?.departure?.at;
  const arr = segLast?.arrival?.at;
  const currency = offer?.price?.currency;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Modal shell: flex-col, fixed height, no overflow on shell */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* ── FIXED HEADER ───────────────────────────────────────── */}
        <div className="shrink-0 bg-gradient-to-r from-primary to-primary-dim p-6 text-white rounded-t-3xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">Passenger Details</h2>
            <p className="text-white/80 text-sm">Complete your booking information</p>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* ── FIXED FLIGHT SUMMARY ────────────────────────────────── */}
        <div className="shrink-0 bg-primary/5 dark:bg-primary/10 border-b border-outline-variant/10 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-white text-on-surface-variant uppercase font-bold">From</p>
              <p className="text-white font-black text-on-surface mt-1">{from}</p>
            </div>
            <div>
              <p className="text-white text-on-surface-variant uppercase font-bold">To</p>
              <p className="text-white font-black text-on-surface mt-1">{to}</p>
            </div>
            <div>
              <p className="text-white text-on-surface-variant uppercase font-bold">Departure</p>
              <p className="text-white font-bold text-on-surface mt-1">
                {dep ? new Date(dep).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-white text-on-surface-variant uppercase font-bold">Price per Person</p>
              <p className="text-white font-black text-primary mt-1">
                {unitPrice} {currency}
              </p>
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE FORM BODY ────────────────────────────────── */}
        <form
          id="passenger-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          <div className="space-y-4">
            {/* Passenger tabs + add/remove controls */}
            <div className="flex gap-2 border-b border-outline-variant/10 items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {passengers.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`px-4 py-3 font-bold text-sm transition-colors border-b-2 -mb-[1px] ${activeTab === idx
                      ? 'text-primary border-primary'
                      : 'text-on-surface-variant border-transparent hover:text-on-surface'
                      }`}
                  >
                    Passenger {idx + 1}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addPassenger}
                  className="p-2 bg-primary text-white rounded-full hover:scale-110 transition-transform"
                  title="Add passenger"
                >
                  <Plus size={20} />
                </button>
                <button
                  type="button"
                  onClick={removePassenger}
                  disabled={passengers.length === 1}
                  className="p-2 bg-error text-white rounded-full hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove last passenger"
                >
                  <Minus size={20} />
                </button>
              </div>
            </div>

            {/* Active passenger fields */}
            {passengers.map((passenger, idx) => (
              activeTab === idx && (
                <div key={idx} className="space-y-4 animate-in fade-in duration-200">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant pl-4">
                      Full Name *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                        <User size={18} />
                      </span>
                      <input
                        type="text"
                        value={passenger.fullName}
                        onChange={(e) => handlePassengerChange(idx, 'fullName', e.target.value)}
                        placeholder="Arman"
                        className={`w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none ${errors[`${idx}-fullName`] ? 'ring-2 ring-error' : ''
                          }`}
                      />
                    </div>
                    {errors[`${idx}-fullName`] && (
                      <p className="text-xs text-error px-4">{errors[`${idx}-fullName`]}</p>
                    )}
                  </div>

                  {/* Passport Number */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant pl-4">
                      Passport Number *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                        <FileText size={18} />
                      </span>
                      <input
                        type="text"
                        value={passenger.passportNumber}
                        onChange={(e) => handlePassengerChange(idx, 'passportNumber', e.target.value)}
                        placeholder="AB123456789"
                        className={`w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none ${errors[`${idx}-passportNumber`] ? 'ring-2 ring-error' : ''
                          }`}
                      />
                    </div>
                    {errors[`${idx}-passportNumber`] && (
                      <p className="text-xs text-error px-4">{errors[`${idx}-passportNumber`]}</p>
                    )}
                  </div>

                  {/* NID Number */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant pl-4">
                      NID Number *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                        <IdCard size={18} />
                      </span>
                      <input
                        type="text"
                        value={passenger.nidNumber}
                        onChange={(e) => handlePassengerChange(idx, 'nidNumber', e.target.value)}
                        placeholder="1234567890123456"
                        className={`w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none ${errors[`${idx}-nidNumber`] ? 'ring-2 ring-error' : ''
                          }`}
                      />
                    </div>
                    {errors[`${idx}-nidNumber`] && (
                      <p className="text-xs text-error px-4">{errors[`${idx}-nidNumber`]}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant pl-4">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                        <Phone size={18} />
                      </span>
                      <input
                        type="tel"
                        value={passenger.phoneNumber}
                        onChange={(e) => handlePassengerChange(idx, 'phoneNumber', e.target.value)}
                        placeholder="+1234567890"
                        className={`w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none ${errors[`${idx}-phoneNumber`] ? 'ring-2 ring-error' : ''
                          }`}
                      />
                    </div>
                    {errors[`${idx}-phoneNumber`] && (
                      <p className="text-xs text-error px-4">{errors[`${idx}-phoneNumber`]}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant pl-4">
                      Email Address *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                        <Mail size={18} />
                      </span>
                      <input
                        type="email"
                        value={passenger.email}
                        onChange={(e) => handlePassengerChange(idx, 'email', e.target.value)}
                        placeholder="arman@gmail.com"
                        className={`w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none ${errors[`${idx}-email`] ? 'ring-2 ring-error' : ''
                          }`}
                      />
                    </div>
                    {errors[`${idx}-email`] && (
                      <p className="text-xs text-error px-4">{errors[`${idx}-email`]}</p>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
        </form>

        {/* ── STICKY FOOTER: Price Summary + Actions ──────────────── */}
        <div className="shrink-0 bg-white dark:bg-slate-900 border-t border-outline-variant/10 p-6 space-y-4 rounded-b-3xl">
          {/* Price Summary */}
          <div className="bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-white font-bold text-on-surface">Number of Passengers:</span>
              <span className="text-xl font-black text-primary">{passengers.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white font-bold text-on-surface">Price per Passenger:</span>
              <span className="text-white font-black text-on-surface">{unitPrice} {currency}</span>
            </div>
            <div className="border-t border-primary/30 pt-2 flex justify-between items-center">
              <span className="text-white font-bold text-on-surface">Total Price:</span>
              <span className="text-2xl font-black text-primary">{totalPrice} {currency}</span>
            </div>
          </div>

          {/* Action Buttons — submit targets the form by id */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-2xl font-bold text-on-surface border-2 border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="passenger-form"
              disabled={loading}
              className="flex-1 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Proceed to Payment</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PassengerDetailsModal;
