const express = require('express');
const router  = express.Router();
const { Package, User, sequelize } = require('../models/index');
const { authenticate, authorize }  = require('../middleware/auth');

/**
 * @route   POST /api/custom-requests
 * @desc    Create a custom travel request
 * @access  Traveler
 */
router.post('/', authenticate, async (req, res) => {
    const { destination, budget, description, num_people, departure_date } = req.body;
    const traveler_id = req.user.id;

    // Configurable placeholder provider_id for holding custom requests until assigned.
    const dummyProviderId = parseInt(process.env.CUSTOM_REQUEST_PLACEHOLDER_PROVIDER_ID || '2', 10);

    const customMetadata = {
        isCustomRequest: true,
        travelerId:      traveler_id,
        budget,
        numPeople:       num_people,
        departureDate:   departure_date,
        bids:            []
    };

    try {
        const pkg = await Package.create({
            provider_id:  Number.isFinite(dummyProviderId) ? dummyProviderId : 2,
            package_type: 'TRAVEL',
            title:        `Custom Trip: ${destination}`,
            description:  JSON.stringify(customMetadata),
            destination,
            price:        budget || 0,
            status:       'PENDING'
        });

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
router.get('/available', authenticate, authorize('provider'), async (req, res) => {
    try {
        // Fetch all PENDING TRAVEL packages and filter custom requests in JS
        // (avoids MySQL-specific JSON_VALID / JSON_CONTAINS functions)
        const rows = await Package.findAll({
            where: { status: 'PENDING', package_type: 'TRAVEL' }
        });

        const customRequests = rows.filter(pkg => {
            try {
                const meta = JSON.parse(pkg.description);
                return meta && meta.isCustomRequest === true;
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
router.post('/:requestId/bid', authenticate, authorize('provider'), async (req, res) => {
    const { requestId }      = req.params;
    const { amount, message } = req.body;
    const agency_id          = req.user.id;

    try {
        const pkg = await Package.findOne({ where: { package_id: requestId } });
        if (!pkg) return res.status(404).json({ success: false, message: 'Request not found' });

        let metadata = JSON.parse(pkg.description);

        const existingBidIndex = metadata.bids.findIndex(b => b.agencyId === agency_id);
        const newBid = {
            agencyId:   agency_id,
            agencyName: req.user.name || 'Agency',
            amount:     parseFloat(amount),
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
    const { agencyId }  = req.body;

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

        // 2. Create booking
        const { Booking, Payment } = require('../models/index');
        const booking = await Booking.create({
            traveler_id:    req.user.id,
            booking_type:   'PACKAGE',
            package_id:     requestId,
            num_people:     metadata.numPeople || 1,
            total_price:    acceptedBid.amount,
            booking_status: 'PENDING'
        }, { transaction: t });

        const bookingId = booking.booking_id;
        const trans_id  = `CUSTOM_${bookingId}_${Date.now()}`;

        // 3. Create payment record
        await Payment.create({
            booking_id:     bookingId,
            traveler_id:    req.user.id,
            amount:         acceptedBid.amount,
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
 * @route   POST /api/custom-requests/:requestId/acknowledge-bid
 * @desc    Agency acknowledges that their bid was accepted
 * @access  Provider
 */
router.post('/:requestId/acknowledge-bid', authenticate, authorize('provider'), async (req, res) => {
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
