import React, { useState } from 'react';
import { MapPin, Bed, Banknote, Search } from 'lucide-react';

const HotelSearch = ({ onSearch }) => {
  const [city, setCity] = useState('');
  const [roomType, setRoomType] = useState('Any');
  const [maxPrice, setMaxPrice] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ city, roomType, maxPrice });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant pl-4">Destination City</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-primary">
            <MapPin size={18} />
          </span>
          <input 
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-surface-container text-on-surface border-none rounded-2xl py-3 pl-12 pr-4 focus:bg-surface-container-low transition-all text-sm h-[52px] outline-none" 
            placeholder="e.g. Cox's Bazar" 
            type="text"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant pl-4">Room Type</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-primary">
            <Bed size={18} />
          </span>
          <select 
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="w-full bg-surface-container text-on-surface border-none rounded-2xl py-3 pl-12 pr-4 focus:bg-surface-container-low transition-all text-sm h-[52px] cursor-pointer outline-none appearance-none"
          >
            <option value="Any">Any Type</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Suite">Suite</option>
            <option value="Deluxe">Deluxe</option>
            <option value="Penthouse">Penthouse</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant pl-4">Max Budget</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-4 flex items-center text-primary">
            <Banknote size={18} />
          </span>
          <input 
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full bg-surface-container text-on-surface border-none rounded-2xl py-3 pl-12 pr-4 focus:bg-surface-container-low transition-all text-sm h-[52px] outline-none" 
            placeholder="Per night (BDT)" 
            type="number"
          />
        </div>
      </div>

      <button className="bg-on-surface text-white py-3 px-6 rounded-2xl font-bold hover:bg-on-surface-variant transition-all h-[52px] shadow-lg flex items-center justify-center gap-2">
        <Search size={18} />
        <span>Find Hotels</span>
      </button>
    </form>
  );
};

export default HotelSearch;
