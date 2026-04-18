const express = require('express');
const router = express.Router();
const SSLCommerzPayment = require('sslcommerz-lts');
const { Booking, Payment, User, Traveler } = require('../models/index');
const { authenticate } = require('../middleware/auth');
const { sendTicketEmail } = require('../services/emailService');

const store_id     = process.env.Store_ID;
const store_passwd = process.env.Store_Secret_Key;
const is_live      = (process.env.SSLCOMMERZ_LIVE || 'false').toLowerCase() === 'true';

function getBaseUrl(req) {
    // Prefer explicit env for deployments (behind proxy), fallback to request-derived.
    const fromEnv = process.env.APP_BASE_URL;
    if (fromEnv) return fromEnv.replace(/\/$/, '');

    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').toString().split(',')[0].trim();
    const host  = (req.headers['x-forwarded-host'] || req.get('host') || '').toString().split(',')[0].trim();
    return `${proto}://${host}`;
}

function getFrontendBaseUrl(req) {
    // 1. Explicit environment variable (recommended)
    if (process.env.FRONTEND_BASE_URL) {
        return process.env.FRONTEND_BASE_URL.replace(/\/$/, '');
    }

    // 2. Fallback to APP_BASE_URL
    if (process.env.APP_BASE_URL) {
        return process.env.APP_BASE_URL.replace(/\/$/, '');
    }

    // 3. Fallback to request-derived URL (same-origin SPA)
    return getBaseUrl(req);
}

/**
 * @route   POST /api/payment/init
 * @desc    Initialize a payment with SSLCommerz (Unified)
 * @access  private
 */
