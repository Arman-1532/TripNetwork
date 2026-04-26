const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Notification = sequelize.define('Notification', {
    notification_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    provider_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    booking_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    traveler_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    traveler_email: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    traveler_phone: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    num_travelers: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    package_title: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    package_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    notification_type: {
        type: DataTypes.ENUM('BOOKING', 'REFUND'),
        defaultValue: 'BOOKING',
        allowNull: false
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'notification',
    timestamps: false
});

module.exports = Notification;

