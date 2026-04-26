const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

// Initialize SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify SMTP connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('⚠️ SMTP connection error:', error.message);
  } else {
    console.log('✅ SMTP server is ready to send emails');
  }
});

/**
 * Generate flight ticket PDF as a buffer
 */
function generateFlightTicketPDF(ticketData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ bufferPages: true });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('FLIGHT TICKET', { align: 'center' });
      doc.fontSize(10).fillColor('#666').text('Official Travel Document', { align: 'center' });
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown();

      // Booking Reference
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Booking Reference');
      doc.fontSize(10).font('Helvetica').text(`PNR: ${ticketData.bookingId}`, { indent: 20 });
      doc.moveDown();

      // Flight Information
      doc.fontSize(12).font('Helvetica-Bold').text('Flight Information');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Airline: ${ticketData.airline || 'N/A'}`, { indent: 20 });
      doc.text(`Flight Number: ${ticketData.flightNumber || 'N/A'}`, { indent: 20 });
      doc.text(`From: ${ticketData.departureAirport || 'N/A'} → To: ${ticketData.arrivalAirport || 'N/A'}`, { indent: 20 });
      doc.text(`Departure: ${ticketData.departureTime || 'N/A'}`, { indent: 20 });
      doc.text(`Arrival: ${ticketData.arrivalTime || 'N/A'}`, { indent: 20 });
      doc.moveDown();

      // Passenger Information
      doc.fontSize(12).font('Helvetica-Bold').text('Passenger Information');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${ticketData.passengerName}`, { indent: 20 });
      doc.text(`Passport Number: ${ticketData.passportNumber}`, { indent: 20 });
      doc.text(`NID Number: ${ticketData.nidNumber}`, { indent: 20 });
      doc.text(`Phone: ${ticketData.phone}`, { indent: 20 });
      doc.text(`Email: ${ticketData.email}`, { indent: 20 });
      doc.moveDown();

      // Seat Information
      doc.fontSize(12).font('Helvetica-Bold').text('Ticket Details');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Ticket Number: ${ticketData.ticketNumber}`, { indent: 20 });
      doc.text(`Seat: ${ticketData.seat || 'To be assigned'}`, { indent: 20 });
      doc.text(`Booking Date: ${new Date().toLocaleDateString()}`, { indent: 20 });
      doc.moveDown();

      // Price Information
      doc.fontSize(12).font('Helvetica-Bold').text('Price');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Amount: ${ticketData.price} BDT`, { indent: 20 });
      doc.moveDown();

      // Footer
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.fontSize(9).fillColor('#999').text('This ticket is valid only with proper identification. Please arrive 2 hours before departure.', { align: 'center' });
      doc.text('For inquiries, contact support@tripnetwork.com', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate package/hotel booking pass PDF as a buffer
 */
function generateBookingPassPDF(passData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ bufferPages: true });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header with TripNetwork branding
      doc.fontSize(20).font('Helvetica-Bold').text('TRIPNETWORK', { align: 'center' });
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#2563eb').text('BOOKING CONFIRMATION PASS', { align: 'center' });
      doc.fontSize(10).fillColor('#666').text('Your Official Travel Document', { align: 'center' });
      doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      doc.moveDown();

      // Booking Status - CONFIRMED
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#16a34a').text('✓ BOOKING CONFIRMED', { align: 'center' });
      doc.moveDown();

      // Booking Reference
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text('Booking Reference');
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#2563eb').text(`${passData.bookingId}`, { indent: 20 });
      doc.moveDown();

      // Package Title
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e40af').text(`${passData.packageTitle || 'Travel Package'}`, { align: 'center' });
      doc.moveDown();

      // Booking Type and Details
      doc.fontSize(11).font('Helvetica-Bold').text(`${passData.bookingType === 'HOTEL' ? 'Hotel' : 'Package'} Details`);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Type: ${passData.packageType || 'Travel Package'}`, { indent: 20 });
      doc.text(`Destination: ${passData.destination || 'N/A'}`, { indent: 20 });
      if (passData.origin) {
        doc.text(`Origin: ${passData.origin}`, { indent: 20 });
      }
      doc.moveDown();

      // Hotel Information Section - NEW
      if (passData.hotelName) {
        doc.fontSize(11).font('Helvetica-Bold').text('Hotel Information');
        doc.fontSize(10).font('Helvetica');
        doc.text(`Hotel Name: ${passData.hotelName}`, { indent: 20 });
        if (passData.hotelLocation) {
          doc.text(`Location: ${passData.hotelLocation}`, { indent: 20 });
        }
        if (passData.hotelEmail) {
          doc.text(`Email: ${passData.hotelEmail}`, { indent: 20 });
        }
        if (passData.hotelPhone) {
          doc.text(`Phone: ${passData.hotelPhone}`, { indent: 20 });
        }
        doc.moveDown();
      }

      // Dates
      if (passData.checkinDate || passData.departureDate) {
        doc.fontSize(11).font('Helvetica-Bold').text('Travel Dates');
        doc.fontSize(10).font('Helvetica');
        doc.text(`Check-in/Departure: ${passData.checkinDate || passData.departureDate || 'N/A'}`, { indent: 20 });
        if (passData.checkoutDate || passData.returnDate) {
          doc.text(`Check-out/Return: ${passData.checkoutDate || passData.returnDate || 'N/A'}`, { indent: 20 });
        }
        doc.moveDown();
      }

      // Traveler Information
      doc.fontSize(11).font('Helvetica-Bold').text('Traveler Information');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${passData.travelerName}`, { indent: 20 });
      doc.text(`NID Number: ${passData.nidNumber}`, { indent: 20 });
      if (passData.passportNumber) {
        doc.text(`Passport Number: ${passData.passportNumber}`, { indent: 20 });
      }
      doc.text(`Phone: ${passData.phone}`, { indent: 20 });
      doc.text(`Email: ${passData.email}`, { indent: 20 });
      doc.moveDown();

      // Price Information
      doc.fontSize(11).font('Helvetica-Bold').text('Price Details');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Unit Price: ${passData.unitPrice} BDT`, { indent: 20 });
      doc.text(`Number of Travelers: ${passData.numTravelers}`, { indent: 20 });
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#2563eb');
      doc.text(`Total Amount: ${passData.totalPrice} BDT`, { indent: 20 });
      doc.moveDown();

      // Important Notes
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text('Important Information');
      doc.fontSize(9).font('Helvetica').fillColor('#333');
      doc.text('• Please present this confirmation pass during check-in', { indent: 20 });
      doc.text('• Keep all copies of this pass for your records', { indent: 20 });
      doc.text('• Contact support for any changes or cancellations', { indent: 20 });
      doc.text('• Ensure you arrive on time as per the schedule provided', { indent: 20 });
      doc.moveDown();

      // Footer
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.fontSize(8).fillColor('#999').text('For inquiries, contact support@tripnetwork.com', { align: 'center' });
      doc.text('© 2026 TripNetwork. All rights reserved.', { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Send ticket email to passenger (for flights)
 */
async function sendTicketEmail(emailData) {
  try {
    const { email, passengerName, bookingId, ticketNumber, passengers } = emailData;

    if (!email) {
      console.error('❌ Email address is required');
      return false;
    }

    // Generate individual tickets for each passenger
    const attachments = [];
    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      const ticketPDF = await generateFlightTicketPDF({
        bookingId,
        ticketNumber: `${ticketNumber}-${String(i + 1).padStart(3, '0')}`,
        passengerName: passenger.fullName,
        passportNumber: passenger.passportNumber,
        nidNumber: passenger.nidNumber,
        phone: passenger.phoneNumber,
        email: passenger.email,
        airline: emailData.airline,
        flightNumber: emailData.flightNumber,
        departureAirport: emailData.departureAirport,
        arrivalAirport: emailData.arrivalAirport,
        departureTime: emailData.departureTime,
        arrivalTime: emailData.arrivalTime,
        price: emailData.price,
        seat: passenger.seat || 'To be assigned'
      });

      attachments.push({
        filename: `Ticket_${passenger.fullName.replace(/\s+/g, '_')}_${i + 1}.pdf`,
        content: ticketPDF,
        contentType: 'application/pdf'
      });
    }

    // Send email with all passenger tickets
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: `Your Flight Tickets - Booking Reference ${bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2c3e50; text-align: center;">✈️ Your Flight Booking Confirmation</h2>
          
          <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Dear <strong>${passengerName}</strong>,</p>
            
            <p>Thank you for booking with TripNetwork! Your flight booking has been confirmed and your tickets are ready.</p>
            
            <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Booking Reference:</strong> ${bookingId}</p>
              <p><strong>Number of Passengers:</strong> ${passengers.length}</p>
              <p><strong>Total Passengers:</strong></p>
              <ul>
                ${passengers.map(p => `<li>${p.fullName} (Passport: ${p.passportNumber})</li>`).join('')}
              </ul>
            </div>
            
            <h3 style="color: #2c3e50;">📎 Attached Tickets</h3>
            <p>Please find ${passengers.length} ticket(s) attached to this email. Each ticket corresponds to one passenger.</p>
            <p><strong>Important:</strong> Please save and print these tickets for check-in.</p>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p><strong>⏰ Important Reminders:</strong></p>
              <ul>
                <li>Arrive at the airport 2 hours before departure</li>
                <li>Bring valid passport and ID</li>
                <li>Check baggage policy before traveling</li>
                <li>Download our mobile app for easy check-in</li>
              </ul>
            </div>
            
            <p style="color: #7f8c8d;">If you have any questions, please contact our support team at support@tripnetwork.com or call our helpline.</p>
            
            <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
            
            <p style="text-align: center; color: #95a5a6; font-size: 12px;">
              © 2026 TripNetwork. All rights reserved.<br>
              This is an automated email. Please do not reply directly.
            </p>
          </div>
        </div>
      `,
      attachments: attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    return false;
  }
}

/**
 * Send booking confirmation email with pass for packages/hotels
 */
async function sendBookingConfirmationEmail(emailData) {
  try {
    const { email, travelers, bookingId, bookingType, packageType, destination, origin, unitPrice, totalPrice } = emailData;

    console.log('📧 Sending booking confirmation email...');
    console.log('  Email:', email);
    console.log('  Travelers:', travelers?.length || 0);
    console.log('  Booking ID:', bookingId);

    if (!email) {
      console.error('❌ Email address is required');
      return false;
    }

    if (!travelers || travelers.length === 0) {
      console.error('❌ At least one traveler is required');
      return false;
    }

    // Generate booking pass for each traveler
    const attachments = [];
    for (let i = 0; i < travelers.length; i++) {
      const traveler = travelers[i];
      console.log(`  Generating pass for traveler ${i + 1}:`, traveler.fullName);

      const passPDF = await generateBookingPassPDF({
        bookingId,
        bookingType,
        packageTitle: emailData.packageTitle || 'Travel Package',
        packageType: packageType || 'Travel Package',
        destination: destination || 'N/A',
        origin: origin || '',
        travelerName: traveler.fullName,
        nidNumber: traveler.nidNumber,
        passportNumber: traveler.passportNumber || '',
        phone: traveler.phoneNumber,
        email: traveler.email,
        unitPrice: unitPrice,
        numTravelers: travelers.length,
        totalPrice: totalPrice,
        checkinDate: emailData.checkinDate || emailData.departureDate,
        checkoutDate: emailData.checkoutDate || emailData.returnDate,
        hotelName: emailData.hotelName,
        hotelEmail: emailData.hotelEmail,
        hotelPhone: emailData.hotelPhone,
        hotelLocation: emailData.hotelLocation
      });

      attachments.push({
        filename: `BookingPass_${traveler.fullName.replace(/\s+/g, '_')}_${i + 1}.pdf`,
        content: passPDF,
        contentType: 'application/pdf'
      });
    }

    console.log(`  PDF passes generated: ${attachments.length}`);

    // Send email with booking pass
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: `Booking Confirmation - Reservation Reference ${bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin: 0;">TripNetwork</h1>
            <h2 style="color: #2c3e50; margin: 5px 0;">✓ Booking Confirmed!</h2>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Dear <strong>${travelers[0].fullName}</strong>,</p>
            
            <p>Thank you for your booking with TripNetwork! We're thrilled to help you plan an unforgettable journey.</p>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <p style="margin: 0;"><strong style="color: #16a34a;">✓ Your booking is confirmed</strong></p>
            </div>
            
            <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Booking Reference:</strong> ${bookingId}</p>
              <p><strong>Package:</strong> ${packageType || 'Travel Package'}</p>
              <p><strong>Destination:</strong> ${destination}</p>
              ${origin ? `<p><strong>Origin:</strong> ${origin}</p>` : ''}
              <p><strong>Number of Travelers:</strong> ${travelers.length}</p>
              <p><strong>Total Price:</strong> ৳${totalPrice}</p>
            </div>
            
            <h3 style="color: #2c3e50; margin-top: 25px;">Travelers Booked:</h3>
            <ul style="background-color: #f5f5f5; padding: 15px 20px; border-radius: 5px;">
              ${travelers.map((t, idx) => `<li>${idx + 1}. ${t.fullName} (NID: ${t.nidNumber})</li>`).join('')}
            </ul>
            
            <h3 style="color: #2c3e50; margin-top: 25px;">📎 Your Booking Pass</h3>
            <p>Please find ${travelers.length} booking pass(es) attached to this email. Each pass contains the complete booking information for one traveler.</p>
            <p><strong>Important:</strong> Download and print these passes before your travel date or keep them readily available on your mobile device.</p>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-weight: bold; color: #92400e;">⚠️ Important Information:</p>
              <ul style="margin: 10px 0 0 0; color: #92400e;">
                <li>Review all booking details carefully</li>
                <li>Contact us immediately if any information is incorrect</li>
                <li>Keep your booking reference for future inquiries</li>
                <li>Cancellation and modification policies apply</li>
              </ul>
            </div>
            
            <h3 style="color: #2c3e50; margin-top: 25px;">Next Steps:</h3>
            <ol style="color: #555;">
              <li>Review the attached booking pass(es)</li>
              <li>Confirm all traveler information is correct</li>
              <li>Prepare required documents (ID, passport if applicable)</li>
              <li>Track your booking on our website</li>
              <li>Contact support for any questions</li>
            </ol>
            
            <p style="margin-top: 25px; color: #7f8c8d;">If you have any questions or need to make changes, please don't hesitate to contact our support team at <strong>support@tripnetwork.com</strong>.</p>
            
            <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
            
            <p style="text-align: center; color: #95a5a6; font-size: 12px;">
              © 2026 TripNetwork. All rights reserved.<br>
              This is an automated email. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      attachments: attachments
    };

    console.log('  Sending email via SMTP...');
    console.log('  From:', mailOptions.from);
    console.log('  To:', mailOptions.to);

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Booking confirmation email sent successfully!');
    console.log('  Response:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Booking confirmation email sending failed:');
    console.error('  Error:', error.message);
    console.error('  Code:', error.code);
    if (error.response) {
      console.error('  SMTP Response:', error.response);
    }
    return false;
  }
}

