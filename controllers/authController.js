/**
 * Authentication Controller
 * Handles user registration and login
 */

const { User, USER_ROLES } = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const userData = req.body;

    // Create user
    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user);

    // Determine response message based on role
    let message = 'Registration successful';
    if (user.role === USER_ROLES.TRAVELER) {
      message = 'Registration successful. You can now login.';
    } else {
      message = 'Registration successful. Your account is pending approval. You will be able to login once an admin approves your account.';
    }

    res.status(201).json({
      success: true,
      message,
      data: {
        user,
        token
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Authenticate user
    const user = await User.authenticate(email, password);

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 * Requires authentication
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: User.sanitizeUser(user)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user profile'
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser
};
