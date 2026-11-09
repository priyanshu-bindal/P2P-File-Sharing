import React, { useState } from 'react';
import { usePeer } from './hooks/usePeer';
import { ConnectCard } from './components/ConnectCard';
import { DropZone } from './components/DropZone';
import { TransferList } from './components/TransferList';
import { AlertTriangle, X, Share2, Check } from 'lucide-react';
import './App.css';

// Iconic BeamDrop Emblem: Concentric signal beams converging into a radiant drop
function BeamDropLogo({ className = "w-9 h-9 sm:w-10 sm:h-10" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoBg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#140e2a" />
          <stop offset="100%" stopColor="#06060c" />
        </linearGradient>
        <linearGradient id="logoBeam" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="45%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="logoDrop" x1="26" y1="26" x2="38" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#logoBg)" stroke="#382d5e" strokeWidth="1.8" />
      <path d="M14 31 C14 21.059 22.059 13 32 13 C41.941 13 50 21.059 50 31" stroke="url(#logoBeam)" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M21 32 C21 25.925 25.925 21 32 21 C38.075 21 43 25.925 43 32" stroke="#a78bfa" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M32 27 C28.134 27 25 30.134 25 34 C25 39.5 32 49 32 49 C32 49 39 39.5 39 34 C39 30.134 35.866 27 32 27 Z" fill="url(#logoDrop)" />
      <circle cx="32" cy="34" r="3.2" fill="#ffffff" />
    </svg>
  );
}

export default function App() {
  const {
    myCode,
    isReady,
    connectionStatus,
    connectedPeerCode,
    error,
    clearError,
    shareableUrl,
    transfers,
    connectToPeer,
    disconnect,
    sendFiles,
    cancelTransfer,
    clearCompletedTransfers,
    removeTransfer,
    regenerateCode,
  } = usePeer();

  const [copiedInvite, setCopiedInvite] = useState(false);

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch (_err) {
      // ignore
    }
  };

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Subtle ambient lighting with breathing pulse */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-violet-600/[0.04] rounded-full blur-[150px] animate-glow-breathe" />
        <div className="absolute bottom-[-15%] right-[20%] w-[500px] h-[500px] bg-cyan-600/[0.03] rounded-full blur-[150px] animate-glow-breathe" style={{ animationDelay: '4s' }} />
      </div>

      {/* Top Header: Branding pinned to top-left corner with left margin on computer */}
      <header className="relative z-20 w-full px-5 sm:px-8 lg:px-14 py-4 sm:py-5 flex items-center justify-between border-b border-white/[0.06] bg-[#050505]/75 backdrop-blur-md">
        {/* Branding (Top Left) */}
        <div className="group flex items-center gap-3 cursor-default">
          <div className="transition-transform duration-300 ease-out group-hover:scale-105 group-hover:rotate-1">
            <BeamDropLogo />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight group-hover:text-violet-200 transition-colors">
              BeamDrop
            </h1>
            <p className="text-[11px] text-neutral-400 font-medium leading-none mt-0.5">
              P2P File Transfer
            </p>
          </div>
        </div>

        {/* Interactive Top Actions (Top Right) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Live Device Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-neutral-300 shadow-sm transition-all hover:bg-white/[0.06]">
            <div className="relative flex h-2 w-2 items-center justify-center">
              {isConnected ? (
                <>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-radar" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </>
              ) : isConnecting ? (
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              ) : (
                <>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/50 opacity-60 animate-radar" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </>
              )}
            </div>
            <span>
              {isConnected 
                ? `Paired: ${connectedPeerCode}` 
                : isConnecting 
                ? 'Connecting...' 
                : isReady 
                ? 'Discoverable' 
                : 'Initializing...'}
            </span>
          </div>

          {/* Interactive Share / Invite Action */}
          <button
            onClick={handleCopyInvite}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600/15 hover:bg-violet-600/25 text-violet-300 hover:text-white border border-violet-500/30 text-xs font-medium transition-all duration-150 active:scale-95 shadow-sm shadow-violet-600/10 cursor-pointer"
            title="Copy auto-connect invite link"
          >
            {copiedInvite ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 animate-pop" />
                <span className="text-emerald-400 font-semibold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-violet-400" />
                <span>Invite Friend</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace (Centered) */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col gap-5 sm:gap-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2 text-xs sm:text-sm animate-in fade-in duration-150">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{error}</span>
            </div>
            <button onClick={clearError} className="text-red-400/70 hover:text-red-300 p-0.5 flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Connect Section */}
        <ConnectCard
          myCode={myCode}
          isReady={isReady}
          connectionStatus={connectionStatus}
          connectedPeerCode={connectedPeerCode}
          shareableUrl={shareableUrl}
          onConnect={connectToPeer}
          onDisconnect={disconnect}
          onRegenerateCode={regenerateCode}
        />

        {/* File Drop Section */}
        <DropZone
          isConnected={connectionStatus === 'connected'}
          onSendFiles={sendFiles}
        />

        {/* Transfers Section */}
        <TransferList
          transfers={transfers}
          onCancelTransfer={cancelTransfer}
          onClearCompleted={clearCompletedTransfers}
          onRemoveTransfer={removeTransfer}
        />
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-[11px] text-neutral-600 border-t border-white/[0.04]">
        Files never leave your browser • Direct WebRTC P2P
      </footer>
    </div>
  );
}
