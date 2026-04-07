const express = require('express');
const router = express.Router();
const Amadeus = require('amadeus');

let amadeus;

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
        if (!amadeus) {
            throw new Error('Amadeus credentials missing');
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
            res.set('X-Data-Source', 'amadeus-api');
            return res.json(flightData);
        }

        return res.json([]);
    } catch (error) {
        console.error('❌ Amadeus API Error Details:', {
            message: error.message,
            description: error.description,
            code: error.code,
            response: error.response?.data
        });

        console.warn('⚠️ Amadeus API error, returning MOCK DATA (not real API results).');

        const mockData = [
            {
                id: '1',
                price: { total: '250.00', currency: 'USD' },
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
                price: { total: '180.50', currency: 'USD' },
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
