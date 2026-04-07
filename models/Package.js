const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Package = sequelize.define('Package', {
    package_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    provider_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    package_type: {
        type: DataTypes.ENUM('HOTEL', 'TRAVEL'),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    destination: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    origin: {
        type: DataTypes.STRING(150)
    },
    travel_medium: {
        type: DataTypes.ENUM('BUS', 'AIR', 'TRAIN', 'SHIP')
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    is_limited_time: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    offer_ends_at: {
        type: DataTypes.DATE
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        defaultValue: 'PENDING'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'package',
    timestamps: false
});

module.exports = Package;
