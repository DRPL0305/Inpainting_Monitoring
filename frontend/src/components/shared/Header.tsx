'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Bell,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Settings,
  Calendar,
  X
} from 'lucide-react';
import { AuthUser } from '@/types';

function HeaderContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Global Date Filter State
  const [fromDate, setFromDate] = useState(searchParams?.get('assignedFrom') || '');
  const [toDate, setToDate] = useState(searchParams?.get('assignedTo') || '');

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem('inpainting_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    setFromDate(searchParams?.get('assignedFrom') || '');
    setToDate(searchParams?.get('assignedTo') || '');
  }, [searchParams]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyFilter = (from: string, to: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (from) params.set('assignedFrom', from);
    else params.delete('assignedFrom');

    if (to) params.set('assignedTo', to);
    else params.delete('assignedTo');

    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFromDate(val);
    applyFilter(val, toDate);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setToDate(val);
    applyFilter(fromDate, val);
  };

  const setQuickFilter = (preset: 'today' | 'yesterday' | 'clear') => {
    let from = '';
    let to = '';
    const now = new Date();

    if (preset === 'today') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      from = `${year}-${month}-${day}`;
      to = `${year}-${month}-${day}`;
    } else if (preset === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const year = yesterday.getFullYear();
      const month = String(yesterday.getMonth() + 1).padStart(2, '0');
      const day = String(yesterday.getDate()).padStart(2, '0');
      from = `${year}-${month}-${day}`;
      to = `${year}-${month}-${day}`;
    }

    setFromDate(from);
    setToDate(to);
    applyFilter(from, to);
  };

  const handleLogout = () => {
    localStorage.removeItem('inpainting_token');
    localStorage.removeItem('inpainting_user');
    router.push('/login');
  };

  const getPageTitle = () => {
    const path = pathname || '';
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/logos')) return 'Logo Management';
    if (path.startsWith('/users')) return 'User Management';
    if (path.startsWith('/logs')) return 'Activity Logs';
    return 'Dashboard';
  };

  return (
    <header className="fixed left-20 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-card-border bg-card/80 px-6 backdrop-blur-md">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button className="md:hidden text-slate-400 hover:text-slate-200">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium text-xs sm:text-sm">Inpainting Asset</span>
          <span className="text-slate-600">/</span>
          <h1 className="text-xs sm:text-sm font-semibold text-slate-200 tracking-wider">{getPageTitle()}</h1>
        </div>
      </div>

      {/* Right: Date Filter, Theme Switcher, Profile Menu */}
      <div className="flex items-center gap-4">
        {/* Global Date Filter Popover */}
        <div className="relative" ref={calendarRef}>
          <button
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className={`rounded-lg px-3 py-1.5 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all cursor-pointer flex items-center gap-2 border border-slate-800 bg-slate-950/40 hover:border-slate-700 shadow-sm ${
              fromDate || toDate
                ? 'text-blue-400 border-blue-500/40 bg-blue-950/20 ring-1 ring-blue-500/30'
                : isCalendarOpen
                ? 'bg-slate-900 text-slate-200 border-slate-700'
                : ''
            }`}
            title="Global Date Filter"
          >
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-semibold hidden sm:inline">Filter Dates</span>
            {(fromDate || toDate) && (
              <span className="text-[10px] font-bold text-blue-400 bg-blue-950/50 px-1.5 py-0.25 rounded-md border border-blue-500/20">
                Active
              </span>
            )}
          </button>

          {isCalendarOpen && (
            <div className="absolute right-0 mt-2.5 w-72 rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-2xl z-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Global Date Filter</h4>
                <button
                  onClick={() => setIsCalendarOpen(false)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned From</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={handleFromChange}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-blue-500/50 cursor-pointer dark:[color-scheme:dark] w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={handleToChange}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-blue-500/50 cursor-pointer dark:[color-scheme:dark] w-full"
                  />
                </div>

                <div className="flex items-center gap-1.5 mt-2 border-t border-slate-800 pt-3">
                  <button
                    onClick={() => setQuickFilter('today')}
                    className="flex-1 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer text-center bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setQuickFilter('yesterday')}
                    className="flex-1 py-1.5 rounded text-[10px] font-bold transition-all cursor-pointer text-center bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  >
                    Yesterday
                  </button>
                  {(fromDate || toDate) && (
                    <button
                      onClick={() => setQuickFilter('clear')}
                      className="px-2 py-1.5 rounded bg-red-950/40 text-red-400 hover:bg-red-950/60 hover:text-red-300 border border-red-900/30 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme Switcher */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {!mounted ? (
            <div className="h-4.5 w-4.5" />
          ) : theme === 'dark' ? (
            <Sun className="h-4.5 w-4.5" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 rounded-lg py-1 px-2.5 border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 transition-all cursor-pointer text-left"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white uppercase shadow-md">
              {user ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-100 leading-tight">
                {user ? user.name : 'User'}
              </p>
              <p className="text-[10px] font-semibold text-slate-400 leading-tight">
                {user ? user.role.toUpperCase() : ''}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2.5 w-56 rounded-xl border border-slate-800 bg-slate-900 py-1.5 shadow-2xl z-50">
              <div className="border-b border-slate-800 px-4 py-2.5">
                <p className="text-xs font-semibold text-slate-100">{user?.name}</p>
                <p className="text-[10px] text-slate-400 font-semibold truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300">
                  <UserIcon className="h-3.5 w-3.5" />
                  Role: <span className="text-blue-400 font-semibold">{user?.role}</span>
                </div>
              </div>
              <div className="border-t border-slate-800 pt-1.5 mt-1.5">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-slate-800 hover:text-red-300 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={
      <header className="fixed left-20 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-card-border bg-card/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium text-xs sm:text-sm">Inpainting Asset</span>
        </div>
      </header>
    }>
      <HeaderContent />
    </Suspense>
  );
}
