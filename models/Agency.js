const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Agency = sequelize.define('Agency', {
    agency_id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    agency_name: {
        type: DataTypes.STRING(150),
        allowNull: false
    }
}, {
    tableName: 'agency',
    timestamps: false
});

module.exports = Agency;
