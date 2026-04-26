/**
 * Admin Routes
 * Protected endpoints for admin actions
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and 'ADMIN' role
router.use(authenticate);
router.use(authorize('ADMIN'));

/**
 * @route   GET /api/admin/pending-providers
 * @desc    Get all pending provider applications
 * @access  Admin
 */
router.get('/pending-providers', adminController.getPendingProviders);

/**
 * @route   PUT /api/admin/providers/:id/approve
 * @desc    Approve a provider
 * @access  Admin
 */
router.put('/providers/:id/approve', adminController.approveProvider);

/**
 * @route   PUT /api/admin/providers/:id/reject
 * @desc    Reject a provider
 * @access  Admin
 */
router.put('/providers/:id/reject', adminController.rejectProvider);

/**
 * @route   GET /api/admin/users
 * @desc    List all users (admin management)
 * @access  Admin
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route   GET /api/admin/users/search
 * @desc    Search user by email
 * @access  Admin
 * NOTE: This route MUST come before /:id routes to avoid being matched as an ID parameter
 */
router.get('/users/search', adminController.searchUserByEmail);

/**
 * @route   PUT /api/admin/users/:id/block
 * @desc    Block a user from the system
 * @access  Admin
 */
router.put('/users/:id/block', adminController.blockUser);

/**
 * @route   PUT /api/admin/users/:id/unblock
 * @desc    Unblock a user (restore access)
 * @access  Admin
 */
router.put('/users/:id/unblock', adminController.unblockUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user and related provider records
 * @access  Admin
 */
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
