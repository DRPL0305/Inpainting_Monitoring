'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, LogIn, Eye, EyeOff } from 'lucide-react';
import api from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      localStorage.setItem('inpainting_token', token);
      localStorage.setItem('inpainting_user', JSON.stringify(user));

      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative min-h-screen w-full flex items-center justify-center lg:justify-end bg-cover bg-center bg-no-repeat p-4 sm:p-6 lg:pr-12 xl:pr-20 overflow-y-auto"
      style={{ backgroundImage: `url('/login_screen.jpg')` }}
    >
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row gap-5 lg:gap-6 max-w-[760px] w-full items-stretch justify-end">
        {/* Left Side Card: Brand Info */}
        <div className="bg-white/95 backdrop-blur-md border border-white/60 rounded-[24px] shadow-xl p-8 sm:p-9 flex flex-col justify-start w-full sm:w-[340px] md:w-[360px] min-h-[360px]">
          {/* Header Icon + Brand Name */}
          <div className="flex items-center gap-3.5 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-blue-50/80 border border-blue-200/60 flex items-center justify-center shrink-0 shadow-sm">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <circle cx="12" cy="12" r="10" fill="url(#logoGrad)" />
                <polygon points="10,8 16,12 10,16" fill="white" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-extrabold text-slate-900 uppercase tracking-wider leading-snug">
                DRPL INPAINTING
              </span>
              <span className="text-[12px] font-extrabold text-slate-900 uppercase tracking-wider leading-snug">
                MANAGEMENT
              </span>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight leading-[1.25] mb-6">
            Inpainting Asset<br />Management
          </h1>

          {/* Description */}
          <p className="text-xs text-slate-500 leading-relaxed font-normal">
            Secure role-based dashboard for orchestrating inpainting task flow, logo management, active assignments, and review steps.
          </p>
        </div>

        {/* Right Side Card: Sign In Form */}
        <div className="bg-white/95 backdrop-blur-md border border-white/60 rounded-[24px] shadow-xl p-8 sm:p-9 flex flex-col justify-between w-full sm:w-[340px] md:w-[360px] min-h-[360px]">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Enter credentials to securely authenticate into your workspace.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  placeholder="you@pulse360.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-slate-50/90 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400" /> ACCOUNT PASSWORD
                  </label>
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Please contact your system administrator to reset your password.');
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-50/90 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  {loading ? 'Authenticating...' : 'Authenticate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
