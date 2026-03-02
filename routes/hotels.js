const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/hotels/packages
 * @desc    Create a new hotel package
 * @access  Hotel Provider
 */
router.post('/packages', authenticate, authorize('provider'), async (req, res) => {
    if (req.user.providerType !== 'HOTEL') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only hotels can post hotel packages.'
        });
    }

    const {
        title,
        description,
        destination,
        price,
        is_limited_time,
        offer_ends_at
    } = req.body;

    const provider_id = req.user.id;

    try {
        const [result] = await pool.execute(
            `INSERT INTO package (
                provider_id, package_type, title, description, destination, 
                price, is_limited_time, offer_ends_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                provider_id,
                'HOTEL',
                title,
                description,
                destination,
                price,
                is_limited_time || false,
                offer_ends_at || null,
                'APPROVED'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Hotel package created successfully',
            packageId: result.insertId
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
 * @access  Hotel Provider
 */
router.get('/my-packages', authenticate, authorize('provider'), async (req, res) => {
    if (req.user.providerType !== 'HOTEL') {
        return res.status(403).json({
            success: false,
            message: 'Access denied.'
        });
    }

    const provider_id = req.user.id;

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM package WHERE provider_id = ? AND package_type = "HOTEL" ORDER BY created_at DESC',
            [provider_id]
        );

        res.json({
            success: true,
            data: rows
        });
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
