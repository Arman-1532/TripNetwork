import React from 'react';

const AgencyCustomRequests = ({ availableRequests, loadingReq, onBid, error, success }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-on-surface">Custom Requests</h1>
        <p className="text-sm text-on-surface-variant dark:text-black/80">Browse and bid on traveler custom trip requests</p>
      </div>

      {error && <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-sm">{error}</div>}
      {success && <div className="p-3 rounded-2xl bg-primary-container/30 text-on-primary-container text-sm font-medium">{success}</div>}

      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-on-surface dark:text-white">Available Custom Trip Requests</h2>
        {loadingReq ? (
          <div className="text-sm text-on-surface-variant dark:text-white/80">Fetching requests...</div>
        ) : availableRequests.length === 0 ? (
          <div className="text-sm text-on-surface-variant dark:text-white/80">No custom trip requests available right now.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableRequests.map((r) => {
              let meta = {};
              try { meta = JSON.parse(r.description); } catch { }
              return (
                <div key={r.package_id} className="border border-outline-variant/10 rounded-2xl p-4 bg-surface-container-low">
                  <div className="font-black text-on-surface">{r.title}</div>
                  <div className="text-xs text-on-surface-variant dark:text-white/80">Requested by: {r.traveler_name || 'Traveler'}</div>
                  <div className="text-sm text-on-surface-variant dark:text-white/80 mt-2">
                    <div><b>Budget:</b> ৳{meta.budget ?? 'N/A'}</div>
                    <div><b>People:</b> {meta.numPeople ?? 'N/A'}</div>
                    <div><b>Date:</b> {meta.departureDate ?? 'Anytime'}</div>
                  </div>
                  <button
                    onClick={() => onBid(r)}
                    className="mt-3 bg-primary text-on-primary px-4 py-2 rounded-xl font-bold text-sm"
                  >
                    Submit Quote
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default AgencyCustomRequests;
