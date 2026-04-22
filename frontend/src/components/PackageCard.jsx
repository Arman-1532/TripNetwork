import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, MessageSquare } from 'lucide-react';

const PackageCard = ({ pkg, onBook }) => {
  const navigate = useNavigate();
  const providerName = pkg.hotel_name || pkg.agency_name || 'TripNetwork Partner';
  const isHotel = pkg.package_type === 'HOTEL';

  return (
    <div 
      onClick={() => navigate(`/packages/${pkg.package_id}`)}
      className="group relative rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 border border-outline-variant/10 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer"
    >
      {pkg.image_url && (
        <div className="h-48 overflow-hidden relative">
          <img
            src={pkg.image_url}
            alt={pkg.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
      )}
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <MapPin size={14} />
              <span>{pkg.origin ? `${pkg.origin} → ` : ''}{pkg.destination}</span>
            </div>
            <h3 className="text-xl font-extrabold text-on-surface group-hover:text-primary transition-colors">
              {pkg.title}
            </h3>
            <p className="text-[11px] text-on-surface-variant font-medium">
              {isHotel ? '🏨 ' : '🏢 '}{providerName}
            </p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${isHotel ? 'bg-tertiary/10 text-tertiary border-tertiary/20' : 'bg-primary/10 text-primary border-primary/20'
            }`}>
            {pkg.package_type}
          </span>
        </div>

        <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed h-10">
          {(() => {
            if (!pkg.description) return 'No description available for this curated package.';
            try {
              const parsed = JSON.parse(pkg.description);
              // If it's JSON, it might be a custom request or metadata - don't show the raw JSON
              if (parsed && typeof parsed === 'object') {
                return parsed.fullDescription || parsed.message || 'Details provided by agency.';
              }
            } catch (e) {
              // Not JSON, just regular text
            }
            return pkg.description;
          })()}
        </p>

        <div className="flex justify-between items-center pt-2 border-t border-outline-variant/5">
          <div className="space-y-0.5">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Price</p>
            <p className="text-2xl font-black text-primary">৳{pkg.price}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/packages/${pkg.package_id}`); }}
              className="p-3 bg-surface-container hover:bg-primary hover:text-white rounded-2xl transition-all"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageCard;
