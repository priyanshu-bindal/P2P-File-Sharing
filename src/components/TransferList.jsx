import React from 'react';
import { 
  Download, 
  Upload, 
  Check, 
  XCircle, 
  AlertOctagon, 
  Clock, 
  FileText, 
  X, 
  Gauge, 
  Trash2 
} from 'lucide-react';
import { formatBytes, formatSpeed, formatETA, sanitizeFileName } from '../utils/formatters';
import { useCardSpotlight } from '../hooks/useCardSpotlight';

function TransferCardItem({ transfer, onCancelTransfer, onRemoveTransfer }) {
  const spotlight = useCardSpotlight({ tilt: false });
  const isSender = transfer.direction === 'send';
  const isCompleted = transfer.status === 'completed';
  const isCancelled = transfer.status === 'cancelled';
  const isFailed = transfer.status === 'failed';
  const isActive = transfer.status === 'sending' || transfer.status === 'receiving';
  const isPending = transfer.status === 'pending';

  const remainingBytes = Math.max(0, transfer.totalBytes - transfer.bytesTransferred);
  const etaText = isActive ? formatETA(remainingBytes, transfer.speed) : '';

  return (
    <div
      {...spotlight}
      className="group relative aesthetic-card bg-white dark:bg-[#0c0c11] border border-slate-200/90 dark:border-white/[0.1] hover:border-violet-500/40 dark:hover:border-violet-400/40 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 transition-all duration-200 shadow-xs dark:shadow-md hover:shadow-md dark:hover:shadow-violet-950/20 animate-in fade-in-0 slide-in-from-bottom-1 hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between gap-3">
        {/* File Details (Left) */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Status Icon */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
              isCompleted
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                : isCancelled || isFailed
                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                : isSender
                ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20'
                : 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20'
            }`}
          >
            {isCompleted ? (
              <Check className="w-4 h-4 stroke-[2.5] animate-pop" />
            ) : isCancelled ? (
              <XCircle className="w-4 h-4 animate-pop" />
            ) : isFailed ? (
              <AlertOctagon className="w-4 h-4 animate-pop" />
            ) : isSender ? (
              <Upload className="w-4 h-4 animate-pulse" />
            ) : (
              <Download className="w-4 h-4 animate-pulse" />
            )}
          </div>

          {/* Title and Metadata */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span 
                className="font-medium text-xs sm:text-sm text-slate-800 dark:text-neutral-100 truncate max-w-[160px] sm:max-w-xs md:max-w-md block leading-tight group-hover:text-slate-900 dark:group-hover:text-white transition-colors" 
                title={transfer.name}
              >
                {transfer.name}
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded leading-none bg-slate-100 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.06] text-slate-600 dark:text-neutral-400">
                {isSender ? 'Sent' : 'Received'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-slate-500 dark:text-neutral-400 leading-none">
              <span>{formatBytes(transfer.totalBytes)}</span>
              
              {isCompleted && (
                <>
                  <span className="text-slate-300 dark:text-neutral-600">•</span>
                  <span className="text-emerald-600 dark:text-emerald-400/90 font-medium flex items-center gap-1">
                    Completed
                  </span>
                </>
              )}

              {isActive && (
                <>
                  <span className="text-slate-300 dark:text-neutral-600">•</span>
                  <span className="font-mono text-slate-700 dark:text-neutral-300 font-medium">
                    {transfer.progress}%
                  </span>
                  <span className="text-slate-300 dark:text-neutral-600">•</span>
                  <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400 font-medium">
                    <Gauge className="w-3 h-3 animate-pulse" />
                    {formatSpeed(transfer.speed)}
                  </span>
                  {etaText && (
                    <>
                      <span className="text-slate-300 dark:text-neutral-600">•</span>
                      <span className="flex items-center gap-1 text-slate-500 dark:text-neutral-400">
                        <Clock className="w-3 h-3" />
                        {etaText}
                      </span>
                    </>
                  )}
                </>
              )}

              {isCancelled && (
                <>
                  <span className="text-slate-300 dark:text-neutral-600">•</span>
                  <span className="text-amber-600 dark:text-amber-400/90 font-medium">Cancelled</span>
                </>
              )}

              {isFailed && (
                <>
                  <span className="text-slate-300 dark:text-neutral-600">•</span>
                  <span className="text-rose-600 dark:text-rose-400/90 font-medium">
                    {transfer.error || 'Failed'}
                  </span>
                </>
              )}

              {isPending && (
                <>
                  <span className="text-slate-300 dark:text-neutral-600">•</span>
                  <span className="text-slate-400 dark:text-neutral-500">Queued</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Download button for completed incoming file */}
          {!isSender && isCompleted && transfer.downloadUrl && (
            <a
              href={transfer.downloadUrl}
              download={sanitizeFileName(transfer.name)}
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 border border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-300 dark:hover:border-emerald-500/50 text-xs font-semibold transition-all duration-150 active:scale-95 shadow-xs dark:shadow-sm shadow-emerald-500/10 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          )}

          {/* Cancel button for active / pending transfers */}
          {(isActive || isPending) && (
            <button
              onClick={() => onCancelTransfer(transfer.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-rose-50 dark:bg-white/[0.04] dark:hover:bg-rose-500/20 text-slate-600 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-300 text-xs font-medium border border-slate-200 dark:border-white/[0.08] transition-all duration-150 active:scale-90 cursor-pointer"
              title="Cancel transfer"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          )}

          {/* Dismiss individual item button on completed/failed/cancelled */}
          {!isActive && !isPending && onRemoveTransfer && (
            <button
              onClick={() => onRemoveTransfer(transfer.id)}
              className="opacity-40 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-white/[0.08] p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 transition-all duration-150 active:scale-90 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar: Only visible during active sending/receiving */}
      {isActive && (
        <div className="mt-2.5">
          <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-neutral-900 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-150 rounded-full ${
                isSender
                  ? 'bg-gradient-to-r from-violet-500 to-indigo-500'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-400'
              }`}
              style={{ width: `${transfer.progress}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      )}
    </div>
  );
}

export function TransferList({ 
  transfers, 
  onCancelTransfer, 
  onClearCompleted,
  onRemoveTransfer 
}) {
  if (!transfers || transfers.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-neutral-800/80 rounded-2xl p-6 sm:p-8 text-center text-slate-400 dark:text-neutral-500 shadow-sm transition-all duration-300">
        <FileText className="w-7 h-7 mx-auto mb-2 opacity-30 text-slate-400 dark:text-neutral-400" />
        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-neutral-400">No file transfers yet</p>
        <p className="text-[11px] text-slate-400 dark:text-neutral-600 mt-0.5">
          Files you send or receive will appear here with live progress
        </p>
      </div>
    );
  }

  const activeCount = transfers.filter((t) => t.status === 'sending' || t.status === 'receiving').length;
  const hasFinished = transfers.some(
    (t) => t.status === 'completed' || t.status === 'cancelled' || t.status === 'failed'
  );

  return (
    <div className="w-full space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-700 dark:text-neutral-200">
            Transfers
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200/80 dark:bg-white/[0.06] text-slate-700 dark:text-neutral-300 border border-slate-300/60 dark:border-white/[0.08] transition-all">
            {transfers.length}
          </span>
          {activeCount > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] text-violet-600 dark:text-violet-400 font-medium ml-1">
              <span className="relative flex h-2 w-2 items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75 animate-radar" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-500 dark:bg-violet-400" />
              </span>
              {activeCount} active
            </span>
          )}
        </div>

        {/* Clear Completed Action */}
        {hasFinished && (
          <button
            onClick={onClearCompleted}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 text-xs font-medium border border-slate-200 dark:border-white/[0.06] transition-all duration-150 active:scale-95 cursor-pointer"
            title="Clear finished transfers"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Completed</span>
          </button>
        )}
      </div>

      {/* Transfer Cards List */}
      <div className="space-y-2">
        {transfers.map((transfer) => (
          <TransferCardItem
            key={transfer.id}
            transfer={transfer}
            onCancelTransfer={onCancelTransfer}
            onRemoveTransfer={onRemoveTransfer}
          />
        ))}
      </div>
    </div>
  );
}
