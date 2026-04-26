import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import PackageCard from '../components/PackageCard';

const AllPackages = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPackages = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.packages.getAll();
        if (res?.success) setPackages(Array.isArray(res.data) ? res.data : []);
        else setError(res?.message || 'Failed to load packages');
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load packages');
      } finally {
        setLoading(false);
      }
    };

    loadPackages();
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200/80 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50 to-slate-100/80 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
              <Sparkles size={14} />
              Explore All Active Offers
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-on-surface">All Curated Packages</h1>
            <p className="text-on-surface-variant">
              Browse all currently active travel packages.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/traveler')}
            className="inline-flex items-center gap-2 rounded-2xl border border-outline-variant/20 px-4 py-2.5 text-sm font-semibold hover:bg-surface-container transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </section>

      {error && (
        <div className="text-sm bg-error-container text-on-error-container p-3 rounded-2xl">{error}</div>
      )}

      <section className="rounded-[2rem] p-5 md:p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border border-slate-200/80 dark:border-slate-700/70">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="h-[400px] bg-surface-container animate-pulse rounded-[2rem]" />
              ))
            : packages.map((pkg) => (
                <PackageCard key={pkg.package_id} pkg={pkg} />
              ))}
        </div>

        {!loading && !error && packages.length === 0 && (
          <div className="text-center py-10 text-on-surface-variant text-sm">
            No active packages available right now.
          </div>
        )}
      </section>
    </div>
  );
};

export default AllPackages;
