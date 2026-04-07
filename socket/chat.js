const jwt = require('jsonwebtoken');
const { User, Provider, Package, Booking, ChatMessage } = require('../models');

// Track who is currently connected per package room.
// Map<packageId, Map<userId, { userId, name, role, providerType }>>
const presenceByPackage = new Map();

function normalizeRole(role) {
  return (role || '').toString().toLowerCase();
}

async function buildSocketUser(userId) {
  // Reuse existing user lookup logic (models/index exports ORM models; middleware uses findUserById,
  // but here we only need providerType and role for authorization).
  const row = await User.findOne({
    where: { user_id: userId },
    include: [{ model: Provider, as: 'provider' }]
  });

  if (!row) return null;

  return {
    id: row.user_id,
    email: row.email,
    name: row.name,
    role: normalizeRole(row.role),
    status: row.status,
    providerType: row.provider ? row.provider.provider_type : null
  };
}

async function canJoinPackageRoom(user, pkg) {
  if (!user || !pkg) return false;

  // Only TRAVEL packages (agency-offered) have chat.
  if (pkg.package_type !== 'TRAVEL') return false;

  // Agency (provider) who owns the package.
  if (user.role === 'provider' && user.providerType === 'AGENCY' && user.id === pkg.provider_id) {
    return true;
  }

  // Any traveler who booked that package.
  if (user.role === 'traveler') {
    const booking = await Booking.findOne({
      where: {
        traveler_id: user.id,
        booking_type: 'PACKAGE',
        package_id: pkg.package_id
      }
    });
    return !!booking;
  }

  // No admin chat for now.
  return false;
}

function upsertPresence(packageId, user) {
  const pid = Number(packageId);
  if (!presenceByPackage.has(pid)) presenceByPackage.set(pid, new Map());
  const map = presenceByPackage.get(pid);
  map.set(user.id, {
    userId: user.id,
    name: user.name,
    role: user.role,
    providerType: user.providerType || null
  });
}

function removePresence(packageId, userId) {
  const pid = Number(packageId);
  const map = presenceByPackage.get(pid);
  if (!map) return;
  map.delete(userId);
  if (map.size === 0) presenceByPackage.delete(pid);
}

function listPresence(packageId) {
  const pid = Number(packageId);
  const map = presenceByPackage.get(pid);
  if (!map) return [];
  return Array.from(map.values());
}

