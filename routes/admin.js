/**
 * Admin Routes
 * Protected endpoints for admin actions
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and 'admin' role
router.use(authenticate);
router.use(authorize('admin'));

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

module.exports = router;
