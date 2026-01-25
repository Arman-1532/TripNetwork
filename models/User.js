/**
 * User Model - MySQL Implementation
 * Manages user data, authentication, and role-based access
 */

const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

// User roles enum
const USER_ROLES = {
  TRAVELER: 'traveler',
  TRAVEL_AGENCY: 'travel_agency',
  HOTEL_REPRESENTATIVE: 'hotel_representative',
  ADMIN: 'admin'
};

// Approval status enum - mapped to DB values
const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'ACTIVE',  // DB uses 'ACTIVE', helper uses 'APPROVED' for consistency
  REJECTED: 'BLOCKED'  // DB uses 'BLOCKED', helper uses 'REJECTED'
};

class User {
  /**
   * Create a new user with hashed password
   */
  static async create(userData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Validate input (keep existing validation logic structure)
      const validationError = User.validateUserData(userData);
      if (validationError) throw new Error(validationError);

      // Check if email exists
      if (await User.findByEmail(userData.email)) {
        throw new Error('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Determine status
      let status = 'PENDING';
      if (userData.role === 'traveler') {
        status = 'ACTIVE';
      }

      // Map role to DB enum
      let dbRole = userData.role.toUpperCase();
      if (dbRole === 'TRAVEL_AGENCY' || dbRole === 'HOTEL_REPRESENTATIVE') {
        dbRole = 'PROVIDER';
      }

      // Insert into user table
      const [userResult] = await connection.execute(
        `INSERT INTO user (name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [userData.name || userData.agencyName || userData.hotelName, userData.email, userData.phone, hashedPassword, dbRole, status]
      );

      const userId = userResult.insertId;

      // Insert into specific role table
      if (userData.role === 'traveler') {
        await connection.execute(
          `INSERT INTO traveler (traveler_id) VALUES (?)`,
          [userId]
        );
      } else if (userData.role === 'travel_agency') {
        // Provider entry first
        await connection.execute(
          `INSERT INTO provider (provider_id, provider_type, trade_license_id, address, website) VALUES (?, 'AGENCY', ?, ?, ?)`,
          [userId, userData.tradeLicenseId, userData.address, userData.website || null]
        );
        // Agency entry
        await connection.execute(
          `INSERT INTO agency (agency_id, agency_name) VALUES (?, ?)`,
          [userId, userData.agencyName]
        );
      } else if (userData.role === 'hotel_representative') {
        // Provider entry first
        await connection.execute(
          `INSERT INTO provider (provider_id, provider_type, trade_license_id, address, website) VALUES (?, 'HOTEL', ?, ?, ?)`,
          [userId, userData.tradeLicenseId, userData.address, userData.website || null]
        );
        // Hotel entry
        await connection.execute(
          `INSERT INTO hotel (hotel_id, hotel_name, location) VALUES (?, ?, ?)`,
          [userId, userData.hotelName, userData.address] // Using address as location for now
        );
      }

      await connection.commit();

      // Return user data (sanitized)
      return {
        id: userId,
        email: userData.email,
        role: userData.role,
        status
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static validateUserData(data) {
    if (!data.email || !data.password || !data.role) return 'Missing required fields';
    return null; // Simplified for now
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM user WHERE email = ?', [email]);
    if (rows.length === 0) return null;
    return User.mapDbUserToModel(rows[0]);
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM user WHERE user_id = ?', [id]);
    if (rows.length === 0) return null;
    return User.mapDbUserToModel(rows[0]);
  }

  static async authenticate(email, password) {
    const user = await User.findByEmail(email);
    if (!user) throw new Error('Invalid credentials');

    // DB stores password_hash column
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('Invalid credentials');

    if (user.approvalStatus !== 'ACTIVE') {
      throw new Error('Account not active');
    }

    return User.sanitizeUser(user);
  }

  static sanitizeUser(user) {
    const { password, ...rest } = user;
    return rest;
  }

  static mapDbUserToModel(dbUser) {
    return {
      id: dbUser.user_id,
      email: dbUser.email,
      password: dbUser.password_hash, // Keep needed for auth check
      role: dbUser.role.toLowerCase(), // Map back to lowercase if needed
      approvalStatus: dbUser.status,
      name: dbUser.name,
      phone: dbUser.phone
      // Note: Full mapping would join mostly needed
    };
  }
}

module.exports = { User, USER_ROLES, APPROVAL_STATUS };