router.post('/init', authenticate, async (req, res) => {
    const { bookingId } = req.body;
    const traveler_id   = req.user.id;
    const userEmail     = req.user.email;
    const userName      = req.user.name || 'Traveler';

    if (!bookingId) {
        return res.status(400).json({ success: false, message: 'Missing booking ID' });
    }

    if (!store_id || !store_passwd) {
        return res.status(500).json({
            success: false,
            message: 'Payment gateway not configured (missing Store_ID / Store_Secret_Key)'
        });
    }

    try {
        const booking = await Booking.findOne({
            where: { booking_id: bookingId, traveler_id },
            include: [{ model: Payment, as: 'payment' }]
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        if (!booking.payment) {
            return res.status(409).json({
                success: false,
                message: 'Payment record missing for this booking. Please recreate the booking.'
            });
        }

        const baseUrl = getBaseUrl(req);
        const tranId  = booking.payment.transaction_id;

        const data = {
            total_amount:    booking.total_price,
            currency:        'BDT',
            tran_id:         tranId,
            success_url:     `${baseUrl}/api/payment/success?tran_id=${encodeURIComponent(tranId)}`,
            fail_url:        `${baseUrl}/api/payment/fail?tran_id=${encodeURIComponent(tranId)}`,
            cancel_url:      `${baseUrl}/api/payment/cancel?tran_id=${encodeURIComponent(tranId)}`,
            ipn_url:         `${baseUrl}/api/payment/ipn`,
            shipping_method: 'No',
            product_name:    booking.booking_type === 'FLIGHT'
                ? `Flight ${booking.flight_number}`
                : `Package #${booking.package_id}`,
            product_category: 'Travel',
            product_profile:  'general',
            cus_name:   userName,
            cus_email:  userEmail,
            cus_add1:   'N/A',
            cus_city:   'N/A',
            cus_country:'Bangladesh',
            cus_phone:  'N/A'
        };

        const sslcz       = new SSLCommerzPayment(store_id, store_passwd, is_live);
        const apiResponse = await sslcz.init(data);

        if (apiResponse && apiResponse.GatewayPageURL) {
            return res.json({ success: true, url: apiResponse.GatewayPageURL });
        }

        console.error('SSLCommerz Init Error:', apiResponse);
        return res.status(400).json({
            success: false,
            message: 'SSLCommerz payment initiation failed',
            error: apiResponse?.failedreason || 'Unknown error'
        });
    } catch (error) {
        console.error('Payment Init Exception:', error);
        return res.status(500).json({ success: false, message: 'Internal server error during payment initiation' });
    }
});

/**
 * Handle successful payment redirect (SSLCommerz may call GET or POST)
 */
async function handleSuccess(req, res) {
    const tran_id = req.query.tran_id;
    console.log('Payment Successful:', tran_id);

    try {
        await Payment.update(
            { payment_status: 'SUCCESS', paid_at: new Date() },
            { where: { transaction_id: tran_id } }
        );

        const payment = await Payment.findOne({ where: { transaction_id: tran_id } });
        if (payment) {
            await Booking.update(
                { booking_status: 'CONFIRMED' },
                { where: { booking_id: payment.booking_id } }
            );

            // Fetch booking details for email
            const booking = await Booking.findOne({
                where: { booking_id: payment.booking_id },
                include: [{ model: Traveler, as: 'traveler', include: [{ model: User, as: 'user' }] }]
            });

            if (booking && booking.passenger_details && booking.passenger_details.length > 0) {
                // Send tickets via email
                const emailData = {
                    email: booking.passenger_details[0].email || booking.traveler?.user?.email,
                    passengerName: booking.passenger_details[0].fullName,
                    bookingId: booking.booking_id,
                    ticketNumber: `TKT${booking.booking_id}${Date.now().toString().slice(-6)}`,
                    passengers: booking.passenger_details,
                    airline: booking.airline_name,
                    flightNumber: booking.flight_number,
                    departureAirport: booking.departure_airport,
                    arrivalAirport: booking.arrival_airport,
                    departureTime: booking.departure_time,
                    arrivalTime: booking.arrival_time,
                    price: booking.total_price / booking.num_people
                };

                const emailSent = await sendTicketEmail(emailData);
                if (emailSent) {
                    console.log('✅ Tickets sent successfully to:', emailData.email);
                } else {
                    console.log('⚠️ Ticket email sending failed, but payment was successful');
                }
            }
        }

        const frontendBase = getFrontendBaseUrl(req);
        const redirectUrl  = `${frontendBase}/payment/success?tran_id=${encodeURIComponent(tran_id)}`;

        console.log('Redirecting to SUCCESS:', redirectUrl);
        return res.redirect(redirectUrl);
    } catch (error) {
        console.error('Error updating payment success:', error);
        const frontendBase = getFrontendBaseUrl(req);
        return res.redirect(`${frontendBase}/payment/failed?tran_id=${encodeURIComponent(tran_id)}&error=server`);
    }
}

/**
 * Handle failed payment redirect (SSLCommerz may call GET or POST)
 */
function handleFail(req, res) {
    const tran_id = req.query.tran_id || '';
    console.log('Payment Failed:', tran_id);
    const frontendBase = getFrontendBaseUrl(req);
    return res.redirect(`${frontendBase}/payment/failed?tran_id=${encodeURIComponent(tran_id)}`);
}

/**
 * Handle cancelled payment redirect (SSLCommerz may call GET or POST)
 */
function handleCancel(req, res) {
    const tran_id = req.query.tran_id || '';
    console.log('Payment Cancelled:', tran_id);
    const frontendBase = getFrontendBaseUrl(req);
    return res.redirect(`${frontendBase}/payment/failed?payment=cancel&tran_id=${encodeURIComponent(tran_id)}`);
}

router.post('/success', handleSuccess);
router.get('/success', handleSuccess);

router.post('/fail', handleFail);
router.get('/fail', handleFail);

router.post('/cancel', handleCancel);
router.get('/cancel', handleCancel);

router.post('/ipn', (req, res) => {
    console.log('IPN Received:', req.body);
    res.send('IPN Received');
});

module.exports = router;
