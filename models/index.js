/**
 * models/index.js
 * Loads all Sequelize models, wires associations, and exports them.
 */

const sequelize = require('../config/sequelize');
// Use bcryptjs (pure JS) instead of native bcrypt to avoid macOS native binary/code-signing issues
const bcrypt    = require('bcryptjs');

const User     = require('./User');
const Traveler = require('./Traveler');
const Provider = require('./Provider');
const Hotel    = require('./Hotel');
const Agency   = require('./Agency');
const Package  = require('./Package');
const Booking  = require('./Booking');
const Payment  = require('./Payment');
const ChatMessage = require('./ChatMessage');

// ── Associations ──────────────────────────────────────────────────────────────

// User ↔ Traveler  (1-to-1, traveler_id = user PK)
User.hasOne(Traveler, { foreignKey: 'traveler_id', as: 'traveler' });
Traveler.belongsTo(User, { foreignKey: 'traveler_id', as: 'user' });

// User ↔ Provider  (1-to-1, provider_id = user PK)
User.hasOne(Provider, { foreignKey: 'provider_id', as: 'provider' });
Provider.belongsTo(User, { foreignKey: 'provider_id', as: 'user' });

// Provider ↔ Hotel  (1-to-1, hotel_id = provider PK)
Provider.hasOne(Hotel, { foreignKey: 'hotel_id', as: 'hotel' });
Hotel.belongsTo(Provider, { foreignKey: 'hotel_id', as: 'provider' });

// Provider ↔ Agency  (1-to-1, agency_id = provider PK)
Provider.hasOne(Agency, { foreignKey: 'agency_id', as: 'agency' });
Agency.belongsTo(Provider, { foreignKey: 'agency_id', as: 'provider' });

// Provider ↔ Package  (1-to-many, through provider_id)
Provider.hasMany(Package, { foreignKey: 'provider_id', as: 'packages' });
Package.belongsTo(Provider, { foreignKey: 'provider_id', as: 'provider' });

// Traveler ↔ Booking  (1-to-many)
Traveler.hasMany(Booking, { foreignKey: 'traveler_id', as: 'bookings' });
Booking.belongsTo(Traveler, { foreignKey: 'traveler_id', as: 'traveler' });

// Package ↔ Booking  (1-to-many, optional)
Package.hasMany(Booking, { foreignKey: 'package_id', as: 'bookings' });
Booking.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });

// Booking ↔ Payment  (1-to-1)
Booking.hasOne(Payment, { foreignKey: 'booking_id', as: 'payment' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// Traveler ↔ Payment  (1-to-many)
Traveler.hasMany(Payment, { foreignKey: 'traveler_id', as: 'payments' });
Payment.belongsTo(Traveler, { foreignKey: 'traveler_id', as: 'traveler' });

// Package ↔ ChatMessage (1-to-many)
Package.hasMany(ChatMessage, { foreignKey: 'package_id', as: 'chatMessages' });
ChatMessage.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });

// User ↔ ChatMessage (1-to-many)
User.hasMany(ChatMessage, { foreignKey: 'sender_user_id', as: 'sentMessages' });
ChatMessage.belongsTo(User, { foreignKey: 'sender_user_id', as: 'sender' });

// ── Auth helpers (previously lived in models/User.js class) ──────────────────

/**
 * Create a full user with the appropriate sub-table entry.
 * Wrapped in a Sequelize transaction for atomicity.
 */
async function createUser(userData) {
    // Validate
    if (!userData.email || !userData.password || !userData.role) {
        throw new Error('Missing required fields');
    }

    // Check duplicate email
    const existing = await User.findOne({ where: { email: userData.email } });
    if (existing) throw new Error('Email already registered');

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    let status = 'PENDING';
    if (userData.role === 'traveler') status = 'ACTIVE';

    // Map role string to DB ENUM
    let dbRole = userData.role.toUpperCase();
    if (dbRole === 'TRAVEL_AGENCY' || dbRole === 'HOTEL_REPRESENTATIVE') {
        dbRole = 'PROVIDER';
    }

    const t = await sequelize.transaction();
    try {
        const user = await User.create({
            name: userData.name || userData.agencyName || userData.hotelName,
            email: userData.email,
            phone: userData.phone,
            password_hash: hashedPassword,
            role: dbRole,
            status
        }, { transaction: t });

        const userId = user.user_id;

        if (userData.role === 'traveler') {
            await Traveler.create({ traveler_id: userId }, { transaction: t });

        } else if (userData.role === 'travel_agency') {
            await Provider.create({
                provider_id: userId,
                provider_type: 'AGENCY',
                trade_license_id: userData.tradeLicenseId,
                address: userData.address,
                website: userData.website || null
            }, { transaction: t });
            await Agency.create({ agency_id: userId, agency_name: userData.agencyName }, { transaction: t });

        } else if (userData.role === 'hotel_representative') {
            await Provider.create({
                provider_id: userId,
                provider_type: 'HOTEL',
                trade_license_id: userData.tradeLicenseId,
                address: userData.address,
                website: userData.website || null
            }, { transaction: t });
            await Hotel.create({
                hotel_id: userId,
                hotel_name: userData.hotelName,
                location: userData.address
            }, { transaction: t });
        }

        await t.commit();
        return { id: userId, email: userData.email, role: userData.role, status };

    } catch (err) {
        await t.rollback();
        throw err;
    }
}

/**
 * Find a user by email, including all provider sub-tables.
 */
async function findUserByEmail(email) {
    const row = await User.findOne({
        where: { email },
        include: [
            { model: Provider, as: 'provider', include: [
                { model: Agency, as: 'agency' },
                { model: Hotel,  as: 'hotel'  }
            ]}
        ]
    });
    if (!row) return null;
    return mapDbUserToModel(row);
}

/**
 * Find a user by PK, including all provider sub-tables.
 */
async function findUserById(id) {
    const row = await User.findOne({
        where: { user_id: id },
        include: [
            { model: Provider, as: 'provider', include: [
                { model: Agency, as: 'agency' },
                { model: Hotel,  as: 'hotel'  }
            ]}
        ]
    });
    if (!row) return null;
    return mapDbUserToModel(row);
}

/**
 * Authenticate email + password, return sanitized user.
 */
async function authenticateUser(email, password) {
    const user = await findUserByEmail(email);
    if (!user) throw new Error('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('Invalid credentials');

    if (user.approvalStatus !== 'ACTIVE') {
        throw new Error('Account not active');
    }

    const { password: _, ...sanitized } = user;
    return sanitized;
}

/**
 * Map a Sequelize User row (with eager-loaded associations) to a plain object
 * that matches the shape the rest of the app expects.
 */
function mapDbUserToModel(row) {
    const p = row.provider;
    return {
        id:            row.user_id,
        email:         row.email,
        password:      row.password_hash,
        role:          row.role.toLowerCase(),
        approvalStatus: row.status,
        name:          row.name,
        phone:         row.phone,
        providerType:  p ? p.provider_type : null,
        tradeLicenseId: p ? p.trade_license_id : null,
        address:       p ? p.address : null,
        website:       p ? p.website : null,
        agencyName:    p && p.agency ? p.agency.agency_name : null,
        hotelName:     p && p.hotel  ? p.hotel.hotel_name   : null,
        hotelLocation: p && p.hotel  ? p.hotel.location      : null,
    };
}

module.exports = {
    sequelize,
    User, Traveler, Provider, Hotel, Agency, Package, Booking, Payment, ChatMessage,
    // Auth helpers
    createUser, findUserByEmail, findUserById, authenticateUser, mapDbUserToModel
};