/**
 * Send provider approval email (Agency/Hotel)
 */
async function sendProviderApprovalEmail({ toEmail, providerName, providerType }) {
  try {
    if (!toEmail) {
      console.error('❌ Provider approval email: recipient is required');
      return false;
    }

    const typeLabel =
      String(providerType || '').toUpperCase() === 'HOTEL'
        ? 'Hotel Representative'
        : 'Travel Agency';

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: toEmail,
      subject: 'Your TripNetwork provider account has been approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background-color: #f6f7fb; padding: 24px; border-radius: 12px;">
          <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e6e8f0;">
            <div style="text-align: center; margin-bottom: 18px;">
              <h1 style="margin: 0; color: #2563eb; letter-spacing: 0.5px;">TripNetwork</h1>
              <p style="margin: 8px 0 0 0; color: #334155;">Provider registration update</p>
            </div>

            <div style="padding: 14px 16px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; border-radius: 10px; font-weight: 700;">
              ✓ Your registration has been approved
            </div>

            <p style="margin-top: 18px; color: #0f172a; font-size: 14px;">
              Hello <strong>${providerName || 'Provider'}</strong>,
            </p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              Your <strong>${typeLabel}</strong> account on TripNetwork has been approved by our admin team.
              You can now log in and start using the provider dashboard.
            </p>

            <div style="margin-top: 18px; padding: 14px 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;">
              <p style="margin: 0; color: #1e40af; font-weight: 700;">Next steps</p>
              <ol style="margin: 10px 0 0 18px; color: #1e3a8a; font-size: 13px; line-height: 1.6;">
                <li>Log in to your provider account</li>
                <li>Complete your profile (if needed)</li>
                <li>Start posting packages/offerings</li>
              </ol>
            </div>

            <p style="margin-top: 18px; color: #64748b; font-size: 12px; line-height: 1.6;">
              If you did not request this registration, please contact support at <strong>support@tripnetwork.com</strong>.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 18px 0;">
            <p style="margin: 0; text-align: center; color: #94a3b8; font-size: 12px;">
              © 2026 TripNetwork. This is an automated email.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Provider approval email sent:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Provider approval email sending failed:', error.message);
    return false;
  }
}

module.exports = {
  sendTicketEmail,
  sendBookingConfirmationEmail,
  sendProviderApprovalEmail,
  generateFlightTicketPDF,
  generateBookingPassPDF
};
