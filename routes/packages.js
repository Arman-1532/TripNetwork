const express = require('express');
const router = express.Router();
const { Package, Provider, Agency, Hotel } = require('../models/index');
const { authenticate, authorize } = require('../middleware/auth');

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

    const { title, description, destination, origin, travel_medium, price, is_limited_time, offer_ends_at } = req.body;
    const provider_id = req.user.id;

    try {
        const pkg = await Package.create({
            provider_id,
            package_type:    'TRAVEL',
            title,
            description,
            destination,
            origin,
            travel_medium,
            price,
            is_limited_time: is_limited_time || false,
            offer_ends_at:   offer_ends_at || null,
            status:          'PENDING'
        });

        res.status(201).json({
            success: true,
            message: 'Travel package created successfully and is pending approval',
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
            where: { status: 'APPROVED' },
            include: [
                {
                    model: Provider,
                    as: 'provider',
                    include: [
                        { model: Agency, as: 'agency' },
                        { model: Hotel,  as: 'hotel'  }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Flatten provider names for frontend compatibility
        const data = rows.map(p => {
            const plain = p.toJSON();
            plain.agency_name = plain.provider && plain.provider.agency ? plain.provider.agency.agency_name : null;
            plain.hotel_name  = plain.provider && plain.provider.hotel  ? plain.provider.hotel.hotel_name   : null;
            delete plain.provider;

            // Prevent leaking custom-request bidding metadata on the public packages feed.
            plain.description = sanitizeCustomRequestDescription(plain.description);

            return plain;
        });

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

/**
 * @route   GET /api/packages/my-packages
 * @desc    Get packages created by the current provider (non-custom-request ones)
 * @access  Provider (Agency)
 */
router.get('/my-packages', authenticate, authorize('provider'), async (req, res) => {
    if (req.user.providerType !== 'AGENCY') {
        return res.status(403).json({ success: false, message: 'Access denied.' });
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
 * @route   PUT /api/packages/:id
 * @desc    Update a package (provider owner only)
 * @access  Provider
 */
router.put('/:id', authenticate, authorize('provider'), async (req, res) => {
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
        const allowed = [ 'title', 'description', 'destination', 'origin', 'price', 'travel_medium', 'is_limited_time', 'offer_ends_at' ];
        const updates = {};
        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(req.body, key)) updates[key] = req.body[key];
        }

        // When a provider edits a previously approved package, reflag for approval
        if (pkg.status === 'APPROVED') updates.status = 'PENDING';

        await Package.update(updates, { where: { package_id: packageId } });

        res.json({ success: true, message: 'Package updated successfully' });
    } catch (error) {
        console.error('Error updating package:', error);
        res.status(500).json({ success: false, message: 'Failed to update package', error: error.message });
    }
});

module.exports = router;
