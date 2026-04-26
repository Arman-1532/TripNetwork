const express = require('express');
const router = express.Router();
const { Notification } = require('../models/index');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for a provider
 * @access  Provider (Hotel/Agency)
 */
router.get('/', authenticate, authorize('PROVIDER'), async (req, res) => {
    const provider_id = req.user.id;

    try {
        const notifications = await Notification.findAll({
            where: { provider_id },
            order: [['created_at', 'DESC']]
        });

        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/notifications/unread/count
 * @desc    Get count of unread notifications
 * @access  Provider (Hotel/Agency)
 */
router.get('/unread/count', authenticate, authorize('PROVIDER'), async (req, res) => {
    const provider_id = req.user.id;

    try {
        const count = await Notification.count({
            where: { provider_id, is_read: false }
        });

        res.json({ success: true, data: { unreadCount: count } });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/notifications/:notificationId/mark-read
 * @desc    Mark a single notification as read
 * @access  Provider (Hotel/Agency)
 */
router.put('/:notificationId/mark-read', authenticate, authorize('PROVIDER'), async (req, res) => {
    const { notificationId } = req.params;
    const provider_id = req.user.id;

    try {
        const notification = await Notification.findOne({
            where: { notification_id: notificationId, provider_id }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await notification.update({ is_read: true });

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Provider (Hotel/Agency)
 */
router.put('/mark-all-read', authenticate, authorize('PROVIDER'), async (req, res) => {
    const provider_id = req.user.id;

    try {
        await Notification.update(
            { is_read: true },
            { where: { provider_id, is_read: false } }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/notifications/:notificationId
 * @desc    Get details of a specific notification
 * @access  Provider (Hotel/Agency)
 */
router.get('/:notificationId', authenticate, authorize('PROVIDER'), async (req, res) => {
    const { notificationId } = req.params;
    const provider_id = req.user.id;

    try {
        const notification = await Notification.findOne({
            where: { notification_id: notificationId, provider_id }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Mark as read when viewing details
        if (!notification.is_read) {
            await notification.update({ is_read: true });
        }

        res.json({ success: true, data: notification });
    } catch (error) {
        console.error('Error fetching notification details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification details',
            error: error.message
        });
    }
});

module.exports = router;
