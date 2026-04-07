const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Hotel = sequelize.define('Hotel', {
    hotel_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    hotel_name: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    location: {
        type: DataTypes.STRING(150),
        allowNull: false
    }
}, {
    tableName: 'hotel',
    timestamps: false
});

module.exports = Hotel;
