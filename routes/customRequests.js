const express = require('express');
const router  = express.Router();
const { Package, User, Provider, Agency, Notification, sequelize } = require('../models/index');
const { authenticate, authorize }  = require('../middleware/auth');

/**
 * @route   POST /api/custom-requests
 * @desc    Create a custom travel request
 * @access  Traveler
 */
router.post('/', authenticate, async (req, res) => {
    const { destination, budget, description, num_people, departure_date } = req.body;
    const traveler_id = req.user.id;

    try {
        // Make the request available to all travel agencies and keep a valid FK provider owner.
        const agencyProviders = await Provider.findAll({
            where: { provider_type: 'AGENCY' },
            attributes: ['provider_id']
        });

        if (!agencyProviders.length) {
            return res.status(400).json({
                success: false,
                message: 'No travel agencies are currently available to receive requests.'
            });
        }

        const allAgencyIds = agencyProviders.map(p => Number(p.provider_id)).filter(Number.isFinite);
        const ownerProviderId = allAgencyIds[0];

        const customMetadata = {
            isCustomRequest: true,
            travelerId: traveler_id,
            budget,
            numPeople: num_people,
            departureDate: departure_date,
            notes: description || '',
            visibleToAgencyIds: allAgencyIds,
            bids: []
        };

        const pkg = await Package.create({
            provider_id: ownerProviderId,
            package_type: 'TRAVEL',
            title:        `Custom Trip: ${destination}`,
            description:  JSON.stringify(customMetadata),
            destination,
            price:        budget || 0,
            status:       'PENDING'
        });

        // Broadcast in-app notifications to all agency providers.
        // Non-fatal: request creation should still succeed even if notification insert fails.
        try {
            const traveler = await User.findOne({
                where: { user_id: traveler_id },
                attributes: ['name', 'email', 'phone']
            });

            let createdCount = 0;
            for (const agencyId of allAgencyIds) {
                try {
                    await Notification.create({
                        provider_id: agencyId,
                        // Existing schema expects this required field.
                        // For custom requests, 0 is used as a sentinel (no booking yet).
                        booking_id: 0,
                        traveler_name: traveler?.name || req.user?.name || 'Traveler',
                        traveler_email: traveler?.email || req.user?.email || 'N/A',
                        traveler_phone: traveler?.phone || 'N/A',
                        num_travelers: Number(num_people) > 0 ? Number(num_people) : 1,
                        package_title: `New Custom Request: ${destination}`,
                        package_id: pkg.package_id,
                        is_read: false
                    });
                    createdCount += 1;
                } catch (singleNotificationError) {
                    console.error(`Failed to create custom request notification for provider ${agencyId}:`, singleNotificationError.message);
                }
            }
            console.log(`Custom request ${pkg.package_id}: notifications sent to ${createdCount}/${allAgencyIds.length} agencies`);
        } catch (notificationError) {
            console.error('Failed to broadcast custom request notifications:', notificationError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Custom travel request submitted successfully',
            requestId: pkg.package_id
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
router.get('/available', authenticate, authorize('PROVIDER'), async (req, res) => {
    if (String(req.user.providerType || '').toUpperCase() !== 'AGENCY') {
        return res.status(403).json({ success: false, message: 'Only travel agencies can access custom requests.' });
    }

    try {
        // Fetch all PENDING TRAVEL packages and filter custom requests in JS
        // (avoids MySQL-specific JSON_VALID / JSON_CONTAINS functions)
        const rows = await Package.findAll({
            where: { status: 'PENDING', package_type: 'TRAVEL' }
        });

        const customRequests = rows.filter(pkg => {
            try {
                const meta = JSON.parse(pkg.description);
                if (!meta || meta.isCustomRequest !== true) return false;

                // New records explicitly list all agencies they were broadcast to.
                if (Array.isArray(meta.visibleToAgencyIds) && meta.visibleToAgencyIds.length > 0) {
                    return meta.visibleToAgencyIds.map(Number).includes(Number(req.user.id));
                }

                // Backward-compatible fallback for old records.
                return true;
            } catch {
                return false;
            }
        });

        // Attach traveler name for each request
        const data = await Promise.all(customRequests.map(async pkg => {
            const plain = pkg.toJSON();
            try {
                const meta = JSON.parse(plain.description);
                const traveler = await User.findOne({ where: { user_id: meta.travelerId } });
                plain.traveler_name = traveler ? traveler.name : null;
            } catch {
                plain.traveler_name = null;
            }
            return plain;
        }));

        res.json({ success: true, data });
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
        const rows = await Package.findAll({ where: { package_type: 'TRAVEL' } });

        const travelerId = req.user.id;
        const data = rows.filter(pkg => {
            try {
                const meta = JSON.parse(pkg.description);
                return meta && meta.isCustomRequest && meta.travelerId == travelerId;
            } catch {
                return false;
            }
        }).map(pkg => pkg.toJSON());

        res.json({ success: true, data });
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
router.post('/:requestId/bid', authenticate, authorize('PROVIDER'), async (req, res) => {
    const { requestId }      = req.params;
    const { amount, message } = req.body;
    const agency_id          = req.user.id;

    if (String(req.user.providerType || '').toUpperCase() !== 'AGENCY') {
        return res.status(403).json({ success: false, message: 'Only travel agencies can submit bids.' });
    }

    try {
        const pkg = await Package.findOne({ where: { package_id: requestId } });
        if (!pkg) return res.status(404).json({ success: false, message: 'Request not found' });

        let metadata = JSON.parse(pkg.description);

        if (Array.isArray(metadata.visibleToAgencyIds) && metadata.visibleToAgencyIds.length > 0) {
            const allowedIds = metadata.visibleToAgencyIds.map(Number);
            if (!allowedIds.includes(Number(agency_id))) {
                return res.status(403).json({ success: false, message: 'This request is not available for your agency.' });
            }
        }

        const agencyProfile = await Agency.findOne({
            where: { agency_id: agency_id },
            attributes: ['agency_name']
        });

        if (!Array.isArray(metadata.bids)) {
            metadata.bids = [];
        }

        const normalizedAmount = Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid bid amount' });
        }

        // Use numeric comparison to avoid duplicate bids when agency_id type differs (string vs number).
        const existingBidIndex = metadata.bids.findIndex(b => Number(b?.agencyId) === Number(agency_id));
        const newBid = {
            agencyId:   Number(agency_id),
            agencyName: agencyProfile?.agency_name || req.user.name || 'Agency',
            amount:     normalizedAmount,
            message,
            timestamp:  new Date().toISOString()
        };

        if (existingBidIndex > -1) {
            metadata.bids[existingBidIndex] = newBid;
        } else {
            metadata.bids.push(newBid);
        }

        await Package.update(
            { description: JSON.stringify(metadata) },
            { where: { package_id: requestId } }
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
    const { agencyId, travelers }  = req.body;

    const t = await sequelize.transaction();
    try {
        const pkg = await Package.findOne({ where: { package_id: requestId }, transaction: t });
        if (!pkg) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        let metadata = JSON.parse(pkg.description);
        if (metadata.travelerId !== req.user.id) {
            await t.rollback();
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const acceptedBid = metadata.bids.find(b => b.agencyId == agencyId);
        if (!acceptedBid) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'Bid not found' });
        }

        // Mark bid as accepted in metadata
        metadata.bids = metadata.bids.map(b =>
            b.agencyId == agencyId ? { ...b, status: 'ACCEPTED' } : b
        );

        const updatedMetadata = {
            ...metadata,
            acceptedBid: { ...acceptedBid, acknowledgedByAgency: false },
            status:      'ACCEPTED',
            acceptedAt:  new Date().toISOString()
        };

        // 1. Re-assign package to the winning agency
        await Package.update(
            {
                provider_id: agencyId,
                price:       acceptedBid.amount,
                status:      'APPROVED',
                description: JSON.stringify(updatedMetadata)
            },
            { where: { package_id: requestId }, transaction: t }
        );

        // 2. Create booking — include traveler details if provided
        const { Booking, Payment } = require('../models/index');
        const numPeople = (Array.isArray(travelers) && travelers.length > 0)
            ? travelers.length
            : (metadata.numPeople || 1);

        const booking = await Booking.create({
            traveler_id:      req.user.id,
            booking_type:     'PACKAGE',
            package_id:       requestId,
            num_people:       numPeople,
            total_price:      acceptedBid.amount,
            booking_status:   'PENDING',
            passenger_details: Array.isArray(travelers) && travelers.length > 0 ? travelers : null
        }, { transaction: t });

        const bookingId = booking.booking_id;
        const trans_id  = `CUSTOM_${bookingId}_${Date.now()}`;

        // 3. Create payment record
        await Payment.create({
            booking_id:     bookingId,
            traveler_id:    req.user.id,
            amount:         acceptedBid.amount,
            // Keep DB-compatible token for older schemas where payment_method enum
            // does not include SSLCOMMERZ yet.
            payment_method: 'BKASH',
            transaction_id: trans_id,
            payment_status: 'PENDING'
        }, { transaction: t });

        await t.commit();
        res.json({
            success: true,
            message: 'Bid accepted! Redirecting to payment...',
            data:    { bookingId }
        });
    } catch (error) {
        await t.rollback();
        console.error('Error accepting bid:', error);
        res.status(500).json({ success: false, message: 'Failed to accept bid' });
    }
});

/**
 * @route   POST /api/custom-requests/:requestId/reject-bid
 * @desc    Traveler rejects a specific agency bid
 * @access  Traveler (owner of the request)
 */
router.post('/:requestId/reject-bid', authenticate, async (req, res) => {
    const { requestId } = req.params;
    const { agencyId }  = req.body;

    try {
        const pkg = await Package.findOne({ where: { package_id: requestId } });
        if (!pkg) return res.status(404).json({ success: false, message: 'Request not found' });

        let metadata = JSON.parse(pkg.description);
        if (metadata.travelerId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const bidIndex = metadata.bids.findIndex(b => b.agencyId == agencyId);
        if (bidIndex === -1) {
            return res.status(404).json({ success: false, message: 'Bid not found' });
        }

        metadata.bids[bidIndex].status = 'REJECTED';
        await Package.update(
            { description: JSON.stringify(metadata) },
            { where: { package_id: requestId } }
        );

        res.json({ success: true, message: 'Bid rejected' });
    } catch (error) {
        console.error('Error rejecting bid:', error);
        res.status(500).json({ success: false, message: 'Failed to reject bid' });
    }
});

/**
 * @route   POST /api/custom-requests/:requestId/acknowledge-bid
 * @desc    Agency acknowledges that their bid was accepted
 * @access  Provider
 */
router.post('/:requestId/acknowledge-bid', authenticate, authorize('PROVIDER'), async (req, res) => {
    const { requestId } = req.params;
    const agency_id     = req.user.id;

    try {
        const pkg = await Package.findOne({ where: { package_id: requestId } });
        if (!pkg) return res.status(404).json({ success: false, message: 'Request not found' });

        let metadata = JSON.parse(pkg.description);
        if (metadata.acceptedBid && metadata.acceptedBid.agencyId == agency_id) {
            metadata.acceptedBid.acknowledgedByAgency = true;
            await Package.update(
                { description: JSON.stringify(metadata) },
                { where: { package_id: requestId } }
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
