'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import { ActivityLog } from '@/types';
import api from '@/services/api';
import { FileText, RefreshCw, Activity, Shield, Search } from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    const token = localStorage.getItem('inpainting_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('UPLOAD_LOGO') || action.includes('CREATE')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (action.includes('DELETE')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    if (action.includes('UPDATE') || action.includes('CHANGED')) {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
    if (action.includes('LOGIN')) {
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (role === 'VIEWER') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  // Get unique actions for filter
  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <div className="flex-1 pl-20 flex flex-col min-w-0">
        <Header />

        <main className="p-6 pt-20 space-y-6 flex-1 w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                System Activity Logs
              </h1>
              <p className="text-xs text-slate-400 mt-1">Perform administrative compliance audits, review timestamps, and track lifecycle actions.</p>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by action, details, user, or asset ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Action Type:</span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-5">Timestamp</th>
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-5">Role</th>
                    <th className="py-3 px-5">Action</th>
                    <th className="py-3 px-5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                        <span className="text-xs">Loading activity logs...</span>
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 text-xs">
                        No activity recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-5 font-mono text-[11px] text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                        <td className="py-3 px-5 font-semibold text-slate-200 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white">
                              {log.userName.charAt(0)}
                            </div>
                            {log.userName}
                          </div>
                        </td>
                        <td className="py-3 px-5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadge(log.userRole)}`}>
                            {log.userRole === 'ADMIN' ? 'Admin' : log.userRole}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadge(log.action)}`}
                          >
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-slate-300 text-xs max-w-md truncate">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
