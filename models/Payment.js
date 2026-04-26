const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Payment = sequelize.define('Payment', {
    payment_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    booking_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    traveler_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    payment_method: {
        // Unified flow initializes payments through SSLCommerz.
        type: DataTypes.ENUM('BKASH', 'NAGAD', 'UPAY', 'SSLCOMMERZ'),
        allowNull: false
    },
    transaction_id: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    payment_status: {
        type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'),
        defaultValue: 'PENDING'
    },
    paid_at: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'payment',
    timestamps: false
});

module.exports = Payment;
