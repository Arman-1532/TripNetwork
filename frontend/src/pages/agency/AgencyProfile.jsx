import React from 'react';

const AgencyProfile = ({ profile, setProfile, onUpdateProfile, error, success }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-on-surface">Agency Profile</h1>
        <p className="text-sm text-on-surface-variant dark:text-black/80">Update your agency information</p>
      </div>

      {error && <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-sm">{error}</div>}
      {success && <div className="p-3 rounded-2xl bg-primary-container/30 text-on-primary-container text-sm font-medium">{success}</div>}

      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-on-surface dark:text-white">Agency Information</h2>
        <form onSubmit={onUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Agency Name</label>
              <input
                className="w-full bg-surface-container-low text-on-surface rounded-2xl px-4 py-3 border border-outline-variant/10"
                value={profile.agencyName}
                onChange={(e) => setProfile(p => ({ ...p, agencyName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Contact Name</label>
              <input
                required
                className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10"
                value={profile.name}
                onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Phone</label>
              <input
                className="w-full bg-surface-container-low text-on-surface rounded-2xl px-4 py-3 border border-outline-variant/10"
                value={profile.phone}
                onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Trade License ID</label>
              <input
                className="w-full bg-surface-container-low text-on-surface rounded-2xl px-4 py-3 border border-outline-variant/10"
                value={profile.tradeLicenseId}
                onChange={(e) => setProfile(p => ({ ...p, tradeLicenseId: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant dark:text-white">Website</label>
              <input
                type="url"
                className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10"
                value={profile.website}
                onChange={(e) => setProfile(p => ({ ...p, website: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant dark:text-white">Address</label>
            <textarea
              className="w-full bg-surface-container-low text-on-surface rounded-2xl px-4 py-3 border border-outline-variant/10 min-h-24"
              value={profile.address}
              onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))}
            />
          </div>

          <button className="bg-primary text-on-primary font-bold px-6 py-3 rounded-2xl">
            Update Agency Info
          </button>
        </form>
      </section>
    </div>
  );
};

export default AgencyProfile;
