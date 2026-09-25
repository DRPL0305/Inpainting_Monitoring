'use client';

import React, { useEffect, useState } from 'react';
import { X, Image as ImageIcon, FileText, Calendar, User, Tag, HardDrive, AlertCircle, ExternalLink, Download } from 'lucide-react';
import { Logo } from '@/types';
import api from '@/services/api';
import { formatIndianTimestamp } from '@/utils/dateFormatter';

interface LogoPreviewModalProps {
  isOpen: boolean;
  logoId: string | null;
  whichLogo?: string | null;
  onClose: () => void;
}

export default function LogoPreviewModal({ isOpen, logoId, whichLogo, onClose }: LogoPreviewModalProps) {
  const [logo, setLogo] = useState<Logo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && logoId) {
      fetchLogoDetails(logoId);
    } else {
      setLogo(null);
      setError(null);
    }
  }, [isOpen, logoId]);

  const fetchLogoDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const cleanedId = id.replace(/^logo/i, '');
      const response = await api.get(`/logos/${cleanedId}`);
      setLogo(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || `Logo with ID #${id} is not available in database`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const backendHost = process.env.NEXT_PUBLIC_API_URL 
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') 
    : 'http://localhost:3006';

  const imageUrl = logo?.filePath
    ? logo.filePath.startsWith('http')
      ? logo.filePath
      : `${backendHost}${logo.filePath}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Logo Preview & Details
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-blue-950 text-blue-400 border border-blue-800/50">
                  ID: {logoId}
                </span>
              </h2>
              {whichLogo && (
                <p className="text-xs text-slate-400 mt-0.5">Channel / Type: <span className="text-slate-200 font-medium">{whichLogo}</span></p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Loading logo details from database...</span>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-950/30 border border-red-900/40 rounded-xl text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-red-200">Logo Image Not Found</h3>
                <p className="text-xs text-red-400 mt-1">{error}</p>
              </div>
            </div>
          ) : logo ? (
            <>
              {/* Image Preview Container with PNG Checkerboard background */}
              <div className="relative rounded-xl border border-slate-800 overflow-hidden bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950 p-8 flex items-center justify-center min-h-[220px]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={logo.fileName}
                    className="max-h-56 max-w-full object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-xs text-slate-500 font-mono">No image file associated</span>
                )}
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>File Name</span>
                  </div>
                  <p className="font-mono text-slate-200 font-semibold truncate" title={logo.fileName}>
                    {logo.fileName}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Channel Name</span>
                  </div>
                  <p className="font-semibold text-slate-200">
                    {logo.channelName || 'General'}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                    <span>File Size & Type</span>
                  </div>
                  <p className="font-mono text-slate-200">
                    {(logo.fileSize / 1024).toFixed(1)} KB ({logo.mimeType || 'image/png'})
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span>Uploaded By</span>
                  </div>
                  <p className="text-slate-200 font-medium">
                    {logo.uploadedBy || 'Admin User'}
                  </p>
                </div>

                {logo.createdAt && (
                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Upload Date</span>
                    </div>
                    <p className="text-slate-300 font-semibold font-mono text-[11px]">
                      {formatIndianTimestamp(logo.createdAt)}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          {imageUrl ? (
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Full Image
            </a>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
