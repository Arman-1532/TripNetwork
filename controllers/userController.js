/**
 * User Controller
 * Handles user profile updates
 */

const { User, Provider, Agency, Hotel, sequelize } = require('../models/index');

const updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, phone, agencyName, hotelName, hotelLocation, tradeLicenseId, address, website } = req.body;

    const t = await sequelize.transaction();
    try {
        // 1. Update base user info
        await User.update(
            { name, phone },
            { where: { user_id: userId }, transaction: t }
        );

        // 2. Check role and update sub-tables if provider
        const user = await User.findOne({ where: { user_id: userId }, transaction: t });

        if (user.role === 'PROVIDER') {
            const provider = await Provider.findOne({ where: { provider_id: userId }, transaction: t });

            await Provider.update(
                { trade_license_id: tradeLicenseId, address, website },
                { where: { provider_id: userId }, transaction: t }
            );

            if (provider.provider_type === 'AGENCY') {
                await Agency.update(
                    { agency_name: agencyName },
                    { where: { agency_id: userId }, transaction: t }
                );
            } else if (provider.provider_type === 'HOTEL') {
                await Hotel.update(
                    { hotel_name: hotelName, location: hotelLocation },
                    { where: { hotel_id: userId }, transaction: t }
                );
            }
        }

        await t.commit();
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        await t.rollback();
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
    }
};

module.exports = { updateProfile };
