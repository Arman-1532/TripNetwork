/**
 * Admin Controller
 * Handles admin-specific actions like approving providers
 */

const { pool } = require('../config/db');

/**
 * Get all pending providers (Agencies & Hotels)
 * GET /api/admin/pending-providers
 */
const getPendingProviders = async (req, res) => {
    try {
        const query = `
      SELECT u.user_id, u.name, u.email, u.phone, u.role, u.status, u.created_at,
             p.provider_type, p.trade_license_id, p.address, p.website,
             a.agency_name, h.hotel_name
      FROM user u
      JOIN provider p ON u.user_id = p.provider_id
      LEFT JOIN agency a ON u.user_id = a.agency_id
      LEFT JOIN hotel h ON u.user_id = h.hotel_id
      WHERE u.status = 'PENDING'
      ORDER BY u.created_at DESC
    `;

        const [rows] = await pool.execute(query);

        res.status(200).json({
            success: true,
            data: rows
        });
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
    const connection = await pool.getConnection();
    try {
        const userId = req.params.id;

        await connection.beginTransaction();

        // Update user status
        const [userResult] = await connection.execute(
            `UPDATE user SET status = 'ACTIVE' WHERE user_id = ? AND status = 'PENDING'`,
            [userId]
        );

        if (userResult.affectedRows === 0) {
            await connection.rollBack();
            return res.status(404).json({
                success: false,
                message: 'Provider not found or already processed'
            });
        }

        // Update provider approval details
        await connection.execute(
            `UPDATE provider SET approved_by_admin = TRUE, approved_at = NOW() WHERE provider_id = ?`,
            [userId]
        );

        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Provider approved successfully'
        });
    } catch (error) {
        await connection.rollBack();
        res.status(500).json({
            success: false,
            message: 'Failed to approve provider',
            error: error.message
        });
    } finally {
        connection.release();
    }
};

/**
 * Reject a provider
 * PUT /api/admin/providers/:id/reject
 */
const rejectProvider = async (req, res) => {
    try {
        const userId = req.params.id;

        // Update status to BLOCKED (or REJECTED if we had that enum, DB schema has BLOCKED)
        const [result] = await pool.execute(
            `UPDATE user SET status = 'BLOCKED' WHERE user_id = ? AND status = 'PENDING'`,
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Provider not found or already processed'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Provider rejected successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to reject provider',
            error: error.message
        });
    }
};

module.exports = {
    getPendingProviders,
    approveProvider,
    rejectProvider
};
