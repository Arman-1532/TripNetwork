import { 
  Building2, MapPin, DollarSign, Bed, 
  FileText, Image as ImageIcon, Send, Sparkles 
} from 'lucide-react';

const HotelPostOffering = ({ offering, setOffering, onPostOffering, posting, error, success }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ── Page Header ── */}
      <div className="rounded-[2rem] border border-slate-200/80 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50 to-slate-100/80 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-6 md:p-8 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
            <Building2 size={14} />
            Hotel Management
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface dark:text-white">
            Post New Offering
          </h1>
          <p className="text-on-surface-variant dark:text-slate-400">
            Create a premium room or package listing for travelers.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-[1.5rem] bg-error-container text-on-error-container border border-error/10">
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-[1.5rem] bg-primary/10 text-primary border border-primary/20">
          <p className="font-bold text-sm">{success}</p>
        </div>
      )}

      <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-700 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-5 mb-6">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Sparkles size={20} />
          </div>
          <h2 className="text-xl font-black text-on-surface dark:text-white uppercase tracking-tight">
            Listing Details
          </h2>
        </div>

        <form onSubmit={onPostOffering} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-300 pl-1">Short Title</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                <input 
                  required 
                  placeholder="e.g. Luxury Ocean Suite"
                  className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all" 
                  value={offering.shortTitle} 
                  onChange={(e) => setOffering(o => ({ ...o, shortTitle: e.target.value }))} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-300 pl-1">Country</label>
                <input 
                  required 
                  placeholder="Bangladesh"
                  className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl px-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all" 
                  value={offering.country} 
                  onChange={(e) => setOffering(o => ({ ...o, country: e.target.value }))} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-300 pl-1">City</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                  <input 
                    required 
                    placeholder="Cox's Bazar"
                    className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all" 
                    value={offering.city} 
                    onChange={(e) => setOffering(o => ({ ...o, city: e.target.value }))} 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-300 pl-1">Area</label>
                <input 
                  className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl px-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all" 
                  value={offering.area} 
                  placeholder="e.g. Laboni Beach"
                  onChange={(e) => setOffering(o => ({ ...o, area: e.target.value }))} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-300 pl-1">Room Type</label>
                <select 
                  className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl px-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white appearance-none transition-all" 
                  value={offering.roomType} 
                  onChange={(e) => setOffering(o => ({ ...o, roomType: e.target.value }))}
                >
                  <option value="Single">Single Room</option>
                  <option value="Double">Double Room</option>
                  <option value="Suite">Executive Suite</option>
                  <option value="Deluxe">Deluxe Room</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-300 pl-1">Bed Type</label>
                <div className="relative">
                  <Bed size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                  <input 
                    placeholder="e.g. King Size"
                    className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all" 
                    value={offering.bedType} 
                    onChange={(e) => setOffering(o => ({ ...o, bedType: e.target.value }))} 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-300 pl-1">Price (BDT / Night)</label>
                <div className="relative">
                  <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                  <input 
                    required 
                    type="number" 
                    min="0" 
                    placeholder="0.00"
                    className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-on-surface dark:text-white transition-all" 
                    value={offering.price} 
                    onChange={(e) => setOffering(o => ({ ...o, price: e.target.value }))} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-300 pl-1">Full Address</label>
              <input 
                required 
                placeholder="Complete street address, landmarks..."
                className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl px-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all" 
                value={offering.fullAddress} 
                onChange={(e) => setOffering(o => ({ ...o, fullAddress: e.target.value }))} 
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-300 pl-1">Cover Image URL</label>
              <div className="relative">
                <ImageIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                <input 
                  placeholder="https://images.unsplash.com/promo-hotel-image..."
                  className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white transition-all" 
                  value={offering.image_url} 
                  onChange={(e) => setOffering(o => ({ ...o, image_url: e.target.value }))} 
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant dark:text-slate-300 pl-1">Detailed Description</label>
            <div className="relative">
              <FileText size={15} className="absolute left-3.5 top-3.5 text-primary" />
              <textarea 
                required 
                placeholder="Amenities, check-in instructions, special features..."
                className="w-full bg-surface-container-low dark:bg-slate-800 rounded-2xl pl-9 pr-4 py-3 border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium text-on-surface dark:text-white min-h-32 resize-none transition-all" 
                value={offering.fullDescription} 
                onChange={(e) => setOffering(o => ({ ...o, fullDescription: e.target.value }))} 
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              disabled={posting} 
              className="group flex items-center gap-2 bg-primary text-on-primary font-black px-8 py-3.5 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {posting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              )}
              {posting ? 'Creating Listing...' : 'Post Offering'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};


export default HotelPostOffering;
