import React from 'react';
import { Calendar, Tag, CreditCard, ChevronRight } from 'lucide-react';

const BookingCard = ({ booking }) => {
  const date = new Date(booking.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const isFlight = booking.booking_type === 'FLIGHT';
  const details = isFlight 
    ? `${booking.airline_name} ${booking.flight_number}: ${booking.departure_airport} → ${booking.arrival_airport}` 
    : `Package #${booking.package_id}`;

  const statusColors = {
    'PENDING': 'bg-primary-container text-on-primary-container',
    'CONFIRMED': 'bg-green-100 text-green-700',
    'CANCELLED': 'bg-error-container text-on-error-container'
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-outline-variant/10 hover:shadow-lg transition-all group cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <div className={`p-3 rounded-2xl ${
            isFlight ? 'bg-primary-container/20 text-primary' : 'bg-tertiary-container/20 text-tertiary'
          }`}>
            {isFlight ? <Calendar size={20} /> : <Tag size={20} />}
          </div>
          <div className="space-y-0.5">
            <p className="font-bold text-sm text-on-surface">{isFlight ? 'Flight Booking' : 'Package Discovery'}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium">{date}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${
          statusColors[booking.booking_status] || 'bg-surface-container text-on-surface-variant'
        }`}>
          {booking.booking_status}
        </span>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-on-surface truncate text-sm">
          {details}
        </h4>
        
        <div className="flex items-center justify-between py-3 px-4 bg-surface-container-low rounded-2xl">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <CreditCard size={14} />
            <span className="text-xs font-bold">৳{booking.total_price}</span>
          </div>
          <ChevronRight size={16} className="text-outline-variant group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
