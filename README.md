

A full-stack web application that connects travelers, hotel representatives, and travel agencies. The system supports publishing travel packages, hotel room offers, flight search using the Amadeus API, online bookings, and payment integration.
All users authenticate through a role-based access system.

 1. Features

 1.1 User Roles

Traveler

* Registers using name, email, phone number, password.
* Can view travel packages, hotel offers, and flight prices.
* Must log in before booking.
* Can book hotel rooms, travel packages, and flights after payment.

Hotel Representative

* Registers using hotel name, NID, trade license ID, address, phone, email, password.
* Can post hotel room availability, prices, and offers.

Travel Agency

* Registers using agency name, NID, trade license ID, address, phone, email, password.
* Can upload travel packages and limited-time offers.

Admin

* Accounts are created manually by the system owner.
* Can verify, approve, or remove hotel/agency data.
* Manages system-wide monitoring (packages, offers, flights, bookings).



2. System Modules

2.1 Traveler Module

* View packages, hotels, flights.
* Book after login.
* Multi-person booking supported.
* Redirect to payment gateway (Bkash/Nagad/Upay).
* Booking recorded only upon successful payment.

 2.2 Hotel Module

* Post hotel rooms and offers.
* Manage and update pricing and availability.

2.3 Travel Agency Module

* Upload packages with destination, transport type, price, and description.
* Upload limited-time offers with expiration.

 2.4 Flight Module (Amadeus API)

* Real-time flight search.
* System stores booking metadata only (PNR, user id, price, status).
* Detailed flight data fetched on-demand from Amadeus, not stored locally.



 3. Technology Stack

Frontend: HTML, CSS, JavaScript
Backend:Node.js (Express.js)
Database: MySQL
API Integration: Amadeus Flight API
Security:JWT authentication, bcrypt hashed passwords
Payment:Bkash, Nagad, Upay (redirect-based integration)


