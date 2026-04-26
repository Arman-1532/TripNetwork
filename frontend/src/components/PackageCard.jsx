import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Timer } from 'lucide-react';

const PackageCard = ({ pkg, onBook }) => {
  const navigate = useNavigate();
  const providerName = pkg.hotel_name || pkg.agency_name || 'TripNetwork Partner';
  const isHotel = pkg.package_type === 'HOTEL';
  const [nowMs, setNowMs] = useState(Date.now());

  // More lenient gate: only requires offer_ends_at to be present.
  // Handles both "2025-12-31T23:59:59" and "2025-12-31 23:59:59" formats.
  const endsAtMs = useMemo(() => {
    if (!pkg?.offer_ends_at) return null;
    const parsed = new Date(pkg.offer_ends_at.toString().replace(' ', 'T')).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }, [pkg?.offer_ends_at]);

  useEffect(() => {
    if (!endsAtMs) return undefined;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [endsAtMs]);

  const countdown = useMemo(() => {
    if (!endsAtMs) return null;
    const remainingMs = endsAtMs - nowMs;
    if (remainingMs <= 0) return { label: 'Expired', expired: true };

    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, '0');

    return {
      days: pad(days),
      hours: pad(hours),
      minutes: pad(minutes),
      seconds: pad(seconds),
      expired: false,
      urgent: totalSeconds < 3600
    };
  }, [endsAtMs, nowMs]);

  return (
    <div
      onClick={() => navigate(`/packages/${pkg.package_id}`)}
      className="group relative rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 border border-slate-300/90 dark:border-slate-700 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer"
    >
      <div className="h-48 overflow-hidden relative">
        {pkg.image_url && (
          <img
            src={pkg.image_url}
            alt={pkg.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )}
        {!pkg.image_url && (
          <div className="w-full h-full bg-gradient-to-br from-primary/15 via-slate-100 to-slate-200 dark:from-primary/20 dark:via-slate-800 dark:to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent pointer-events-none" />

        {/* Floating Digital Clock Badge */}
        {countdown && !countdown.expired && (
          <div className={`absolute top-4 right-4 flex items-center gap-1 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 z-10 transition-all duration-500
            ${countdown.urgent
              ? 'bg-red-500/30 ring-1 ring-red-500/50'
              : 'bg-black/40'
            }`}
          >
            <div className="flex items-center gap-1">
              <div className={`flex items-center justify-center bg-white/20 rounded-md ${countdown.urgent ? 'bg-red-500/50' : ''}`} style={{ width: '20px', height: '20px' }}>
                <Timer size={14} className={`text-white ${countdown.urgent ? 'animate-pulse' : ''}`} />
              </div>

              {/* Show agency-provided duration */}
              {pkg.duration_value && pkg.duration_unit && (
                <span className="text-[9px] font-bold text-white/90 bg-white/10 px-1.5 py-0.5 rounded-md">
                  {pkg.duration_value} {pkg.duration_unit}
                </span>
              )}

              {Number(countdown.days) > 0 && (
                <>
                  <div className="flex flex-col items-center">
                    <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] font-black text-white min-w-[20px] text-center">{countdown.days}</span>
                    <span className="text-[6px] font-bold text-white/50 uppercase">Days</span>
                  </div>
                  <span className="text-[10px] font-bold text-white/40 pb-2">:</span>
                </>
              )}

              <div className="flex flex-col items-center">
                <span className="bg-white/10 px-1.5 py-0.5 rounded-md text-[10px] font-black text-white min-w-[20px] text-center">{countdown.hours}</span>
                <span className="text-[6px] font-bold text-white/50 uppercase">Hrs</span>
              </div>

              <span className="text-[10px] font-bold text-white/40 pb-2">:</span>

              <div className="flex flex-col items-center">
                <span className="bg-white/10 px-1.5 py-0.5 rounded-md text-[10px] font-black text-white min-w-[20px] text-center">{countdown.minutes}</span>
                <span className="text-[6px] font-bold text-white/50 uppercase">Min</span>
              </div>

              <span className="text-[10px] font-bold text-white/40 pb-2">:</span>

              <div className="flex flex-col items-center">
                <span className={`bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] font-black text-white min-w-[20px] text-center ${countdown.urgent ? 'bg-red-500/40 text-red-100' : ''}`}>{countdown.seconds}</span>
                <span className="text-[6px] font-bold text-white/50 uppercase">Sec</span>
              </div>
            </div>
          </div>
        )}

        {countdown?.expired && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-20">
            <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white">
              Offer Expired
            </div>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-sky-700 dark:text-sky-300 font-bold text-xs bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700/40 rounded-full px-2.5 py-1">
              <MapPin size={14} />
              <span>{pkg.origin ? `${pkg.origin} → ` : ''}{pkg.destination}</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
              {pkg.title}
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
              {isHotel ? '🏨 ' : '🏢 '}{providerName}
            </p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${isHotel
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/40'
              : 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700/40'
            }`}>
            {pkg.package_type}
          </span>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed h-10">
          {(() => {
            if (!pkg.description) return 'No description available for this curated package.';
            try {
              const parsed = JSON.parse(pkg.description);
              if (parsed && typeof parsed === 'object') {
                return parsed.fullDescription || parsed.message || 'Details provided by agency.';
              }
            } catch {
              // plain text
            }
            return pkg.description;
          })()}
        </p>

        <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="space-y-0.5">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">Price</p>
            <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">৳{pkg.price}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/packages/${pkg.package_id}`); }}
            className="px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-primary hover:text-white rounded-2xl transition-all inline-flex items-center gap-2 font-bold text-sm"
          >
            View Details
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PackageCard;