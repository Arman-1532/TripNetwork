const express = require('express');
const router = express.Router();
const { Package } = require('../models/index');
const sequelize = require('../config/sequelize');
const { authenticate, authorize } = require('../middleware/auth');
const { Op, fn, col } = require('sequelize');

/**
 * @route   POST /api/hotels/packages
 * @desc    Create a new hotel package
 * @access  protected
 */
router.post('/packages', authenticate, authorize('provider'), async (req, res) => {
    if (req.user.providerType !== 'HOTEL') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only hotels can post hotel packages.'
        });
    }

    const { title, description, destination, price, is_limited_time, offer_ends_at } = req.body;
    const provider_id = req.user.id;

    try {
        const pkg = await Package.create({
            provider_id,
            package_type: 'HOTEL',
            title,
            description,
            destination,
            price,
            is_limited_time: is_limited_time || false,
            offer_ends_at: offer_ends_at || null,
            status: 'APPROVED'
        });

        res.status(201).json({
            success: true,
            message: 'Hotel package created successfully',
            packageId: pkg.package_id
        });
    } catch (error) {
        console.error('Error creating hotel package:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create hotel package',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/hotels/my-packages
 * @desc    Get packages created by the current hotel
 * @access  protected
 */
router.get('/my-packages', authenticate, authorize('provider'), async (req, res) => {
    if (req.user.providerType !== 'HOTEL') {
        return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const provider_id = req.user.id;

    try {
        const rows = await Package.findAll({
            where: { provider_id, package_type: 'HOTEL' },
            order: [['created_at', 'DESC']]
        });

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching hotel packages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your packages',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/hotels/search
 * @desc    Search approved hotel packages
 * @access  Public
 */
router.get('/search', async (req, res) => {
    const { city, roomType, maxPrice } = req.query;

    try {
        // Use raw query for more reliable case-insensitive search
        let query = `SELECT * FROM package WHERE status = 'APPROVED' AND package_type = 'HOTEL'`;
        const params = [];

        if (city && String(city).trim() !== '') {
            // Don't escape - just use the city as-is with LIKE
            query += ` AND destination LIKE ?`;
            params.push(`%${String(city).trim()}%`);
        }

        if (maxPrice) {
            const priceNum = Number(maxPrice);
            if (!isNaN(priceNum) && priceNum > 0) {
                query += ` AND price <= ?`;
                params.push(priceNum);
            }
        }

        query += ` ORDER BY created_at DESC`;

        const rows = await sequelize.query(query, {
            replacements: params,
            type: sequelize.QueryTypes.SELECT
        });

        console.log(`Hotel search - City: ${city}, Found: ${rows.length} results`);

        // Optional: filter by roomType from JSON description
        let data = rows.map(r => ({
            ...r,
            price: parseFloat(r.price)
        }));

        if (roomType && roomType !== 'Any') {
            data = data.filter(p => {
                try {
                    const desc = typeof p.description === 'string' ? JSON.parse(p.description) : p.description;
                    return (desc?.roomType || '').toLowerCase() === String(roomType).toLowerCase();
                } catch {
                    return false;
                }
            });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error searching hotels:', error);
        res.status(500).json({ success: false, message: 'Failed to search hotels', error: error.message });
    }
});

/**
 * @route   GET /api/hotels/:packageId/reviews
 * @desc    Get all reviews for a hotel package
 * @access  Public
 */
router.get('/:packageId/reviews', async (req, res) => {
    try {
        const { Review, Traveler, User } = require('../models/index');
        const packageId = req.params.packageId;

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
        console.error('Error fetching hotel reviews:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
    }
});

/**
 * @route   POST /api/hotels/:packageId/reviews
 * @desc    Add a review to a hotel package
 * @access  Protected (must have booked)
 */
router.post('/:packageId/reviews', authenticate, async (req, res) => {
    try {
        const { Package, Review, Booking, Payment } = require('../models/index');
        const packageId = req.params.packageId;
        const travelerId = req.user.id;
        const { rating, comment } = req.body;

        console.log(`📝 Hotel review submission - Traveler: ${travelerId}, Package: ${packageId}, Rating: ${rating}`);

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        // Check if package exists
        const pkg = await Package.findByPk(packageId);
        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Hotel package not found' });
        }

        // Only a buyer traveler can review:
        // require a CONFIRMED booking with SUCCESS payment for this hotel package.
        const purchase = await Booking.findOne({
            where: {
                traveler_id: travelerId,
                package_id: packageId,
                booking_status: {
                    [Op.in]: ['CONFIRMED']
                },
                booking_type: {
                    [Op.in]: ['HOTEL', 'PACKAGE']
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
            console.log(`❌ No booking found for traveler ${travelerId} and hotel package ${packageId}`);
            return res.status(403).json({ success: false, message: 'Only buyers who completed payment can leave a review' });
        }

        console.log(`✅ Booking found: booking_id=${purchase.booking_id}, status=${purchase.booking_status}`);

        // Check if user already reviewed
        const existingReview = await Review.findOne({
            where: {
                package_id: packageId,
                traveler_id: travelerId
            }
        });

        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this hotel' });
        }

        // Create review
        const review = await Review.create({
            package_id: packageId,
            traveler_id: travelerId,
            rating,
            comment: comment || ''
        });

        console.log(`⭐ Hotel review created successfully: review_id=${review.review_id}`);
        res.status(201).json({ success: true, message: 'Review added successfully', review_id: review.review_id });
    } catch (error) {
        console.error('Error adding hotel review:', error);
        res.status(500).json({ success: false, message: 'Failed to add review' });
    }
});

/**
 * @route   GET /api/hotels/:packageId/can-review
 * @desc    Check if current user can review a hotel package
 * @access  Protected
 */
router.get('/:packageId/can-review', authenticate, async (req, res) => {
    try {
        const { Booking, Review, Payment } = require('../models/index');
        const packageId = req.params.packageId;
        const travelerId = req.user.id;

        console.log(`🔍 Checking hotel review eligibility for traveler ${travelerId} and package ${packageId}`);

        // Eligible only if traveler has a CONFIRMED booking + SUCCESS payment for this hotel package.
        const purchase = await Booking.findOne({
            where: {
                traveler_id: travelerId,
                package_id: packageId,
                booking_status: {
                    [Op.in]: ['CONFIRMED']
                },
                booking_type: {
                    [Op.in]: ['HOTEL', 'PACKAGE']
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

        console.log(`📦 Hotel booking found:`, purchase ? 'Yes' : 'No');

        // Check if already reviewed
        const existingReview = await Review.findOne({
            where: {
                package_id: packageId,
                traveler_id: travelerId
            }
        });

        console.log(`⭐ Existing hotel review found:`, existingReview ? 'Yes' : 'No');
        console.log(`✅ Response: canReview=${!!purchase}, hasReviewed=${!!existingReview}`);

        res.json({
            success: true,
            data: {
                canReview: !!purchase,
                hasReviewed: !!existingReview
            }
        });
    } catch (error) {
        console.error('Error checking hotel review eligibility:', error);
        res.status(500).json({ success: false, message: 'Failed to check eligibility' });
    }
});

/**
 * @route   GET /api/hotels/:packageId
 * @desc    Get a single approved hotel package by id
 * @access  Public
 */
router.get('/:packageId', async (req, res) => {
    const { packageId } = req.params;

    try {
        const pkg = await Package.findOne({
            where: { package_id: packageId, status: 'APPROVED', package_type: 'HOTEL' }
        });

        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Hotel not found' });
        }

        res.json({ success: true, data: pkg.toJSON() });
    } catch (error) {
        console.error('Error fetching hotel by id:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch hotel', error: error.message });
    }
});

/**
 * @route   PUT /api/hotels/:packageId
 * @desc    Update a hotel package (hotel owner only)
 * @access  Protected (Provider - Hotel)
 */
router.put('/:packageId', authenticate, authorize('provider'), async (req, res) => {
    const packageId = req.params.packageId;
    const provider_id = req.user.id;

    if (req.user.providerType !== 'HOTEL') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only hotels can update hotel packages.'
        });
    }

    try {
        const pkg = await Package.findOne({ where: { package_id: packageId, package_type: 'HOTEL' } });
        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Hotel package not found' });
        }

        if (pkg.provider_id !== provider_id) {
            return res.status(403).json({ success: false, message: 'Access denied. You do not own this hotel package.' });
        }

        // Allow updating these fields that the hotel representative provided during creation
        const { title, destination, price, description } = req.body;

        const updates = {};
        if (title !== undefined) updates.title = title;
        if (destination !== undefined) updates.destination = destination;
        if (price !== undefined) updates.price = price;
        if (description !== undefined) updates.description = description;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        await Package.update(updates, { where: { package_id: packageId } });

        res.json({ success: true, message: 'Hotel package updated successfully' });
    } catch (error) {
        console.error('Error updating hotel package:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update hotel package',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/hotels/:packageId
 * @desc    Delete a hotel package (hotel owner only)
 * @access  Protected (Provider - Hotel)
 */
router.delete('/:packageId', authenticate, authorize('provider'), async (req, res) => {
    const packageId = req.params.packageId;
    const provider_id = req.user.id;

    if (req.user.providerType !== 'HOTEL') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only hotels can delete hotel packages.'
        });
    }

    try {
        const pkg = await Package.findOne({ where: { package_id: packageId, package_type: 'HOTEL' } });
        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Hotel package not found' });
        }

        if (pkg.provider_id !== provider_id) {
            return res.status(403).json({ success: false, message: 'Access denied. You do not own this hotel package.' });
        }

        await Package.destroy({ where: { package_id: packageId } });

        res.json({ success: true, message: 'Hotel package deleted successfully' });
    } catch (error) {
        console.error('Error deleting hotel package:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete hotel package',
            error: error.message
        });
    }
});

module.exports = router;
