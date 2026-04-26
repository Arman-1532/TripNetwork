import React, { useState } from 'react';
import { Mail, Lock, LogIn, Sparkles, Plane, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import RegisterPage from './Register';

const LoginPage = ({ onLoginSuccess }) => {
  console.log('LoginPage rendering');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(email, password);
      if (res?.success && res?.data?.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);

        const role = (res.data.user?.role || '').toLowerCase();
        const pType = (res.data.user?.providerType || '').toUpperCase();

        if (role === 'admin') { window.location.assign('/admin'); return; }
        if (role === 'provider' && pType === 'AGENCY') { window.location.assign('/provider/agency/packages'); return; }
        if (role === 'provider' && pType === 'HOTEL') { window.location.assign('/provider/hotel/packages'); return; }
        window.location.assign('/traveler');
      } else {
        setError(res?.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  if (showRegister) {
    return (
      <RegisterPage
        onBackToLogin={() => setShowRegister(false)}
        onRegisterSuccess={() => setShowRegister(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6 font-body">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tertiary rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 glass-effect bg-white/40 dark:bg-slate-900/40 p-10 rounded-[2.5rem] border border-outline-variant/10 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 mb-6">
            <Plane size={32} />
          </div>
          <h1 className="text-4xl font-black font-headline tracking-tight text-on-surface">Welcome Back</h1>
          <p className="text-on-surface-variant font-medium">Continue your curatorial journey</p>
        </div>

        {error && (
          <div className="p-4 bg-error-container/10 border border-error/20 text-error rounded-2xl text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-white/90 pl-4">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                <Mail size={18} />
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                placeholder="you@example.com"
                type="email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-white/90 pl-4">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-primary">
                <Lock size={18} />
              </span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-on-surface-variant dark:placeholder:text-white/60 border-none rounded-2xl py-4 pl-12 pr-10 focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-4 flex items-center text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-full font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group mt-4 h-14 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>Begin Adventure</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-8 border-t border-outline-variant/10 text-center space-y-3">
          <p className="text-xs text-on-surface font-medium">
            Don&apos;t have an account?
          </p>
          <button
            type="button"
            onClick={() => setShowRegister(true)}
            className="text-primary font-black hover:underline"
          >
            Create one
          </button>
        </div>
      </div>

      {/* Floating Sparkle Decoration */}
      <div className="fixed bottom-10 right-10 text-primary opacity-30 animate-pulse">
        <Sparkles size={48} />
      </div>
    </div>
  );
};

export default LoginPage;
