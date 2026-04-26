/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

const jwt = require('jsonwebtoken');
const { User, Provider } = require('../models/index');

/**
 * Find user by ID (helper function)
 */
const findUserById = async (userId) => {
  return await User.findOne({ where: { user_id: userId } });
};

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please include a Bearer token in the Authorization header.'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');

    // Find user
    const user = await findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.'
      });
    }

    // Check if user is blocked
    if (user.status === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked by the administrator. You no longer have access to the system.'
      });
    }

    // Check if user is still approved
    // DB uses 'ACTIVE', 'PENDING', 'BLOCKED'
    if (user.status !== 'ACTIVE') {
      // If pending, specific message
      if (user.status === 'PENDING') {
        return res.status(403).json({
          success: false,
          message: 'Account is pending approval. Please wait for admin approval.'
        });
      }

      return res.status(403).json({
        success: false,
        message: 'Account is not active.'
      });
    }

    // Build user object with provider type if applicable
    let providerType = null;
    if (user.role === 'PROVIDER') {
      const provider = await Provider.findOne({ where: { provider_id: user.user_id } });
      if (provider) {
        providerType = provider.provider_type;
      }
    }

    // Attach user to request
    req.user = {
      id: user.user_id,
      email: user.email,
      role: user.role,
      name: user.name,
      status: user.status,
      providerType: providerType
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Role-based authorization middleware
 * Checks if user has required role(s)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
    const isAllowed = normalizedAllowedRoles.includes(userRole);

    console.log(`🔐 Authorization Check:`, {
      userEmail: req.user.email,
      userRole: req.user.role,
      userRoleLowercase: userRole,
      allowedRoles: normalizedAllowedRoles,
      isAllowed
    });

    if (!isAllowed) {
      console.warn(`🚫 Access Denied: User role '${userRole}' not in allowed roles: [${normalizedAllowedRoles}]`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  findUserById
};
