import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { useCardSpotlight } from '../hooks/useCardSpotlight';

export function DropZone({ isConnected, connectedPeersCount = 0, onSendFiles }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const spotlight = useCardSpotlight({ tilt: isConnected, maxTilt: 1.5 });

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isConnected) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!isConnected) return;
    if (e.dataTransfer.files?.length > 0) {
      onSendFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files?.length > 0) {
      onSendFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div
        {...(isConnected ? spotlight : {})}
        onClick={() => isConnected && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full rounded-xl transition-all duration-200 overflow-hidden select-none ${
          !isConnected
            ? 'border border-dashed border-slate-200/90 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] py-3.5 px-4 cursor-default'
            : isDragOver
            ? 'aesthetic-card border border-dashed border-violet-500 bg-violet-50/80 dark:bg-violet-950/30 py-4 px-4 sm:px-5 cursor-pointer scale-[1.008] shadow-lg shadow-violet-500/15'
            : 'aesthetic-card border border-dashed border-slate-300/80 dark:border-white/[0.12] hover:border-violet-500/70 dark:hover:border-violet-400/60 bg-white dark:bg-[#0c0c11] py-3.5 sm:py-4 px-4 sm:px-5 cursor-pointer shadow-xs dark:shadow-md hover:shadow-md dark:hover:shadow-violet-950/20'
        }`}
      >
        <div className="flex items-center justify-center gap-3">
          {/* Minimal Icon */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
              !isConnected
                ? 'bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-neutral-500'
                : isDragOver
                ? 'bg-violet-600 text-white scale-105 shadow-sm'
                : 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:scale-105'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
          </div>

          {/* Sharp, Minimal Copy */}
          <div className="text-left min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-neutral-200 leading-tight group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
              {!isConnected ? (
                'Connect to a peer to send files'
              ) : isDragOver ? (
                'Release files to transfer'
              ) : connectedPeersCount > 1 ? (
                <>Drop files to send to all <span className="text-violet-600 dark:text-violet-400">{connectedPeersCount} devices</span> or <span className="underline underline-offset-2">browse</span></>
              ) : (
                <>Drop files here or <span className="text-violet-600 dark:text-violet-400 underline underline-offset-2">browse</span></>
              )}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500 leading-tight mt-0.5">
              {!isConnected
                ? 'Share your code or enter a friend\'s code above'
                : 'Direct peer-to-peer stream • Any file size'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
