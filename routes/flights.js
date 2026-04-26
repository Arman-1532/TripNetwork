const express = require('express');
const router = express.Router();
const Amadeus = require('amadeus');
const axios = require('axios');

let amadeus;
const usdToBdtRate = Number(process.env.USD_TO_BDT_RATE || 117);
const serpApiKey = process.env.SERPAPI_KEY;

// Initialize Amadeus SDK
if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
    amadeus = new Amadeus({
        clientId: process.env.AMADEUS_CLIENT_ID,
        clientSecret: process.env.AMADEUS_CLIENT_SECRET,
        hostname: process.env.AMADEUS_HOSTNAME || 'test' // 'test' or 'production'
    });

    console.log('Amadeus SDK initialized');
} else {
    console.warn('⚠️ Amadeus credentials missing. Search will fallback to mock data.');
}

if (!serpApiKey) {
    console.warn('⚠️ SerpApi key missing. Flight search will fallback to Amadeus/mock data.');
}

const minutesToIsoDuration = (minutes) => {
    const mins = Math.max(0, Number(minutes) || 0);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `PT${m}M`;
    if (m === 0) return `PT${h}H`;
    return `PT${h}H${m}M`;
};

const safePriceToBdt = (usdPrice) => {
    const usd = Number(usdPrice);
    if (!Number.isFinite(usd)) return '0.00';
    return (usd * usdToBdtRate).toFixed(2);
};

const mapSerpResultToAmadeusOffer = (offer, origin, destination, date, index) => {
    const flights = Array.isArray(offer?.flights) ? offer.flights : [];
    const segments = flights.map((flight, segIndex) => ({
        id: `${index}-${segIndex}`,
        departure: {
            iataCode: flight?.departure_airport?.id || origin,
            at: flight?.departure_airport?.time || `${date}T00:00:00`
        },
        arrival: {
            iataCode: flight?.arrival_airport?.id || destination,
            at: flight?.arrival_airport?.time || `${date}T00:00:00`
        },
        carrierCode: (flight?.airline || 'NA').slice(0, 2).toUpperCase(),
        number: String(flight?.flight_number || ''),
        duration: minutesToIsoDuration(flight?.duration),
        aircraft: { code: flight?.airplane || '' }
    }));

    const offerDuration = offer?.total_duration || flights.reduce((acc, f) => acc + (Number(f?.duration) || 0), 0);

    return {
        id: String(offer?.departure_token || `serp-${index}`),
        source: 'SERPAPI',
        meta: {
            departureToken: offer?.departure_token || null,
            bookingToken: offer?.booking_token || null,
            airlineLogo: flights?.[0]?.airline_logo || null,
            flights: flights.map((f) => ({
                airline: f?.airline || null,
                airlineLogo: f?.airline_logo || null,
                flightNumber: f?.flight_number || null,
                travelClass: f?.travel_class || null,
                legroom: f?.legroom || null,
                airplane: f?.airplane || null,
                durationMinutes: Number(f?.duration) || null,
                extensions: Array.isArray(f?.extensions) ? f.extensions : [],
                overnight: Boolean(f?.overnight)
            })),
            layovers: Array.isArray(offer?.layovers) ? offer.layovers : [],
            carbonEmissions: offer?.carbon_emissions || null,
            totalDurationMinutes: Number(offer?.total_duration) || null
        },
        price: {
            total: safePriceToBdt(offer?.price),
            currency: 'BDT',
            // Keep source amount for debugging/accounting if needed.
            originalUsdTotal: Number.isFinite(Number(offer?.price)) ? Number(offer.price).toFixed(2) : null
        },
        itineraries: [
            {
                duration: minutesToIsoDuration(offerDuration),
                segments
            }
        ]
    };
};

/**
 * @route   GET /api/flights/search
 * @desc    Search for flight offers
 * @access  Public
 */
