const express = require('express');
const router = express.Router();
const SSLCommerzPayment = require('sslcommerz-lts');
const { Booking, Payment } = require('../models/index');
const { authenticate } = require('../middleware/auth');

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

/**
 * @route   POST /api/payment/init
 * @desc    Initialize a payment with SSLCommerz (Unified)
 * @access  Private (Traveler)
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
 * @route   POST /api/payment/success
 * @desc    Handle successful payment redirect
 */
router.post('/success', async (req, res) => {
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
        }

        res.redirect(`/payment-success.html?tran_id=${encodeURIComponent(tran_id)}`);
    } catch (error) {
        console.error('Error updating payment success:', error);
        res.redirect('/payment-fail.html');
    }
});

router.post('/fail', (req, res) => {
    console.log('Payment Failed:', req.query.tran_id);
    res.redirect('/payment-fail.html');
});

router.post('/cancel', (req, res) => {
    console.log('Payment Cancelled:', req.query.tran_id);
    res.redirect('/dashboard.html');
});

router.post('/ipn', (req, res) => {
    console.log('IPN Received:', req.body);
    res.send('IPN Received');
});

module.exports = router;
