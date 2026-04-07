-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS travel_booking_system;
USE travel_booking_system;

-- =======================
-- USER
-- =======================
CREATE TABLE IF NOT EXISTS user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('TRAVELER','PROVIDER','ADMIN') NOT NULL,
    status ENUM('ACTIVE','PENDING','BLOCKED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =======================
-- TRAVELER (IS-A USER)
-- =======================
CREATE TABLE IF NOT EXISTS traveler (
    traveler_id INT PRIMARY KEY,
    dob DATE,
    FOREIGN KEY (traveler_id)
        REFERENCES user(user_id)
        ON DELETE CASCADE
);

-- =======================
-- PROVIDER (IS-A USER)
-- =======================
CREATE TABLE IF NOT EXISTS provider (
    provider_id INT PRIMARY KEY,
    provider_type ENUM('HOTEL','AGENCY') NOT NULL,
    trade_license_id VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    website VARCHAR(200),
    approved_by_admin BOOLEAN DEFAULT FALSE,
    approved_at DATETIME,
    FOREIGN KEY (provider_id)
        REFERENCES user(user_id)
        ON DELETE CASCADE
);

-- =======================
-- HOTEL (IS-A PROVIDER)
-- =======================
CREATE TABLE IF NOT EXISTS hotel (
    hotel_id INT PRIMARY KEY,
    hotel_name VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    FOREIGN KEY (hotel_id)
        REFERENCES provider(provider_id)
        ON DELETE CASCADE
);

-- =======================
-- AGENCY (IS-A PROVIDER)
-- =======================
CREATE TABLE IF NOT EXISTS agency (
    agency_id INT PRIMARY KEY,
    agency_name VARCHAR(150) NOT NULL,
    FOREIGN KEY (agency_id)
        REFERENCES provider(provider_id)
        ON DELETE CASCADE
);

-- =======================
-- PACKAGE
-- =======================
CREATE TABLE IF NOT EXISTS package (
    package_id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    package_type ENUM('HOTEL','TRAVEL') NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    destination VARCHAR(150) NOT NULL,
    origin VARCHAR(150),
    travel_medium ENUM('BUS','AIR','TRAIN','SHIP'),
    price DECIMAL(10,2) NOT NULL,
    is_limited_time BOOLEAN DEFAULT FALSE,
    offer_ends_at DATETIME,
    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id)
        REFERENCES provider(provider_id)
        ON DELETE CASCADE
);

-- =======================
-- BOOKING
-- =======================
CREATE TABLE IF NOT EXISTS booking (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    traveler_id INT NOT NULL,
    booking_type ENUM('FLIGHT','PACKAGE') NOT NULL,
    package_id INT,
    airline_name VARCHAR(100),
    flight_number VARCHAR(20),
    departure_airport VARCHAR(10),
    arrival_airport VARCHAR(10),
    departure_time DATETIME,
    arrival_time DATETIME,
    pnr_code VARCHAR(20),
    num_people INT NOT NULL,
    checkin_date DATE,
    checkout_date DATE,
    total_price DECIMAL(10,2) NOT NULL,
    booking_status ENUM('PENDING','CONFIRMED','CANCELLED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (traveler_id)
        REFERENCES traveler(traveler_id)
        ON DELETE CASCADE,
    FOREIGN KEY (package_id)
        REFERENCES package(package_id)
        ON DELETE SET NULL
);

-- =======================
-- PAYMENT
-- =======================
CREATE TABLE IF NOT EXISTS payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    traveler_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('BKASH','NAGAD','UPAY') NOT NULL,
    transaction_id VARCHAR(100) NOT NULL,
    payment_status ENUM('PENDING','SUCCESS','FAILED') DEFAULT 'PENDING',
    paid_at DATETIME,
    FOREIGN KEY (booking_id)
        REFERENCES booking(booking_id)
        ON DELETE CASCADE,
    FOREIGN KEY (traveler_id)
        REFERENCES traveler(traveler_id)
        ON DELETE CASCADE
);
