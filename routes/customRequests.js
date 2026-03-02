
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/custom-requests
 * @desc    Create a custom travel request
 * @access  Traveler
 */
router.post('/', authenticate, async (req, res) => {
    const { destination, budget, description, num_people, departure_date } = req.body;
    const traveler_id = req.user.id;

    // We use any existing provider as a temporary holder
    // In a real app, we'd have a system provider ID
    const dummyProviderId = 2;

    const customMetadata = {
        isCustomRequest: true,
        travelerId: traveler_id,
        budget: budget,
        numPeople: num_people,
        departureDate: departure_date,
        bids: []
    };

    try {
        const [result] = await pool.execute(
            `INSERT INTO package (
                provider_id, package_type, title, description, destination, 
                price, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                dummyProviderId,
                'TRAVEL',
                `Custom Trip: ${destination}`,
                JSON.stringify(customMetadata),
                destination,
                budget || 0,
                'PENDING' // Pending until a bid is accepted
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Custom travel request submitted successfully',
            requestId: result.insertId
        });
    } catch (error) {
        console.error('Error creating custom request:', error);
        res.status(500).json({ success: false, message: 'Failed to submit request' });
    }
});

/**
 * @route   GET /api/custom-requests/available
 * @desc    Get all available custom requests for agencies to bid on
 * @access  Provider
 */
router.get('/available', authenticate, authorize('provider'), async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT p.*, u.name as traveler_name 
             FROM package p
             INNER JOIN user u ON (CASE WHEN JSON_VALID(p.description) THEN JSON_UNQUOTE(JSON_EXTRACT(p.description, '$.travelerId')) ELSE NULL END) = u.user_id
             WHERE JSON_VALID(p.description) 
             AND p.status = 'PENDING' 
             AND JSON_CONTAINS(p.description, 'true', '$.isCustomRequest')`
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching available requests:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requests' });
    }
});

/**
 * @route   GET /api/custom-requests/my-requests
 * @desc    Get traveler's own custom requests
 * @access  Traveler
 */
router.get('/my-requests', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT * FROM package 
             WHERE JSON_VALID(description) 
             AND (CASE WHEN JSON_VALID(description) THEN JSON_UNQUOTE(JSON_EXTRACT(description, '$.travelerId')) ELSE NULL END) = ? 
             AND JSON_CONTAINS(description, 'true', '$.isCustomRequest')`,
            [req.user.id]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching my requests:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch requests' });
    }
});

/**
 * @route   POST /api/custom-requests/:requestId/bid
 * @desc    Submit a bid for a custom request
 * @access  Provider
 */
router.post('/:requestId/bid', authenticate, authorize('provider'), async (req, res) => {
    const { requestId } = req.params;
    const { amount, message } = req.body;
    const agency_id = req.user.id;

    try {
        const [rows] = await pool.execute('SELECT description FROM package WHERE package_id = ?', [requestId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Request not found' });

        let metadata = JSON.parse(rows[0].description);

        // Add or update bid
        const existingBidIndex = metadata.bids.findIndex(b => b.agencyId === agency_id);
        const newBid = {
            agencyId: agency_id,
            agencyName: req.user.name || 'Agency',
            amount: parseFloat(amount),
            message: message,
            timestamp: new Date().toISOString()
        };

        if (existingBidIndex > -1) {
            metadata.bids[existingBidIndex] = newBid;
        } else {
            metadata.bids.push(newBid);
        }

        await pool.execute(
            'UPDATE package SET description = ? WHERE package_id = ?',
            [JSON.stringify(metadata), requestId]
        );

        res.json({ success: true, message: 'Bid submitted successfully' });
    } catch (error) {
        console.error('Error submitting bid:', error);
        res.status(500).json({ success: false, message: 'Failed to submit bid' });
    }
});

/**
 * @route   POST /api/custom-requests/:requestId/accept-bid
 * @desc    Accept a bid and finalize the package
 * @access  Traveler
 */
router.post('/:requestId/accept-bid', authenticate, async (req, res) => {
    const { requestId } = req.params;
    const { agencyId } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute('SELECT * FROM package WHERE package_id = ?', [requestId]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        let metadata = JSON.parse(rows[0].description);
        if (metadata.travelerId !== req.user.id) {
            await connection.rollback();
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const acceptedBid = metadata.bids.find(b => b.agencyId == agencyId);
        if (!acceptedBid) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Bid not found' });
        }

        // 1. Update package: change owner to agency, set price, mark as approved
        const updatedMetadata = {
            ...metadata,
            acceptedBid: { ...acceptedBid, acknowledgedByAgency: false },
            status: 'ACCEPTED',
            acceptedAt: new Date().toISOString()
        };

        await connection.execute(
            `UPDATE package SET 
                provider_id = ?, 
                price = ?, 
                status = 'APPROVED',
                description = ?
             WHERE package_id = ?`,
            [
                agencyId,
                acceptedBid.amount,
                JSON.stringify(updatedMetadata),
                requestId
            ]
        );

        const [bookingResult] = await connection.execute(
            `INSERT INTO booking 
             (traveler_id, booking_type, package_id, num_people, total_price, booking_status) 
             VALUES (?, 'PACKAGE', ?, ?, ?, 'PENDING')`,
            [
                req.user.id,
                requestId,
                metadata.numPeople || 1,
                acceptedBid.amount
            ]
        );

        const bookingId = bookingResult.insertId;

        // 3. Create Payment Record (Pending) - Needed for SSLCommerz transaction_id
        const trans_id = `CUSTOM_${bookingId}_${Date.now()}`;
        await connection.execute(
            `INSERT INTO payment (
                booking_id, traveler_id, amount, payment_method, transaction_id, payment_status
            ) VALUES (?, ?, ?, 'BKASH', ?, 'PENDING')`,
            [bookingId, req.user.id, acceptedBid.amount, trans_id]
        );

        await connection.commit();
        res.json({
            success: true,
            message: 'Bid accepted! Redirecting to payment...',
            data: { bookingId }
        });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error accepting bid:', error);
        res.status(500).json({ success: false, message: 'Failed to accept bid' });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * @route   POST /api/custom-requests/:requestId/acknowledge-bid
 * @desc    Agency acknowledges that their bid was accepted (Dismisses notification)
 * @access  Provider
 */
router.post('/:requestId/acknowledge-bid', authenticate, authorize('provider'), async (req, res) => {
    const { requestId } = req.params;
    const agency_id = req.user.id;

    try {
        const [rows] = await pool.execute('SELECT description FROM package WHERE package_id = ?', [requestId]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Request not found' });

        let metadata = JSON.parse(rows[0].description);
        if (metadata.acceptedBid && metadata.acceptedBid.agencyId == agency_id) {
            metadata.acceptedBid.acknowledgedByAgency = true;
            await pool.execute(
                'UPDATE package SET description = ? WHERE package_id = ?',
                [JSON.stringify(metadata), requestId]
            );
            res.json({ success: true, message: 'Notification acknowledged' });
        } else {
            res.status(403).json({ success: false, message: 'Unauthorized' });
        }
    } catch (error) {
        console.error('Error acknowledging bid:', error);
        res.status(500).json({ success: false, message: 'Failed to acknowledge bid' });
    }
});

module.exports = router;
