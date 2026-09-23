'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import ConfirmDeleteModal from '@/components/shared/ConfirmDeleteModal';
import { Logo, AuthUser } from '@/types';
import api from '@/services/api';
import { Upload, Trash2, Image as ImageIcon, CheckCircle, RefreshCw, FileText } from 'lucide-react';

export default function LogosPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; logo: Logo | null }>({
    isOpen: false,
    logo: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('inpainting_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
    fetchLogos();
  }, []);

  const fetchLogos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/logos');
      setLogos(res.data);
    } catch (err) {
      console.error('Error fetching logos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file (PNG, JPG, SVG, WebP)' });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMessage(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a logo image to upload' });
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('logo', selectedFile);

    try {
      await api.post('/logos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: 'Logo image uploaded successfully!' });
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchLogos();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to upload logo' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!deleteModal.logo) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/logos/${deleteModal.logo.id}`);
      setDeleteModal({ isOpen: false, logo: null });
      fetchLogos();
      setMessage({ type: 'success', text: 'Logo deleted successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.error || 'Failed to delete logo' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getFullImageUrl = (pathStr: string) => {
    if (pathStr.startsWith('http')) return pathStr;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006/api';
    return `${baseUrl.replace('/api', '')}${pathStr}`;
  };

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
                <ImageIcon className="w-5 h-5 text-blue-400" />
                Logo Tab & Image Repository
              </h1>
              <p className="text-xs text-slate-400 mt-1">Upload brand logo assets, preview images, and manage storage</p>
            </div>
            <button
              onClick={fetchLogos}
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors cursor-pointer"
              title="Refresh List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          {/* Upload Logo Card (Admin Only / Viewers see view mode) */}
          {user?.role === 'ADMIN' && (
            <div className="glass-card bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Upload New Logo Image</span>
              </h2>

              <form onSubmit={handleUpload} className="space-y-3">
                <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-xl p-6 text-center bg-slate-950/50 transition-colors relative cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {previewUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={previewUrl} alt="Preview" className="h-20 max-w-full object-contain rounded-lg border border-slate-700 p-1 bg-slate-900" />
                      <p className="text-[11px] text-blue-400 font-semibold">{selectedFile?.name}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-300">Click or drag & drop logo image here</p>
                      <p className="text-[10px] text-slate-500">Supports PNG, JPG, WebP, SVG (Max 10MB)</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!selectedFile || uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-lg shadow-blue-600/20 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Logo Gallery Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200">Uploaded Logo Images ({logos.length})</h2>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                Loading logo repository...
              </div>
            ) : logos.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-semibold">No logo images uploaded yet.</p>
                <p className="text-[10px] text-slate-600 mt-1">Use the upload box above to add logo assets.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {logos.map((logo) => (
                  <div
                    key={logo.id}
                    className="glass-card bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between group hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="w-full h-28 bg-slate-950 rounded-lg flex items-center justify-center p-2 border border-slate-800/80 overflow-hidden mb-2">
                        <img
                          src={getFullImageUrl(logo.filePath)}
                          alt={logo.fileName}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="font-bold text-slate-200 text-xs truncate" title={logo.fileName}>
                        {logo.fileName}
                      </h4>
                      <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-400">
                        <p className="flex justify-between">
                          <span>Size:</span>
                          <span className="font-mono font-semibold text-slate-300">{(logo.fileSize / 1024).toFixed(1)} KB</span>
                        </p>
                        <p className="flex justify-between">
                          <span>By:</span>
                          <span className="text-slate-300 font-semibold">{logo.uploadedBy}</span>
                        </p>
                      </div>
                    </div>

                    {user?.role === 'ADMIN' && (
                      <div className="mt-3 pt-2 border-t border-slate-800 flex justify-end">
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, logo })}
                          className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          title="Delete Logo Image"
          message={`Are you sure you want to delete logo "${deleteModal.logo?.fileName}"? This will permanently remove the file.`}
          onClose={() => setDeleteModal({ isOpen: false, logo: null })}
          onConfirm={handleDeleteLogo}
          loading={deleteLoading}
        />
      </div>
    </div>
  );
}
