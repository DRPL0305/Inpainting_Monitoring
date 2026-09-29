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
      className="relative min-h-screen w-full flex items-center justify-center lg:justify-end bg-cover bg-center bg-no-repeat p-4 sm:p-6 lg:pr-12 xl:pr-20 overflow-y-auto select-none"
      style={{ backgroundImage: `url('/login_screen.jpg')` }}
    >
      <div className="relative z-10 flex flex-col sm:flex-row gap-5 lg:gap-6 max-w-[760px] w-full items-stretch justify-end">
        {/* Left Side Card: Brand Info */}
        <div className="bg-white/85 backdrop-blur-md rounded-[24px] border border-white/40 shadow-2xl p-8 sm:p-9 flex flex-col justify-start w-full sm:w-[340px] md:w-[360px] min-h-[360px]">
          {/* Header Icon + Brand Name */}
          <div className="flex items-center gap-3.5 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-[#eff6ff] flex items-center justify-center shrink-0 shadow-sm border border-blue-500/20">
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
              <span className="text-[12px] font-extrabold text-[#0f172a] uppercase tracking-wider leading-snug">
                DRPL INPAINTING
              </span>
              <span className="text-[12px] font-extrabold text-[#0f172a] uppercase tracking-wider leading-snug">
                MANAGEMENT
              </span>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-[26px] font-extrabold text-[#0f172a] tracking-tight leading-[1.25] mb-6">
            Inpainting Asset<br />Management
          </h1>

          {/* Description */}
          <p className="text-[#334155] text-sm md:text-[15px] leading-relaxed font-normal">
            Secure role-based dashboard for orchestrating inpainting task flow, logo management, active assignments, and review steps.
          </p>
        </div>

        {/* Right Side Card: Sign In Form */}
        <div className="bg-white/85 backdrop-blur-md rounded-[24px] border border-white/40 shadow-2xl p-8 sm:p-9 flex flex-col justify-between w-full sm:w-[340px] md:w-[360px] min-h-[360px]">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">Sign In</h2>
            <p className="text-xs text-[#475569] mt-1 mb-6">
              Enter credentials to securely authenticate into your workspace.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 text-red-600 text-xs rounded-xl text-center font-medium border border-red-500/20">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#334155] uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#64748b]" /> EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  placeholder="you@pulse360.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="login-input w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-sm text-[#0f172a] placeholder:text-[#94a3b8] caret-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#334155] uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-[#64748b]" /> ACCOUNT PASSWORD
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
                    className="login-input w-full px-3.5 py-2.5 pr-10 bg-white border border-[#cbd5e1] rounded-xl text-sm text-[#0f172a] placeholder:text-[#94a3b8] caret-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#64748b] hover:text-[#0f172a] p-0.5 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#2563eb] hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
