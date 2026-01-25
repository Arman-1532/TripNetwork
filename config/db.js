/**
 * Database Configuration
 * Uses mysql2 connection pool
 */

const mysql = require('mysql2/promise');
const debug = require('debug')('tripnetwork:db');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'travel_booking_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
const checkConnection = async () => {
    try {
        const connection = await pool.getConnection();
        debug('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    checkConnection
};
