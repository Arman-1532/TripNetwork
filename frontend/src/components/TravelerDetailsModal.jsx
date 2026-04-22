import React, { useState, useMemo } from 'react';
import { User, IdCard, Phone, Mail, X, Plus, Minus } from 'lucide-react';

const TravelerDetailsModal = ({
  item,
  itemType = 'PACKAGE', // 'PACKAGE' or 'HOTEL'
  numTravelers = 1,
  onConfirm,
  onCancel,
  loading = false
}) => {
  // Initialize travelers array based on numTravelers
  const initialTravelers = useMemo(() => {
    return Array(numTravelers).fill(null).map(() => ({
      fullName: '',
      nidNumber: '',
      passportNumber: '', // Optional
      phoneNumber: '',
      email: ''
    }));
  }, [numTravelers]);

  const [travelers, setTravelers] = useState(initialTravelers);
  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState({});

  // Calculate unit price and total price
  const unitPrice = Number(item?.price || 0);
  const totalPrice = useMemo(() => {
    return unitPrice * travelers.length;
  }, [unitPrice, travelers.length]);

  const handleTravelerChange = (index, field, value) => {
    const updated = [...travelers];
    updated[index][field] = value;
    setTravelers(updated);

    // Clear error for this field
    if (errors[`${index}-${field}`]) {
      const newErrors = { ...errors };
      delete newErrors[`${index}-${field}`];
      setErrors(newErrors);
    }
  };

  const addTraveler = () => {
    const MAX_TRAVELERS = 9;
    if (travelers.length < MAX_TRAVELERS) {
      setTravelers([...travelers, {
        fullName: '',
        nidNumber: '',
        passportNumber: '',
        phoneNumber: '',
        email: ''
      }]);
      setActiveTab(travelers.length); // Switch to the new traveler tab
    }
  };

  const removeTraveler = () => {
    if (travelers.length > 1) {
      const updated = travelers.slice(0, -1);
      setTravelers(updated);
      setActiveTab(Math.max(0, activeTab - 1)); // Switch to previous tab if needed

      // Clear errors for removed traveler
      const newErrors = { ...errors };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`${travelers.length - 1}-`)) {
          delete newErrors[key];
        }
      });
      setErrors(newErrors);
    }
  };

  const validateTravelers = () => {
    const newErrors = {};
    travelers.forEach((t, idx) => {
      if (!t.fullName.trim()) newErrors[`${idx}-fullName`] = 'Full name is required';
      if (!t.nidNumber.trim()) newErrors[`${idx}-nidNumber`] = 'NID number is required';
      // Passport is optional, so we don't validate it
      if (!t.phoneNumber.trim()) newErrors[`${idx}-phoneNumber`] = 'Phone number is required';
      if (!t.email.trim()) newErrors[`${idx}-email`] = 'Email is required';
      if (t.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email)) {
        newErrors[`${idx}-email`] = 'Invalid email format';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateTravelers()) {
      await onConfirm(travelers);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-primary-dim p-6 text-white rounded-t-3xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">Traveler Details</h2>
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

        {/* Booking Summary */}
        <div className="bg-primary/5 dark:bg-primary/10 border-b border-outline-variant/10 p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-on-surface-variant uppercase font-bold">Destination</p>
              <p className="text-lg font-black text-on-surface mt-1">{item?.destination || 'Destination'}</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant uppercase font-bold">Unit Price</p>
              <p className="text-lg font-black text-primary mt-1">
                ৳{unitPrice}
              </p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant uppercase font-bold">Total Price</p>
              <p className="text-lg font-black text-primary mt-1">
                ৳{totalPrice}
              </p>
            </div>
          </div>
        </div>

        {/* Traveler Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tabs for multiple travelers with +/- buttons */}
          <div className="space-y-4">
            <div className="flex gap-2 border-b border-outline-variant/10 items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {travelers.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`px-4 py-3 font-bold text-sm transition-colors border-b-2 -mb-[1px] ${
                      activeTab === idx
                        ? 'text-primary border-primary'
                        : 'text-on-surface-variant border-transparent hover:text-on-surface'
                    }`}
                  >
                    Traveler {idx + 1}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addTraveler}
                  className="p-2 bg-primary text-white rounded-full hover:scale-110 transition-transform"
                  title="Add traveler"
                >
                  <Plus size={20} />
                </button>
                <button
                  type="button"
                  onClick={removeTraveler}
                  disabled={travelers.length === 1}
                  className="p-2 bg-error text-white rounded-full hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove last traveler"
                >
                  <Minus size={20} />
                </button>
              </div>
            </div>

            {/* Current traveler form */}
            {travelers.map((traveler, idx) => (
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
                        value={traveler.fullName}
                        onChange={(e) => handleTravelerChange(idx, 'fullName', e.target.value)}
                        placeholder="John Doe"
                        className={`w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none ${
                          errors[`${idx}-fullName`] ? 'ring-2 ring-error' : ''
                        }`}
                      />
                    </div>
                    {errors[`${idx}-fullName`] && (
                      <p className="text-xs text-error px-4">{errors[`${idx}-fullName`]}</p>
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
                        value={traveler.nidNumber}
                        onChange={(e) => handleTravelerChange(idx, 'nidNumber', e.target.value)}
                        placeholder="1234567890123456"
                        className={`w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none ${
                          errors[`${idx}-nidNumber`] ? 'ring-2 ring-error' : ''
                        }`}
                      />
                    </div>
                    {errors[`${idx}-nidNumber`] && (
                      <p className="text-xs text-error px-4">{errors[`${idx}-nidNumber`]}</p>
                    )}
                  </div>

                  {/* Passport Number (Optional) */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant pl-4">
                      Passport Number <span className="text-on-surface-variant text-xs">(Optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                        <User size={18} />
                      </span>
                      <input
                        type="text"
                        value={traveler.passportNumber}
                        onChange={(e) => handleTravelerChange(idx, 'passportNumber', e.target.value)}
                        placeholder="AB123456789 (leave blank if not applicable)"
                        className={`w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none`}
                      />
                    </div>
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
                        value={traveler.phoneNumber}
                        onChange={(e) => handleTravelerChange(idx, 'phoneNumber', e.target.value)}
                        placeholder="+1234567890"
                        className={`w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none ${
                          errors[`${idx}-phoneNumber`] ? 'ring-2 ring-error' : ''
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
                        value={traveler.email}
                        onChange={(e) => handleTravelerChange(idx, 'email', e.target.value)}
                        placeholder="john@example.com"
                        className={`w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none ${
                          errors[`${idx}-email`] ? 'ring-2 ring-error' : ''
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-outline-variant/10">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-4 rounded-2xl border border-outline-variant/20 text-on-surface font-bold transition-all hover:bg-surface-container disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 rounded-2xl bg-primary text-on-primary font-bold transition-all hover:bg-primary-hover shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TravelerDetailsModal;

