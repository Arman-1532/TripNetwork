import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Plane, Bus, Train, Ship, Phone, Mail, User, ArrowLeft, ShieldCheck, Timer, Star, Send } from 'lucide-react';
import { api } from '../services/api';
import useBookAndPay from '../hooks/useBookAndPay';
import TravelerDetailsModal from '../components/TravelerDetailsModal';

const PackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTravelerModal, setShowTravelerModal] = useState(false);
  const [travelerLoading, setTravelerLoading] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);

  const { bookAndPay, loading: booking, error: bookError } = useBookAndPay();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await api.packages.getById(id);
        if (res?.success) {
          setPkg(res.data);
        } else {
          setError(res?.message || 'Package not found');
        }
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load package details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  // Fetch reviews and check if user can review
  useEffect(() => {
    const fetchReviewsData = async () => {
      try {
        setReviewsLoading(true);
        
        // Fetch reviews (public)
        const reviewsRes = await api.packages.getReviews(id);
        if (reviewsRes?.success) {
          setReviews(reviewsRes.data || []);
        }
        
        // Check if user can review (protected)
        try {
          const canReviewRes = await api.packages.canReview(id);
          console.log('🔍 Can Review Response:', canReviewRes);
          if (canReviewRes?.success) {
            console.log('✅ canReview:', canReviewRes.data.canReview);
            console.log('✅ hasReviewed:', canReviewRes.data.hasReviewed);
            setCanReview(canReviewRes.data.canReview);
            setHasReviewed(canReviewRes.data.hasReviewed);
          }
        } catch (e) {
          console.warn('⚠️ Not logged in or cannot review:', e.message);
          // User not logged in - canReview will be false
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviewsData();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError(null);
    setReviewSuccess(null);
    setSubmittingReview(true);
    
    try {
      const res = await api.packages.addReview(id, reviewForm);
      if (res?.success) {
        setReviewSuccess('Review submitted successfully!');
        setHasReviewed(true);
        // Refresh reviews
        const reviewsRes = await api.packages.getReviews(id);
        if (reviewsRes?.success) {
          setReviews(reviewsRes.data || []);
        }
        setReviewForm({ rating: 5, comment: '' });
      } else {
        setReviewError(res?.message || 'Failed to submit review');
      }
    } catch (err) {
      setReviewError(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const endsAtMs = useMemo(() => {
    if (!pkg?.offer_ends_at) return null;
    const parsed = new Date(pkg.offer_ends_at.toString().replace(' ', 'T')).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }, [pkg?.offer_ends_at]);

  useEffect(() => {
    if (!endsAtMs) return undefined;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [endsAtMs]);

  const countdown = useMemo(() => {
    if (!endsAtMs) return null;
    const remainingMs = endsAtMs - nowMs;
    if (remainingMs <= 0) return { label: 'Expired', expired: true };

    const totalSeconds = Math.floor(remainingMs / 1000);
    const days    = Math.floor(totalSeconds / 86400);
    const hours   = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');

    return {
      days: pad(days),
      hours: pad(hours),
      minutes: pad(minutes),
      seconds: pad(seconds),
      expired: false,
      urgent: totalSeconds < 3600
    };
  }, [endsAtMs, nowMs]);

  const handleBook = () => {
    if (!pkg) return;
    setShowTravelerModal(true);
  };

  const handleTravelerDetailsSubmit = async (travelers) => {
    setTravelerLoading(true);
    try {
      const totalPrice = Number(pkg.price) * travelers.length;
      await bookAndPay({
        booking_type: 'PACKAGE',
        package_id: pkg.package_id,
        travelers: travelers,
        num_people: travelers.length,
        total_price: totalPrice,
      });
      setShowTravelerModal(false);
    } catch (err) {
      console.error('Booking failed:', err);
    } finally {
      setTravelerLoading(false);
    }
  };

  const handleCloseTravelerModal = () => {
    setShowTravelerModal(false);
  };

  const getTransportIcon = (medium) => {
    switch (medium) {
      case 'AIR': return <Plane size={18} />;
      case 'BUS': return <Bus size={18} />;
      case 'TRAIN': return <Train size={18} />;
      case 'SHIP': return <Ship size={18} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-error-container text-on-error-container rounded-[2rem] text-center">
        <h2 className="text-2xl font-black mb-4">Oops!</h2>
        <p className="mb-6">{error || 'Package not found.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-on-error-container text-error-container px-6 py-2 rounded-2xl font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header / Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold group"
      >
        <div className="p-2 rounded-full bg-surface-container border border-outline-variant/15 group-hover:bg-primary group-hover:text-on-primary transition-all">
          <ArrowLeft size={20} />
        </div>
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Section */}
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden border border-slate-200/90 dark:border-slate-700 shadow-lg shadow-slate-900/5">
            {pkg.image_url ? (
              <div className="h-96 w-full relative">
                <img
                  src={pkg.image_url}
                  alt={pkg.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-900/10 to-transparent" />
                <div className="absolute top-6 left-6">
                  <span className="px-4 py-2 bg-black/55 backdrop-blur-md text-white rounded-full text-xs font-black uppercase tracking-widest border border-white/30">
                    {pkg.package_type}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-br from-primary/10 via-slate-100 to-slate-200 dark:from-primary/10 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
                <span className="text-primary/40 font-black text-4xl">TripNetwork</span>
              </div>
            )}

            <div className="p-8 md:p-12 space-y-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700/30 rounded-full text-xs font-bold text-sky-700 dark:text-sky-300">
                    <MapPin size={14} />
                    {pkg.origin && <span>{pkg.origin} → </span>}
                    {pkg.destination}
                  </div>
                  {pkg.travel_medium && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/30 rounded-full text-xs font-bold capitalize">
                      {getTransportIcon(pkg.travel_medium)}
                      {pkg.travel_medium.toLowerCase()}
                    </div>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-slate-100 drop-shadow-[0_1px_0_rgba(255,255,255,0.3)] dark:drop-shadow-none">
                  {pkg.title}
                </h1>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-4">About this Experience</h3>
                <div className="text-slate-700 dark:text-slate-200 leading-relaxed text-lg whitespace-pre-line">
                  {pkg.description || 'Welcome to an exclusive journey curated just for you. This package offers a unique blend of comfort, exploration, and cultural immersion, handled by our expert local partners.'}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden border border-slate-200/90 dark:border-slate-700 shadow-lg shadow-slate-900/5 p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 text-sm font-black uppercase tracking-wider shadow-md shadow-amber-500/25">
                <Star size={14} className="fill-white" />
                Reviews
              </div>
              {reviews.length > 0 && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                  {reviews.length}
                </span>
              )}
            </div>

            {/* Review Form - Only for buyers who haven't reviewed */}
            {canReview && !hasReviewed && (
              <form onSubmit={handleSubmitReview} className="mb-10 p-6 bg-surface-container rounded-[2rem] border border-outline-variant/10 space-y-4">
                <h3 className="text-sm font-black text-on-surface uppercase tracking-wider">Write a Review</h3>
                
                {/* Star Rating */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-on-surface-variant">Your Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          size={24}
                          className={star <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-on-surface-variant/30'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <textarea
                  placeholder="Share your experience..."
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 rounded-2xl px-4 py-3 border border-outline-variant/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium resize-none cursor-text"
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  disabled={false}
                />

                {reviewError && <p className="text-xs text-error font-bold">{reviewError}</p>}
                {reviewSuccess && <p className="text-xs text-green-600 font-bold">{reviewSuccess}</p>}

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-6 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
                >
                  <Send size={16} />
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}

            {/* Not eligible message */}
            {!canReview && (
              <div className="mb-10 p-4 bg-surface-container border border-outline-variant/10 rounded-2xl">
                <p className="text-sm text-on-surface-variant font-semibold">
                  Only travelers who booked and completed payment can submit a review.
                </p>
              </div>
            )}

            {/* Already Reviewed Message */}
            {canReview && hasReviewed && (
              <div className="mb-10 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
                <p className="text-sm text-green-700 dark:text-green-400 font-bold">✓ You have reviewed this package</p>
              </div>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="inline-block text-sm font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/30 rounded-full px-4 py-2">
                  No reviews yet. Be the first to review!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.review_id} className="p-6 bg-surface-container rounded-[2rem] border border-outline-variant/10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{review.traveler_name}</p>
                          <p className="text-[10px] text-on-surface-variant">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-on-surface-variant/20'}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-on-surface-variant leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / Booking Area */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-200/90 dark:border-slate-700 shadow-xl shadow-primary/10 space-y-8 sticky top-24">
            {countdown && !countdown.expired && (
              <div className={`p-6 rounded-[2rem] flex flex-col items-center gap-4 mb-8 transition-all duration-700
                ${countdown.urgent
                  ? 'bg-red-500/10 border border-red-500/20 shadow-lg shadow-red-500/5'
                  : 'bg-primary/5 border border-primary/10'
                }`}
              >
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                  <Timer size={14} className={countdown.urgent ? 'text-red-500 animate-pulse' : 'text-primary'} />
                  Limited Time Offer
                </div>
                
                <div className="flex items-center gap-2">
                  {Number(countdown.days) > 0 && (
                    <>
                      <div className="flex flex-col items-center gap-1">
                        <div className="bg-white dark:bg-slate-800 w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center text-xl font-black text-primary border border-slate-200 dark:border-slate-700">
                          {countdown.days}
                        </div>
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase">Days</span>
                      </div>
                      <span className="text-xl font-black text-on-surface-variant/30 pb-5">:</span>
                    </>
                  )}

                  <div className="flex flex-col items-center gap-1">
                    <div className="bg-white dark:bg-slate-800 w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center text-xl font-black text-primary border border-slate-200 dark:border-slate-700">
                      {countdown.hours}
                    </div>
                    <span className="text-[9px] font-bold text-on-surface-variant uppercase">Hrs</span>
                  </div>

                  <span className="text-xl font-black text-on-surface-variant/30 pb-5">:</span>

                  <div className="flex flex-col items-center gap-1">
                    <div className="bg-white dark:bg-slate-800 w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center text-xl font-black text-primary border border-slate-200 dark:border-slate-700">
                      {countdown.minutes}
                    </div>
                    <span className="text-[9px] font-bold text-on-surface-variant uppercase">Min</span>
                  </div>

                  <span className="text-xl font-black text-on-surface-variant/30 pb-5">:</span>

                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center text-xl font-black border border-slate-200 dark:border-slate-700 transition-colors
                      ${countdown.urgent ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-white dark:bg-slate-800 text-primary'}`}
                    >
                      {countdown.seconds}
                    </div>
                    <span className="text-[9px] font-bold text-on-surface-variant uppercase">Sec</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-black uppercase tracking-[0.2em]">Total Price</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-primary drop-shadow-[0_1px_0_rgba(0,0,0,0.08)]">৳{pkg.price}</span>
                <span className="text-slate-600 dark:text-slate-300 text-sm font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">/ person</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-surface-container rounded-3xl">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-on-surface uppercase tracking-wider">Certified Partner</p>
                  <p className="text-xs text-on-surface-variant font-medium">Verified by TripNetwork</p>
                </div>
              </div>

              <button
                onClick={handleBook}
                disabled={booking}
                className="w-full bg-primary hover:bg-primary-dim text-on-primary py-5 rounded-3xl font-black text-lg transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
              >
                {booking ? 'Initiating...' : 'Book & Pay Now'}
              </button>
              {bookError && <p className="text-center text-xs text-error font-bold">{bookError}</p>}
            </div>

            {/* Contact Info Section */}
            <div className="pt-8 border-t border-outline-variant/10 space-y-4">
              <h4 className="inline-flex text-xs font-black text-white uppercase tracking-[0.2em] mb-4 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 dark:text-slate-900 px-3 py-1.5 rounded-full">Partner Contact Details</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User size={18} className="text-primary" />
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Provided By</p>
                    <p className="font-black text-slate-900 dark:text-slate-100">{pkg.hotel_name || pkg.agency_name || 'TripNetwork Partner'}</p>
                  </div>
                </div>
                {pkg.contact_phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={18} className="text-primary" />
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Phone</p>
                      <p className="font-black text-slate-900 dark:text-slate-100">{pkg.contact_phone}</p>
                    </div>
                  </div>
                )}
                {pkg.contact_email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={18} className="text-primary" />
                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Email</p>
                      <p className="font-black text-slate-900 dark:text-slate-100">{pkg.contact_email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Traveler Details Modal */}
      {showTravelerModal && pkg && (
        <TravelerDetailsModal
          item={pkg}
          itemType="PACKAGE"
          numTravelers={1}
          onConfirm={handleTravelerDetailsSubmit}
          onCancel={handleCloseTravelerModal}
          loading={travelerLoading}
        />
      )}
    </div>
  );
};

export default PackageDetails;
