import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquareText } from 'lucide-react';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isTravelerDashboard = location.pathname === '/traveler' || location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl flex items-center justify-between px-8 py-4 shadow-sm dark:shadow-none font-headline antialiased border-b border-outline-variant/5">
      <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        The Atmospheric Traveler
      </div>

      <div className="flex items-center gap-3">
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
