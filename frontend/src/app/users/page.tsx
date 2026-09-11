'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import UserModal from '@/components/shared/UserModal';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import { User, AuthUser } from '@/types';
import api from '@/services/api';
import { Users as UsersIcon, UserPlus, Shield, RefreshCw, Trash2, CheckCircle2, XCircle, Search, Edit2 } from 'lucide-react';

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('inpainting_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
    fetchUsers();
  }, []);

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

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/users/${user.id}`, { status: newStatus });
      fetchUsers();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Compute stats
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const viewerCount = users.filter(u => u.role === 'VIEWER').length;
  const activeCount = users.filter(u => u.status === 'ACTIVE').length;

  const statCards = [
    { label: 'TOTAL USERS', value: totalUsers, icon: UsersIcon, color: 'text-blue-400', iconBg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'ADMINS', value: adminCount, icon: Shield, color: 'text-indigo-400', iconBg: 'bg-indigo-500/10 border-indigo-500/20' },
    { label: 'VIEWERS', value: viewerCount, icon: UsersIcon, color: 'text-cyan-400', iconBg: 'bg-cyan-500/10 border-cyan-500/20' },
    { label: 'ACTIVE', value: activeCount, icon: CheckCircle2, color: 'text-emerald-400', iconBg: 'bg-emerald-500/10 border-emerald-500/20' },
  ];

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <div className="flex-1 pl-20 flex flex-col min-w-0">
        <Header />

        <main className="p-6 pt-20 space-y-6 flex-1 w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100">User Management</h1>
              <p className="text-xs text-slate-400 mt-1">Activate/deactivate accounts, review roles, and audit credentials.</p>
            </div>
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            )}
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="glass-card bg-slate-900/60 border border-slate-800 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
                    <div className={`w-8 h-8 rounded-lg ${card.iconBg} border flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className={`text-3xl font-extrabold mt-2 tracking-tight ${card.color}`}>{card.value}</h3>
                </div>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-5">S.No.</th>
                    <th className="py-3 px-5">Name</th>
                    <th className="py-3 px-5">Email</th>
                    <th className="py-3 px-5">Role</th>
                    <th className="py-3 px-5">Status</th>
                    {currentUser?.role === 'ADMIN' && <th className="py-3 px-5 text-right">Actions</th>}
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
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, idx) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-5 text-xs text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-5 font-semibold text-slate-200 text-xs">{u.name}</td>
                        <td className="py-3 px-5 text-xs text-slate-400">{u.email}</td>
                        <td className="py-3 px-5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                              u.role === 'ADMIN'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {u.role === 'ADMIN' ? 'Admin' : 'Viewer'}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <button
                            disabled={currentUser?.role !== 'ADMIN'}
                            onClick={() => handleToggleStatus(u)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {u.status}
                          </button>
                        </td>
                        {currentUser?.role === 'ADMIN' && (
                          <td className="py-3 px-5 text-right space-x-1">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                u.status === 'ACTIVE'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, user: u })}
                              className="px-2 py-1 rounded text-[10px] font-bold border bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 transition-colors cursor-pointer"
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
          </div>
        </main>

        {/* User Create Modal */}
        <UserModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          onSave={handleCreateUser}
        />

        {/* User Delete Modal */}
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
