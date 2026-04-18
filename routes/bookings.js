const express = require('express');
const router = express.Router();
const { Booking, Payment, Package, sequelize } = require('../models/index');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings for the logged-in traveler
 * @access  Traveler
 */
router.get('/', authenticate, authorize('traveler'), async (req, res) => {
    const traveler_id = req.user.id;

    try {
        const bookings = await Booking.findAll({
            where: { traveler_id },
            include: [
                { model: Payment, as: 'payment' },
                { model: Package, as: 'package' }
            ],
            order: [['created_at', 'DESC']]
        });

        // Flatten for frontend compatibility
        const data = bookings.map(b => {
            const plain = b.toJSON();
            // Flatten payment fields
            if (plain.payment) {
                plain.transaction_id = plain.payment.transaction_id;
                plain.payment_method = plain.payment.payment_method;
                plain.payment_status = plain.payment.payment_status;
                plain.paid_at = plain.payment.paid_at;
                delete plain.payment; // Remove the nested payment object
            }
            // Add package title if available
            if (plain.package) {
                plain.package_title = plain.package.title;
                delete plain.package; // Remove the nested package object
            }
            return plain;
        });

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking (Unified for Flight and Package)
 * @access  Traveler
 */
router.post('/', authenticate, authorize('traveler'), async (req, res) => {
    const { booking_type, package_id, flight_details, num_people, total_price, passengers } = req.body;
    const traveler_id = req.user.id;

    if (!booking_type || !num_people || !total_price) {
        return res.status(400).json({ success: false, message: 'Missing booking details' });
    }

    let airlineName = null, flightNumber = null, departureAirport = null;
    let arrivalAirport = null, departureTime = null, arrivalTime = null;

    if (booking_type === 'FLIGHT' && flight_details) {
        const itinerary    = flight_details.itineraries[0];
        const firstSegment = itinerary.segments[0];
        const lastSegment  = itinerary.segments[itinerary.segments.length - 1];

        airlineName      = firstSegment.carrierCode;
        flightNumber     = firstSegment.number;
        departureAirport = firstSegment.departure.iataCode;
        arrivalAirport   = lastSegment.arrival.iataCode;
        departureTime    = firstSegment.departure.at.replace('T', ' ');
        arrivalTime      = lastSegment.arrival.at.replace('T', ' ');
    }

    const t = await sequelize.transaction();
    try {
        const booking = await Booking.create({
            traveler_id,
            booking_type,
            package_id:       package_id || null,
            airline_name:     airlineName,
            flight_number:    flightNumber,
            departure_airport: departureAirport,
            arrival_airport:  arrivalAirport,
            departure_time:   departureTime,
            arrival_time:     arrivalTime,
            num_people,
            total_price,
            passenger_details: passengers || [],
            booking_status:   'PENDING'
        }, { transaction: t });

        const bookingId = booking.booking_id;
        const trans_id  = `${booking_type}_${bookingId}_${Date.now()}`;

        await Payment.create({
            booking_id:     bookingId,
            traveler_id,
            amount:         total_price,
            payment_method: 'BKASH',
            transaction_id: trans_id,
            payment_status: 'PENDING'
        }, { transaction: t });

        await t.commit();

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: { bookingId, totalPrice: total_price }
        });
    } catch (error) {
        await t.rollback();
        console.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking',
            error: error.message
        });
    }
});

module.exports = router;
