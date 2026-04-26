const express = require('express');
const router = express.Router();
const { Package, Provider, Agency, Hotel } = require('../models/index');
const { authenticate, authorize } = require('../middleware/auth');
const path = require('path');
const { Op } = require('sequelize');

// Hide sensitive fields stored in custom-request JSON metadata when returning public curated packages.
function sanitizeCustomRequestDescription(description) {
    try {
        const meta = typeof description === 'string' ? JSON.parse(description) : description;
        if (!meta || meta.isCustomRequest !== true) return description;

        const sanitized = {
            isCustomRequest: true,
            // keep only non-sensitive fields needed to render a card
            budget: meta.budget,
            numPeople: meta.numPeople,
            departureDate: meta.departureDate,
            status: meta.status,
            acceptedAt: meta.acceptedAt,
            // accepted bid amount may be needed to match the package price, but do not expose agencyId/message/timestamps
            acceptedBid: meta.acceptedBid ? { amount: meta.acceptedBid.amount } : undefined
        };

        return JSON.stringify(sanitized);
    } catch {
        return description;
    }
}

function activeLimitedTimeFilter(now = new Date()) {
    return {
        [Op.or]: [
            { is_limited_time: false },
            { is_limited_time: null },
            { offer_ends_at: null },
            { offer_ends_at: { [Op.gt]: now } }
        ]
    };
}

function isAgencyProvider(providerType) {
    if (!providerType) return false;
    const normalized = String(providerType).trim().toUpperCase();
    return normalized === 'AGENCY' || normalized === 'TRAVEL_AGENCY';
}

/**
 * @route   POST /api/packages
 * @desc    Create a new travel package
 * @access  Provider (Agency)
 */
