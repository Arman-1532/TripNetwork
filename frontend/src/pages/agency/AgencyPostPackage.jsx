import React from 'react';

const AgencyPostPackage = ({ pkgForm, setPkgForm, onPostPackage, posting, error, success }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-on-surface">Post Package</h1>
        <p className="text-sm text-on-surface-variant dark:text-black/80">Create a new travel package for travelers</p>
      </div>

      {error && <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-sm">{error}</div>}
      {success && <div className="p-3 rounded-2xl bg-primary-container/30 text-on-primary-container text-sm font-medium">{success}</div>}

      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-on-surface dark:text-white">Post New Travel Package</h2>
        <form onSubmit={onPostPackage} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Package Title</label>
              <input
                required
                className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10"
                value={pkgForm.title}
                onChange={(e) => setPkgForm(p => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Destination</label>
              <input
                required
                className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10"
                value={pkgForm.destination}
                onChange={(e) => setPkgForm(p => ({ ...p, destination: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Origin</label>
              <input
                className="w-full bg-surface-container-low text-on-surface rounded-2xl px-4 py-3 border border-outline-variant/10"
                value={pkgForm.origin}
                onChange={(e) => setPkgForm(p => ({ ...p, origin: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Price (BDT)</label>
              <input
                required
                type="number"
                min="0"
                className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10"
                value={pkgForm.price}
                onChange={(e) => setPkgForm(p => ({ ...p, price: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Travel Medium</label>
              <select
                className="w-full bg-surface-container-low text-on-surface rounded-2xl px-4 py-3 border border-outline-variant/10"
                value={pkgForm.travel_medium}
                onChange={(e) => setPkgForm(p => ({ ...p, travel_medium: e.target.value }))}
              >
                <option value="BUS">BUS</option>
                <option value="AIR">AIR</option>
                <option value="TRAIN">TRAIN</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-outline-variant/10">
            <h3 className="text-sm font-bold text-on-surface dark:text-white">Image Section</h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Image URL</label>
              <input
                placeholder="https://example.com/image.jpg"
                className="w-full bg-surface-container-low text-on-surface rounded-2xl px-4 py-3 border border-outline-variant/10"
                value={pkgForm.image_url || ''}
                onChange={(e) => setPkgForm(p => ({ ...p, image_url: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant dark:text-white">Description</label>
            <textarea
              className="w-full bg-surface-container-low text-on-surface rounded-2xl px-4 py-3 border border-outline-variant/10 min-h-24"
              value={pkgForm.description}
              onChange={(e) => setPkgForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          <button disabled={posting} className="bg-primary text-on-primary font-bold px-6 py-3 rounded-2xl disabled:opacity-50">
            {posting ? 'Posting...' : 'Post Package'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default AgencyPostPackage;
