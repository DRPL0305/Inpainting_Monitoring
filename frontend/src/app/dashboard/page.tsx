'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import AssetModal from '@/components/shared/AssetModal';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import LogoPreviewModal from '@/components/shared/LogoPreviewModal';
import { Asset, AssetStats, AuthUser } from '@/types';
import api from '@/services/api';
import { formatIndianTimestamp } from '@/utils/dateFormatter';
import {
  Database,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  RefreshCw,
  Film,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BadgeCheck,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';

type SortField = 'id' | 'title' | 'blitzAgId' | 'filePath' | 'logoPresent' | 'logoId' | 'whichLogo' | 'duration' | 'status' | 'doneTimestamp';

const formatDuration = (seconds?: number | null) => {
  if (seconds === undefined || seconds === null || isNaN(Number(seconds))) return '—';
  const totalSecs = Math.floor(Number(seconds));
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
};

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<AssetStats>({
    totalAssets: 0,
    completedAssets: 0,
    completedHours: 0,
  });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [logoPresentFilter, setLogoPresentFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, logoPresentFilter, sortField, sortDirection, itemsPerPage]);

  // Modals state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; asset: Asset | null }>({
    isOpen: false,
    asset: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewLogoModal, setPreviewLogoModal] = useState<{
    isOpen: boolean;
    logoId: string | null;
    whichLogo?: string | null;
  }>({
    isOpen: false,
    logoId: null,
  });

  useEffect(() => {
    const token = localStorage.getItem('inpainting_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const storedUser = localStorage.getItem('inpainting_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
    fetchDashboardData();
  }, [statusFilter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await api.get('/assets/stats');
      setStats(statsRes.data);

      // Fetch assets list
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search) params.search = search;

      const assetsRes = await api.get('/assets', { params });
      setAssets(assetsRes.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSaveAsset = async (assetData: Partial<Asset>) => {
    if (editingAsset) {
      await api.patch(`/assets/${editingAsset.id}`, assetData);
    } else {
      await api.post('/assets', assetData);
    }
    fetchDashboardData();
  };

  const handleDeleteAsset = async () => {
    if (!deleteModal.asset) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/assets/${deleteModal.asset.id}`);
      setDeleteModal({ isOpen: false, asset: null });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to delete asset:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setLogoPresentFilter('ALL');
    setSortField('id');
    setSortDirection('asc');
  };

  const isFilteredActive = search !== '' || statusFilter !== 'ALL' || logoPresentFilter !== 'ALL' || sortField !== 'id' || sortDirection !== 'asc';

  // Filter assets client-side
  const filteredAssets = assets.filter((asset) => {
    const isLogoPresent = asset.logoPresent === 'Yes' || asset.logoPresent === 'YES' || Boolean(asset.whichLogo || asset.logoId);
    if (logoPresentFilter === 'YES' && !isLogoPresent) return false;
    if (logoPresentFilter === 'NO' && isLogoPresent) return false;
    return true;
  });

  // Sort assets client-side
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    if (!sortField) return 0;
    let valA = a[sortField] ?? '';
    let valB = b[sortField] ?? '';

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    }

    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations
  const totalEntries = sortedAssets.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalEntries);
  const paginatedAssets = sortedAssets.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Top 3 Metric Cards config
  const statCards = [
    {
      label: 'TOTAL ASSETS',
      value: stats.totalAssets,
      icon: Database,
      color: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'COMPLETED',
      value: stats.completedAssets,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'AMOUNT OF CONTENT HOURS',
      value: `${(assets.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 3600).toFixed(2)} hrs`,
      icon: Clock,
      color: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20',
    },
  ];

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-60 group-hover:opacity-100" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-400 font-bold" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-400 font-bold" />
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <div className="flex-1 pl-20 flex flex-col min-w-0">
        <Header />

        <main className="p-6 pt-20 space-y-6 flex-1 w-full">
          {/* Section Heading & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                Asset Registry
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Track inpainting assets, logo metadata, and processing metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchDashboardData}
                className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* 3 Metric Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="glass-card bg-slate-900/60 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
                    <div
                      className={`w-8 h-8 rounded-lg ${card.iconBg} border flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className={`text-3xl font-extrabold mt-2 tracking-tight ${card.color}`}>{card.value}</h3>
                </div>
              );
            })}
          </div>

          {/* Asset count + Enhanced Creative Filters & Search Toolbar */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-300">
                  Showing <span className="text-blue-400 font-bold">{sortedAssets.length}</span> of {assets.length} total assets
                </span>
              </div>
              <button
                onClick={fetchDashboardData}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-lg transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> REFRESH DATA
              </button>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              {/* Left side: Search input */}
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72 md:w-80 shrink-0">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ID, Title, Blitz AG ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-inner"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Right side: Filters & Sorting controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-slate-900 text-slate-200">All Statuses</option>
                    <option value="PENDING" className="bg-slate-900 text-amber-400">Pending Only</option>
                    <option value="COMPLETED" className="bg-slate-900 text-emerald-400">Completed Only</option>
                  </select>
                </div>

                {/* Logo Present Filter - Commented out for now
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Logo Present:</span>
                  <select
                    value={logoPresentFilter}
                    onChange={(e) => setLogoPresentFilter(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-slate-900 text-slate-200">All</option>
                    <option value="YES" className="bg-slate-900 text-emerald-400">Yes (Logo Attached)</option>
                    <option value="NO" className="bg-slate-900 text-rose-400">No (No Logo)</option>
                  </select>
                </div>
                */}

                {/* Sort By Selector */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sort By:</span>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="id" className="bg-slate-900">Asset ID</option>
                    <option value="title" className="bg-slate-900">Title</option>
                    <option value="blitzAgId" className="bg-slate-900">Blitz AG ID</option>
                    <option value="logoId" className="bg-slate-900">Logo ID</option>
                    <option value="duration" className="bg-slate-900">Duration</option>
                    <option value="status" className="bg-slate-900">Status</option>
                    <option value="doneTimestamp" className="bg-slate-900">Done Timestamp</option>
                  </select>
                </div>

                {/* Sort Direction Toggle Button */}
                <button
                  onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/50 rounded-xl text-xs font-bold text-blue-400 transition-all cursor-pointer"
                  title={`Sort ${sortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
                >
                  {sortDirection === 'asc' ? (
                    <>
                      <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
                      <span>ASC</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                      <span>DESC</span>
                    </>
                  )}
                </button>

                {/* Reset Filters Button */}
                {isFilteredActive && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    title="Reset all search filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Filter Pills Bar */}
            {isFilteredActive && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Filters:</span>
                {search && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Search: "{search}"
                    <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSearch('')} />
                  </span>
                )}
                {statusFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Status: {statusFilter}
                    <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setStatusFilter('ALL')} />
                  </span>
                )}
                {/* 
                {logoPresentFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Logo Present: {logoPresentFilter}
                    <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setLogoPresentFilter('ALL')} />
                  </span>
                )}
                */}
                {(sortField !== 'id' || sortDirection !== 'asc') && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Sorted by: {sortField} ({sortDirection.toUpperCase()})
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-white"
                      onClick={() => {
                        setSortField('id');
                        setSortDirection('asc');
                      }}
                    />
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Assets Data Table */}
          <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th
                      onClick={() => handleSort('id')}
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Asset ID</span>
                        {renderSortIcon('id')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('title')}
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Title</span>
                        {renderSortIcon('title')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('blitzAgId')}
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Blitz AG ID</span>
                        {renderSortIcon('blitzAgId')}
                      </div>
                    </th>
                    {/* Logo Present Column Header - Commented out for now
                    <th
                      onClick={() => handleSort('logoPresent')}
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Logo Present</span>
                        {renderSortIcon('logoPresent')}
                      </div>
                    </th>
                    */}
                    <th
                      onClick={() => handleSort('logoId')}
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Logo ID</span>
                        {renderSortIcon('logoId')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('duration')}
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Duration</span>
                        {renderSortIcon('duration')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        {renderSortIcon('status')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('doneTimestamp')}
                      className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Done Timestamp</span>
                        {renderSortIcon('doneTimestamp')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                        <span className="text-xs">Loading inpainting assets...</span>
                      </td>
                    </tr>
                  ) : sortedAssets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                        No inpainting assets found.
                      </td>
                    </tr>
                  ) : (
                    paginatedAssets.map((asset) => {
                      const isLogoPresent = asset.logoPresent === 'Yes' || asset.logoPresent === 'YES' || Boolean(asset.whichLogo || asset.logoId);
                      return (
                        <tr key={asset.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold text-blue-400 text-xs">{asset.id}</td>
                          <td className="py-3 px-4 font-medium text-slate-200 text-xs">
                            <div className="flex items-center gap-2">
                              <Film className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[180px]" title={asset.title}>{asset.title}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-200 font-semibold">
                            {asset.blitzAgId || (asset as any).blitzagid || '—'}
                          </td>
                          {/* Logo Present Cell - Commented out for now
                          <td className="py-3 px-4 text-xs font-semibold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                isLogoPresent
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {asset.logoPresent || (isLogoPresent ? 'Yes' : 'No')}
                            </span>
                          </td>
                          */}
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                            {asset.logoId ? (
                              <button
                                onClick={() => setPreviewLogoModal({ isOpen: true, logoId: asset.logoId!, whichLogo: asset.whichLogo || asset.logoType })}
                                className="bg-blue-950/80 hover:bg-blue-900 text-blue-400 hover:text-blue-300 border border-blue-800/60 hover:border-blue-500 px-2.5 py-1 rounded-md cursor-pointer transition-all flex items-center gap-1 font-semibold group/btn"
                                title="Click to view logo PNG image"
                              >
                                <span>{asset.logoId}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-70 group-hover/btn:opacity-100" />
                              </button>
                            ) : (
                              <span className="bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800 text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-200 font-mono text-[11px] font-semibold">
                            {asset.duration ? (
                              <span className="inline-flex items-center gap-1 bg-slate-950/80 px-2.5 py-0.5 rounded border border-slate-800 text-cyan-400 font-semibold font-mono">
                                {formatDuration(asset.duration)}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                asset.status === 'COMPLETED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  asset.status === 'COMPLETED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                                }`}
                              />
                              {asset.status === 'COMPLETED' ? 'Completed' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[11px] font-semibold text-slate-300 font-mono whitespace-nowrap">
                            {asset.doneTimestamp ? formatIndianTimestamp(asset.doneTimestamp) : <span className="text-slate-600">—</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Pagination Controls */}
            <div className="px-5 py-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/40">
              <div className="flex items-center gap-4">
                <span className="text-[12px] text-slate-400">
                  Showing{' '}
                  <span className="font-semibold text-slate-200">
                    {totalEntries === 0 ? 0 : startIndex + 1}
                  </span>{' '}
                  –{' '}
                  <span className="font-semibold text-slate-200">
                    {endIndex}
                  </span>{' '}
                  of <span className="font-semibold text-slate-200">{totalEntries}</span> entries
                </span>

                <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                  <label htmlFor="itemsPerPage" className="text-xs text-slate-400">
                    Per page:
                  </label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Navigation Controls */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {getPageNumbers().map((page, idx) =>
                      page === '...' ? (
                        <span key={`dots-${idx}`} className="px-1.5 text-xs text-slate-600 select-none">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(Number(page))}
                          className={`min-w-[28px] h-7 px-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                            currentPage === page
                              ? 'bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Asset Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          title="Delete Inpainting Asset"
          message={`Are you sure you want to delete asset "${deleteModal.asset?.id}"? This action cannot be undone.`}
          onClose={() => setDeleteModal({ isOpen: false, asset: null })}
          onConfirm={handleDeleteAsset}
          loading={deleteLoading}
        />

        {/* Logo Preview Modal */}
        <LogoPreviewModal
          isOpen={previewLogoModal.isOpen}
          logoId={previewLogoModal.logoId}
          whichLogo={previewLogoModal.whichLogo}
          onClose={() => setPreviewLogoModal({ isOpen: false, logoId: null })}
        />
      </div>
    </div>
  );
}
