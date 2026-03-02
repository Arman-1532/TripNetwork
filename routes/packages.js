
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/packages
 * @desc    Create a new travel package
 * @access  Provider (Agency)
 */
router.post('/', authenticate, authorize('provider'), async (req, res) => {
    if (req.user.providerType !== 'AGENCY') {
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
        offer_ends_at
    } = req.body;

    const provider_id = req.user.id; // User ID from decoded token

    try {
        const [result] = await pool.execute(
            `INSERT INTO package (
                provider_id, package_type, title, description, destination, 
                origin, travel_medium, price, is_limited_time, offer_ends_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                provider_id,
                'TRAVEL', // Enforce TRAVEL type
                title,
                description,
                destination,
                origin,
                travel_medium,
                price,
                is_limited_time || false,
                offer_ends_at || null,
                'APPROVED' // Default to approved for demo purposes
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Travel package created successfully',
            packageId: result.insertId
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
 * @desc    Get all active packages
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT p.*, a.agency_name, h.hotel_name
             FROM package p 
             LEFT JOIN agency a ON p.provider_id = a.agency_id 
             LEFT JOIN hotel h ON p.provider_id = h.hotel_id
             WHERE p.status = 'APPROVED' 
             ORDER BY p.created_at DESC`
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch packages',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/packages/my-packages
 * @desc    Get packages created by the current provider
 * @access  Provider
 */
router.get('/my-packages', authenticate, authorize('provider'), async (req, res) => {
    if (req.user.providerType !== 'AGENCY') {
        return res.status(403).json({
            success: false,
            message: 'Access denied.'
        });
    }

    const provider_id = req.user.id;

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM package WHERE provider_id = ? AND package_type = "TRAVEL" AND (NOT JSON_VALID(description) OR (CASE WHEN JSON_VALID(description) THEN JSON_EXTRACT(description, "$.isCustomRequest") ELSE NULL END) IS NULL OR (CASE WHEN JSON_VALID(description) THEN JSON_EXTRACT(description, "$.status") ELSE NULL END) = "ACCEPTED") ORDER BY created_at DESC',
            [provider_id]
        );

        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching my packages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your packages',
            error: error.message
        });
    }
});

module.exports = router;
