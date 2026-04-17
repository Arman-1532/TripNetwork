import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HotelSearch from '../components/HotelSearch';
import { api } from '../services/api';

export default function HotelResults() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onSearch = async (params) => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await api.hotels.search(params);
      if (res?.success) setResults(res.data || []);
      else setError(res?.message || 'Search failed');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-on-surface">Find Hotels</h1>
        <p className="text-sm text-on-surface-variant">Search approved hotel offerings</p>
      </div>

      <HotelSearch onSearch={onSearch} />

      {loading && <div className="text-sm text-on-surface-variant">Searching...</div>}
      {error && <div className="text-sm bg-error-container text-on-error-container p-3 rounded-2xl">{error}</div>}

      {!loading && !error && results.length === 0 && (
        <div className="text-sm text-on-surface-variant">No hotels found for that search.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((h) => (
          <button
            key={h.package_id}
            type="button"
            onClick={() => navigate(`/hotels/${h.package_id}`)}
            className="text-left bg-white dark:bg-slate-900 border border-outline-variant/10 rounded-3xl p-5 hover:shadow-lg transition-shadow"
          >
            <div className="font-black text-on-surface">{h.title}</div>
            <div className="text-xs text-on-surface-variant">{h.destination}</div>
            <div className="text-sm text-primary font-black mt-2">৳{h.price}</div>
            <div className="text-xs text-on-surface-variant mt-2 line-clamp-2">
              {h.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