router.post('/', authenticate, authorize('PROVIDER'), async (req, res) => {
    if (!isAgencyProvider(req.user.providerType)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only travel agencies can post travel packages.'
        });
    }

    const {
        title,
        description,
        destination,
        origin,
        travel_medium,
        price,
        is_limited_time,
        offer_ends_at,
        duration_value,
        duration_unit,
        image_url
    } = req.body;
    const provider_id = req.user.id;

    try {
        const limitedTimeEnabled = is_limited_time === true || is_limited_time === 'true' || is_limited_time === 1 || is_limited_time === '1';
        let computedOfferEndsAt = null;

        if (limitedTimeEnabled) {
            if (offer_ends_at) {
                const parsed = new Date(offer_ends_at);
                if (Number.isNaN(parsed.getTime())) {
                    return res.status(400).json({ success: false, message: 'Invalid offer end time.' });
                }
                computedOfferEndsAt = parsed;
            } else if (duration_value !== undefined && duration_value !== null && duration_value !== '') {
                const numericValue = Number(duration_value);
                if (!Number.isFinite(numericValue) || numericValue <= 0) {
                    return res.status(400).json({ success: false, message: 'Duration must be a positive number.' });
                }

                const normalizedUnit = (duration_unit || 'hours').toString().toLowerCase();
                const multiplierByUnit = { minutes: 60 * 1000, hours: 60 * 60 * 1000, days: 24 * 60 * 60 * 1000 };
                const multiplier = multiplierByUnit[normalizedUnit];
                if (!multiplier) {
                    return res.status(400).json({ success: false, message: 'Invalid duration unit. Use minutes, hours, or days.' });
                }

                computedOfferEndsAt = new Date(Date.now() + numericValue * multiplier);
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid duration for limited-time package.'
                });
            }
        }

        const pkg = await Package.create({
            provider_id,
            package_type: 'TRAVEL',
            title,
            description,
            destination,
            origin,
            travel_medium,
            price,
            is_limited_time: limitedTimeEnabled,
            offer_ends_at: limitedTimeEnabled ? computedOfferEndsAt : null,
            duration_value: limitedTimeEnabled ? Number(duration_value) : null,
            duration_unit: limitedTimeEnabled ? duration_unit : null,
            status: 'APPROVED',
            image_url
        });

        res.status(201).json({
            success: true,
            message: 'Travel package created successfully',
            packageId: pkg.package_id
        });
    } catch (error) {
        console.error('Error creating package:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create package',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/packages
 * @desc    Get all approved packages
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const rows = await Package.findAll({
            where: {
                status: 'APPROVED',
                ...activeLimitedTimeFilter()
            },
            include: [
                {
                    model: Provider,
                    as: 'provider',
                    where: { provider_type: 'AGENCY' }, // Only show agency packages
                    include: [
                        { model: Agency, as: 'agency' },
                        { model: Hotel, as: 'hotel' }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Flatten provider names and filter out custom-request packages
        const data = rows
            .map(p => {
                const plain = p.toJSON();
                plain.agency_name = plain.provider && plain.provider.agency ? plain.provider.agency.agency_name : null;
                plain.hotel_name = plain.provider && plain.provider.hotel ? plain.provider.hotel.hotel_name : null;
                delete plain.provider;

                // Check if it's a custom request
                try {
                    const meta = typeof plain.description === 'string' ? JSON.parse(plain.description) : plain.description;
                    if (meta && meta.isCustomRequest === true) {
                        return null; // Mark for removal
                    }
                } catch {
                    // Not JSON, it's a regular description
                }

                return plain;
            })
            .filter(pkg => pkg !== null);

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch packages',
            error: error.message
        });
    }
});

router.get('/my-packages', authenticate, authorize('PROVIDER'), async (req, res) => {
    // Only allow AGENCY providers to view their packages
    // Log for debugging
    console.log('📦 /my-packages request:', {
        userId: req.user.id,
        userRole: req.user.role,
        providerType: req.user.providerType
    });

    if (!req.user.providerType) {
        return res.status(403).json({
            success: false,
            message: 'Provider type not found. Please log in again.'
        });
    }

    if (!isAgencyProvider(req.user.providerType)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only travel agencies can view packages.'
        });
    }

    const provider_id = req.user.id;

    try {
        const rows = await Package.findAll({
            where: { provider_id, package_type: 'TRAVEL' },
            order: [['created_at', 'DESC']]
        });

        // Filter out custom requests that are still pending (not accepted yet)
        // This mirrors the original SQL logic using JSON parsing in JS
        const data = rows.filter(pkg => {
            try {
                const desc = JSON.parse(pkg.description);
                if (desc && desc.isCustomRequest) {
                    return desc.status === 'ACCEPTED';
                }
                return true; // not a custom request — always show
            } catch {
                return true; // not valid JSON — it's a regular description, show it
            }
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching my packages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your packages',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/packages/:id/reviews
 * @desc    Get all reviews for a package
 * @access  Public
 */
router.get('/:id/reviews', async (req, res) => {
    try {
        const { Review, Traveler, User } = require('../models/index');
        const packageId = req.params.id;

        const reviews = await Review.findAll({
            where: { package_id: packageId },
            include: [
                {
                    model: Traveler,
                    as: 'traveler',
                    attributes: ['traveler_id'],
                    include: [
                        { model: User, as: 'user', attributes: ['user_id', 'name'] }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        const data = reviews.map(r => ({
            review_id: r.review_id,
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at,
            traveler_name: r.traveler?.user?.name || 'Anonymous'
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
});

/**
 * @route   POST /api/packages/:id/reviews
 * @desc    Add a review to a package
 * @access  Protected (must have purchased)
 */
router.post('/:id/reviews', authenticate, async (req, res) => {
    try {
        const { Package, Review, Booking, Payment } = require('../models/index');
        const packageId = req.params.id;
        const travelerId = req.user.id;
        const { rating, comment } = req.body;

        console.log(`📝 Review submission attempt - Traveler: ${travelerId}, Package: ${packageId}, Rating: ${rating}`);

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        // Check if package exists
        const pkg = await Package.findByPk(packageId);
        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        // Only a buyer traveler can review:
        // require a CONFIRMED booking with SUCCESS payment for this package.
        const purchase = await Booking.findOne({
            where: {
                traveler_id: travelerId,
                package_id: packageId,
                booking_status: {
                    [Op.in]: ['CONFIRMED']
                },
                booking_type: {
                    [Op.in]: ['PACKAGE', 'HOTEL']
                }
            },
            include: [
                {
                    model: Payment,
                    as: 'payment',
                    required: true,
                    where: { payment_status: 'SUCCESS' }
                }
            ]
        });

        if (!purchase) {
            console.log(`❌ No purchase found for traveler ${travelerId} and package ${packageId}`);
            return res.status(403).json({ success: false, message: 'Only buyers who completed payment can leave a review' });
        }

        console.log(`✅ Purchase found: booking_id=${purchase.booking_id}, status=${purchase.booking_status}`);

        // Check if user already reviewed
        const existingReview = await Review.findOne({
            where: {
                package_id: packageId,
                traveler_id: travelerId
            }
        });

        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this package' });
        }

        // Create review
        const review = await Review.create({
            package_id: packageId,
            traveler_id: travelerId,
            rating,
            comment: comment || ''
        });

        console.log(`⭐ Review created successfully: review_id=${review.review_id}`);
        res.status(201).json({ success: true, message: 'Review added successfully', review_id: review.review_id });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ success: false, message: 'Failed to add review' });
    }
});

/**
 * @route   GET /api/packages/:id/can-review
 * @desc    Check if current user can review a package
 * @access  Protected
 */
router.get('/:id/can-review', authenticate, async (req, res) => {
    try {
        const { Booking, Review, Payment } = require('../models/index');
        const packageId = req.params.id;
        const travelerId = req.user.id;

        console.log(`🔍 Checking review eligibility for traveler ${travelerId} and package ${packageId}`);

        // Eligible only if traveler has a CONFIRMED booking + SUCCESS payment for this package.
        const purchase = await Booking.findOne({
            where: {
                traveler_id: travelerId,
                package_id: packageId,
                booking_status: {
                    [Op.in]: ['CONFIRMED']
                },
                booking_type: {
                    [Op.in]: ['PACKAGE', 'HOTEL']
                }
            },
            include: [
                {
                    model: Payment,
                    as: 'payment',
                    required: true,
                    where: { payment_status: 'SUCCESS' }
                }
            ]
        });

        console.log(`📦 Purchase found:`, purchase ? 'Yes' : 'No');

        // Check if already reviewed
        const existingReview = await Review.findOne({
            where: {
                package_id: packageId,
                traveler_id: travelerId
            }
        });

        console.log(`⭐ Existing review found:`, existingReview ? 'Yes' : 'No');
        console.log(`✅ Response: canReview=${!!purchase}, hasReviewed=${!!existingReview}`);

        res.json({
            success: true,
            data: {
                canReview: !!purchase,
                hasReviewed: !!existingReview
            }
        });
    } catch (error) {
        console.error('Error checking review eligibility:', error);
        res.status(500).json({ success: false, message: 'Failed to check eligibility' });
    }
});

/**
 * @route   GET /api/packages/:id
 * @desc    Get a single package with details and contact info
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const pkg = await Package.findOne({
            where: { package_id: req.params.id },
            include: [
                {
                    model: Provider,
                    as: 'provider',
                    include: [
                        { association: 'user', attributes: ['name', 'email', 'phone'] },
                        { model: Agency, as: 'agency' },
                        { model: Hotel, as: 'hotel' }
                    ]
                }
            ]
        });

        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        const data = pkg.toJSON();
        if (data.provider) {
            data.contact_email = data.provider.user ? data.provider.user.email : null;
            data.contact_phone = data.provider.user ? data.provider.user.phone : null;
            data.agency_name = data.provider.agency ? data.provider.agency.agency_name : null;
            data.hotel_name = data.provider.hotel ? data.provider.hotel.hotel_name : null;
            delete data.provider;
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching package details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch package details', error: error.message });
    }
});

/**
 * @route   PUT /api/packages/:id
 * @desc    Update a package (provider owner only)
 * @access  Provider
 */
router.put('/:id', authenticate, authorize('PROVIDER'), async (req, res) => {
    const packageId = req.params.id;
    const provider_id = req.user.id;

    try {
        const pkg = await Package.findOne({ where: { package_id: packageId } });
        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        if (pkg.provider_id !== provider_id) {
            return res.status(403).json({ success: false, message: 'Access denied. You do not own this package.' });
        }

        // Only allow updating of a safe set of fields
        const allowed = ['title', 'description', 'destination', 'origin', 'price', 'travel_medium', 'is_limited_time', 'offer_ends_at', 'image_url'];
        const updates = {};
        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(req.body, key)) updates[key] = req.body[key];
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'is_limited_time')) {
            const limitedTimeEnabled =
                req.body.is_limited_time === true ||
                req.body.is_limited_time === 'true' ||
                req.body.is_limited_time === 1 ||
                req.body.is_limited_time === '1';

            updates.is_limited_time = limitedTimeEnabled;

            if (!limitedTimeEnabled) {
                updates.offer_ends_at = null;
            } else if (Object.prototype.hasOwnProperty.call(req.body, 'offer_ends_at')) {
                if (!req.body.offer_ends_at) {
                    return res.status(400).json({ success: false, message: 'Offer end time is required for limited-time package.' });
                }
                const parsed = new Date(req.body.offer_ends_at);
                if (Number.isNaN(parsed.getTime())) {
                    return res.status(400).json({ success: false, message: 'Invalid offer end time.' });
                }
                updates.offer_ends_at = parsed;
            } else if (!pkg.offer_ends_at) {
                return res.status(400).json({ success: false, message: 'Offer end time is required for limited-time package.' });
            }
        }

        // When a provider edits a package, it remains approved (no manual review required anymore)
        // if (pkg.status === 'APPROVED') updates.status = 'PENDING';

        await Package.update(updates, { where: { package_id: packageId } });

        res.json({ success: true, message: 'Package updated successfully' });
    } catch (error) {
        console.error('Error updating package:', error);
        res.status(500).json({ success: false, message: 'Failed to update package', error: error.message });
    }
});

/**
 * @route   DELETE /api/packages/:id
 * @desc    Delete a package (provider owner only)
 * @access  Provider
 */
router.delete('/:id', authenticate, authorize('PROVIDER'), async (req, res) => {
    const packageId = req.params.id;
    const provider_id = req.user.id;

    try {
        const pkg = await Package.findOne({ where: { package_id: packageId } });
        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Package not found' });
        }

        if (pkg.provider_id !== provider_id) {
            return res.status(403).json({ success: false, message: 'Access denied. You do not own this package.' });
        }

        await Package.destroy({ where: { package_id: packageId } });

        res.json({ success: true, message: 'Package deleted successfully' });
    } catch (error) {
        console.error('Error deleting package:', error);
        res.status(500).json({ success: false, message: 'Failed to delete package', error: error.message });
    }
});

module.exports = router;
