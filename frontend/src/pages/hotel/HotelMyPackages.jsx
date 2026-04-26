import React from 'react';

const HotelMyPackages = ({ myPackages, loadingMy, editingId, editForm, setEditForm, startEdit, cancelEdit, saveEdit, onDeletePackage, error, success }) => {
  const editFieldClass = 'w-full rounded-2xl px-4 py-2.5 border border-outline-variant/30 bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-300 dark:border-slate-600';
  const editLabelClass = 'text-xs font-extrabold text-slate-700 dark:text-slate-100 tracking-wide';

  const getStatusStyle = (status) => {
    const normalizedStatus = String(status || '').toLowerCase();
    if (normalizedStatus === 'active') return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/40';
    if (normalizedStatus === 'pending') return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/40';
    if (normalizedStatus === 'rejected') return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40';
    return 'bg-surface-container text-on-surface-variant border-outline-variant/20';
  };

  const parseDestination = (destination) => {
    if (!destination) return { city: 'Unknown', country: '' };
    const parts = destination.split(',').map((part) => part.trim()).filter(Boolean);
    return {
      city: parts[0] || 'Unknown',
      country: parts.slice(1).join(', ')
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-on-surface">My Offerings</h1>
        <p className="text-sm text-on-surface-variant dark:text-on-surface-variant">Manage your posted hotel packages</p>
      </div>

      {error && <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-sm">{error}</div>}
      {success && <div className="p-3 rounded-2xl bg-primary-container/30 text-on-surface text-sm">{success}</div>}

      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-5">
        <div className="space-y-1">
          <div>
            <h2 className="text-lg font-extrabold text-on-surface dark:text-white">My Posted Hotel Packages</h2>
            <p className="text-xs sm:text-sm text-on-surface-variant dark:text-white/70">Manage and update all your hotel listings with better clarity</p>
          </div>
        </div>

        {loadingMy ? (
          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low px-4 py-6 text-sm text-on-surface-variant dark:text-white/80">
            Loading your hotel packages...
          </div>
        ) : myPackages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-low px-4 py-8 text-center">
            <div className="text-sm font-bold text-on-surface dark:text-white">No packages posted yet</div>
            <div className="text-xs text-on-surface-variant dark:text-white/70 mt-1">Create a new offering to start receiving bookings.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {myPackages.map((p) => (
              <div
                key={p.package_id}
                className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
                  editingId === p.package_id
                    ? 'bg-surface border-primary/30 shadow-[0_0_0_1px_rgba(var(--color-primary-rgb),0.08)]'
                    : 'bg-gradient-to-br from-surface-container-low to-white dark:from-slate-900 dark:to-slate-800/90 border-outline-variant/20 hover:border-primary/30 hover:shadow-md'
                }`}
              >
                {editingId === p.package_id ? (
                  <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 rounded-2xl border border-primary/20 bg-white/90 dark:bg-slate-900/80 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-black text-on-surface dark:text-white text-base sm:text-lg">Edit Offering</h3>
                      <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${getStatusStyle(p.status)}`}>
                        {p.status || 'Unknown'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className={editLabelClass}>Short Title *</label>
                        <input
                          className={editFieldClass}
                          value={editForm.shortTitle || ''}
                          onChange={(e) => setEditForm(f => ({ ...f, shortTitle: e.target.value }))}
                          placeholder="e.g., Luxury Beach Resort"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={editLabelClass}>Country *</label>
                        <input
                          className={editFieldClass}
                          value={editForm.country || ''}
                          onChange={(e) => setEditForm(f => ({ ...f, country: e.target.value }))}
                          placeholder="e.g., Bangladesh"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={editLabelClass}>City *</label>
                        <input
                          className={editFieldClass}
                          value={editForm.city || ''}
                          onChange={(e) => setEditForm(f => ({ ...f, city: e.target.value }))}
                          placeholder="e.g., Cox's Bazar"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={editLabelClass}>Area</label>
                        <input
                          className={editFieldClass}
                          value={editForm.area || ''}
                          onChange={(e) => setEditForm(f => ({ ...f, area: e.target.value }))}
                          placeholder="e.g., Downtown"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className={editLabelClass}>Full Address</label>
                        <textarea
                          className={editFieldClass}
                          value={editForm.fullAddress || ''}
                          onChange={(e) => setEditForm(f => ({ ...f, fullAddress: e.target.value }))}
                          placeholder="Complete address"
                          rows="2"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={editLabelClass}>Room Type *</label>
                        <select
                          className={editFieldClass}
                          value={editForm.roomType || 'Single'}
                          onChange={(e) => setEditForm(f => ({ ...f, roomType: e.target.value }))}
                        >
                          <option value="Single">Single</option>
                          <option value="Double">Double</option>
                          <option value="Suite">Suite</option>
                          <option value="Deluxe">Deluxe</option>
                          <option value="Penthouse">Penthouse</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className={editLabelClass}>Bed Type *</label>
                        <select
                          className={editFieldClass}
                          value={editForm.bedType || ''}
                          onChange={(e) => setEditForm(f => ({ ...f, bedType: e.target.value }))}
                        >
                          <option value="">Select Bed Type</option>
                          <option value="Single Bed">Single Bed</option>
                          <option value="Double Bed">Double Bed</option>
                          <option value="Twin Beds">Twin Beds</option>
                          <option value="King Size">King Size</option>
                          <option value="Queen Size">Queen Size</option>
                        </select>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className={editLabelClass}>Price (BDT per night) *</label>
                        <input
                          type="number"
                          className={editFieldClass}
                          value={editForm.price || ''}
                          onChange={(e) => setEditForm(f => ({ ...f, price: e.target.value }))}
                          placeholder="e.g., 5000"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className={editLabelClass}>Detailed Description</label>
                        <textarea
                          className={editFieldClass}
                          value={editForm.fullDescription || ''}
                          onChange={(e) => setEditForm(f => ({ ...f, fullDescription: e.target.value }))}
                          placeholder="Provide detailed description about the room and amenities"
                          rows="4"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button onClick={() => saveEdit(p.package_id)} className="flex-1 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-bold hover:bg-primary-hover">Save Changes</button>
                      <button onClick={cancelEdit} className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/10 hover:bg-surface-container">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const parsedDestination = parseDestination(p.destination);
                      return (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-black text-on-surface dark:text-white text-base sm:text-xl tracking-tight truncate">{p.title}</div>
                              <div className="text-sm text-on-surface-variant dark:text-white/75 mt-1 font-medium">
                                {parsedDestination.city}
                                {parsedDestination.country ? `, ${parsedDestination.country}` : ''}
                              </div>
                            </div>
                            <span className={`shrink-0 px-2.5 py-1 rounded-full border text-xs font-bold ${getStatusStyle(p.status)}`}>
                              {p.status || 'Unknown'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 px-3 py-2.5">
                              <div className="text-[11px] uppercase tracking-wide text-on-surface-variant font-semibold">Price</div>
                              <div className="text-base sm:text-lg font-black text-primary">৳{Number(p.price || 0).toLocaleString()}</div>
                            </div>
                            <div className="rounded-xl border border-outline-variant/20 bg-white/80 dark:bg-slate-800/80 px-3 py-2.5">
                              <div className="text-[11px] uppercase tracking-wide text-on-surface-variant font-semibold">Visibility</div>
                              <div className="text-sm font-bold text-on-surface dark:text-white">{String(p.status || 'Unknown')}</div>
                            </div>
                          </div>

                          <div className="pt-2 flex flex-col sm:flex-row gap-2">
                            <button onClick={() => startEdit(p)} className="sm:w-auto px-4 py-2.5 rounded-xl bg-surface text-on-surface border border-outline-variant/20 hover:bg-surface-container font-bold">
                              Edit Offering
                            </button>
                            <button onClick={() => onDeletePackage(p.package_id)} className="sm:w-auto px-4 py-2.5 rounded-xl bg-error-container text-on-error-container border border-error/30 hover:opacity-90 font-bold">
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HotelMyPackages;
