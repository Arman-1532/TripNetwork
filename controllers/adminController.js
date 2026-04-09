
const { User, Provider, Agency, Hotel, sequelize } = require('../models/index');
const { Op } = require('sequelize');


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

module.exports = { getPendingProviders, approveProvider, rejectProvider };
