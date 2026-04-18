/**
 * Admin Controller
 * Handles admin-specific actions like approving providers
 */

const { User, Provider, Agency, Hotel, sequelize } = require('../models/index');
const { Op } = require('sequelize');

/**
 * Get all pending providers (Agencies & Hotels)
 * GET /api/admin/pending-providers
 */
const getPendingProviders = async (req, res) => {
    try {
        const rows = await User.findAll({
            where: { status: 'PENDING', role: 'PROVIDER' },
            include: [
                {
                    model: Provider,
                    as: 'provider',
                    include: [
                        { model: Agency, as: 'agency' },
                        { model: Hotel,  as: 'hotel'  }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Flatten into the same shape the frontend expects
        const data = rows.map(u => {
            const p = u.provider;
            return {
                user_id:          u.user_id,
                name:             u.name,
                email:            u.email,
                phone:            u.phone,
                role:             u.role,
                status:           u.status,
                created_at:       u.created_at,
                provider_type:    p ? p.provider_type    : null,
                trade_license_id: p ? p.trade_license_id : null,
                address:          p ? p.address          : null,
                website:          p ? p.website          : null,
                agency_name:      p && p.agency ? p.agency.agency_name : null,
                hotel_name:       p && p.hotel  ? p.hotel.hotel_name   : null
            };
        });

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending providers',
            error: error.message
        });
    }
};

/**
 * Approve a provider
 * PUT /api/admin/providers/:id/approve
 */
const approveProvider = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.params.id;

        const [updatedCount] = await User.update(
            { status: 'ACTIVE' },
            { where: { user_id: userId, status: 'PENDING' }, transaction: t }
        );

        if (updatedCount === 0) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Provider not found or already processed'
            });
        }

        await Provider.update(
            { approved_by_admin: true, approved_at: new Date() },
            { where: { provider_id: userId }, transaction: t }
        );

        await t.commit();
        res.status(200).json({ success: true, message: 'Provider approved successfully' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({
            success: false,
            message: 'Failed to approve provider',
            error: error.message
        });
    }
};

/**
 * Reject a provider
 * PUT /api/admin/providers/:id/reject
 */
const rejectProvider = async (req, res) => {
    try {
        const userId = req.params.id;

        const [updatedCount] = await User.update(
            { status: 'BLOCKED' },
            { where: { user_id: userId, status: 'PENDING' } }
        );

        if (updatedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found or already processed'
            });
        }

        res.status(200).json({ success: true, message: 'Provider rejected successfully' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to reject provider',
            error: error.message
        });
    }
};

/**
 * Get all users (admin management view)
 * GET /api/admin/users
 */
const getAllUsers = async (req, res) => {
    try {
        const rows = await User.findAll({
            order: [['created_at', 'DESC']]
        });

        const data = rows.map(u => ({
            user_id: u.user_id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            status: u.status,
            created_at: u.created_at
        }));

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    }
};

/**
 * Delete a user and related provider/agency/hotel rows
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const userId = req.params.id;

        const user = await User.findOne({ where: { user_id: userId } });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Remove dependent provider/agency/hotel rows if present
        await Agency.destroy({ where: { agency_id: userId }, transaction: t });
        await Hotel.destroy({ where: { hotel_id: userId }, transaction: t });
        await Provider.destroy({ where: { provider_id: userId }, transaction: t });

        // Remove traveler/bookings/payments could be added here if desired
        await User.destroy({ where: { user_id: userId }, transaction: t });

        await t.commit();
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
    }
};

module.exports = { getPendingProviders, approveProvider, rejectProvider, getAllUsers, deleteUser };
