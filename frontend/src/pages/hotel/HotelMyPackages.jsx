import React from 'react';

const HotelMyPackages = ({ myPackages, loadingMy, editingId, editForm, setEditForm, startEdit, cancelEdit, saveEdit, onDeletePackage, error, success }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-on-surface">My Offerings</h1>
        <p className="text-sm text-on-surface-variant dark:text-on-surface-variant">Manage your posted hotel packages</p>
      </div>

      {error && <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-sm">{error}</div>}
      {success && <div className="p-3 rounded-2xl bg-primary-container/30 text-on-surface text-sm">{success}</div>}

      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-on-surface dark:text-white">My Posted Hotel Packages</h2>
        {loadingMy ? (
          <div className="text-sm text-on-surface-variant dark:text-white/80">Loading...</div>
        ) : myPackages.length === 0 ? (
          <div className="text-sm text-on-surface-variant dark:text-white/80">No packages posted yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {myPackages.map((p) => (
              <div key={p.package_id} className="border border-outline-variant/10 rounded-2xl p-4 bg-surface-container-low">
                {editingId === p.package_id ? (
                  <div className="space-y-3 max-h-[80vh] overflow-y-auto">
                    <h3 className="font-bold text-on-surface">Edit Offering</h3>

                    {/* Short Title */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant">Short Title *</label>
                      <input
                        className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 border border-outline-variant/20"
                        value={editForm.shortTitle || ''}
                        onChange={(e) => setEditForm(f => ({ ...f, shortTitle: e.target.value }))}
                        placeholder="e.g., Luxury Beach Resort"
                      />
                    </div>

                    {/* Country */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant">Country *</label>
                      <input
                        className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 border border-outline-variant/20"
                        value={editForm.country || ''}
                        onChange={(e) => setEditForm(f => ({ ...f, country: e.target.value }))}
                        placeholder="e.g., Bangladesh"
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant">City *</label>
                      <input
                        className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 border border-outline-variant/20"
                        value={editForm.city || ''}
                        onChange={(e) => setEditForm(f => ({ ...f, city: e.target.value }))}
                        placeholder="e.g., Cox's Bazar"
                      />
                    </div>

                    {/* Area */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant">Area</label>
                      <input
                        className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 border border-outline-variant/20"
                        value={editForm.area || ''}
                        onChange={(e) => setEditForm(f => ({ ...f, area: e.target.value }))}
                        placeholder="e.g., Downtown"
                      />
                    </div>

                    {/* Full Address */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant">Full Address</label>
                      <textarea
                        className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 border border-outline-variant/20"
                        value={editForm.fullAddress || ''}
                        onChange={(e) => setEditForm(f => ({ ...f, fullAddress: e.target.value }))}
                        placeholder="Complete address"
                        rows="2"
                      />
                    </div>

                    {/* Room Type */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant">Room Type *</label>
                      <select
                        className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 border border-outline-variant/20"
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

                    {/* Bed Type */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant">Bed Type *</label>
                      <select
                        className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 border border-outline-variant/20"
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

                    {/* Price */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant">Price (BDT per night) *</label>
                      <input
                        type="number"
                        className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 border border-outline-variant/20"
                        value={editForm.price || ''}
                        onChange={(e) => setEditForm(f => ({ ...f, price: e.target.value }))}
                        placeholder="e.g., 5000"
                      />
                    </div>

                    {/* Full Description */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-on-surface-variant">Detailed Description</label>
                      <textarea
                        className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 border border-outline-variant/20"
                        value={editForm.fullDescription || ''}
                        onChange={(e) => setEditForm(f => ({ ...f, fullDescription: e.target.value }))}
                        placeholder="Provide detailed description about the room and amenities"
                        rows="4"
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button onClick={() => saveEdit(p.package_id)} className="flex-1 bg-primary text-on-primary px-4 py-2 rounded-xl font-bold hover:bg-primary-hover">Save Changes</button>
                      <button onClick={cancelEdit} className="flex-1 px-4 py-2 rounded-xl bg-surface border border-outline-variant/10 hover:bg-surface-container">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="font-black text-on-surface">{p.title}</div>
                    <div className="text-xs text-on-surface-variant dark:text-white/80">{p.destination}</div>
                    <div className="text-sm text-primary font-black mt-2">৳{p.price}</div>
                    <div className="text-xs text-on-surface-variant dark:text-white/80">Status: {p.status}</div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => startEdit(p)} className="px-3 py-2 rounded-xl bg-surface text-on-surface border border-outline-variant/10">Edit</button>
                      <button onClick={() => onDeletePackage(p.package_id)} className="px-3 py-2 rounded-xl bg-error-container text-on-error-container border border-error/20">Delete</button>
                    </div>
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
