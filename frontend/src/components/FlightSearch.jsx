import React, { useState } from 'react';
import { PlaneTakeoff, PlaneLanding, Calendar, Users, Search } from 'lucide-react';

const FlightSearch = ({ onSearch }) => {
  const [origin, setOrigin] = useState('DAC');
  const [destination, setDestination] = useState('CXB');
  const [date, setDate] = useState('');
  const [adults, setAdults] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ origin, destination, date, adults });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10 shadow-sm">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant pl-4">Origin</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-primary">
            <PlaneTakeoff size={18} />
          </span>
          <input 
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm h-[52px] outline-none"
            placeholder="Origin (e.g. DAC)"
            type="text"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant pl-4">Destination</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-primary">
            <PlaneLanding size={18} />
          </span>
          <input 
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm h-[52px] outline-none"
            placeholder="Destination (e.g. CXB)"
            type="text"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant pl-4">Date</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-primary">
            <Calendar size={18} />
          </span>
          <input 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm h-[52px] outline-none"
            type="date"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant pl-4">Adults</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-primary">
            <Users size={18} />
          </span>
          <input 
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm h-[52px] outline-none"
            type="number"
            min="1"
            required
          />
        </div>
      </div>

      <button className="bg-primary text-white py-3 px-6 rounded-2xl font-bold hover:bg-primary-dim transition-all h-[52px] shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
        <Search size={18} />
        <span>Search</span>
      </button>
    </form>
  );
};

export default FlightSearch;
