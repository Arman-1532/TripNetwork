const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Package, Booking, Provider, User } = require('../models');

// Minimal REST helpers for chat UI discovery.

// GET /api/chat/rooms
// Returns travel-package chat rooms for the logged-in user:
// - traveler: packages they booked (booking_type=PACKAGE)
// - agency provider: packages they own (package_type=TRAVEL)
router.get('/rooms', authenticate, async (req, res) => {
  try {
    const role = (req.user.role || '').toLowerCase();

    if (role === 'traveler') {
      const bookings = await Booking.findAll({
        where: { traveler_id: req.user.id, booking_type: 'PACKAGE' },
        include: [{ model: Package, as: 'package' }],
        order: [['created_at', 'DESC']]
      });

      const rooms = bookings
        .filter(b => b.package && b.package.package_type === 'TRAVEL')
        .map(b => ({
          packageId: b.package.package_id,
          title: b.package.title,
          destination: b.package.destination
        }));

      return res.json({ success: true, data: rooms });
    }

    if (role === 'provider' && req.user.providerType === 'AGENCY') {
      const pkgs = await Package.findAll({
        where: { provider_id: req.user.id, package_type: 'TRAVEL' },
        order: [['created_at', 'DESC']]
      });

      const rooms = pkgs.map(p => ({
        packageId: p.package_id,
        title: p.title,
        destination: p.destination
      }));

      return res.json({ success: true, data: rooms });
    }

    return res.status(403).json({ success: false, message: 'Access denied' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch chat rooms' });
  }
});

module.exports = router;

