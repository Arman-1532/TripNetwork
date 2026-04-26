import React, { useMemo, useState } from 'react';
import {
  Inbox,
  User,
  MapPin,
  DollarSign,
  Users,
  CalendarDays,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageSquare,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/* ─── Inline Quote Form ─────────────────────────────────────────────────────── */
const QuoteForm = ({ requestId, onSubmit, onCancel, submitting }) => {
  const [amount, setAmount]   = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount) return;
    onSubmit(requestId, { amount: amount.trim(), message });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white pl-1">Your Quote (BDT)</label>
        <div className="relative">
          <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
          <input
            required
            type="number"
            min="1"
            className="w-full bg-surface-container-low dark:bg-slate-800 rounded-xl pl-8 pr-3 py-2.5 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-on-surface dark:text-white text-sm transition-all"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 15000"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white pl-1">Message to Traveler</label>
        <div className="relative">
          <MessageSquare size={14} className="absolute left-3 top-3 text-primary" />
          <textarea
            className="w-full bg-surface-container-low dark:bg-slate-800 rounded-xl pl-8 pr-3 py-2.5 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white text-sm min-h-20 resize-none transition-all"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what's included, itinerary highlights, accommodation..."
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !amount}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-xl font-black text-xs shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {submitting
            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Send size={13} />}
          {submitting ? 'Submitting...' : 'Send Quote'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant/10 text-on-surface-variant font-bold text-xs hover:bg-surface-container-high transition-all disabled:opacity-50"
        >
          <X size={14} />
        </button>
      </div>
    </form>
  );
};

/* ─── Request Card ──────────────────────────────────────────────────────────── */
const RequestCard = ({ r, onBid, submittingId }) => {
  const [showForm, setShowForm] = useState(false);

  let meta = {};
  try { meta = JSON.parse(r.description); } catch { /* plain text fallback */ }

  const budget        = meta.budget        ?? null;
  const numPeople     = meta.numPeople     ?? null;
  const departureDate = meta.departureDate ?? null;
  const notes         = meta.notes || meta.message || (!meta.budget ? r.description : null);

  const myBid = Array.isArray(meta.bids)
    ? meta.bids.find(b => b.agencyId == r._myAgencyId)
    : null;

  const handleSubmit = async (requestId, data) => {
    await onBid(r, data);
    setShowForm(false);
  };

  return (
    <div className="group relative rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 hover:shadow-xl hover:shadow-slate-900/8 hover:-translate-y-0.5 transition-all duration-300">

      {/* Coloured top accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />

      <div className="p-6 space-y-5">

        {/* Header: title + requester */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-primary transition-colors">
              {r.title}
            </h3>
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              <Inbox size={11} />
              Open
            </span>
          </div>

          <div className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-3 py-1">
            <User size={12} className="text-primary" />
            {r.traveler_name || 'Traveler'}
          </div>
        </div>

        {/* Route */}
        {(r.origin || r.destination) && (
          <div className="inline-flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-bold text-xs bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700/40 rounded-full px-3 py-1">
            <MapPin size={12} />
            {r.origin ? `${r.origin} → ` : ''}{r.destination}
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-surface-container dark:bg-slate-800 border border-outline-variant/10">
            <DollarSign size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant dark:text-slate-400">Budget</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {budget ? `৳${budget}` : '—'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-surface-container dark:bg-slate-800 border border-outline-variant/10">
            <Users size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant dark:text-slate-400">People</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {numPeople ?? '—'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-surface-container dark:bg-slate-800 border border-outline-variant/10">
            <CalendarDays size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant dark:text-slate-400">Date</span>
            <span className="text-sm font-black text-slate-900 dark:text-white truncate w-full text-center">
              {departureDate ?? 'Flexible'}
            </span>
          </div>
        </div>

        {/* Notes / description */}
        {notes && (
          <div className="flex gap-2.5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30">
            <FileText size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed line-clamp-3">
              {notes}
            </p>
          </div>
        )}

        {/* Quote form / CTA */}
        {showForm ? (
          <QuoteForm
            requestId={r.package_id}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            submitting={submittingId === r.package_id}
          />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Send size={15} />
            Submit Quote
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Main Component ────────────────────────────────────────────────────────── */
const AgencyCustomRequests = ({ availableRequests, loadingReq, onBid, error, success }) => {
  const [submittingId, setSubmittingId] = useState(null);
  const agencyId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return Number(user.id) || null;
    } catch {
      return null;
    }
  }, []);

  const sortedRequests = useMemo(() => {
    const hasAgencyBid = (requestItem) => {
      if (!agencyId) return false;
      try {
        const meta = typeof requestItem.description === 'string'
          ? JSON.parse(requestItem.description)
          : requestItem.description;
        return Array.isArray(meta?.bids) && meta.bids.some((b) => Number(b?.agencyId) === agencyId);
      } catch {
        return false;
      }
    };

    const requests = Array.isArray(availableRequests) ? [...availableRequests] : [];
    requests.sort((a, b) => {
      const aResponded = hasAgencyBid(a);
      const bResponded = hasAgencyBid(b);
      if (aResponded !== bResponded) return aResponded ? 1 : -1; // unanswered first

      const aTime = new Date(a?.created_at || 0).getTime();
      const bTime = new Date(b?.created_at || 0).getTime();
      return bTime - aTime; // newest first within each group
    });
    return requests;
  }, [availableRequests, agencyId]);

  const handleBid = async (r, data) => {
    setSubmittingId(r.package_id);
    await onBid(r, data);
    setSubmittingId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Page Header ── */}
      <div className="rounded-[2rem] border border-slate-200/80 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50 to-slate-100/80 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-6 md:p-8 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
            <Inbox size={14} />
            Traveler Requests
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface dark:text-white">
            Custom Trip Requests
          </h1>
          <p className="text-on-surface-variant dark:text-slate-400">
            Browse open requests from travelers and submit your best quote.
          </p>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-[1.5rem] bg-error-container text-on-error-container border border-error/10">
          <AlertCircle size={18} />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-[1.5rem] bg-primary/10 text-primary border border-primary/20">
          <CheckCircle2 size={18} />
          <p className="font-bold text-sm">{success}</p>
        </div>
      )}

      {/* ── Content ── */}
      <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-700 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Inbox size={20} />
          </div>
          <h2 className="text-xl font-black text-on-surface dark:text-white uppercase tracking-tight">
            Available Custom Trip Requests
          </h2>
          {!loadingReq && (
            <span className="ml-auto px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black">
              {sortedRequests.length} {sortedRequests.length === 1 ? 'request' : 'requests'}
            </span>
          )}
        </div>

        {loadingReq ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 bg-surface-container animate-pulse rounded-[2rem]" />
            ))}
          </div>
        ) : sortedRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Inbox size={36} className="text-primary/40" />
            </div>
            <div>
              <p className="font-black text-on-surface dark:text-white text-lg">No requests right now</p>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">
                Check back later — new traveler requests will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sortedRequests.map((r) => (
              <RequestCard
                key={r.package_id}
                r={r}
                onBid={handleBid}
                submittingId={submittingId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AgencyCustomRequests;
