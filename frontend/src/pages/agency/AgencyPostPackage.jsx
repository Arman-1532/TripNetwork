import React, { useState } from 'react';
import { Package, MapPin, DollarSign, Image as ImageIcon, Clock, Calendar, CheckCircle2, AlertCircle, Info, Plane, Bus, Train } from 'lucide-react';

const AgencyPostPackage = ({ pkgForm, setPkgForm, onPostPackage, posting, error, success }) => {
  const [useSpecificDate, setUseSpecificDate] = useState(false);

  const transportIcons = {
    BUS: <Bus size={18} />,
    AIR: <Plane size={18} />,
    TRAIN: <Train size={18} />
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight flex items-center gap-3">
            <Package className="text-primary" size={32} />
            Post Package
          </h1>
          <p className="text-black font-medium mt-1">Design a unique travel experience for the TripNetwork community.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-[1.5rem] bg-error-container text-on-error-container border border-error/10 animate-in shake-in duration-500">
          <AlertCircle size={20} />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 rounded-[1.5rem] bg-primary/10 text-primary border border-primary/20 animate-in zoom-in duration-500">
          <CheckCircle2 size={20} />
          <p className="font-bold text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={onPostPackage} className="space-y-8">
        {/* Core Information Section */}
        <section className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-outline-variant/10 p-8 shadow-2xl space-y-8 transition-all hover:shadow-primary/5">
          <div className="flex items-center gap-3 border-b border-outline-variant/5 pb-4">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Info size={20} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Core Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white pl-4">Package Title</label>
              <div className="relative group">
                <input
                  required
                  placeholder="e.g. Dreamy Sylhet Monsoon Tour"
                  className="w-full bg-surface-container-low dark:bg-slate-900 rounded-2xl px-6 py-4 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-white"
                  value={pkgForm.title}
                  onChange={(e) => setPkgForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white pl-4">Destination</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  required
                  placeholder="e.g. Cox's Bazar"
                  className="w-full bg-surface-container-low dark:bg-slate-900 rounded-2xl pl-12 pr-6 py-4 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-white"
                  value={pkgForm.destination}
                  onChange={(e) => setPkgForm(p => ({ ...p, destination: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white pl-4">Origin (Optional)</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  placeholder="e.g. Dhaka"
                  className="w-full bg-surface-container-low dark:bg-slate-900 rounded-2xl pl-12 pr-6 py-4 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-white"
                  value={pkgForm.origin}
                  onChange={(e) => setPkgForm(p => ({ ...p, origin: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white pl-4">Price (BDT)</label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="0.00"
                  className="w-full bg-surface-container-low dark:bg-slate-900 rounded-2xl pl-12 pr-6 py-4 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold text-sm text-white"
                  value={pkgForm.price}
                  onChange={(e) => setPkgForm(p => ({ ...p, price: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white pl-4">Travel Medium</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary">
                  {transportIcons[pkgForm.travel_medium] || <Bus size={18} />}
                </div>
                <select
                  className="w-full bg-surface-container-low dark:bg-slate-900 rounded-2xl pl-12 pr-6 py-4 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-white appearance-none"
                  value={pkgForm.travel_medium}
                  onChange={(e) => setPkgForm(p => ({ ...p, travel_medium: e.target.value }))}
                >
                  <option value="BUS">Bus Travel</option>
                  <option value="AIR">By Air</option>
                  <option value="TRAIN">Train Journey</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white dark:text-white pl-4">Image Display</label>
              <div className="relative">
                <ImageIcon size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  required
                  placeholder="https://images.unsplash.com/promo-path"
                  className="w-full bg-surface-container-low dark:bg-slate-900 rounded-2xl pl-12 pr-6 py-4 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-white"
                  value={pkgForm.image_url || ''}
                  onChange={(e) => setPkgForm(p => ({ ...p, image_url: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white pl-4">Description & Highlights</label>
            <textarea
              required
              placeholder="Describe the magical experience travelers will have..."
              className="w-full bg-surface-container-low dark:bg-slate-900 rounded-[2rem] px-6 py-5 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-white min-h-32 resize-none"
              value={pkgForm.description}
              onChange={(e) => setPkgForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>
        </section>

        {/* Time Restriction Section */}
        <section className="bg-white dark:bg-slate-950 rounded-[2.5rem] border border-outline-variant/10 p-8 shadow-2xl space-y-8">
          <div className="flex items-center justify-between border-b border-outline-variant/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400">
                <Clock size={20} />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Time-Limited Offer</h2>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-white">Enable Timer</label>
              <button
                type="button"
                onClick={() => setPkgForm(p => ({ ...p, is_limited_time: !p.is_limited_time }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${pkgForm.is_limited_time ? 'bg-primary' : 'bg-surface-container-high'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pkgForm.is_limited_time ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {pkgForm.is_limited_time && (
            <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
              <div className="flex p-1 bg-surface-container rounded-2xl max-w-sm">
                <button
                  type="button"
                  onClick={() => setUseSpecificDate(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all ${!useSpecificDate ? 'bg-white dark:bg-slate-800 shadow-sm text-white' : 'text-black hover:text-black/80'}`}
                >
                  <Clock size={16} /> SET DURATION
                </button>
                <button
                  type="button"
                  onClick={() => setUseSpecificDate(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all ${useSpecificDate ? 'bg-white dark:bg-slate-800 shadow-sm text-white' : 'text-black hover:text-black/80'}`}
                >
                  <Calendar size={16} /> SPECIFIC DATE
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                {!useSpecificDate ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white pl-4">Value</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 24"
                        className="w-full bg-surface-container-low dark:bg-slate-900 rounded-2xl px-6 py-4 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold text-white"
                        value={pkgForm.duration_value}
                        onChange={(e) => setPkgForm(p => ({ ...p, duration_value: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white pl-4">Unit</label>
                      <select
                        className="w-full bg-surface-container-low dark:bg-slate-900 rounded-2xl px-6 py-4 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-white appearance-none"
                        value={pkgForm.duration_unit}
                        onChange={(e) => setPkgForm(p => ({ ...p, duration_unit: e.target.value }))}
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white pl-4">Expiration Date & Time</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                      <input
                        type="datetime-local"
                        className="w-full bg-surface-container-low dark:bg-slate-900 rounded-2xl pl-12 pr-6 py-4 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium text-white"
                        value={pkgForm.offer_ends_at}
                        onChange={(e) => setPkgForm(p => ({ ...p, offer_ends_at: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-amber-400/5 border border-amber-400/10 flex items-start gap-3">
                  <Clock size={16} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-white leading-relaxed">
                    Once enabled, travelers will see a real-time countdown timer. The package will automatically disappear from the public curated list once the time limit expires.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={posting}
            className="group relative bg-primary text-on-primary font-black px-12 py-5 rounded-[2rem] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-lg flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
          >
            {posting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Package size={22} className="group-hover:-translate-y-1 transition-transform" />
            )}
            <span>{posting ? 'Designating...' : 'Post Curated Package'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AgencyPostPackage;
