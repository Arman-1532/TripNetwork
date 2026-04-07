const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Traveler = sequelize.define('Traveler', {
    traveler_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    dob: {
        type: DataTypes.DATEONLY
    }
}, {
    tableName: 'traveler',
    timestamps: false
});

module.exports = Traveler;
