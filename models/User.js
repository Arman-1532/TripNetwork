const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const User = sequelize.define('User', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING(20)
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('TRAVELER', 'PROVIDER', 'ADMIN'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'PENDING', 'BLOCKED'),
        defaultValue: 'PENDING'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'user',
    timestamps: false
});

module.exports = User;
