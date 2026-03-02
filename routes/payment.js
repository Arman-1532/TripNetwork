const express = require('express');
const router = express.Router();
const SSLCommerzPayment = require('sslcommerz-lts');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');

// Environment variables for SSLCommerz
const store_id = process.env.Store_ID;
const store_passwd = process.env.Store_Secret_Key;
const is_live = false; // true for live, false for sandbox

/**
 * @route   POST /api/payment/init
 * @desc    Initialize a payment with SSLCommerz (Unified)
 * @access  Private (Traveler)
 */
router.post('/init', authenticate, async (req, res) => {
    const { bookingId } = req.body;
    const traveler_id = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.name || 'Traveler';

    if (!bookingId) {
        return res.status(400).json({ success: false, message: 'Missing booking ID' });
    }

    try {
        // 1. Fetch Booking and Payment details
        const [rows] = await pool.execute(
            `SELECT b.*, p.transaction_id 
             FROM booking b 
             JOIN payment p ON b.booking_id = p.booking_id 
             WHERE b.booking_id = ? AND b.traveler_id = ?`,
            [bookingId, traveler_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const booking = rows[0];

        // 2. Prepare SSLCommerz data
        const data = {
            total_amount: booking.total_price,
            currency: 'BDT',
            tran_id: booking.transaction_id,
            success_url: `http://localhost:3000/api/payment/success?tran_id=${booking.transaction_id}`,
            fail_url: `http://localhost:3000/api/payment/fail?tran_id=${booking.transaction_id}`,
            cancel_url: `http://localhost:3000/api/payment/cancel?tran_id=${booking.transaction_id}`,
            ipn_url: 'http://localhost:3000/api/payment/ipn',
            shipping_method: 'No',
            product_name: booking.booking_type === 'FLIGHT' ? `Flight ${booking.flight_number}` : `Package #${booking.package_id}`,
            product_category: 'Travel',
            product_profile: 'general',
            cus_name: userName,
            cus_email: userEmail,
            cus_add1: 'N/A',
            cus_city: 'N/A',
            cus_country: 'Bangladesh',
            cus_phone: 'N/A',
        };

        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
        const apiResponse = await sslcz.init(data);

        if (apiResponse && apiResponse.GatewayPageURL) {
            res.json({ success: true, url: apiResponse.GatewayPageURL });
        } else {
            console.error('SSLCommerz Init Error:', apiResponse);
            res.status(400).json({
                success: false,
                message: "SSLCommerz payment initiation failed",
                error: apiResponse.failedreason || 'Unknown error'
            });
        }
    } catch (error) {
        console.error('Payment Init Exception:', error);
        res.status(500).json({ success: false, message: "Internal server error during payment initiation" });
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
        // 1. Update Payment table
        await pool.execute(
            `UPDATE payment SET payment_status = 'SUCCESS', paid_at = NOW() WHERE transaction_id = ?`,
            [tran_id]
        );

        // 2. Update Booking table - find booking linked to this transaction
        await pool.execute(
            `UPDATE booking b 
             JOIN payment p ON b.booking_id = p.booking_id 
             SET b.booking_status = 'CONFIRMED' 
             WHERE p.transaction_id = ?`,
            [tran_id]
        );

        res.redirect(`/payment-success.html?tran_id=${tran_id}`);
    } catch (error) {
        console.error('Error updating payment success:', error);
        res.redirect('/payment-fail.html');
    }
});

/**
 * @route   POST /api/payment/fail
 */
router.post('/fail', (req, res) => {
    console.log('Payment Failed:', req.query.tran_id);
    res.redirect('/payment-fail.html');
});

/**
 * @route   POST /api/payment/cancel
 */
router.post('/cancel', (req, res) => {
    console.log('Payment Cancelled:', req.query.tran_id);
    res.redirect('/dashboard.html');
});

/**
 * @route   POST /api/payment/ipn
 */
router.post('/ipn', (req, res) => {
    console.log('IPN Received:', req.body);
    res.send('IPN Received');
});

module.exports = router;
