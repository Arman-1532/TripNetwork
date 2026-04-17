const express = require('express');
const router = express.Router();
const { Package } = require('../models/index');
const { authenticate, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

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

/**
 * @route   GET /api/hotels/search
 * @desc    Search approved hotel packages
 * @access  Public
 */
router.get('/search', async (req, res) => {
    const { city, roomType, maxPrice } = req.query;

    const where = {
        status: 'APPROVED',
        package_type: 'HOTEL'
    };

    if (city) {
        where.destination = { [Op.like]: `%${city}%` };
    }

    if (maxPrice !== undefined && maxPrice !== null && String(maxPrice).trim() !== '') {
        where.price = { [Op.lte]: Number(maxPrice) };
    }

    try {
        const rows = await Package.findAll({ where, order: [['created_at', 'DESC']] });

        // Optional: filter by roomType from JSON description
        let data = rows.map(r => r.toJSON());
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

module.exports = router;
