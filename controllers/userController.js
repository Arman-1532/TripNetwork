/**
 * User Controller
 * Handles user profile updates
 */

const { pool } = require('../config/db');

const updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, phone, agencyName, hotelName, hotelLocation, tradeLicenseId, address, website } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update basic user info
        await connection.execute(
            'UPDATE user SET name = ?, phone = ? WHERE user_id = ?',
            [name, phone, userId]
        );

        // 2. Get user role and provider type
        const [userRows] = await connection.execute('SELECT role FROM user WHERE user_id = ?', [userId]);
        const role = userRows[0].role;

        if (role === 'PROVIDER') {
            const [providerRows] = await connection.execute('SELECT provider_type FROM provider WHERE provider_id = ?', [userId]);
            const providerType = providerRows[0].provider_type;

            // Update provider base table
            await connection.execute(
                'UPDATE provider SET trade_license_id = ?, address = ?, website = ? WHERE provider_id = ?',
                [tradeLicenseId, address, website, userId]
            );

            if (providerType === 'AGENCY') {
                await connection.execute(
                    'UPDATE agency SET agency_name = ? WHERE agency_id = ?',
                    [agencyName, userId]
                );
            } else if (providerType === 'HOTEL') {
                await connection.execute(
                    'UPDATE hotel SET hotel_name = ?, location = ? WHERE hotel_id = ?',
                    [hotelName, hotelLocation, userId]
                );
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
    } finally {
        connection.release();
    }
};

module.exports = {
    updateProfile
};
