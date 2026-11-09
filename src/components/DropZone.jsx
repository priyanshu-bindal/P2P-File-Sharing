import React, { useState, useRef } from 'react';
import { UploadCloud, Plus } from 'lucide-react';

export function DropZone({ isConnected, onSendFiles }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

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
        onClick={() => isConnected && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative w-full border-2 border-dashed rounded-2xl p-6 sm:p-9 text-center transition-all duration-300 overflow-hidden ${
          !isConnected
            ? 'border-neutral-800/80 bg-[#0c0c0e]/60 cursor-not-allowed opacity-50'
            : isDragOver
            ? 'border-violet-500 bg-violet-950/20 cursor-pointer scale-[1.01] shadow-xl shadow-violet-500/10'
            : 'border-neutral-800 hover:border-neutral-700 hover:bg-[#0f0f13] bg-[#0c0c0e] cursor-pointer shadow-lg hover:shadow-black/50'
        }`}
      >
        {/* Subtle dynamic ambient glow on hover when connected */}
        {isConnected && (
          <div className="absolute inset-0 bg-gradient-to-b from-violet-600/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        )}

        <div className="relative flex flex-col items-center justify-center space-y-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
              !isConnected
                ? 'bg-neutral-800 text-neutral-600'
                : isDragOver
                ? 'bg-violet-600 text-white scale-110 shadow-lg shadow-violet-600/40'
                : 'bg-violet-600/10 text-violet-400 group-hover:scale-105 group-hover:bg-violet-600/20'
            }`}
          >
            <UploadCloud className={`w-6 h-6 transition-transform duration-300 ${isConnected && !isDragOver ? 'animate-float' : ''}`} />
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white transition-colors group-hover:text-violet-100">
              {isConnected ? (
                <>Drop files here or <span className="text-violet-400 underline underline-offset-4 decoration-violet-500/50 group-hover:text-violet-300">browse</span></>
              ) : (
                'Connect to a peer to send files'
              )}
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              {isConnected ? 'Any file size • 16 KB chunked stream with backpressure' : 'Share your code or enter a friend\'s code above'}
            </p>
          </div>

          {isConnected && (
            <div className="flex items-center gap-2 pt-1 text-xs text-neutral-400">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-900/90 border border-neutral-800 group-hover:border-neutral-700 transition-colors">
                <Plus className="w-3 h-3 text-violet-400" /> Multiple files supported
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
