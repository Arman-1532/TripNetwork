const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings for the logged-in traveler
 * @access  Traveler
 */
router.get('/', authenticate, authorize('traveler'), async (req, res) => {
    const traveler_id = req.user.id;

    try {
        const [rows] = await pool.execute(
            `SELECT b.*, p.payment_status, p.transaction_id, p.payment_method, p.paid_at 
             FROM booking b 
             LEFT JOIN payment p ON b.booking_id = p.booking_id 
             WHERE b.traveler_id = ? 
             ORDER BY b.created_at DESC`,
            [traveler_id]
        );

        res.json({
            success: true,
            data: rows
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
    const { booking_type, package_id, flight_details, num_people, total_price } = req.body;
    const traveler_id = req.user.id;

    if (!booking_type || !num_people || !total_price) {
        return res.status(400).json({ success: false, message: 'Missing booking details' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        let airlineName = null;
        let flightNumber = null;
        let departureAirport = null;
        let arrivalAirport = null;
        let departureTime = null;
        let arrivalTime = null;

        if (booking_type === 'FLIGHT' && flight_details) {
            const itinerary = flight_details.itineraries[0];
            const firstSegment = itinerary.segments[0];
            const lastSegment = itinerary.segments[itinerary.segments.length - 1];

            airlineName = firstSegment.carrierCode;
            flightNumber = firstSegment.number;
            departureAirport = firstSegment.departure.iataCode;
            arrivalAirport = lastSegment.arrival.iataCode;
            departureTime = firstSegment.departure.at.replace('T', ' ');
            arrivalTime = lastSegment.arrival.at.replace('T', ' ');
        }

        // 1. Insert into booking table
        const [bookingResult] = await connection.execute(
            `INSERT INTO booking 
             (traveler_id, booking_type, package_id, airline_name, flight_number, 
              departure_airport, arrival_airport, departure_time, arrival_time, 
              num_people, total_price, booking_status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [
                traveler_id, booking_type, package_id || null, airlineName, flightNumber,
                departureAirport, arrivalAirport, departureTime, arrivalTime,
                num_people, total_price
            ]
        );

        const bookingId = bookingResult.insertId;
        const trans_id = `${booking_type}_${bookingId}_${Date.now()}`;

        // 2. Create Payment Record (Pending)
        await connection.execute(
            `INSERT INTO payment (
                booking_id, traveler_id, amount, payment_method, transaction_id, payment_status
            ) VALUES (?, ?, ?, 'BKASH', ?, 'PENDING')`,
            [bookingId, traveler_id, total_price, trans_id]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: {
                bookingId,
                totalPrice: total_price
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
