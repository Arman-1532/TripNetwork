import React from 'react';

const AgencyMyPackages = ({
  myPackages,
  loadingMy,
  editingId,
  editForm,
  setEditForm,
  startEdit,
  cancelEdit,
  saveEdit,
  onDeletePackage,
  error,
  success,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-on-surface">My Packages</h1>
        <p className="text-sm text-on-surface-variant dark:text-on-surface-variant">Manage your posted travel packages</p>
      </div>

      {error && <div className="p-3 rounded-2xl bg-error-container text-on-error-container text-sm">{error}</div>}
      {success && <div className="p-3 rounded-2xl bg-primary-container/30 text-on-primary-container text-sm font-medium">{success}</div>}

      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-outline-variant/10 p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-on-surface dark:text-white">My Posted Travel Packages</h2>
        {loadingMy ? (
          <div className="text-sm text-on-surface-variant dark:text-white/80">Loading...</div>
        ) : myPackages.length === 0 ? (
          <div className="text-sm text-on-surface-variant dark:text-white/80">No packages posted yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPackages.map((p) => (
              <div key={p.package_id} className="border border-outline-variant/10 rounded-2xl p-4 bg-surface-container-low">
                {editingId === p.package_id ? (
                  <div className="space-y-3">
                    <input
                      className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2"
                      value={editForm.title}
                      onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2"
                        value={editForm.origin}
                        onChange={(e) => setEditForm(f => ({ ...f, origin: e.target.value }))}
                        placeholder="Origin"
                      />
                      <input
                        className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2"
                        value={editForm.destination}
                        onChange={(e) => setEditForm(f => ({ ...f, destination: e.target.value }))}
                        placeholder="Destination"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2"
                        value={editForm.price}
                        onChange={(e) => setEditForm(f => ({ ...f, price: e.target.value }))}
                        placeholder="Price"
                      />
                      <select
                        className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2"
                        value={editForm.travel_medium}
                        onChange={(e) => setEditForm(f => ({ ...f, travel_medium: e.target.value }))}
                      >
                        <option value="BUS">BUS</option>
                        <option value="AIR">AIR</option>
                        <option value="TRAIN">TRAIN</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <input
                        className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2 text-sm"
                        value={editForm.image_url || ''}
                        onChange={(e) => setEditForm(f => ({ ...f, image_url: e.target.value }))}
                        placeholder="Image URL"
                      />
                    </div>
                    <textarea
                      className="w-full bg-white dark:bg-slate-800 rounded-2xl px-4 py-2"
                      value={editForm.description}
                      onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(p.package_id)}
                        className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold"
                      >
                        Save
                      </button>
                      <button onClick={cancelEdit} className="px-4 py-2 rounded-xl bg-surface">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-4">
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={p.title}
                          className="w-20 h-20 object-cover rounded-xl border border-outline-variant/10"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-black text-on-surface">{p.title}</div>
                        <div className="text-xs text-on-surface-variant dark:text-white/80">
                          {p.origin ? `${p.origin} → ` : ''}{p.destination}
                        </div>
                        <div className="text-sm text-primary font-black mt-2">৳{p.price}</div>
                        <div className="text-xs text-on-surface-variant dark:text-white/80">Status: {p.status}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => startEdit(p)}
                        className="px-3 py-2 rounded-xl bg-surface text-on-surface border"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeletePackage(p.package_id)}
                        className="px-3 py-2 rounded-xl bg-error-container text-on-error-container border border-error/20"
                      >
                        Delete
                      </button>
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

export default AgencyMyPackages;