async function getPackageParticipants(pkg) {
  // Agency owner
  const agencyUser = await buildSocketUser(pkg.provider_id);

  // All travelers who booked this package (PACKAGE bookings only)
  const bookings = await Booking.findAll({
    where: { booking_type: 'PACKAGE', package_id: pkg.package_id },
    attributes: ['traveler_id']
  });

  const travelerIds = Array.from(new Set(bookings.map(b => b.traveler_id)));
  const travelers = await Promise.all(travelerIds.map(id => buildSocketUser(id)));

  const all = [];
  if (agencyUser) {
    all.push({
      userId: agencyUser.id,
      name: agencyUser.name,
      role: agencyUser.role,
      providerType: agencyUser.providerType || null
    });
  }

  for (const t of travelers.filter(Boolean)) {
    all.push({
      userId: t.id,
      name: t.name,
      role: t.role,
      providerType: t.providerType || null
    });
  }

  // Stable sort: agency first, then travelers by name.
  all.sort((a, b) => {
    const aIsAgency = a.role === 'provider' && a.providerType === 'AGENCY';
    const bIsAgency = b.role === 'provider' && b.providerType === 'AGENCY';
    if (aIsAgency && !bIsAgency) return -1;
    if (!aIsAgency && bIsAgency) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  return all;
}

function initChat(io) {
  // Socket auth middleware: expects token in `socket.handshake.auth.token` (recommended)
  // Fallback to querystring ?token= for simple clients.
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (socket.handshake.headers?.authorization || '').toString().replace(/^Bearer\s+/i, '');

      if (!token) return next(new Error('AUTH_REQUIRED'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await buildSocketUser(decoded.id);

      if (!user) return next(new Error('AUTH_INVALID'));
      if (user.status !== 'ACTIVE') return next(new Error('ACCOUNT_INACTIVE'));

      socket.user = user;
      return next();
    } catch (err) {
      return next(new Error('AUTH_INVALID'));
    }
  });

  io.on('connection', (socket) => {
    // Keep track of which package rooms this socket joined.
    socket.joinedPackageRooms = new Set();

    async function broadcastMembers(packageId) {
      const room = `package:${packageId}`;
      io.to(room).emit('chat:members', {
        packageId: Number(packageId),
        members: listPresence(packageId)
      });
    }

    // Join: { packageId }
    socket.on('chat:join', async ({ packageId }) => {
      try {
        const pkg = await Package.findOne({ where: { package_id: packageId } });
        if (!pkg) return socket.emit('chat:error', { message: 'Package not found' });

        const allowed = await canJoinPackageRoom(socket.user, pkg);
        if (!allowed) return socket.emit('chat:error', { message: 'Access denied' });

        const room = `package:${pkg.package_id}`;
        await socket.join(room);

        socket.joinedPackageRooms.add(pkg.package_id);
        upsertPresence(pkg.package_id, socket.user);

        socket.emit('chat:joined', { room, packageId: pkg.package_id });
        await broadcastMembers(pkg.package_id);
      } catch {
        socket.emit('chat:error', { message: 'Failed to join chat' });
      }
    });

    // Members (on-demand): { packageId }
    socket.on('chat:members', async ({ packageId }) => {
      try {
        const pkg = await Package.findOne({ where: { package_id: packageId } });
        if (!pkg) return socket.emit('chat:error', { message: 'Package not found' });
        const allowed = await canJoinPackageRoom(socket.user, pkg);
        if (!allowed) return socket.emit('chat:error', { message: 'Access denied' });

        socket.emit('chat:members', {
          packageId: Number(pkg.package_id),
          members: listPresence(pkg.package_id)
        });
      } catch {
        socket.emit('chat:error', { message: 'Failed to load members' });
      }
    });

    // Participants (offline roster): { packageId }
    socket.on('chat:participants', async ({ packageId }) => {
      try {
        const pkg = await Package.findOne({ where: { package_id: packageId } });
        if (!pkg) return socket.emit('chat:error', { message: 'Package not found' });
        const allowed = await canJoinPackageRoom(socket.user, pkg);
        if (!allowed) return socket.emit('chat:error', { message: 'Access denied' });

        const participants = await getPackageParticipants(pkg);
        socket.emit('chat:participants', {
          packageId: Number(pkg.package_id),
          participants
        });
      } catch {
        socket.emit('chat:error', { message: 'Failed to load participants' });
      }
    });

    // History: { packageId, limit? }
    socket.on('chat:history', async ({ packageId, limit = 50 }) => {
      try {
        const pkg = await Package.findOne({ where: { package_id: packageId } });
        if (!pkg) return socket.emit('chat:error', { message: 'Package not found' });
        const allowed = await canJoinPackageRoom(socket.user, pkg);
        if (!allowed) return socket.emit('chat:error', { message: 'Access denied' });

        const rows = await ChatMessage.findAll({
          where: { package_id: pkg.package_id },
          order: [['created_at', 'DESC']],
          limit: Math.min(parseInt(limit, 10) || 50, 200)
        });

        const senderIds = Array.from(new Set(rows.map(r => r.sender_user_id)));
        const senderUsers = await Promise.all(senderIds.map(id => buildSocketUser(id)));
        const senderById = new Map(senderUsers.filter(Boolean).map(u => [u.id, u]));

        const messages = rows.reverse().map(r => {
          const sender = senderById.get(r.sender_user_id);
          return {
            id: r.message_id,
            packageId: r.package_id,
            senderUserId: r.sender_user_id,
            senderName: sender ? sender.name : null,
            senderRole: sender ? sender.role : null,
            body: r.body,
            createdAt: r.created_at
          };
        });

        socket.emit('chat:history', { packageId: pkg.package_id, messages });
      } catch (err) {
        console.error('❌ Error in chat:history:', err);
        socket.emit('chat:error', { message: 'Failed to load history' });
      }
    });

    // Send: { packageId, body }
    socket.on('chat:message', async ({ packageId, body }) => {
      try {
        const text = (body || '').toString().trim();
        if (!text) return;

        const pkg = await Package.findOne({ where: { package_id: packageId } });
        if (!pkg) return socket.emit('chat:error', { message: 'Package not found' });

        const allowed = await canJoinPackageRoom(socket.user, pkg);
        if (!allowed) return socket.emit('chat:error', { message: 'Access denied' });

        const msg = await ChatMessage.create({
          package_id: pkg.package_id,
          sender_user_id: socket.user.id,
          body: text
        });

        const payload = {
          id: msg.message_id,
          packageId: msg.package_id,
          senderUserId: msg.sender_user_id,
          senderName: socket.user.name,
          senderRole: socket.user.role,
          body: msg.body,
          createdAt: msg.created_at
        };

        const room = `package:${pkg.package_id}`;
        io.to(room).emit('chat:message', payload);
      } catch (err) {
        console.error('❌ Error in chat:message:', err);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', async () => {
      // Remove this user from presence for each joined package room and broadcast updated list.
      const joined = Array.from(socket.joinedPackageRooms || []);
      for (const packageId of joined) {
        removePresence(packageId, socket.user?.id);
        const room = `package:${packageId}`;
        io.to(room).emit('chat:members', {
          packageId: Number(packageId),
          members: listPresence(packageId)
        });
      }
    });
  });
}

module.exports = { initChat };
