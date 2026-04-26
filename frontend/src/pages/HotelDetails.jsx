import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import useBookAndPay from '../hooks/useBookAndPay';
import TravelerDetailsModal from '../components/TravelerDetailsModal';
import { Star, Send, User, MapPin, BedDouble, Wallet, ArrowLeft, Building2 } from 'lucide-react';

export default function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTravelerModal, setShowTravelerModal] = useState(false);
  const [travelerLoading, setTravelerLoading] = useState(false);

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
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.hotels.getById(id);
        if (res?.success) setHotel(res.data);
        else setError(res?.message || 'Failed to load hotel');
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load hotel');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Fetch reviews and check if user can review
  useEffect(() => {
    const fetchReviewsData = async () => {
      try {
        setReviewsLoading(true);

        // Fetch reviews (public)
        const reviewsRes = await api.hotels.getReviews(id);
        if (reviewsRes?.success) {
          setReviews(reviewsRes.data || []);
        }

        // Check if user can review (protected)
        try {
          const canReviewRes = await api.hotels.canReview(id);
          console.log('🔍 Hotel Can Review Response:', canReviewRes);
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
        console.error('Error fetching hotel reviews:', err);
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
      const res = await api.hotels.addReview(id, reviewForm);
      if (res?.success) {
        setReviewSuccess('Review submitted successfully!');
        setHasReviewed(true);
        // Refresh reviews
        const reviewsRes = await api.hotels.getReviews(id);
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

  const details = useMemo(() => {
    if (!hotel) return null;
    try {
      return typeof hotel.description === 'string' ? JSON.parse(hotel.description) : hotel.description;
    } catch {
      return null;
    }
  }, [hotel]);

  const onBook = () => {
    if (!hotel) return;
    setShowTravelerModal(true);
  };

  const handleTravelerDetailsSubmit = async (travelers) => {
    setTravelerLoading(true);
    try {
      const totalPrice = Number(hotel.price) * travelers.length;
      await bookAndPay({
        booking_type: 'HOTEL',
        package_id: hotel.package_id,
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

  if (loading) return <div className="text-sm text-on-surface-variant">Loading...</div>;
  if (error) return <div className="text-sm bg-error-container text-on-error-container p-3 rounded-2xl">{error}</div>;
  if (!hotel) return <div className="text-sm text-on-surface-variant">Not found.</div>;

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] p-6 md:p-8 border border-slate-200/90 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50 to-slate-100/70 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
              <Building2 size={14} />
              Hotel Offer Details
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">{hotel.title}</h1>
            <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <MapPin size={15} className="text-primary" />
              {hotel.destination}
            </div>
          </div>

          <div className="rounded-3xl bg-white/90 dark:bg-slate-100 border border-slate-200 dark:border-slate-300 px-5 py-4 shadow-sm min-w-[180px]">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wide font-bold text-slate-600">
              <Wallet size={14} />
              Price / Night
            </div>
            <div className="text-3xl font-black text-slate-800 tracking-tight mt-1">৳{hotel.price}</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-outline-variant/10 rounded-3xl p-6 md:p-7 space-y-5 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-1.5 text-sm font-black uppercase tracking-wider shadow-md shadow-fuchsia-500/20">
          <Building2 size={14} />
          Hotel Information
        </div>
        {details ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl bg-surface-container p-4"><span className="text-on-surface-variant">City:</span> <span className="font-semibold text-on-surface">{details.city || hotel.destination}</span></div>
            <div className="rounded-2xl bg-surface-container p-4"><span className="text-on-surface-variant">Area:</span> <span className="font-semibold text-on-surface">{details.area || '—'}</span></div>
            <div className="rounded-2xl bg-surface-container p-4"><span className="text-on-surface-variant">Room Type:</span> <span className="font-semibold text-on-surface">{details.roomType || '—'}</span></div>
            <div className="rounded-2xl bg-surface-container p-4 inline-flex items-center gap-2"><BedDouble size={15} className="text-primary" /><span className="text-on-surface-variant">Bed Type:</span> <span className="font-semibold text-on-surface">{details.bedType || '—'}</span></div>
            <div className="md:col-span-2 rounded-2xl bg-surface-container p-4"><span className="text-on-surface-variant">Address:</span> <span className="font-semibold text-on-surface">{details.fullAddress || '—'}</span></div>
            <div className="md:col-span-2 rounded-2xl bg-surface-container p-4"><span className="text-on-surface-variant">Description:</span> <span className="font-semibold text-on-surface">{details.fullDescription || '—'}</span></div>
          </div>
        ) : (
          <div className="rounded-2xl bg-surface-container p-4 text-sm text-on-surface-variant whitespace-pre-line">{hotel.description}</div>
        )}
      </div>

      {/* Reviews Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-outline-variant/10 p-6 md:p-7 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 text-sm font-black uppercase tracking-wider shadow-md shadow-amber-500/20">
            <Star size={14} className="fill-white" />
            Guest Reviews
          </div>
          {reviews.length > 0 && (
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
              {reviews.length}
            </span>
          )}
        </div>

        {/* Review Form - Only for guests who have booked */}
        {canReview && !hasReviewed && (
          <form onSubmit={handleSubmitReview} className="mb-6 p-5 bg-surface-container rounded-2xl space-y-3 border border-outline-variant/10">
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
                      size={20}
                      className={star <= reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-on-surface-variant/30'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <textarea
              placeholder="Share your experience with this hotel..."
              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 rounded-2xl px-4 py-3 border border-outline-variant/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium resize-none cursor-text"
              rows={3}
              value={reviewForm.comment}
              onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
              disabled={false}
            />

            {reviewError && <p className="text-xs text-error font-bold">{reviewError}</p>}
            {reviewSuccess && <p className="text-xs text-green-600 font-bold">{reviewSuccess}</p>}

            <button
              type="submit"
              disabled={submittingReview}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-on-primary px-5 py-2.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
            >
              <Send size={14} />
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {/* Not eligible message */}
        {!canReview && (
          <div className="mb-6 p-3 bg-surface-container border border-outline-variant/10 rounded-2xl">
            <p className="text-sm text-on-surface-variant font-semibold">
              Only travelers who booked and completed payment can submit a review.
            </p>
          </div>
        )}

        {/* Already Reviewed Message */}
        {canReview && hasReviewed && (
          <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
            <p className="text-sm text-green-700 dark:text-green-400 font-bold">✓ You have reviewed this hotel</p>
          </div>
        )}

        {/* Reviews List */}
        {reviewsLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-on-surface-variant font-medium text-sm">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.review_id} className="p-4 bg-surface-container rounded-2xl border border-outline-variant/10">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm">{review.traveler_name}</p>
                      <p className="text-[10px] text-on-surface-variant">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-on-surface-variant/20'}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-on-surface-variant leading-relaxed text-sm">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {bookError && <div className="text-sm bg-error-container text-on-error-container p-3 rounded-2xl">{bookError}</div>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-2xl border border-outline-variant/20 px-4 py-2.5 inline-flex items-center gap-2 font-semibold hover:bg-surface-container transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          type="button"
          disabled={booking}
          className="rounded-2xl bg-primary text-on-primary font-bold px-5 py-2.5 disabled:opacity-50 hover:bg-primary-dim transition-colors"
          onClick={onBook}
        >
          {booking ? 'Processing...' : 'Book & Pay'}
        </button>
      </div>

      {/* Traveler Details Modal */}
      {showTravelerModal && hotel && (
        <TravelerDetailsModal
          item={hotel}
          itemType="HOTEL"
          numTravelers={1}
          onConfirm={handleTravelerDetailsSubmit}
          onCancel={handleCloseTravelerModal}
          loading={travelerLoading}
        />
      )}
    </div>
  );
}
