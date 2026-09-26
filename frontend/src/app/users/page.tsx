'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import UserModal from '@/components/shared/UserModal';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import { User, AuthUser } from '@/types';
import api from '@/services/api';
import {
  Users as UsersIcon,
  UserPlus,
  Shield,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  X,
  AlertTriangle,
  SlidersHorizontal,
  UserCheck,
  UserX
} from 'lucide-react';

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'VIEWER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Status Toggle Confirmation Modal
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    user: User | null;
    targetStatus: 'ACTIVE' | 'INACTIVE' | null;
  }>({
    isOpen: false,
    user: null,
    targetStatus: null,
  });
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('inpainting_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const storedUser = localStorage.getItem('inpainting_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
        if (parsed.role !== 'ADMIN') {
          window.location.href = '/dashboard';
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchUsers();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, itemsPerPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    await api.post('/users', userData);
    fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/users/${deleteModal.user.id}`);
      setDeleteModal({ isOpen: false, user: null });
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const promptToggleStatus = (user: User) => {
    const targetStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatusModal({
      isOpen: true,
      user,
      targetStatus,
    });
  };

  const confirmToggleStatus = async () => {
    if (!statusModal.user || !statusModal.targetStatus) return;
    setStatusLoading(true);
    try {
      await api.patch(`/users/${statusModal.user.id}`, { status: statusModal.targetStatus });
      setStatusModal({ isOpen: false, user: null, targetStatus: null });
      fetchUsers();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  };

  const isFilteredActive = searchTerm !== '' || roleFilter !== 'ALL' || statusFilter !== 'ALL';

  // Compute stats
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const viewerCount = users.filter((u) => u.role === 'VIEWER').length;
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;

  const statCards = [
    {
      label: 'TOTAL USERS',
      value: totalUsers,
      icon: UsersIcon,
      color: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      onClick: handleResetFilters,
      isActive: roleFilter === 'ALL' && statusFilter === 'ALL',
      tooltip: 'Show all users'
    },
    {
      label: 'ADMINS',
      value: adminCount,
      icon: Shield,
      color: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20',
      onClick: () => {
        setRoleFilter('ADMIN');
        setStatusFilter('ALL');
      },
      isActive: roleFilter === 'ADMIN',
      tooltip: 'Filter by Admin role'
    },
    {
      label: 'VIEWERS',
      value: viewerCount,
      icon: UsersIcon,
      color: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20',
      onClick: () => {
        setRoleFilter('VIEWER');
        setStatusFilter('ALL');
      },
      isActive: roleFilter === 'VIEWER',
      tooltip: 'Filter by Viewer role'
    },
    {
      label: 'ACTIVE USERS',
      value: activeCount,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      onClick: () => {
        setStatusFilter('ACTIVE');
        setRoleFilter('ALL');
      },
      isActive: statusFilter === 'ACTIVE',
      tooltip: 'Filter by Active status'
    },
  ];

  // Client-side Filter
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      searchTerm === '' ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination calculations
  const totalEntries = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalEntries);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

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

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <div className="flex-1 pl-20 flex flex-col min-w-0">
        <Header />

        <main className="p-6 pt-20 space-y-6 flex-1 w-full">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-blue-400" />
                User Management
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Activate/deactivate accounts, review user roles, and audit access credentials.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsers}
                className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors cursor-pointer"
                title="Refresh Users List"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {currentUser?.role === 'ADMIN' && (
                <button
                  onClick={() => setIsUserModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add User</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  onClick={card.onClick}
                  title={card.tooltip}
                  className={`glass-card bg-slate-900/60 border rounded-xl p-5 relative overflow-hidden group transition-all cursor-pointer select-none ${
                    card.isActive
                      ? 'border-blue-500/60 bg-blue-950/20 ring-1 ring-blue-500/30 shadow-lg'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
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
                  {card.isActive && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-bl-md" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Search Bar & Role/Status Filters Toolbar */}
          <div className="flex flex-col gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              {/* Search input */}
              <div className="relative w-full sm:w-72 md:w-80 shrink-0">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-inner"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters Right */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Role Filter */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-slate-900 text-slate-200">All Roles</option>
                    <option value="ADMIN" className="bg-slate-900 text-indigo-400">Admin Only</option>
                    <option value="VIEWER" className="bg-slate-900 text-cyan-400">Viewer Only</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-slate-900 text-slate-200">All Statuses</option>
                    <option value="ACTIVE" className="bg-slate-900 text-emerald-400">Active Only</option>
                    <option value="INACTIVE" className="bg-slate-900 text-rose-400">Inactive Only</option>
                  </select>
                </div>

                {/* Reset Filters */}
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

            {/* Active Filters Bar */}
            {isFilteredActive && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Search: "{searchTerm}"
                    <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSearchTerm('')} />
                  </span>
                )}
                {roleFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Role: {roleFilter}
                    <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setRoleFilter('ALL')} />
                  </span>
                )}
                {statusFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Status: {statusFilter}
                    <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setStatusFilter('ALL')} />
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Users Data Table */}
          <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-5">S.No.</th>
                    <th className="py-3.5 px-5">User</th>
                    <th className="py-3.5 px-5">Email</th>
                    <th className="py-3.5 px-5">Role</th>
                    <th className="py-3.5 px-5">Status</th>
                    {currentUser?.role === 'ADMIN' && <th className="py-3.5 px-5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                        <span className="text-xs">Loading system users...</span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                        No user accounts match current criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u, idx) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-5 text-xs font-mono text-slate-500">{startIndex + idx + 1}</td>
                        <td className="py-3 px-5 font-semibold text-slate-200 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm uppercase ${
                                u.role === 'ADMIN'
                                  ? 'bg-gradient-to-tr from-indigo-600 to-blue-600 ring-2 ring-indigo-500/30'
                                  : 'bg-gradient-to-tr from-cyan-600 to-teal-600 ring-2 ring-cyan-500/30'
                              }`}
                            >
                              {u.name ? u.name.charAt(0) : 'U'}
                            </div>
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-xs text-slate-400 font-mono">{u.email}</td>
                        <td className="py-3 px-5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              u.role === 'ADMIN'
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            }`}
                          >
                            <Shield className="w-3 h-3" />
                            {u.role === 'ADMIN' ? 'Admin' : 'Viewer'}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <button
                            disabled={currentUser?.role !== 'ADMIN'}
                            onClick={() => promptToggleStatus(u)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                            }`}
                            title="Click to toggle account status"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                              }`}
                            />
                            {u.status}
                          </button>
                        </td>
                        {currentUser?.role === 'ADMIN' && (
                          <td className="py-3 px-5 text-right space-x-2">
                            <button
                              onClick={() => promptToggleStatus(u)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                u.status === 'ACTIVE'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, user: u })}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
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
                  <label htmlFor="itemsPerPageUsers" className="text-xs text-slate-400">
                    Per page:
                  </label>
                  <select
                    id="itemsPerPageUsers"
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

        {/* User Create Modal */}
        <UserModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          onSave={handleCreateUser}
        />

        {/* Status Confirmation Modal (Activate / Deactivate) */}
        {statusModal.isOpen && statusModal.user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 text-center space-y-4">
                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center border ${
                  statusModal.targetStatus === 'INACTIVE'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  {statusModal.targetStatus === 'INACTIVE' ? <UserX className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {statusModal.targetStatus === 'INACTIVE' ? 'Deactivate User Account?' : 'Activate User Account?'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Are you sure you want to change status of account{' '}
                    <span className="font-semibold text-slate-200">{statusModal.user.email}</span> to{' '}
                    <span className={`font-bold ${statusModal.targetStatus === 'INACTIVE' ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {statusModal.targetStatus}
                    </span>?
                    {statusModal.targetStatus === 'INACTIVE' && (
                      <span className="block mt-1 text-slate-400">This user will be unable to log in until reactivated.</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setStatusModal({ isOpen: false, user: null, targetStatus: null })}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmToggleStatus}
                    disabled={statusLoading}
                    className={`px-4 py-2 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                      statusModal.targetStatus === 'INACTIVE'
                        ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    }`}
                  >
                    {statusLoading
                      ? 'Updating...'
                      : statusModal.targetStatus === 'INACTIVE'
                      ? 'Yes, Deactivate'
                      : 'Yes, Activate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          title="Delete User Account"
          message={`Are you sure you want to delete user "${deleteModal.user?.email}"? This action cannot be undone.`}
          onClose={() => setDeleteModal({ isOpen: false, user: null })}
          onConfirm={handleDeleteUser}
          loading={deleteLoading}
        />
      </div>
    </div>
  );
}
