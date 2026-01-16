/**
 * User Model - In-Memory User Store
 * Manages user data, authentication, and role-based access
 */

const bcrypt = require('bcrypt');

// User roles enum
const USER_ROLES = {
  TRAVELER: 'traveler',
  TRAVEL_AGENCY: 'travel_agency',
  HOTEL_REPRESENTATIVE: 'hotel_representative',
  ADMIN: 'admin'
};

// Approval status enum
const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// In-memory user store (resets on server restart)
let users = [];
let userIdCounter = 1;

class User {
  constructor(data) {
    this.id = userIdCounter++;
    this.email = data.email;
    this.password = data.password; // Will be hashed
    this.role = data.role;
    this.approvalStatus = data.approvalStatus || APPROVAL_STATUS.PENDING;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    // Role-specific fields
    if (data.role === USER_ROLES.TRAVELER) {
      this.name = data.name;
      this.phone = data.phone;
    } else if (data.role === USER_ROLES.TRAVEL_AGENCY) {
      this.agencyName = data.agencyName;
      this.nid = data.nid;
      this.tradeLicenseId = data.tradeLicenseId;
      this.address = data.address;
      this.phone = data.phone;
    } else if (data.role === USER_ROLES.HOTEL_REPRESENTATIVE) {
      this.hotelName = data.hotelName;
      this.nid = data.nid;
      this.tradeLicenseId = data.tradeLicenseId;
      this.address = data.address;
      this.phone = data.phone;
    } else if (data.role === USER_ROLES.ADMIN) {
      this.name = data.name;
    }
  }

  /**
   * Create a new user with hashed password
   */
  static async create(userData) {
    // Validate required fields based on role
    const validationError = User.validateUserData(userData);
    if (validationError) {
      throw new Error(validationError);
    }

    // Check if email already exists
    if (User.findByEmail(userData.email)) {
      throw new Error('Email already registered');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Determine approval status based on role
    let approvalStatus = APPROVAL_STATUS.PENDING;
    if (userData.role === USER_ROLES.TRAVELER) {
      approvalStatus = APPROVAL_STATUS.APPROVED; // Travelers auto-approved
    }

    // Create user object
    const user = new User({
      ...userData,
      password: hashedPassword,
      approvalStatus
    });

    // Store user
    users.push(user);

    // Return user without password
    return User.sanitizeUser(user);
  }

  /**
   * Validate user data based on role
   */
  static validateUserData(data) {
    if (!data.email || !data.password || !data.role) {
      return 'Email, password, and role are required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return 'Invalid email format';
    }

    // Password validation
    if (data.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    // Role-specific validation
    if (data.role === USER_ROLES.TRAVELER) {
      if (!data.name || !data.phone) {
        return 'Name and phone are required for travelers';
      }
    } else if (data.role === USER_ROLES.TRAVEL_AGENCY) {
      if (!data.agencyName || !data.nid || !data.tradeLicenseId || !data.address || !data.phone) {
        return 'Agency name, NID, trade license ID, address, and phone are required for travel agencies';
      }
    } else if (data.role === USER_ROLES.HOTEL_REPRESENTATIVE) {
      if (!data.hotelName || !data.nid || !data.tradeLicenseId || !data.address || !data.phone) {
        return 'Hotel name, NID, trade license ID, address, and phone are required for hotel representatives';
      }
    } else if (data.role === USER_ROLES.ADMIN) {
      return 'Admin accounts cannot be created through registration';
    } else {
      return 'Invalid role';
    }

    return null;
  }

  /**
   * Find user by email
   */
  static findByEmail(email) {
    return users.find(user => user.email === email);
  }

  /**
   * Find user by ID
   */
  static findById(id) {
    return users.find(user => user.id === id);
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticate(email, password) {
    const user = User.findByEmail(email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is approved
    if (user.approvalStatus !== APPROVAL_STATUS.APPROVED) {
      throw new Error('Account is pending approval. Please wait for admin approval.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    return User.sanitizeUser(user);
  }

  /**
   * Remove password from user object
   */
  static sanitizeUser(user) {
    if (!user) return null;
    
    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Get all users (for admin use)
   */
  static getAllUsers() {
    return users.map(user => User.sanitizeUser(user));
  }

  /**
   * Get pending users (for admin use)
   */
  static getPendingUsers() {
    return users
      .filter(user => user.approvalStatus === APPROVAL_STATUS.PENDING)
      .map(user => User.sanitizeUser(user));
  }

  /**
   * Update user approval status (admin only)
   */
  static updateApprovalStatus(userId, status) {
    const user = User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (!Object.values(APPROVAL_STATUS).includes(status)) {
      throw new Error('Invalid approval status');
    }

    user.approvalStatus = status;
    user.updatedAt = new Date();

    return User.sanitizeUser(user);
  }

  /**
   * Check if user can login (approved status)
   */
  static canLogin(user) {
    return user && user.approvalStatus === APPROVAL_STATUS.APPROVED;
  }
}

// Export User model and constants
module.exports = {
  User,
  USER_ROLES,
  APPROVAL_STATUS
};
