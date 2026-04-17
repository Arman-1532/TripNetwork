import React from 'react';
import { Receipt } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-on-surface h-[400px] flex items-center p-12 mb-12 shadow-2xl shadow-on-surface/5">
      <div className="absolute inset-0 opacity-40">
        <img 
          className="w-full h-full object-cover" 
          alt="Majestic mountain landscape at sunrise" 
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2070" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-on-surface via-on-surface/80 to-transparent"></div>
      </div>
      
      <div className="relative z-10 max-w-2xl space-y-6">
        <h1 className="text-6xl font-extrabold text-white leading-tight tracking-tighter font-headline">
          Where to next?
        </h1>
        <p className="text-xl text-white/80 font-light max-w-lg">
          Experience the world through a curated lens. Every destination is a new chapter in your story.
        </p>
        <div className="flex gap-4">
          <button className="bg-gradient-to-br from-primary to-primary-container text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
            Explore Destinations
          </button>
          <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-bold hover:bg-white/20 transition-all flex items-center gap-2">
            <Receipt size={20} />
            View Invoices
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
