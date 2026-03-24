const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Provider = sequelize.define('Provider', {
    provider_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    provider_type: {
        type: DataTypes.ENUM('HOTEL', 'AGENCY'),
        allowNull: false
    },
    trade_license_id: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    website: {
        type: DataTypes.STRING(200)
    },
    approved_by_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    approved_at: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'provider',
    timestamps: false
});

module.exports = Provider;
