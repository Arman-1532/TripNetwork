import React from 'react';
import {
  Package,
  MapPin,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plane,
  Bus,
  Train,
  DollarSign,
  Image as ImageIcon,
  X,
  Save,
  Clock,
  Layers,
} from 'lucide-react';

const transportConfig = {
  BUS:   { icon: <Bus   size={14} />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/40' },
  AIR:   { icon: <Plane size={14} />, color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-700/40' },
  TRAIN: { icon: <Train size={14} />, color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700/40' },
};

const statusConfig = {
  active:   { label: 'Active',   color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/40' },
  inactive: { label: 'Inactive', color: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
  pending:  { label: 'Pending',  color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/40' },
};

const getStatus = (status) => {
  const normalized = String(status || '').toLowerCase();
  return statusConfig[normalized] || { label: String(status || 'Unknown'), color: 'bg-slate-100 text-slate-500 border-slate-200' };
};

const getTransport = (medium) => transportConfig[String(medium || '').toUpperCase()] || null;

const getDescriptionText = (description) => {
  const customPackageLabel = 'custom package';
  const isLikelyCustomPackageJson = (value) => {
    if (!value || typeof value !== 'object') return false;
    const keys = Object.keys(value);
    if (keys.length >= 4) return true;
    return (
      'travelerName' in value ||
      'travelerEmail' in value ||
      'requestId' in value ||
      'customRequestId' in value ||
      'budget' in value ||
      'requirements' in value ||
      'preferences' in value ||
      'destination' in value
    );
  };

  if (!description) return '';
  if (typeof description === 'string') {
    const trimmed = description.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (isLikelyCustomPackageJson(parsed)) return customPackageLabel;
        if (parsed && typeof parsed === 'object') {
          return parsed.fullDescription || parsed.message || customPackageLabel;
        }
      } catch {
        return description;
      }
    }

    try {
      const parsed = JSON.parse(description);
      if (parsed && typeof parsed === 'object') {
        if (isLikelyCustomPackageJson(parsed)) return customPackageLabel;
        return parsed.fullDescription || parsed.message || customPackageLabel;
      }
    } catch {
      // keep original plain string description
    }
    return description;
  }
  if (typeof description === 'object') {
    if (isLikelyCustomPackageJson(description)) return customPackageLabel;
    return description.fullDescription || description.message || customPackageLabel;
  }
  return String(description);
};

/* ─── Edit Form ─────────────────────────────────────────────────────────────── */
const EditForm = ({ editForm, setEditForm, onSave, onCancel, packageId }) => (
  <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
    <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/10">
      <Pencil size={16} className="text-primary" />
      <span className="text-sm font-black text-white uppercase tracking-wider">Edit Package</span>
    </div>

    {/* Title */}
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white pl-1">Package Title</label>
      <input
        className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl px-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all"
        value={editForm.title}
        onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
        placeholder="Package title"
      />
    </div>

    {/* Origin / Destination */}
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white pl-1">Origin</label>
        <div className="relative">
          <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
          <input
            className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all"
            value={editForm.origin}
            onChange={(e) => setEditForm(f => ({ ...f, origin: e.target.value }))}
            placeholder="e.g. Dhaka"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white pl-1">Destination</label>
        <div className="relative">
          <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
          <input
            className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all"
            value={editForm.destination}
            onChange={(e) => setEditForm(f => ({ ...f, destination: e.target.value }))}
            placeholder="e.g. Cox's Bazar"
          />
        </div>
      </div>
    </div>

    {/* Price / Travel Medium */}
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white pl-1">Price (BDT)</label>
        <div className="relative">
          <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
          <input
            type="number"
            min="0"
            className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-on-surface dark:text-white transition-all"
            value={editForm.price}
            onChange={(e) => setEditForm(f => ({ ...f, price: e.target.value }))}
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white pl-1">Travel Medium</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary">
            {getTransport(editForm.travel_medium)?.icon || <Bus size={15} />}
          </div>
          <select
            className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white appearance-none transition-all"
            value={editForm.travel_medium}
            onChange={(e) => setEditForm(f => ({ ...f, travel_medium: e.target.value }))}
          >
            <option value="BUS">Bus Travel</option>
            <option value="AIR">By Air</option>
            <option value="TRAIN">Train Journey</option>
          </select>
        </div>
      </div>
    </div>

    {/* Image URL */}
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white pl-1">Image URL</label>
      <div className="relative">
        <ImageIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
        <input
          className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all"
          value={editForm.image_url || ''}
          onChange={(e) => setEditForm(f => ({ ...f, image_url: e.target.value }))}
          placeholder="https://..."
        />
      </div>
    </div>

    {/* Description */}
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white pl-1">Description</label>
      <textarea
        className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl px-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white min-h-24 resize-none transition-all"
        value={editForm.description}
        onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
        placeholder="Describe the experience..."
      />
    </div>

    {/* Actions */}
    <div className="flex gap-3 pt-1">
      <button
        onClick={() => onSave(packageId)}
        className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
      >
        <Save size={16} />
        Save Changes
      </button>
      <button
        onClick={onCancel}
        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/10 text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-all"
      >
        <X size={16} />
        Cancel
      </button>
    </div>
  </div>
);

/* ─── Package Card ──────────────────────────────────────────────────────────── */
const PackageManageCard = ({ p, editingId, editForm, setEditForm, startEdit, cancelEdit, saveEdit, onDeletePackage }) => {
  const isEditing = editingId === p.package_id;
  const transport = getTransport(p.travel_medium);
  const status = getStatus(p.status);

  return (
    <div className={`group relative rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 border transition-all duration-300
      ${isEditing
        ? 'border-primary/30 shadow-xl shadow-primary/10 ring-1 ring-primary/20'
        : 'border-slate-200/90 dark:border-slate-700 hover:shadow-xl hover:shadow-slate-900/8 hover:-translate-y-0.5'
      }`}
    >
      {/* Image / Hero */}
      {!isEditing && (
        <div className="h-44 overflow-hidden relative">
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 via-slate-100 to-slate-200 dark:from-primary/10 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
              <Package size={40} className="text-primary/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent pointer-events-none" />

          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${status.color}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {status.label}
            </span>
          </div>

          {/* Transport badge */}
          {transport && (
            <div className="absolute top-3 right-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${transport.color}`}>
                {transport.icon}
                {p.travel_medium}
              </span>
            </div>
          )}

          {/* Price overlay */}
          <div className="absolute bottom-3 left-3">
            <span className="text-2xl font-black text-white drop-shadow-lg">৳{p.price}</span>
            <span className="text-white/70 text-xs font-bold ml-1">/ person</span>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="p-5">
        {isEditing ? (
          <EditForm
            editForm={editForm}
            setEditForm={setEditForm}
            onSave={saveEdit}
            onCancel={cancelEdit}
            packageId={p.package_id}
          />
        ) : (
          <div className="space-y-4">
            {/* Title & Route */}
            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-primary transition-colors line-clamp-1">
                {p.title}
              </h3>
              {(p.origin || p.destination) && (
                <div className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-bold text-xs bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700/40 rounded-full px-2.5 py-1">
                  <MapPin size={12} />
                  {p.origin ? `${p.origin} → ` : ''}{p.destination}
                </div>
              )}
            </div>

            {/* Description */}
            {p.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {getDescriptionText(p.description)}
              </p>
            )}

            {/* Meta row */}
            {p.is_limited_time && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/40">
                  <Clock size={11} />
                  Limited Time
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => startEdit(p)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/10 text-on-surface font-bold text-sm hover:bg-primary hover:text-on-primary hover:border-primary transition-all group/btn"
              >
                <Pencil size={15} className="group-hover/btn:rotate-12 transition-transform" />
                Edit
              </button>
              <button
                onClick={() => onDeletePackage(p.package_id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-all group/del"
              >
                <Trash2 size={15} className="group-hover/del:scale-110 transition-transform" />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Main Component ────────────────────────────────────────────────────────── */
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
  const safePackages = Array.isArray(myPackages)
    ? myPackages
    : Array.isArray(myPackages?.packages)
      ? myPackages.packages
      : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Page Header ── */}
      <div className="rounded-[2rem] border border-slate-200/80 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50 to-slate-100/80 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
              <Layers size={14} />
              Package Management
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface dark:text-white">
              My Posted Packages
            </h1>
            <p className="text-on-surface-variant dark:text-slate-400">
              Manage, edit, and track all your curated travel packages.
            </p>
          </div>


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
            <Package size={20} />
          </div>
          <h2 className="text-xl font-black text-on-surface dark:text-white uppercase tracking-tight">
            My Posted Travel Packages
          </h2>
          {!loadingMy && (
            <span className="ml-auto px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black">
              {safePackages.length} {safePackages.length === 1 ? 'package' : 'packages'}
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
              <Package size={36} className="text-primary/40" />
            </div>
            <div>
              <p className="font-black text-on-surface dark:text-white text-lg">No packages yet</p>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">
                Head over to <span className="text-primary font-bold">Post Package</span> to create your first travel package.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {safePackages.map((p) => (
              <PackageManageCard
                key={p.package_id}
                p={p}
                editingId={editingId}
                editForm={editForm}
                setEditForm={setEditForm}
                startEdit={startEdit}
                cancelEdit={cancelEdit}
                saveEdit={saveEdit}
                onDeletePackage={onDeletePackage}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AgencyMyPackages;