router.get('/search', async (req, res) => {
    const { origin, destination, date, adults } = req.query;
    const numAdults = adults || 1;

    if (!origin || !destination || !date) {
        return res.status(400).json({ error: 'Missing required parameters: origin, destination, and date are required.' });
    }

    try {
        if (serpApiKey) {
            const serpResponse = await axios.get('https://serpapi.com/search.json', {
                params: {
                    engine: 'google_flights',
                    departure_id: origin.toUpperCase(),
                    arrival_id: destination.toUpperCase(),
                    outbound_date: date,
                    adults: parseInt(numAdults),
                    currency: 'USD',
                    type: 2,
                    api_key: serpApiKey
                }
            });

            const bestFlights = Array.isArray(serpResponse?.data?.best_flights) ? serpResponse.data.best_flights : [];
            const otherFlights = Array.isArray(serpResponse?.data?.other_flights) ? serpResponse.data.other_flights : [];
            const allFlights = [...bestFlights, ...otherFlights];

            const mappedFlights = allFlights.map((offer, index) =>
                mapSerpResultToAmadeusOffer(offer, origin, destination, date, index)
            );

            res.set('X-Data-Source', 'serpapi');
            return res.json(mappedFlights);
        }

        if (!amadeus) {
            throw new Error('SerpApi key and Amadeus credentials missing');
        }

        const response = await amadeus.shopping.flightOffersSearch.get({
            originLocationCode: origin.toUpperCase(),
            destinationLocationCode: destination.toUpperCase(),
            departureDate: date,
            adults: parseInt(numAdults),
            max: 10
        });

        let flightData = [];

        if (response && response.data) {
            flightData = Array.isArray(response.data) ? response.data : [];
        } else if (response && response.result && response.result.data) {
            flightData = Array.isArray(response.result.data) ? response.result.data : [];
        } else if (response && Array.isArray(response)) {
            flightData = response;
        } else if (response && response.body && response.body.data) {
            flightData = Array.isArray(response.body.data) ? response.body.data : [];
        }

        if (flightData.length > 0) {
            const bdtFlights = flightData.map((offer) => {
                const usdTotal = Number(offer?.price?.total);
                if (!Number.isFinite(usdTotal)) return offer;
                return {
                    ...offer,
                    price: {
                        ...offer.price,
                        total: safePriceToBdt(usdTotal),
                        currency: 'BDT',
                        originalUsdTotal: usdTotal.toFixed(2)
                    }
                };
            });

            res.set('X-Data-Source', 'amadeus-api');
            return res.json(bdtFlights);
        }

        return res.json([]);
    } catch (error) {
        console.error('❌ Flight API Error Details:', {
            message: error.message,
            description: error.description,
            code: error.code,
            response: error.response?.data
        });

        console.warn('⚠️ Flight API error, returning MOCK DATA (not real API results).');

        const mockData = [
            {
                id: '1',
                price: { total: safePriceToBdt(250), currency: 'BDT', originalUsdTotal: '250.00' },
                itineraries: [{
                    duration: 'PT2H30M',
                    segments: [{
                        departure: { iataCode: origin || 'DAC', at: `${date}T10:00:00` },
                        arrival: { iataCode: destination || 'CXB', at: `${date}T12:30:00` },
                        carrierCode: 'BS',
                        number: '123'
                    }]
                }]
            },
            {
                id: '2',
                price: { total: safePriceToBdt(180.5), currency: 'BDT', originalUsdTotal: '180.50' },
                itineraries: [{
                    duration: 'PT3H00M',
                    segments: [{
                        departure: { iataCode: origin || 'DAC', at: `${date}T14:00:00` },
                        arrival: { iataCode: destination || 'CXB', at: `${date}T17:00:00` },
                        carrierCode: 'BG',
                        number: '456'
                    }]
                }]
            }
        ];

        res.set('X-Data-Source', 'mock-data');
        return res.json(mockData);
    }
});

module.exports = router;
