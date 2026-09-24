'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, LogIn, Eye, EyeOff } from 'lucide-react';
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
    <div className="relative min-h-screen flex items-center justify-center bg-background text-foreground overflow-hidden px-4">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch relative z-10 my-12">
        {/* Left Side: Brand Info */}
        <div className="flex flex-col justify-between p-6 md:p-8 glass-card rounded-2xl">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 border border-blue-500/30">
                <Sparkles className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-base font-bold text-slate-100 uppercase tracking-widest">INPAINTING MONITORING</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100 leading-tight">
              Inpainting Asset Management
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              Secure role-based dashboard for monitoring inpainting pipelines, logo management, asset tracking, and export status review.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex flex-col justify-center p-6 md:p-8 glass-card rounded-2xl">
          <h2 className="text-xl font-bold text-slate-100">Sign In</h2>
          <p className="text-slate-400 text-xs mt-1 mb-6">Enter credentials to securely authenticate into your workspace.</p>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Account Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 pr-10 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                {loading ? 'Authenticating...' : 'Authenticate'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
