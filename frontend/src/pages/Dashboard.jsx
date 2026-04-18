import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

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
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
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
              {flightLoading ? 'Searching...' : flightDataSource ? `Source: ${flightDataSource}` : null}
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
                <div key={offer.id} className="bg-white dark:bg-slate-900 border border-outline-variant/10 rounded-3xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-black text-on-surface">{from} → {to}</div>
                    <div className="font-black text-primary">{price} {currency}</div>
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    {dep ? new Date(dep).toLocaleString() : '—'} → {arr ? new Date(arr).toLocaleString() : '—'}
                  </div>
                  <button
                    onClick={() => handleBookFlight(offer)}
                    disabled={bookPayLoading}
                    className="mt-2 bg-primary text-on-primary px-4 py-2 rounded-2xl font-bold text-sm disabled:opacity-50"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(hotelResults || []).slice(0, 6).map((h) => (
              <button
                key={h.package_id}
                type="button"
                onClick={() => navigate(`/hotels/${h.package_id}`)}
                className="text-left bg-white dark:bg-slate-900 border border-outline-variant/10 rounded-3xl p-5 hover:shadow-lg transition-shadow"
              >
                <div className="font-black text-on-surface">{h.title}</div>
                <div className="text-xs text-on-surface-variant">{h.destination}</div>
                <div className="text-sm text-primary font-black mt-2">৳{h.price}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Curated Packages */}
      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold tracking-tight">Curated Packages</h2>
            <p className="text-on-surface-variant">All-inclusive experiences designed by local experts</p>
          </div>
          <button className="text-primary font-bold text-sm flex items-center gap-1 hover:underline" type="button">
            View All <Sparkles size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading
            ? [...Array(3)].map((_, i) => (
                <div key={i} className="h-[400px] bg-surface-container animate-pulse rounded-[2rem]" />
              ))
            : packages.slice(0, 6).map((pkg) => (
                <PackageCard key={pkg.package_id} pkg={pkg} onBook={handleBookPackage} />
              ))}
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
