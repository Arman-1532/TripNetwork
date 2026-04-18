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
 * Generate ticket PDF as a buffer
 */
function generateTicketPDF(ticketData) {
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
 * Send ticket email to passenger
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
      const ticketPDF = await generateTicketPDF({
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

module.exports = {
  sendTicketEmail,
  generateTicketPDF
};
