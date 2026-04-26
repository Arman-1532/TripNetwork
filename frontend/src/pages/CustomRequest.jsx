import React, { useEffect, useState } from 'react';
import {
  MapPin, DollarSign, Users, CalendarDays, FileText,
  Send, CheckCircle2, AlertCircle, Inbox, Clock,
  ThumbsUp, ThumbsDown, Building2, MessageSquare,
  ChevronDown, ChevronUp, Sparkles, CreditCard,
} from 'lucide-react';
import { api } from '../services/api';
import TravelerDetailsModal from '../components/TravelerDetailsModal';

/* ─── Status badge helper ───────────────────────────────────────────────────── */
const statusStyles = {
  PENDING:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/40',
  APPROVED: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/40',
  REJECTED: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700/40',
};

/* ─── Bid Card ──────────────────────────────────────────────────────────────── */
const BidCard = ({ bid, requestId, requestStatus, onAccept, onReject, accepting, rejecting }) => {
  const isAccepted = bid.status === 'ACCEPTED' || requestStatus === 'ACCEPTED';
  const isRejected = bid.status === 'REJECTED';
  const isActing   = accepting === bid.agencyId || rejecting === bid.agencyId;

  return (
    <div className={`rounded-2xl border p-4 space-y-3 transition-all
      ${isAccepted ? 'border-green-300 bg-green-50 dark:bg-green-900/10 dark:border-green-700/40' :
        isRejected ? 'border-slate-200 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 opacity-60' :
        'border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 hover:shadow-md'}`}
    >
      {/* Agency header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 size={16} className="text-primary" />
          </div>
          <div>
            <p className="font-black text-slate-900 dark:text-white text-sm">{bid.agencyName}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {new Date(bid.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        {isAccepted && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/40">
            <CheckCircle2 size={11} /> Accepted
          </span>
        )}
        {isRejected && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600">
            Rejected
          </span>
        )}
      </div>

      {/* Quote amount */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <DollarSign size={16} className="text-primary shrink-0" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-primary/70">Quoted Price</p>
          <p className="text-xl font-black text-primary">৳{bid.amount}</p>
        </div>
      </div>

      {/* Message */}
      {bid.message && (
        <div className="flex gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30">
          <MessageSquare size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{bid.message}</p>
        </div>
      )}

      {/* Actions — only show if request is still open and bid not rejected */}
      {!isAccepted && !isRejected && requestStatus === 'PENDING' && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onAccept(requestId, bid.agencyId)}
            disabled={isActing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-on-primary font-black text-xs shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {accepting === bid.agencyId
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <ThumbsUp size={14} />}
            Accept & Pay
          </button>
          <button
            onClick={() => onReject(requestId, bid.agencyId)}
            disabled={isActing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-700/30 text-red-600 dark:text-red-400 font-black text-xs hover:bg-red-500 hover:text-white hover:border-red-500 transition-all disabled:opacity-50"
          >
            {rejecting === bid.agencyId
              ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <ThumbsDown size={14} />}
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Request Card ──────────────────────────────────────────────────────────── */
const RequestCard = ({ r, onAccept, onReject, accepting, rejecting }) => {
  const [expanded, setExpanded] = useState(false);

  let meta = {};
  try { meta = JSON.parse(r.description); } catch { /* plain text */ }

  const bids        = Array.isArray(meta.bids) ? meta.bids : [];
  const activeBids  = bids.filter(b => b.status !== 'REJECTED');
  const hasBids     = activeBids.length > 0;
  const isAccepted  = r.status === 'APPROVED';

  return (
    <div className={`rounded-[2rem] overflow-hidden border transition-all duration-300
      ${isAccepted
        ? 'border-green-300 dark:border-green-700/40 shadow-lg shadow-green-500/5'
        : hasBids
          ? 'border-primary/30 dark:border-primary/20 shadow-lg shadow-primary/5'
          : 'border-slate-200/90 dark:border-slate-700'}`}
    >
      {/* Accent bar */}
      <div className={`h-1.5 w-full ${isAccepted ? 'bg-gradient-to-r from-green-500 to-emerald-400' : hasBids ? 'bg-gradient-to-r from-primary via-primary/60 to-transparent' : 'bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-600'}`} />

      <div className="bg-white dark:bg-slate-900 p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base leading-tight">{r.title}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusStyles[r.status] || statusStyles.PENDING}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {r.status}
              </span>
              {hasBids && !isAccepted && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  <Sparkles size={10} />
                  {activeBids.length} {activeBids.length === 1 ? 'Quote' : 'Quotes'} Received
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-surface-container dark:bg-slate-800 border border-outline-variant/10">
            <DollarSign size={14} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant dark:text-slate-400">Budget</span>
            <span className="text-xs font-black text-slate-900 dark:text-white">{meta.budget ? `৳${meta.budget}` : '—'}</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-surface-container dark:bg-slate-800 border border-outline-variant/10">
            <Users size={14} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant dark:text-slate-400">People</span>
            <span className="text-xs font-black text-slate-900 dark:text-white">{meta.numPeople ?? '—'}</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-surface-container dark:bg-slate-800 border border-outline-variant/10">
            <CalendarDays size={14} className="text-primary" />
            <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant dark:text-slate-400">Date</span>
            <span className="text-xs font-black text-slate-900 dark:text-white truncate w-full text-center">{meta.departureDate ?? 'Flexible'}</span>
          </div>
        </div>

        {/* Bids section */}
        {hasBids && (
          <div className="space-y-2">
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-full flex items-center justify-between gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors"
            >
              <span className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={14} />
                {activeBids.length} Agency {activeBids.length === 1 ? 'Quote' : 'Quotes'}
              </span>
              {expanded ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} className="text-primary" />}
            </button>

            {expanded && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                {activeBids.map((bid) => (
                  <BidCard
                    key={bid.agencyId}
                    bid={bid}
                    requestId={r.package_id}
                    requestStatus={r.status}
                    onAccept={onAccept}
                    onReject={onReject}
                    accepting={accepting}
                    rejecting={rejecting}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {!hasBids && !isAccepted && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Clock size={14} className="text-slate-400 shrink-0" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Waiting for agency quotes...</p>
          </div>
        )}

        {isAccepted && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700/30">
            <CheckCircle2 size={14} className="text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-xs text-green-700 dark:text-green-400 font-bold">Quote accepted — payment completed.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
const CustomRequestPage = () => {
  const [destination, setDestination]   = useState('');
  const [budget, setBudget]             = useState('');
  const [numPeople, setNumPeople]       = useState(1);
  const [departureDate, setDepartureDate] = useState('');
  const [description, setDescription]  = useState('');

  const [myRequests, setMyRequests]     = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [success, setSuccess]           = useState(null);

  // Bid accept/reject state
  const [accepting, setAccepting]       = useState(null); // agencyId being accepted
  const [rejecting, setRejecting]       = useState(null); // agencyId being rejected
  const [bidError, setBidError]         = useState(null);

  // Traveler details modal (shown before payment after accepting a bid)
  const [pendingAccept, setPendingAccept] = useState(null); // { requestId, agencyId, amount, numPeople }
  const [travelerLoading, setTravelerLoading] = useState(false);


  const loadMyRequests = async () => {
    try {
      const res = await api.customRequests.getMyRequests();
      if (res?.success) setMyRequests(res.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadMyRequests();
    // Poll every 15 seconds so new bids appear without a manual refresh
    const interval = setInterval(loadMyRequests, 15000);
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.customRequests.create({
        destination,
        budget: budget ? Number(budget) : undefined,
        num_people: Number(numPeople),
        departure_date: departureDate,
        description,
      });
      if (res?.success) {
        setSuccess(res.message || 'Request submitted! Agencies will respond shortly.');
        setDestination(''); setBudget(''); setNumPeople(1); setDepartureDate(''); setDescription('');
        await loadMyRequests();
      } else {
        setError(res?.message || 'Failed to submit request');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: user clicks "Accept & Pay" → open traveler details modal
  const handleAcceptBid = (requestId, agencyId) => {
    const request = myRequests.find(r => r.package_id === requestId);
    if (!request) return;
    let meta = {};
    try { meta = JSON.parse(request.description); } catch { /* */ }
    const bid = (meta.bids || []).find(b => b.agencyId == agencyId);
    if (!bid) return;

    setPendingAccept({
      requestId,
      agencyId,
      amount: bid.amount,
      numPeople: meta.numPeople || 1,
      destination: request.destination,
      title: request.title,
    });
  };

  // Step 2: traveler fills in details → accept bid on backend → init payment
  const handleTravelerDetailsSubmit = async (travelers) => {
    if (!pendingAccept) return;
    setTravelerLoading(true);
    setBidError(null);
    setAccepting(pendingAccept.agencyId);

    try {
      // Accept the bid — this creates Booking + Payment records with traveler details
      const res = await api.customRequests.acceptBid(pendingAccept.requestId, {
        agencyId: pendingAccept.agencyId,
        travelers,
      });
      if (!res?.success) {
        setBidError(res?.message || 'Failed to accept bid');
        return;
      }

      const bookingId = res.data?.bookingId;
      if (!bookingId) {
        setBidError('No booking ID returned from server');
        return;
      }

      // Init SSLCommerz payment
      const payRes = await api.payment.init(bookingId);
      if (!payRes?.success || !payRes?.url) {
        setBidError(payRes?.message || 'Failed to initiate payment');
        return;
      }

      setPendingAccept(null);
      await loadMyRequests();

      // Navigate to payment gateway in the same tab
      window.location.assign(payRes.url);
    } catch (err) {
      setBidError(err?.response?.data?.message || err?.message || 'Failed to process payment');
    } finally {
      setTravelerLoading(false);
      setAccepting(null);
    }
  };

  const handleRejectBid = async (requestId, agencyId) => {
    setRejecting(agencyId);
    setBidError(null);
    try {
      const res = await api.customRequests.rejectBid(requestId, { agencyId });
      if (res?.success) {
        await loadMyRequests();
      } else {
        setBidError(res?.message || 'Failed to reject bid');
      }
    } catch (err) {
      setBidError(err?.response?.data?.message || 'Failed to reject bid');
    } finally {
      setRejecting(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Page Header ── */}
      <div className="rounded-[2rem] border border-slate-200/80 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50 to-slate-100/80 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-6 md:p-8 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-primary dark:text-black text-xs font-black uppercase tracking-widest">
            <Send size={14} />
            Custom Trips
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black dark:text-black">
            Custom Travel Request
          </h1>
          <p className="text-black dark:text-black">
            Describe your dream trip and let agencies compete to offer you the best deal.
          </p>
        </div>
      </div>

      {/* ── Submit Form ── */}
      <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-700 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Send size={20} />
          </div>
          <h2 className="text-xl font-black text-on-surface dark:text-white uppercase tracking-tight">
            New Request
          </h2>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-error-container text-on-error-container border border-error/10">
            <AlertCircle size={18} />
            <p className="font-bold text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <CheckCircle2 size={18} />
            <p className="font-bold text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white pl-1">Destination</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  required
                  className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Cox's Bazar"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white pl-1">Budget (BDT)</label>
              <div className="relative">
                <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="number"
                  min="0"
                  className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white pl-1">Number of People</label>
              <div className="relative">
                <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  required
                  type="number"
                  min="1"
                  className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all"
                  value={numPeople}
                  onChange={(e) => setNumPeople(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white pl-1">Departure Date</label>
              <div className="relative">
                <CalendarDays size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  required
                  type="date"
                  className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white pl-1">Trip Preferences</label>
            <div className="relative">
              <FileText size={15} className="absolute left-3.5 top-3.5 text-primary" />
              <textarea
                className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white min-h-24 resize-none transition-all"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Hotels, activities, dietary needs, special requests..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-primary text-on-primary px-8 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send size={16} />}
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </section>

      {/* ── My Requests ── */}
      <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-700 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Inbox size={20} />
          </div>
          <h2 className="text-xl font-black text-on-surface dark:text-white uppercase tracking-tight">
            My Requests
          </h2>
          {myRequests.length > 0 && (
            <span className="ml-auto px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black">
              {myRequests.length}
            </span>
          )}
        </div>

        {bidError && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-error-container text-on-error-container border border-error/10">
            <AlertCircle size={18} />
            <p className="font-bold text-sm">{bidError}</p>
          </div>
        )}

        {myRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Inbox size={28} className="text-primary/40" />
            </div>
            <div>
              <p className="font-black text-on-surface dark:text-white">No requests yet</p>
              <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-1">
                Submit your first custom trip request above.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {myRequests.map((r) => (
              <RequestCard
                key={r.package_id}
                r={r}
                onAccept={handleAcceptBid}
                onReject={handleRejectBid}
                accepting={accepting}
                rejecting={rejecting}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Traveler Details Modal (shown after clicking Accept & Pay) ── */}
      {pendingAccept && (
        <TravelerDetailsModal
          item={{
            price: pendingAccept.amount,
            destination: pendingAccept.destination,
            title: pendingAccept.title,
          }}
          itemType="PACKAGE"
          numTravelers={pendingAccept.numPeople}
          onConfirm={handleTravelerDetailsSubmit}
          onCancel={() => setPendingAccept(null)}
          loading={travelerLoading}
        />
      )}
    </div>
  );
};

export default CustomRequestPage;
