import React from 'react';
import { 
  Building2, MapPin, DollarSign, Bed, 
  Trash2, Pencil, Image as ImageIcon, 
  X, Save, Sparkles, CheckCircle2, 
  AlertCircle, Hotel, Layers
} from 'lucide-react';

const HotelMyPackages = ({ 
  myPackages, loadingMy, editingId, editForm, 
  setEditForm, startEdit, cancelEdit, saveEdit, 
  onDeletePackage, error, success 
}) => {
  const editFieldClass = 'w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl px-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all';
  const editLabelClass = 'text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-300 pl-1';

  const getStatusStyle = (status) => {
    const normalizedStatus = String(status || '').toLowerCase();
    if (normalizedStatus === 'active' || normalizedStatus === 'approved') 
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/40';
    if (normalizedStatus === 'pending') 
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/40';
    if (normalizedStatus === 'rejected') 
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/40';
    return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  };

  const parseDestination = (destination) => {
    if (!destination) return { city: 'Unknown', country: '' };
    const parts = destination.split(',').map((part) => part.trim()).filter(Boolean);
    return {
      city: parts[0] || 'Unknown',
      country: parts.slice(1).join(', ')
    };
  };

  const safePackages = Array.isArray(myPackages) ? myPackages : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ── Page Header ── */}
      <div className="rounded-[2rem] border border-slate-200/80 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50 to-slate-100/80 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-6 md:p-8 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
            <Layers size={14} />
            Inventory Management
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface dark:text-white">
            My Posted Offerings
          </h1>
          <p className="text-on-surface-variant dark:text-slate-400">
            Manage and update your hotel's room types, pricing, and visibility.
          </p>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-[1.5rem] bg-error-container text-on-error-container border border-error/10 animate-in shake-in duration-500">
          <AlertCircle size={18} />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-[1.5rem] bg-primary/10 text-primary border border-primary/20 animate-in zoom-in duration-500">
          <CheckCircle2 size={18} />
          <p className="font-bold text-sm">{success}</p>
        </div>
      )}

      {/* ── Content ── */}
      <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-700 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Hotel size={20} />
          </div>
          <h2 className="text-xl font-black text-on-surface dark:text-white uppercase tracking-tight">
            Active Hotel Room Offerings
          </h2>
          {!loadingMy && (
            <span className="ml-auto px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black">
              {safePackages.length} {safePackages.length === 1 ? 'offering' : 'offerings'}
            </span>
          )}
        </div>

        {loadingMy ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 bg-surface-container animate-pulse rounded-[2rem]" />
            ))}
          </div>
        ) : safePackages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Hotel size={36} className="text-primary/40" />
            </div>
            <div>
              <p className="font-black text-on-surface dark:text-white text-lg">No offerings yet</p>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">
                Head over to <span className="text-primary font-bold">Post Offering</span> to list your first room.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {safePackages.map((p) => {
              const isEditing = editingId === p.package_id;
              const parsedDest = parseDestination(p.destination);
              
              return (
                <div 
                  key={p.package_id}
                  className={`group relative rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 border transition-all duration-300
                    ${isEditing 
                      ? 'border-primary/30 shadow-xl shadow-primary/10 ring-1 ring-primary/20' 
                      : 'border-slate-200/90 dark:border-slate-700 hover:shadow-xl hover:shadow-slate-900/8 hover:-translate-y-0.5'
                    }`}
                >
                  {/* Image / Hero (Only if not editing) */}
                  {!isEditing && (
                    <div className="h-48 overflow-hidden relative">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 via-slate-100 to-slate-200 dark:from-primary/10 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
                          <Building2 size={44} className="text-primary/20" />
                        </div>
                      )}
                      
                      {/* Price overlay */}
                      <div className="absolute bottom-3 left-4">
                        <span className="text-2xl font-black text-white drop-shadow-lg">৳{Number(p.price).toLocaleString()}</span>
                        <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider ml-1">/ night</span>
                      </div>
                      
                      {/* Status badge */}
                      <div className="absolute top-4 left-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-md ${getStatusStyle(p.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {p.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Body */}
                  <div className="p-6">
                    {isEditing ? (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/10">
                          <Pencil size={16} className="text-primary" />
                          <span className="text-sm font-black text-on-surface dark:text-white uppercase tracking-wider">Edit Room Offering</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className={editLabelClass}>Title</label>
                            <input className={editFieldClass} value={editForm.shortTitle} onChange={e => setEditForm(f => ({ ...f, shortTitle: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <label className={editLabelClass}>Image URL</label>
                            <input className={editFieldClass} value={editForm.image_url} onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <label className={editLabelClass}>Price (BDT)</label>
                            <input type="number" className={editFieldClass} value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
                          </div>
                          <div className="space-y-1.5">
                            <label className={editLabelClass}>Room Type</label>
                            <select className={editFieldClass} value={editForm.roomType} onChange={e => setEditForm(f => ({ ...f, roomType: e.target.value }))}>
                              <option value="Single">Single</option>
                              <option value="Double">Double</option>
                              <option value="Suite">Suite</option>
                              <option value="Deluxe">Deluxe</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2.5 pt-2">
                          <button onClick={() => saveEdit(p.package_id)} className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-2xl font-black text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                            <Save size={14} /> Save
                          </button>
                          <button onClick={cancelEdit} className="flex-1 flex items-center justify-center gap-2 bg-surface-container border border-outline-variant/10 text-on-surface font-bold py-3 rounded-2xl text-xs hover:bg-surface-container-high transition-all">
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-on-surface dark:text-white tracking-tight group-hover:text-primary transition-colors">{p.title}</h3>
                          <div className="flex items-center gap-2 text-on-surface-variant dark:text-slate-400 text-xs font-bold">
                            <MapPin size={12} className="text-primary" />
                            {parsedDest.city}{parsedDest.country ? `, ${parsedDest.country}` : ''}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 p-3 rounded-2xl bg-surface-container dark:bg-slate-800/50 border border-outline-variant/10">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                              <Bed size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant dark:text-slate-500">Room Type</p>
                              <p className="text-xs font-bold text-on-surface dark:text-white">
                                {editForm.roomType || 'Standard'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-3 rounded-2xl bg-surface-container dark:bg-slate-800/50 border border-outline-variant/10">
                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                              <Sparkles size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant dark:text-slate-500">Service</p>
                              <p className="text-xs font-bold text-on-surface dark:text-white uppercase">Premium</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button onClick={() => startEdit(p)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/10 text-on-surface font-bold text-sm hover:bg-primary hover:text-on-primary hover:border-primary transition-all group/btn">
                            <Pencil size={15} className="group-hover/btn:rotate-12 transition-transform" />
                            Edit
                          </button>
                          <button onClick={() => onDeletePackage(p.package_id)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-all group/del">
                            <Trash2 size={15} className="group-hover/del:scale-110 transition-transform" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default HotelMyPackages;
