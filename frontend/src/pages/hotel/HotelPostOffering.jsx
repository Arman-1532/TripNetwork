import React from 'react';

const HotelPostOffering = ({ offering, setOffering, onPostOffering, posting, error, success }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-on-surface">Post Offering</h1>
        <p className="text-sm text-on-surface-variant dark:text-black/80">Create a new hotel room offering</p>
      </div>

      {error && <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-sm">{error}</div>}
      {success && <div className="p-3 rounded-2xl bg-primary-container/30 text-on-surface text-sm">{success}</div>}

      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-on-surface dark:text-white">Post Hotel Offering</h2>
        <form onSubmit={onPostOffering} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Short Title</label>
              <input required className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={offering.shortTitle} onChange={(e) => setOffering(o => ({ ...o, shortTitle: e.target.value }))} />
            </div>
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
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Bed Type</label>
              <input className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={offering.bedType} onChange={(e) => setOffering(o => ({ ...o, bedType: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Price (BDT)</label>
              <input required type="number" min="0" className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10" value={offering.price} onChange={(e) => setOffering(o => ({ ...o, price: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant dark:text-white">Detailed Description</label>
            <textarea required className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10 min-h-24" value={offering.fullDescription} onChange={(e) => setOffering(o => ({ ...o, fullDescription: e.target.value }))} />
          </div>
          <button disabled={posting} className="bg-primary text-on-primary font-bold px-6 py-3 rounded-2xl disabled:opacity-50">
            {posting ? 'Posting...' : 'Post Offering'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default HotelPostOffering;
