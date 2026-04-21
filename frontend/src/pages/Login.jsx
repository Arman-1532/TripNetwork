import React, { useState } from 'react';
import { Mail, Lock, LogIn, Sparkles, Plane, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
      // axios returns res.data directly because of our interceptor
      if (res?.success && res?.data?.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user);

        const role = (res.data.user?.role || '').toLowerCase();
        const pType = (res.data.user?.providerType || '').toUpperCase();

        if (role === 'admin') {
          window.location.assign('/admin');
          return;
        }

        if (role === 'provider' && pType === 'AGENCY') {
          window.location.assign('/provider/agency');
          return;
        }
        if (role === 'provider' && pType === 'HOTEL') {
          window.location.assign('/provider/hotel');
          return;
        }

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
        onRegisterSuccess={() => {
          // After successful registration, return user to login.
          setShowRegister(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 sm:p-6 font-body overflow-hidden relative">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-10"></div>
      </div>

      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 text-blue-400 opacity-5">
          <Plane size={120} />
        </div>
        <div className="absolute bottom-20 right-10 text-indigo-400 opacity-5">
          <Sparkles size={120} />
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Premium Glass Card */}
        <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden hover:border-white/30 transition-all duration-300">
          {/* Gradient Top Bar with Animation */}
          <div className="h-1.5 bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-500 animate-pulse"></div>

          <div className="p-8 sm:p-10">
            {/* Header Section */}
            <div className="text-center space-y-4 mb-8">
              {/* Animated Logo */}
              <div className="inline-flex justify-center mb-2">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/50 transform hover:scale-110 transition-all duration-300 hover:rotate-12">
                  <Plane size={44} strokeWidth={1.5} />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Welcome Back</h1>
              <p className="text-blue-100 font-medium text-sm leading-relaxed">Begin your journey with TripNetwork</p>
            </div>

            {/* Error Message with Animation */}
            {error && (
              <div className="p-4 mb-6 bg-red-500/20 border border-red-400/50 text-red-200 rounded-xl text-sm font-semibold text-center animate-pulse backdrop-blur-sm">
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-5 h-5 rounded-full bg-red-400"></div>
                  {error}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-blue-200 pl-1 flex items-center gap-2">
                  <Mail size={14} /> Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-blue-300 group-focus-within:text-cyan-300 transition-colors">
                    <Mail size={18} strokeWidth={2} />
                  </div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 text-white placeholder:text-white/40 border border-white/20 rounded-xl py-3 pl-12 pr-4 focus:bg-white/10 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all text-sm outline-none hover:border-white/30 hover:bg-white/8 backdrop-blur-sm"
                    placeholder="you@example.com"
                    type="email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-blue-200 pl-1 flex items-center gap-2">
                  <Lock size={14} /> Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-blue-300 group-focus-within:text-cyan-300 transition-colors">
                    <Lock size={18} strokeWidth={2} />
                  </div>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 text-white placeholder:text-white/40 border border-white/20 rounded-xl py-3 pl-12 pr-12 focus:bg-white/10 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all text-sm outline-none hover:border-white/30 hover:bg-white/8 backdrop-blur-sm"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-300 hover:text-cyan-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-blue-200 cursor-pointer hover:text-blue-100 transition-colors">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 accent-blue-400" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-cyan-300 hover:text-cyan-200 font-semibold transition-colors">
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-600 hover:from-blue-600 hover:via-cyan-500 hover:to-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group mt-6 text-base"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider with Icon */}
            <div className="my-7 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-blue-300 font-bold">New to TripNetwork?</span>
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/20 hover:border-white/40 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group backdrop-blur-sm"
            >
              <span>Create Free Account</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bottom Decorative Text */}
        <p className="text-center text-blue-200/60 text-xs mt-8 font-medium">
          🔒 Encrypted • 🚀 Fast • 🌍 Reliable Travel Companion
        </p>
      </div>

      {/* Floating Animation Element */}
      <div className="fixed bottom-8 right-8 text-blue-300 opacity-30 animate-bounce pointer-events-none">
        <Sparkles size={48} />
      </div>

      {/* Corner Decorations */}
      <div className="fixed top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default LoginPage;
