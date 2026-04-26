
const { Booking } = require('./models/index');

async function checkBookings() {
  try {
    const bookings = await Booking.findAll();
    console.log(`Found ${bookings.length} bookings`);
    bookings.forEach((b, i) => {
      console.log(`Row ${i + 1}: ID ${b.booking_id}, Status: "${b.booking_status}"`);
    });
  } catch (err) {
    console.error('Error fetching bookings:', err.message);
  } finally {
    process.exit();
  }
}

checkBookings();
