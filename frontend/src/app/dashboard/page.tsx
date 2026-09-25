'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import AssetModal from '@/components/shared/AssetModal';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import { Asset, AssetStats, AuthUser } from '@/types';
import api from '@/services/api';
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
  BadgeCheck
} from 'lucide-react';

type SortField = 'id' | 'title' | 'logoId' | 'duration' | 'status' | 'doneTimestamp';

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

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; asset: Asset | null }>({
    isOpen: false,
    asset: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // Sort assets client-side
  const sortedAssets = [...assets].sort((a, b) => {
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
      label: 'AMOUNT OF CONTENT HOURS COMPLETED',
      value: `${stats.completedHours ?? 0} hrs`,
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

          {/* Asset count + Filters & Search Toolbar */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{sortedAssets.length} assets</span>
              <button
                onClick={fetchDashboardData}
                className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> REFRESH
              </button>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
              <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by ID, title, logo ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </form>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ALL">All</option>
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Assets Data Table */}
          <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th
                      onClick={() => handleSort('id')}
                      className="py-3.5 px-5 cursor-pointer hover:text-slate-200 transition-colors select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Asset ID</span>
                        {renderSortIcon('id')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('title')}
                      className="py-3.5 px-5 cursor-pointer hover:text-slate-200 transition-colors select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Title</span>
                        {renderSortIcon('title')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('logoId')}
                      className="py-3.5 px-5 cursor-pointer hover:text-slate-200 transition-colors select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Logo ID</span>
                        {renderSortIcon('logoId')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('duration')}
                      className="py-3.5 px-5 cursor-pointer hover:text-slate-200 transition-colors select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Duration</span>
                        {renderSortIcon('duration')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="py-3.5 px-5 cursor-pointer hover:text-slate-200 transition-colors select-none group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        {renderSortIcon('status')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('doneTimestamp')}
                      className="py-3.5 px-5 cursor-pointer hover:text-slate-200 transition-colors select-none group"
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
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                        <span className="text-xs">Loading inpainting assets...</span>
                      </td>
                    </tr>
                  ) : sortedAssets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                        No inpainting assets found.
                      </td>
                    </tr>
                  ) : (
                    sortedAssets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-semibold text-blue-400 text-xs">{asset.id}</td>
                        <td className="py-3.5 px-5 font-medium text-slate-200 text-xs">
                          <div className="flex items-center gap-2">
                            <Film className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate max-w-xs">{asset.title}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400">
                          <span className="bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                            {asset.logoId || '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">
                          {asset.duration}s
                        </td>
                        <td className="py-3.5 px-5">
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
                        <td className="py-3.5 px-5 text-[11px] text-slate-400 font-mono">
                          {asset.doneTimestamp || <span className="text-slate-600">—</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer count */}
            <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Showing 1 – {sortedAssets.length} of {sortedAssets.length} entries
              </span>
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
      </div>
    </div>
  );
}
