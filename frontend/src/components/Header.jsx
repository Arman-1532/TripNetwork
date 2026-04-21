import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquareText } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isTravelerDashboard = location.pathname === '/traveler' || location.pathname === '/';

  // Read user from localStorage so header can show provider quick actions
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {}
  const role = (user?.role || '').toLowerCase();
  const providerType = (user?.providerType || '').toUpperCase();

  const handleGoToProfile = () => {
    if (role === 'provider' && providerType === 'HOTEL') return navigate('/provider/hotel/profile');
    if (role === 'provider' && providerType === 'AGENCY') return navigate('/provider/agency');
    return null;
  };

  const handleGoToPost = () => {
    if (role === 'provider' && providerType === 'HOTEL') return navigate('/provider/hotel');
    if (role === 'provider' && providerType === 'AGENCY') return navigate('/provider/agency');
    return null;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl flex items-center justify-between px-8 py-4 shadow-sm dark:shadow-none font-headline antialiased border-b border-outline-variant/5">
      <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        The Atmospheric Traveler
      </div>

      <div className="flex items-center gap-3">
        {/* Provider quick actions */}
        {role === 'provider' && (
          <div className="hidden md:flex items-center gap-2">
            <button onClick={handleGoToProfile} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface text-on-surface border border-outline-variant/10 hover:bg-surface-container-low">
              Profile
            </button>
            <button onClick={handleGoToPost} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-on-primary font-extrabold shadow-lg shadow-primary/20 hover:bg-primary-dim">
              {providerType === 'HOTEL' ? 'Post Offering' : 'Post Package'}
            </button>
          </div>
        )}

        {isTravelerDashboard && (
          <button
            onClick={() => navigate('/chat')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-on-primary font-extrabold shadow-lg shadow-primary/20 hover:bg-primary-dim transition-colors"
            aria-label="Chat"
            title="Chat"
          >
            <MessageSquareText size={20} className="stroke-[2.5]" />
            <span className="tracking-wide">Chat</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

