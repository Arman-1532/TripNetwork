const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Booking = sequelize.define('Booking', {
    booking_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    traveler_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    booking_type: {
        type: DataTypes.ENUM('FLIGHT', 'PACKAGE', 'HOTEL'),
        allowNull: false
    },
    package_id: {
        type: DataTypes.INTEGER
    },
    airline_name: {
        type: DataTypes.STRING(100)
    },
    flight_number: {
        type: DataTypes.STRING(20)
    },
    departure_airport: {
        type: DataTypes.STRING(10)
    },
    arrival_airport: {
        type: DataTypes.STRING(10)
    },
    departure_time: {
        type: DataTypes.DATE
    },
    arrival_time: {
        type: DataTypes.DATE
    },
    pnr_code: {
        type: DataTypes.STRING(20)
    },
    num_people: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    passenger_details: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stores array of passenger information with fullName, passportNumber, nidNumber, phoneNumber, email'
    },
    checkin_date: {
        type: DataTypes.DATEONLY
    },
    checkout_date: {
        type: DataTypes.DATEONLY
    },
    total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    booking_status: {
        type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUND_REQUESTED'),
        defaultValue: 'PENDING'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'booking',
    timestamps: false
});

module.exports = Booking;
