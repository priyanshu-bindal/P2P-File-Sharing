import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Copy, 
  Check, 
  QrCode, 
  RefreshCw, 
  Link2, 
  ArrowRight,
  X
} from 'lucide-react';
import { sanitizeCode } from '../utils/formatters';
import { useCardSpotlight } from '../hooks/useCardSpotlight';

export function ConnectCard({
  myCode,
  isReady,
  connectionStatus,
  connectedPeerCode,
  shareableUrl,
  onConnect,
  onDisconnect,
  onRegenerateCode,
}) {
  const [friendCode, setFriendCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(myCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (_err) {
      // ignore
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (_err) {
      // ignore
    }
  };

  const handleRegenerate = () => {
    setIsRotating(true);
    onRegenerateCode();
    setTimeout(() => setIsRotating(false), 500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (friendCode.trim()) {
      onConnect(friendCode);
    }
  };

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';
  const spotlight = useCardSpotlight({ tilt: true, maxTilt: 1.5 });

  return (
    <div
      {...spotlight}
      className="aesthetic-card w-full bg-gradient-to-b from-white via-white to-slate-50/80 dark:from-[#111118] dark:via-[#0c0c11] dark:to-[#09090d] border border-slate-200/90 dark:border-white/[0.12] rounded-2xl p-4 sm:p-6 shadow-[0_12px_36px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.16)] transition-all duration-300"
    >
      {/* Live Status Bar */}
      <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-white/[0.06]">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
          Connection Status
        </span>

        {isConnected ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium transition-all animate-in fade-in duration-200 shadow-xs">
            <div className="relative flex h-2 w-2 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-radar" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            </div>
            <span>Connected: <strong className="font-mono text-slate-900 dark:text-white tracking-wider">{connectedPeerCode}</strong></span>
            <button
              onClick={onDisconnect}
              className="ml-1 text-[11px] underline text-emerald-600 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        ) : isConnecting ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium transition-all animate-in fade-in duration-200 shadow-xs">
            <div className="relative flex h-2 w-2 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-radar" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
            </div>
            <span>Connecting...</span>
            <button
              onClick={onDisconnect}
              className="ml-1 text-[11px] underline text-amber-700 dark:text-amber-200 hover:text-amber-900 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{isReady ? 'Discoverable' : 'Initializing...'}</span>
          </div>
        )}
      </div>

      {/* Code & Connect Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left: Your Code */}
        <div className="group flex flex-col justify-between bg-slate-50/90 dark:bg-[#14141c] border border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-violet-500/40 rounded-xl p-4 transition-all duration-300 shadow-xs dark:shadow-none hover:shadow-md dark:hover:shadow-violet-950/20 hover:-translate-y-0.5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium flex items-center gap-1.5">
                <span>Your Share Code</span>
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
              </span>
              <button
                onClick={handleRegenerate}
                title="Generate fresh code"
                className="text-slate-400 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-200 p-1 rounded-md transition-all duration-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] active:scale-90 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${isRotating ? 'rotate-180 text-violet-500 dark:text-violet-400' : ''}`} />
              </button>
            </div>

            {/* Glowing Hero Code Container */}
            <div className="flex items-center justify-between bg-gradient-to-r from-violet-500/[0.07] via-slate-50 to-cyan-500/[0.05] dark:from-violet-950/40 dark:via-[#09090e] dark:to-cyan-950/25 border border-violet-500/30 dark:border-violet-500/40 rounded-xl px-4 py-3 transition-all shadow-xs dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-slate-900 dark:text-white select-all">
                {myCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-xs text-neutral-200 font-semibold transition-all duration-150 active:scale-95 shadow-sm shadow-violet-600/20 cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white dark:text-emerald-400 animate-pop" />
                    <span className="text-white dark:text-emerald-400 font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick share options */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200/70 dark:border-neutral-800/70">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800/90 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-medium transition-all duration-150 active:scale-95 border border-slate-200/80 dark:border-transparent cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500 animate-pop" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Link Copied</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowQr((p) => !p)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer border ${
                showQr 
                  ? 'bg-violet-50 dark:bg-violet-600/30 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-500/40 shadow-sm' 
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800/90 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 border-slate-200/80 dark:border-transparent'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{showQr ? 'Hide' : 'QR'}</span>
            </button>
          </div>
        </div>

        {/* Right: Connect to peer */}
        <div className="group flex flex-col justify-between bg-slate-50/90 dark:bg-[#14141c] border border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-violet-500/40 rounded-xl p-4 transition-all duration-300 shadow-xs dark:shadow-none hover:shadow-md dark:hover:shadow-violet-950/20 hover:-translate-y-0.5">
          <div>
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium block mb-1.5">
              Enter Friend's Code
            </span>
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <input
                type="text"
                value={friendCode}
                onChange={(e) => setFriendCode(sanitizeCode(e.target.value))}
                placeholder="6-LETTER CODE"
                maxLength={8}
                disabled={isConnected || isConnecting}
                className="w-full bg-white dark:bg-[#08080a] border border-slate-200 dark:border-neutral-800 focus:border-violet-500 dark:focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 text-slate-900 dark:text-white font-mono text-center sm:text-left text-lg font-bold tracking-widest uppercase rounded-lg px-3.5 py-2 placeholder:text-slate-400 dark:placeholder:text-neutral-600 outline-none transition-all disabled:opacity-40 shadow-sm dark:shadow-none"
              />

              <button
                type="submit"
                disabled={!friendCode.trim() || isConnected || isConnecting || !isReady}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg px-4 py-2.5 transition-all duration-150 active:scale-[0.98] shadow-md shadow-violet-600/20 disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none cursor-pointer"
              >
                <span>{isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect'}</span>
                {!isConnecting && !isConnected && <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />}
              </button>
            </form>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-neutral-500 mt-2 text-center sm:text-left">
            Direct Peer-to-Peer • No uploads
          </div>
        </div>
      </div>

      {/* QR Code toggle with smooth entry animation */}
      {showQr && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-neutral-800 flex flex-col items-center gap-2.5 animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="bg-white p-3.5 rounded-2xl shadow-lg border border-slate-200 dark:border-transparent transition-transform hover:scale-105 duration-200">
            <QRCodeSVG value={shareableUrl} size={150} level="M" />
          </div>
          <span className="text-xs text-slate-600 dark:text-neutral-300 font-medium">Scan with phone to auto-connect</span>
          <button
            onClick={() => setShowQr(false)}
            className="text-[11px] text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
          >
            <X className="w-3 h-3" /> Close
          </button>
        </div>
      )}
    </div>
  );
}
