const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { Package, Booking, Provider, User } = require('../models');

// Minimal REST helpers for chat UI discovery.
function normalizeRoom(pkg) {
  if (!pkg) return null;

  const rawId = pkg.package_id ?? pkg.packageId;
  const packageId = Number(rawId);
  if (!Number.isFinite(packageId)) return null;

  return {
    packageId,
    title: pkg.title || `Package #${packageId}`,
    destination: pkg.destination || null
  };
}

function dedupeRooms(rooms) {
  const roomMap = new Map();

  for (const room of rooms) {
    if (!room || !Number.isFinite(Number(room.packageId))) continue;
    const key = Number(room.packageId);
    if (!roomMap.has(key)) roomMap.set(key, { ...room, packageId: key });
  }

  return Array.from(roomMap.values());
}

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

      const rooms = dedupeRooms(
        bookings
          .filter(b => b.package && b.package.package_type === 'TRAVEL')
          .map(b => normalizeRoom(b.package))
          .filter(Boolean)
      );

      return res.json({ success: true, data: rooms });
    }

    if (role === 'provider' && req.user.providerType === 'AGENCY') {
      const pkgs = await Package.findAll({
        where: { provider_id: req.user.id, package_type: 'TRAVEL' },
        order: [['created_at', 'DESC']]
      });

      const rooms = dedupeRooms(pkgs.map(p => normalizeRoom(p)).filter(Boolean));

      return res.json({ success: true, data: rooms });
    }

    return res.status(403).json({ success: false, message: 'Access denied' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch chat rooms' });
  }
});

module.exports = router;

