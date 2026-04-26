const express = require('express');
const router = express.Router();
const { Booking, Payment, Package, Provider, Agency, Hotel, sequelize } = require('../models/index');
const { authenticate, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings for the logged-in traveler
 * @access  Traveler
 */
// Allow legacy USER role as traveler-equivalent for booking endpoints.
router.get('/', authenticate, authorize('TRAVELER'), async (req, res) => {
    const traveler_id = req.user.id;

    try {
        const bookings = await Booking.findAll({
            where: { traveler_id },
            include: [
                { model: Payment, as: 'payment' },
                {
                    model: Package,
                    as: 'package',
                    include: [
                        {
                            model: Provider,
                            as: 'provider',
                            include: [
                                { model: Agency, as: 'agency' },
                                { model: Hotel, as: 'hotel' }
                            ]
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        const raw = bookings.map(b => b.toJSON());
        const providerIds = [...new Set(
            raw
                .map(b => b.package?.provider_id)
                .filter(id => Number.isFinite(Number(id)))
                .map(id => Number(id))
        )];

        let agencyNameByProviderId = {};
        let hotelNameByProviderId = {};

        if (providerIds.length > 0) {
            const [agencies, hotels] = await Promise.all([
                Agency.findAll({
                    where: { agency_id: { [Op.in]: providerIds } },
                    attributes: ['agency_id', 'agency_name']
                }),
                Hotel.findAll({
                    where: { hotel_id: { [Op.in]: providerIds } },
                    attributes: ['hotel_id', 'hotel_name']
                })
            ]);

            agencyNameByProviderId = Object.fromEntries(
                agencies.map(a => [Number(a.agency_id), a.agency_name])
            );
            hotelNameByProviderId = Object.fromEntries(
                hotels.map(h => [Number(h.hotel_id), h.hotel_name])
            );
        }

        // Flatten for frontend compatibility
        const data = raw.map(plain => {
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
                const provider = plain.package.provider;
                const providerId = Number(plain.package.provider_id);
                plain.provider_name =
                    provider?.agency?.agency_name ||
                    provider?.hotel?.hotel_name ||
                    agencyNameByProviderId[providerId] ||
                    hotelNameByProviderId[providerId] ||
                    'TripNetwork Partner';
                // Expose provider_type so the frontend can show HOTEL vs PACKAGE correctly
                plain.provider_type =
                    provider?.provider_type ||
                    (agencyNameByProviderId[providerId] ? 'AGENCY' :
                        hotelNameByProviderId[providerId] ? 'HOTEL' : null);
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
// Allow legacy USER role as traveler-equivalent for booking endpoints.
router.post('/', authenticate, authorize('TRAVELER'), async (req, res) => {
    const { booking_type, package_id, flight_details, num_people, total_price, passengers, travelers } = req.body;
    const traveler_id = req.user.id;

    console.log(`📝 Booking request from user: ${req.user.email} (role: ${req.user.role})`);

    if (!booking_type || !num_people || !total_price) {
        return res.status(400).json({ success: false, message: 'Missing booking details' });
    }

    // Support both 'passengers' (flights) and 'travelers' (packages/hotels)
    const passengerDetails = passengers || travelers || [];

    if (!passengerDetails || passengerDetails.length === 0) {
        return res.status(400).json({ success: false, message: 'Passenger/traveler details are required' });
    }

    let airlineName = null, flightNumber = null, departureAirport = null;
    let arrivalAirport = null, departureTime = null, arrivalTime = null;

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

    const t = await sequelize.transaction();
    try {
        const booking = await Booking.create({
            traveler_id,
            booking_type,
            package_id: package_id || null,
            airline_name: airlineName,
            flight_number: flightNumber,
            departure_airport: departureAirport,
            arrival_airport: arrivalAirport,
            departure_time: departureTime,
            arrival_time: arrivalTime,
            num_people,
            total_price,
            booking_status: 'PENDING',
            passenger_details: passengerDetails
        }, { transaction: t });

        // Create payment record with traveler_id
        await Payment.create({
            booking_id: booking.booking_id,
            traveler_id: traveler_id,
            transaction_id: `${booking_type}_${booking.booking_id}_${Date.now()}`,
            // Keep a DB-compatible method token so booking creation never fails
            // on older schemas where enum values were BKASH/NAGAD/UPAY only.
            payment_method: 'BKASH',
            payment_status: 'PENDING',
            amount: total_price
        }, { transaction: t });

        await t.commit();

        console.log(`✅ Booking created: ${booking.booking_id} for traveler ${traveler_id}`);
        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: { bookingId: booking.booking_id }
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

/**
 * @route   POST /api/bookings/:id/refund
 * @desc    Request a refund for a confirmed package booking
 * @access  Traveler
 */
router.post('/:id/refund', authenticate, authorize('TRAVELER'), async (req, res) => {
    const traveler_id = req.user.id;
    const booking_id = parseInt(req.params.id, 10);

    try {
        // 1. Find the booking and verify ownership
        const booking = await Booking.findOne({
            where: { booking_id, traveler_id }
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // 2. Only CONFIRMED PACKAGE or HOTEL bookings can be refunded
        if (booking.booking_type !== 'PACKAGE' && booking.booking_type !== 'HOTEL') {
            return res.status(400).json({ success: false, message: 'Refunds are only available for package and hotel bookings' });
        }
        if (booking.booking_status !== 'CONFIRMED') {
            return res.status(400).json({
                success: false,
                message: booking.booking_status === 'REFUND_REQUESTED'
                    ? 'A refund has already been requested for this booking'
                    : 'Only confirmed bookings can be refunded'
            });
        }

        // 3. Get the package to find the provider
        const pkg = await Package.findOne({
            where: { package_id: booking.package_id },
            attributes: ['package_id', 'title', 'provider_id']
        });

        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Associated package not found' });
        }

        // 4. Get traveler info for the notification
        const { User } = require('../models/index');
        const traveler = await User.findOne({
            where: { user_id: traveler_id },
            attributes: ['name', 'email', 'phone']
        });

        // 5. Update booking status to REFUND_REQUESTED
        await booking.update({ booking_status: 'REFUND_REQUESTED' });

        console.log(`🔄 Refund requested: booking_id=${booking_id} by traveler ${traveler_id}`);

        // 6. Create a REFUND notification for the provider (non-fatal)
        try {
            const { Notification } = require('../models/index');
            await Notification.create({
                provider_id: pkg.provider_id,
                booking_id: booking_id,
                traveler_name: traveler?.name || 'Traveler',
                traveler_email: traveler?.email || 'N/A',
                traveler_phone: traveler?.phone || 'N/A',
                num_travelers: booking.num_people,
                package_title: pkg.title,
                package_id: pkg.package_id,
                notification_type: 'REFUND',
                is_read: false
            });
            console.log(`📩 Refund notification sent to provider ${pkg.provider_id}`);
        } catch (notifErr) {
            console.error('Failed to create refund notification (non-fatal):', notifErr.message);
        }

        return res.json({
            success: true,
            message: 'Refund request submitted successfully. The agency has been notified.'
        });

    } catch (error) {
        console.error('Error processing refund request:', error);
        res.status(500).json({ success: false, message: 'Failed to process refund request', error: error.message });
    }
});

module.exports = router;

