import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Clock3, Plane, Hotel, ArrowUpRight } from 'lucide-react';

import Hero from '../components/Hero';
import FlightSearch from '../components/FlightSearch';
import HotelSearch from '../components/HotelSearch';
import PackageCard from '../components/PackageCard';
import PassengerDetailsModal from '../components/PassengerDetailsModal';

import useBookAndPay from '../hooks/useBookAndPay';
import { api } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recoInsight, setRecoInsight] = useState(null);
  const [recoError, setRecoError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recoLoading, setRecoLoading] = useState(true);

  const [flightResults, setFlightResults] = useState([]);
  const [flightLoading, setFlightLoading] = useState(false);
  const [flightError, setFlightError] = useState(null);
  const [flightDataSource, setFlightDataSource] = useState(null);

  const [hotelResults, setHotelResults] = useState([]);
  const [hotelLoading, setHotelLoading] = useState(false);
  const [hotelError, setHotelError] = useState(null);

  const [selectedFlightOffer, setSelectedFlightOffer] = useState(null);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [passengerLoading, setPassengerLoading] = useState(false);

  const { bookAndPay, loading: bookPayLoading, error: bookPayError } = useBookAndPay();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pkgRes = await api.packages.getAll();
        if (pkgRes?.success) setPackages(pkgRes.data);

        // Fetch recommendations
        const recoRes = await api.recommendations.get();
        if (recoRes?.success) {
          setRecommendations(recoRes.data.recommendations || []);
          setRecoInsight(recoRes.data.insight);
          setRecoError(null);
        } else {
          setRecommendations([]);
          setRecoInsight(null);
          setRecoError(recoRes?.message || 'Could not load recommendations right now.');
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setRecommendations([]);
        setRecoInsight(null);
        setRecoError('Could not load recommendations right now.');
      } finally {
        setLoading(false);
        setRecoLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFlightSearch = async (params) => {
    setFlightError(null);
    setFlightDataSource(null);
    setFlightResults([]);

    try {
      setFlightLoading(true);
      const { origin, destination, date, adults } = params;

      // Bypass the response interceptor for flights so we can read headers (X-Data-Source)
      const raw = await api.__raw.flights.search({ origin, destination, date, adults });
      setFlightDataSource(raw?.headers?.['x-data-source'] || null);

      const list = raw?.data;
      setFlightResults(Array.isArray(list) ? list : []);
    } catch (e) {
      setFlightError(e?.response?.data?.message || e?.message || 'Flight search failed');
    } finally {
      setFlightLoading(false);
    }
  };

  const handleHotelSearch = async (params) => {
    setHotelError(null);
    setHotelResults([]);

    try {
      setHotelLoading(true);
      const res = await api.hotels.search(params);
      if (res?.success) setHotelResults(res.data || []);
      else setHotelError(res?.message || 'Hotel search failed');
    } catch (e) {
      setHotelError(e?.response?.data?.message || e?.message || 'Hotel search failed');
    } finally {
      setHotelLoading(false);
    }
  };

  const handleBookPackage = async (pkg) => {
    await bookAndPay({
      booking_type: 'PACKAGE',
      package_id: pkg.package_id,
      num_people: 1,
      total_price: Number(pkg.price) || 0,
    });
  };

  const handleBookFlight = (offer) => {
    setSelectedFlightOffer(offer);
    setShowPassengerModal(true);
  };

  const handlePassengerDetailsSubmit = async (passengers) => {
    setPassengerLoading(true);
    try {
      const unitPrice = Number(selectedFlightOffer?.price?.total || 0);
      const totalPrice = unitPrice * passengers.length;
      await bookAndPay({
        booking_type: 'FLIGHT',
        flight_details: selectedFlightOffer,
        passengers: passengers,
        num_people: passengers.length,
        total_price: totalPrice,
      });
      setShowPassengerModal(false);
    } catch (err) {
      console.error('Booking failed:', err);
    } finally {
      setPassengerLoading(false);
    }
  };

  const handleClosePassengerModal = () => {
    setShowPassengerModal(false);
    setSelectedFlightOffer(null);
  };

  const parseHotelQuickOverview = (description) => {
    try {
      const details = typeof description === 'string' ? JSON.parse(description) : description;
      return {
        bedType: details?.bedType || details?.bed_type || '—',
        area: details?.area || '—',
      };
    } catch {
      return { bedType: '—', area: '—' };
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <Hero />

      {/* Flight Search Section */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight">Search Flights</h2>
          <p className="text-on-surface-variant">Find the best routes across the globe</p>
        </div>

        <FlightSearch onSearch={handleFlightSearch} />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-on-surface">Flight Results</h3>
            <div className="text-xs text-on-surface-variant">
              {flightLoading ? 'Searching...' : null}
            </div>
          </div>

          {flightError && (
            <div className="text-sm bg-error-container text-on-error-container p-3 rounded-2xl">{flightError}</div>
          )}

          {!flightLoading && !flightError && flightResults.length === 0 && (
            <div className="text-sm text-on-surface-variant">No flights found for the given search.</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(flightResults || []).slice(0, 6).map((offer) => {
              const itinerary = offer?.itineraries?.[0];
              const seg0 = itinerary?.segments?.[0];
              const segLast = itinerary?.segments?.[itinerary?.segments?.length - 1];
              const from = seg0?.departure?.iataCode;
              const to = segLast?.arrival?.iataCode;
              const dep = seg0?.departure?.at;
              const arr = segLast?.arrival?.at;
              const price = offer?.price?.total;
              const currency = offer?.price?.currency;

              return (
                <div
                  key={offer.id}
                  className="rounded-3xl p-5 space-y-4 border border-slate-200/90 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50 to-slate-100/70 dark:from-slate-900 dark:via-slate-850 dark:to-slate-800 shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide mb-3">
                        <Plane size={13} />
                        Flight Offer
                      </div>
                      <div className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                        {from || '—'} <span className="text-slate-400">→</span> {to || '—'}
                      </div>
                    </div>
                    <div className="text-right bg-white/90 dark:bg-slate-100 border border-slate-200 dark:border-slate-300 rounded-2xl px-3 py-2 shadow-sm">
                      <div className="text-[11px] uppercase tracking-wide font-semibold text-slate-600 dark:text-slate-600">Total Price</div>
                      <div className="text-xl font-black text-slate-800 dark:text-slate-800 tracking-tight">
                        {price || '—'} {currency || ''}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-900 text-slate-100 dark:bg-slate-950/80 p-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-300 text-xs mb-1">
                      <Clock3 size={14} />
                      Departure and Arrival
                    </div>
                    <div className="font-semibold leading-relaxed">
                      {dep ? new Date(dep).toLocaleString() : '—'} <span className="text-slate-500">→</span> {arr ? new Date(arr).toLocaleString() : '—'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookFlight(offer)}
                    disabled={bookPayLoading}
                    className="w-full mt-1 bg-primary text-on-primary px-4 py-3 rounded-2xl font-bold text-sm disabled:opacity-50 hover:bg-primary-dim transition-colors"
                  >
                    {bookPayLoading ? 'Processing...' : 'Book & Pay'}
                  </button>
                </div>
              );
            })}
          </div>

          {bookPayError && (
            <div className="text-sm bg-error-container text-on-error-container p-3 rounded-2xl">{bookPayError}</div>
          )}
        </div>
      </section>

      {/* Hotel Search Section */}
      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight">Hotel Search</h2>
          <p className="text-on-surface-variant">Exceptional stays in the world's most beautiful cities</p>
        </div>

        <HotelSearch onSearch={handleHotelSearch} />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-on-surface">Hotel Results</h3>
            <div className="text-xs text-on-surface-variant">{hotelLoading ? 'Searching...' : null}</div>
          </div>

          {hotelError && (
            <div className="text-sm bg-error-container text-on-error-container p-3 rounded-2xl">{hotelError}</div>
          )}

          {!hotelLoading && !hotelError && hotelResults.length === 0 && (
            <div className="text-sm text-on-surface-variant">No hotels found for the given search.</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(hotelResults || []).slice(0, 6).map((h) => {
              const overview = parseHotelQuickOverview(h.description);
              return (
                <div
                  key={h.package_id}
                  className="rounded-3xl p-5 border border-slate-200/90 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50 to-slate-100/70 dark:from-slate-900 dark:via-slate-850 dark:to-slate-800 shadow-sm hover:shadow-lg transition-shadow space-y-4"
                >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide mb-3">
                      <Hotel size={13} />
                      Hotel Offer
                    </div>
                    <div className="font-black text-lg text-slate-900 dark:text-slate-100 truncate">{h.title}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">{h.destination || 'Destination unavailable'}</div>
                  </div>
                  <div className="text-right bg-white/90 dark:bg-slate-100 border border-slate-200 dark:border-slate-300 rounded-2xl px-3 py-2 shadow-sm">
                    <div className="text-[11px] uppercase tracking-wide font-semibold text-slate-600 dark:text-slate-600">TOTAL PRICE</div>
                    <div className="text-lg font-black text-slate-800 dark:text-slate-800 tracking-tight">৳{h.price}</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-900 text-slate-100 dark:bg-slate-950/80 p-3">
                  <div className="text-xs uppercase tracking-wide text-slate-300 mb-1">Quick Overview</div>
                  <div className="space-y-1 text-sm">
                    <div><span className="text-slate-300">Bed Type:</span> <span className="font-semibold">{overview.bedType}</span></div>
                    <div><span className="text-slate-300">Area:</span> <span className="font-semibold">{overview.area}</span></div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/hotels/${h.package_id}`)}
                  className="w-full bg-primary text-on-primary py-3 px-4 rounded-2xl font-bold text-sm hover:bg-primary-dim transition-colors inline-flex items-center justify-center gap-2"
                >
                  View Package
                  <ArrowUpRight size={16} />
                </button>
              </div>
            );
            })}
          </div>
        </div>
      </section>
      
      {/* Personalized Recommendations (Handpicked for You) */}
      <section className="space-y-8 animate-in slide-in-from-bottom-8 duration-1000">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
              <Sparkles size={14} /> Personalized Selection
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Handpicked for You</h2>
            <p className="text-on-surface-variant max-w-2xl">
              Our algorithm analyzed your preferences to find these exclusive matches.
            </p>
          </div>
          {recoInsight && (
            <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl max-w-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex flex-shrink-0 items-center justify-center font-bold text-xs">GS</div>
                <p className="text-xs italic text-on-surface-variant leading-relaxed">
                  <span className="font-bold text-primary not-italic block mb-1">Gojo's Insight:</span>
                  "{recoInsight}"
                </p>
              </div>
            </div>
          )}
        </div>

        {recoError && !recoLoading && (
          <div className="text-sm bg-error-container text-on-error-container p-3 rounded-2xl">
            {recoError}
          </div>
        )}

        {!recoLoading && !recoError && recommendations.length === 0 && (
          <div className="text-sm text-on-surface-variant bg-surface-container border border-outline-variant/10 p-4 rounded-2xl">
            No personalized recommendations yet. Book a package to improve your recommendations.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recoLoading
            ? [...Array(3)].map((_, i) => (
                <div key={i} className="h-[400px] bg-surface-container animate-pulse rounded-[2rem]" />
              ))
            : recommendations.map((pkg) => (
                <PackageCard key={pkg.package_id} pkg={pkg} onBook={handleBookPackage} />
              ))}
        </div>
      </section>

      {/* Curated Packages */}
      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold tracking-tight">Curated Packages</h2>
            <p className="text-on-surface-variant">All-inclusive experiences designed by local experts</p>
          </div>
          <button
            className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
            type="button"
            onClick={() => navigate('/packages')}
          >
            View All <Sparkles size={16} />
          </button>
        </div>

        <div className="rounded-[2rem] p-5 md:p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border border-slate-200/80 dark:border-slate-700/70">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="h-[400px] bg-surface-container animate-pulse rounded-[2rem]" />
              ))
            : packages.slice(0, 6).map((pkg) => (
                <PackageCard key={pkg.package_id} pkg={pkg} onBook={handleBookPackage} />
              ))}
          </div>
        </div>

        {bookPayError && (
          <div className="text-sm bg-error-container text-on-error-container p-3 rounded-2xl">{bookPayError}</div>
        )}
      </section>

      {/* Passenger Details Modal */}
      {showPassengerModal && selectedFlightOffer && (
        <PassengerDetailsModal
          offer={selectedFlightOffer}
          numPassengers={1}
          onConfirm={handlePassengerDetailsSubmit}
          onCancel={handleClosePassengerModal}
          loading={passengerLoading}
        />
      )}
    </div>
  );
};

export default Dashboard;
