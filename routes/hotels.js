const express = require('express');
const router = express.Router();
const { Package } = require('../models/index');
const { authenticate, authorize } = require('../middleware/auth');

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
            package_type:    'HOTEL',
            title,
            description,
            destination,
            price,
            is_limited_time: is_limited_time || false,
            offer_ends_at:   offer_ends_at || null,
            status:          'PENDING'
        });

        res.status(201).json({
            success: true,
            message: 'Hotel package created successfully and is pending approval',
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

module.exports = router;
