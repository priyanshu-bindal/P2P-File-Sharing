import React, { useState, useRef } from 'react';
import { UploadCloud, Plus } from 'lucide-react';
import { useCardSpotlight } from '../hooks/useCardSpotlight';

export function DropZone({ isConnected, onSendFiles }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const spotlight = useCardSpotlight({ tilt: isConnected, maxTilt: 1.8 });

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
        className={`aesthetic-card group relative w-full border-2 border-dashed rounded-2xl p-6 sm:p-9 text-center transition-all duration-300 overflow-hidden ${
          !isConnected
            ? 'border-slate-200 dark:border-white/[0.06] bg-slate-50/60 dark:bg-[#0a0a0e]/60 cursor-not-allowed opacity-60'
            : isDragOver
            ? 'border-violet-500 bg-violet-50/70 dark:bg-violet-950/25 cursor-pointer scale-[1.01] shadow-2xl shadow-violet-500/20'
            : 'border-slate-300/90 dark:border-white/[0.14] hover:border-violet-500/60 dark:hover:border-violet-400/60 bg-gradient-to-b from-white via-white to-slate-50/80 dark:from-[#111118] dark:via-[#0c0c11] dark:to-[#09090d] cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.12)] hover:shadow-xl dark:hover:shadow-violet-950/25'
        }`}
      >
        {/* Subtle dynamic ambient glow on hover when connected */}
        {isConnected && (
          <div className="absolute inset-0 bg-gradient-to-b from-violet-600/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        )}

        <div className="relative flex flex-col items-center justify-center space-y-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
              !isConnected
                ? 'bg-slate-200 dark:bg-neutral-800 text-slate-400 dark:text-neutral-600'
                : isDragOver
                ? 'bg-violet-600 text-white scale-110 shadow-lg shadow-violet-600/40'
                : 'bg-violet-50 dark:bg-violet-600/10 text-violet-600 dark:text-violet-400 group-hover:scale-105 group-hover:bg-violet-100 dark:group-hover:bg-violet-600/20'
            }`}
          >
            <UploadCloud className={`w-6 h-6 transition-transform duration-300 ${isConnected && !isDragOver ? 'animate-float' : ''}`} />
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white transition-colors group-hover:text-violet-700 dark:group-hover:text-violet-100">
              {isConnected ? (
                <>Drop files here or <span className="text-violet-600 dark:text-violet-400 underline underline-offset-4 decoration-violet-500/50 group-hover:text-violet-700 dark:group-hover:text-violet-300">browse</span></>
              ) : (
                'Connect to a peer to send files'
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1">
              {isConnected ? 'Any file size • 16 KB chunked stream with backpressure' : 'Share your code or enter a friend\'s code above'}
            </p>
          </div>

          {isConnected && (
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 dark:text-neutral-400">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800 group-hover:border-slate-300 dark:group-hover:border-neutral-700 transition-colors shadow-xs">
                <Plus className="w-3 h-3 text-violet-600 dark:text-violet-400" /> Multiple files supported
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
