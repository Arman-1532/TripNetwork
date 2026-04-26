const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Review = sequelize.define('Review', {
    review_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    package_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'package',
            key: 'package_id'
        }
    },
    traveler_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'user',
            key: 'user_id'
        }
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    comment: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'review',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Review;