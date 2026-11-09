import React, { useState, useEffect } from 'react';
import { usePeer } from './hooks/usePeer';
import { ConnectCard } from './components/ConnectCard';
import { DropZone } from './components/DropZone';
import { TransferList } from './components/TransferList';
import { TextShare } from './components/TextShare';
import { 
  AlertTriangle, 
  X, 
  Share2, 
  Check, 
  Sun, 
  Moon, 
  Files, 
  ClipboardType
} from 'lucide-react';
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
    messages,
    unreadTextCount,
    sendText,
    clearMessages,
    removeMessage,
    resetUnreadTextCount,
    connectToPeer,
    disconnect,
    sendFiles,
    cancelTransfer,
    clearCompletedTransfers,
    removeTransfer,
    regenerateCode,
  } = usePeer();

  // Active section tab: 'files' or 'text'
  const [activeTab, setActiveTab] = useState('files');
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Theme Management (light/dark with persistent state)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark'; // Dark theme default
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch (_) {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch (_err) {
      // ignore
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'text') {
      resetUnreadTextCount();
    }
  };

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';
  const activeTransfersCount = transfers.filter((t) => t.status === 'sending' || t.status === 'receiving').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-white flex flex-col transition-colors duration-300">
      {/* Subtle ambient lighting with breathing pulse */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-violet-600/[0.04] dark:bg-violet-600/[0.04] rounded-full blur-[150px] animate-glow-breathe" />
        <div className="absolute bottom-[-15%] right-[20%] w-[500px] h-[500px] bg-cyan-600/[0.03] dark:bg-cyan-600/[0.03] rounded-full blur-[150px] animate-glow-breathe" style={{ animationDelay: '4s' }} />
      </div>

      {/* Top Floating 3D Glassy Navbar: Fully rounded, compact, floating with smooth depth */}
      <header className="sticky top-3 sm:top-5 z-40 w-full px-3 sm:px-6 flex justify-center pointer-events-none">
        <div className="pointer-events-auto floating-glass-navbar animate-navbar-float w-full max-w-4xl px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full flex items-center justify-between
          bg-white/75 dark:bg-[#0c0c12]/80
          border border-white/60 dark:border-white/[0.12]
          shadow-[0_12px_32px_-6px_rgba(0,0,0,0.08),0_4px_12px_-2px_rgba(0,0,0,0.04),inset_0_1px_1px_0_rgba(255,255,255,0.9),inset_0_-1px_1px_0_rgba(0,0,0,0.04)]
          dark:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7),0_4px_16px_-2px_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(255,255,255,0.2),inset_0_-1px_1px_0_rgba(0,0,0,0.5)]
          hover:shadow-[0_20px_48px_-8px_rgba(0,0,0,0.12),inset_0_1px_1px_0_rgba(255,255,255,1)]
          dark:hover:shadow-[0_24px_56px_-10px_rgba(0,0,0,0.85),inset_0_1px_1px_0_rgba(255,255,255,0.26)]
          hover:border-white/80 dark:hover:border-white/[0.2]">

          {/* Branding (Left) */}
          <div className="group flex items-center gap-2.5 sm:gap-3 cursor-default select-none">
            <div className="transition-transform duration-300 ease-out group-hover:scale-105 group-hover:rotate-1 flex-shrink-0">
              <BeamDropLogo className="w-8 h-8 sm:w-8.5 sm:h-8.5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-tight group-hover:text-violet-600 dark:group-hover:text-violet-200 transition-colors">
                BeamDrop
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium leading-none hidden sm:block">
                P2P Direct Transfer
              </p>
            </div>
          </div>

          {/* Interactive Actions (Right) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Device Status Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/90 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-[11px] text-slate-700 dark:text-neutral-300 shadow-xs transition-all hover:bg-slate-200/60 dark:hover:bg-white/[0.08]">
              <div className="relative flex h-2 w-2 items-center justify-center">
                {isConnected ? (
                  <>
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-radar" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  </>
                ) : isConnecting ? (
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                ) : (
                  <>
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/50 opacity-60 animate-radar" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
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
              type="button"
              onClick={handleCopyInvite}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white dark:bg-violet-600/20 dark:hover:bg-violet-600/30 dark:text-violet-300 dark:hover:text-white border border-violet-500/30 text-xs font-semibold transition-all duration-150 active:scale-95 shadow-sm shadow-violet-600/20 cursor-pointer"
              title="Copy auto-connect invite link"
            >
              {copiedInvite ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white dark:text-emerald-400 animate-pop" />
                  <span className="font-semibold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Invite Friend</span>
                  <span className="xs:hidden">Invite</span>
                </>
              )}
            </button>

            {/* Smooth Animated Theme Toggle Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-700 dark:text-neutral-300 border border-slate-200/90 dark:border-white/[0.1] shadow-xs dark:shadow-sm transition-all duration-300 active:scale-90 cursor-pointer relative overflow-hidden"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle theme"
            >
              <Sun className="w-4 h-4 text-amber-500 rotate-0 scale-100 transition-all duration-300 ease-out dark:-rotate-90 dark:scale-0 absolute" />
              <Moon className="w-4 h-4 text-violet-400 rotate-90 scale-0 transition-all duration-300 ease-out dark:rotate-0 dark:scale-100 absolute" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace (Centered) */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col gap-5 sm:gap-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 dark:bg-red-500/10 border border-rose-200 dark:border-red-500/20 text-rose-700 dark:text-red-400 px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2 text-xs sm:text-sm animate-in fade-in duration-150">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{error}</span>
            </div>
            <button onClick={clearError} className="text-rose-500 hover:text-rose-700 dark:text-red-400/70 dark:hover:text-red-300 p-0.5 flex-shrink-0 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 1. Connect Card: Pair device or enter friend's code */}
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

        {/* 2. Mode Selector: Files vs Text & Clipboard (Compact 3D Glassy Segmented Capsule) */}
        <div className="flex justify-center -my-0.5">
          <div className="relative inline-grid grid-cols-2 p-1 rounded-full bg-slate-200/80 dark:bg-[#0a0a10] border border-slate-300/70 dark:border-white/[0.08] shadow-inner backdrop-blur-md max-w-md w-full sm:w-auto">
            {/* Smooth Animated Sliding Indicator Capsule */}
            <span
              className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white dark:bg-[#1c1c28] border border-slate-200/90 dark:border-white/[0.16] shadow-sm dark:shadow-[0_2px_10px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.18)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
              style={{
                transform: activeTab === 'files' ? 'translateX(0)' : 'translateX(100%)',
              }}
            />

            <button
              type="button"
              onClick={() => handleTabChange('files')}
              className={`relative z-10 flex items-center justify-center gap-2 py-2 px-4 sm:px-6 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer select-none active:scale-95 ${
                activeTab === 'files'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
              }`}
            >
              <Files className={`w-3.5 h-3.5 transition-transform duration-200 ${activeTab === 'files' ? 'scale-110 text-violet-600 dark:text-violet-400' : ''}`} />
              <span className="truncate">Files Transfer</span>
              {activeTransfersCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 leading-none">
                  {activeTransfersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('text')}
              className={`relative z-10 flex items-center justify-center gap-2 py-2 px-4 sm:px-6 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer select-none active:scale-95 ${
                activeTab === 'text'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
              }`}
            >
              <ClipboardType className={`w-3.5 h-3.5 transition-transform duration-200 ${activeTab === 'text' ? 'scale-110 text-emerald-600 dark:text-emerald-400' : ''}`} />
              <span className="truncate">Text & Clipboard</span>
              {unreadTextCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-pulse leading-none shadow-xs shadow-emerald-500/30">
                  {unreadTextCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 3. Tab Content */}
        {activeTab === 'files' ? (
          <div className="space-y-5 animate-in fade-in-50 duration-200">
            {/* File Drop Section */}
            <DropZone
              isConnected={isConnected}
              onSendFiles={sendFiles}
            />

            {/* Transfers Section */}
            <TransferList
              transfers={transfers}
              onCancelTransfer={cancelTransfer}
              onClearCompleted={clearCompletedTransfers}
              onRemoveTransfer={removeTransfer}
            />
          </div>
        ) : (
          <div className="animate-in fade-in-50 duration-200">
            {/* Text & Clipboard Share Section */}
            <TextShare
              isConnected={isConnected}
              messages={messages}
              onSendText={sendText}
              onClearMessages={clearMessages}
              onRemoveMessage={removeMessage}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-[11px] text-slate-500 dark:text-neutral-600 border-t border-slate-200/80 dark:border-white/[0.04] transition-colors duration-300">
        Files & text never touch a server • Direct Peer-to-Peer Transfer
      </footer>
    </div>
  );
}
