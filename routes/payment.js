const express = require('express');
const router = express.Router();
const SSLCommerzPayment = require('sslcommerz-lts');
const { Booking, Payment, User, Traveler, Package } = require('../models/index');
const { authenticate } = require('../middleware/auth');
const { sendTicketEmail, sendBookingConfirmationEmail } = require('../services/emailService');

const store_id = process.env.Store_ID;
const store_passwd = process.env.Store_Secret_Key;
const is_live = (process.env.SSLCOMMERZ_LIVE || 'false').toLowerCase() === 'true';

function getBaseUrl(req) {
    // Prefer explicit env for deployments (behind proxy), fallback to request-derived.
    const fromEnv = process.env.APP_BASE_URL;
    if (fromEnv) return fromEnv.replace(/\/$/, '');

    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').toString().split(',')[0].trim();
    const host = (req.headers['x-forwarded-host'] || req.get('host') || '').toString().split(',')[0].trim();
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
    const traveler_id = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.name || 'Traveler';

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
        const tranId = booking.payment.transaction_id;

        const data = {
            total_amount: booking.total_price,
            currency: 'BDT',
            tran_id: tranId,
            success_url: `${baseUrl}/api/payment/success?tran_id=${encodeURIComponent(tranId)}`,
            fail_url: `${baseUrl}/api/payment/fail?tran_id=${encodeURIComponent(tranId)}`,
            cancel_url: `${baseUrl}/api/payment/cancel?tran_id=${encodeURIComponent(tranId)}`,
            ipn_url: `${baseUrl}/api/payment/ipn`,
            shipping_method: 'No',
            product_name: booking.booking_type === 'FLIGHT'
                ? `Flight ${booking.flight_number}`
                : `${booking.booking_type === 'HOTEL' ? 'Hotel' : 'Package'} #${booking.package_id || booking.booking_id}`,
            product_category: 'Travel',
            product_profile: 'general',
            cus_name: userName,
            cus_email: userEmail,
            cus_add1: 'N/A',
            cus_city: 'N/A',
            cus_country: 'Bangladesh',
            cus_phone: 'N/A',
            // Explicitly disable EMI options to avoid sandbox EMI API calls which sometimes return 500
            emi_option: 0,
            emi_max_inst_option: 0,
            // safer defaults
            value_a: '',
            value_b: '',
            value_c: '',
            value_d: ''
        };

        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
        const apiResponse = await sslcz.init(data);

        if (apiResponse && apiResponse.GatewayPageURL) {
            console.log('✅ Payment gateway URL generated successfully');
            return res.json({ success: true, url: apiResponse.GatewayPageURL });
        }

        console.error('SSLCommerz Init Error:', apiResponse);
        // return raw response when available for easier client-side debugging
        return res.status(400).json({
            success: false,
            message: 'SSLCommerz payment initiation failed',
            error: apiResponse || 'Unknown error'
        });
    } catch (error) {
        console.error('Payment Init Exception:', error);
        // include message for clarity
        return res.status(500).json({ success: false, message: 'Internal server error during payment initiation', error: error.message });
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
            console.log('Payment record found, updating booking status...');

            await Booking.update(
                { booking_status: 'CONFIRMED' },
                { where: { booking_id: payment.booking_id } }
            );

            // Fetch booking details for email
            const booking = await Booking.findOne({
                where: { booking_id: payment.booking_id },
                include: [{ model: Traveler, as: 'traveler', include: [{ model: User, as: 'user' }] }]
            });

            console.log('📚 Booking details:', {
                bookingId: booking?.booking_id,
                bookingType: booking?.booking_type,
                passengerDetailsCount: booking?.passenger_details?.length || 0,
                passengerDetails: booking?.passenger_details
            });

            if (booking && booking.passenger_details && booking.passenger_details.length > 0) {
                if (booking.booking_type === 'FLIGHT') {
                    // Send flight tickets
                    console.log('✈️ Processing FLIGHT booking for email...');
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
                        console.log('✅ Flight tickets sent successfully to:', emailData.email);
                    } else {
                        console.log('⚠️ Flight ticket email sending failed, but payment was successful');
                    }
                } else if (booking.booking_type === 'PACKAGE' || booking.booking_type === 'HOTEL') {
                    // Send package/hotel booking confirmation with pass
                    console.log('📦 Processing PACKAGE booking for email...');
                    try {
                        const { Notification } = require('../models/index');
                        const packageData = await Package.findOne({
                            where: { package_id: booking.package_id },
                            include: [{ model: require('../models/index').Provider, as: 'provider' }]
                        });

                        console.log('📦 Package data:', {
                            packageId: booking.package_id,
                            packageFound: !!packageData,
                            packageTitle: packageData?.title,
                            packageType: packageData?.package_type,
                            destination: packageData?.destination
                        });

                        const unitPrice = booking.total_price / booking.num_people;
                        // Use email from the first traveler's form submission, NOT from user profile
                        const confirmationEmail = booking.passenger_details[0]?.email || booking.traveler?.user?.email;
                        const travelerPhone = booking.passenger_details[0]?.phoneNumber || 'N/A';

                        console.log('📧 Email data to send:', {
                            email: confirmationEmail,
                            travelersCount: booking.passenger_details.length,
                            unitPrice,
                            totalPrice: booking.total_price
                        });

                        // Create notification for provider (hotel/agency) — wrapped separately
                        // so a DB error here never blocks the confirmation email below.
                        if (packageData?.provider_id) {
                            try {
                                await Notification.create({
                                    provider_id: packageData.provider_id,
                                    booking_id: booking.booking_id,
                                    traveler_name: booking.passenger_details[0].fullName,
                                    traveler_email: confirmationEmail,
                                    traveler_phone: travelerPhone,
                                    num_travelers: booking.passenger_details.length,
                                    package_title: packageData.title,
                                    package_id: packageData.package_id,
                                    is_read: false
                                });
                                console.log('📬 Notification created for provider:', packageData.provider_id);
                            } catch (notifError) {
                                console.error('⚠️ Notification creation failed (non-fatal):', notifError.message);
                            }
                        }

                        // Fetch agency/hotel info for the pass
                        let providerInfo = {};
                        try {
                            const ProviderUser = require('../models/index').User;
                            const providerUser = await ProviderUser.findOne({
                                where: { user_id: packageData?.provider_id }
                            });
                            if (providerUser) {
                                providerInfo = {
                                    hotelName: providerUser.name || 'Travel Partner',
                                    hotelEmail: providerUser.email,
                                    hotelPhone: providerUser.phone,
                                    hotelLocation: packageData?.destination
                                };
                            }
                        } catch (provErr) {
                            console.error('⚠️ Provider info fetch failed (non-fatal):', provErr.message);
                        }

                        // Determine a clean package title — custom requests store JSON in title
                        let packageTitle = packageData?.title || 'Travel Package';
                        try {
                            const parsed = JSON.parse(packageTitle);
                            if (parsed && typeof parsed === 'object') {
                                packageTitle = parsed.fullDescription || parsed.message || packageTitle;
                            }
                        } catch { /* plain string — keep as-is */ }

                        const emailData = {
                            email: confirmationEmail,
                            travelers: booking.passenger_details,
                            bookingId: booking.booking_id,
                            bookingType: booking.booking_type,
                            packageTitle: packageTitle,
                            packageType: packageData?.package_type || 'TRAVEL',
                            destination: packageData?.destination || 'N/A',
                            origin: packageData?.origin || '',
                            unitPrice: unitPrice,
                            totalPrice: booking.total_price,
                            checkinDate: booking.checkin_date,
                            checkoutDate: booking.checkout_date,
                            hotelName: providerInfo.hotelName,
                            hotelEmail: providerInfo.hotelEmail,
                            hotelPhone: providerInfo.hotelPhone,
                            hotelLocation: providerInfo.hotelLocation
                        };

                        const emailSent = await sendBookingConfirmationEmail(emailData);
                        if (emailSent) {
                            console.log('✅ Booking confirmation email with pass sent successfully to:', confirmationEmail);
                        } else {
                            console.log('⚠️ Booking confirmation email sending failed, but payment was successful');
                        }
                    } catch (emailError) {
                        console.error('⚠️ Error sending booking confirmation email:', emailError.message);
                    }
                }
            } else {
                console.log('⚠️ No passenger details found for booking');
            }
        }

        const frontendBase = getFrontendBaseUrl(req);
        const redirectUrl = `${frontendBase}/payment/success?tran_id=${encodeURIComponent(tran_id)}`;

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
