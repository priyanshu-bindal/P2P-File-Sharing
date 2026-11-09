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

  return (
    <div className="w-full bg-[#0c0c0e] border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-2xl premium-card">
      {/* Live Status Bar */}
      <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-neutral-800/80">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Connection Status
        </span>

        {isConnected ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium transition-all animate-in fade-in duration-200">
            <div className="relative flex h-2 w-2 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-radar" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <span>Connected: <strong className="font-mono text-white tracking-wider">{connectedPeerCode}</strong></span>
            <button
              onClick={onDisconnect}
              className="ml-1 text-[11px] underline text-emerald-300 hover:text-white transition-colors button-interactive"
            >
              Disconnect
            </button>
          </div>
        ) : isConnecting ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium transition-all animate-in fade-in duration-200">
            <div className="relative flex h-2 w-2 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-radar" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
            </div>
            <span>Connecting...</span>
            <button
              onClick={onDisconnect}
              className="ml-1 text-[11px] underline text-amber-200 hover:text-white button-interactive"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{isReady ? 'Discoverable' : 'Initializing...'}</span>
          </div>
        )}
      </div>

      {/* Code & Connect Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left: Your Code */}
        <div className="group flex flex-col justify-between bg-[#141417] border border-neutral-800/90 hover:border-neutral-700/80 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/40">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-neutral-400 font-medium">Your Code</span>
              <button
                onClick={handleRegenerate}
                title="New code"
                className="text-neutral-500 hover:text-neutral-200 p-1 rounded-md transition-all duration-300 hover:bg-white/[0.06] active:scale-90"
              >
                <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${isRotating ? 'rotate-180 text-violet-400' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-[#08080a] border border-neutral-800/80 group-hover:border-neutral-700/60 rounded-lg px-3.5 py-2.5 transition-colors">
              <span className="font-mono text-2xl font-black tracking-widest text-white select-all">
                {myCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium transition-all duration-150 active:scale-95 shadow-sm"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 animate-pop" />
                    <span className="text-emerald-400 font-medium">Copied</span>
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
          <div className="flex gap-2 mt-3 pt-3 border-t border-neutral-800/70">
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-all duration-150 active:scale-95"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 animate-pop" />
                  <span className="text-emerald-400">Link Copied</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5 text-violet-400" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowQr((p) => !p)}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 ${
                showQr 
                  ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40 shadow-sm shadow-violet-600/20' 
                  : 'bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{showQr ? 'Hide' : 'QR'}</span>
            </button>
          </div>
        </div>

        {/* Right: Connect to peer */}
        <div className="group flex flex-col justify-between bg-[#141417] border border-neutral-800/90 hover:border-neutral-700/80 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-black/40">
          <div>
            <span className="text-xs text-neutral-400 font-medium block mb-1.5">
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
                className="w-full bg-[#08080a] border border-neutral-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 text-white font-mono text-center sm:text-left text-lg font-bold tracking-widest uppercase rounded-lg px-3.5 py-2 placeholder:text-neutral-600 outline-none transition-all disabled:opacity-40"
              />

              <button
                type="submit"
                disabled={!friendCode.trim() || isConnected || isConnecting || !isReady}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg px-4 py-2.5 transition-all duration-150 active:scale-[0.98] shadow-md shadow-violet-600/20 disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none"
              >
                <span>{isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect'}</span>
                {!isConnecting && !isConnected && <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />}
              </button>
            </form>
          </div>

          <div className="text-[11px] text-neutral-500 mt-2 text-center sm:text-left">
            Direct WebRTC • No uploads
          </div>
        </div>
      </div>

      {/* QR Code toggle with smooth entry animation */}
      {showQr && (
        <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col items-center gap-2.5 animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="bg-white p-3.5 rounded-2xl shadow-xl transition-transform hover:scale-105 duration-200">
            <QRCodeSVG value={shareableUrl} size={150} level="M" />
          </div>
          <span className="text-xs text-neutral-300 font-medium">Scan to auto-connect</span>
          <button
            onClick={() => setShowQr(false)}
            className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-white/[0.05]"
          >
            <X className="w-3 h-3" /> Close
          </button>
        </div>
      )}
    </div>
  );
}
