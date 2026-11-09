import React, { useState, useRef } from 'react';
import { 
  Clipboard, 
  Send, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink, 
  X, 
  MessageSquare
} from 'lucide-react';
import { useCardSpotlight } from '../hooks/useCardSpotlight';

function isUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function TextShare({
  isConnected,
  messages = [],
  onSendText,
  onClearMessages,
  onRemoveMessage,
}) {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [clipboardError, setClipboardError] = useState(null);
  const textareaRef = useRef(null);
  const spotlight = useCardSpotlight({ tilt: false });

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !isConnected) return;
    const success = onSendText(inputText);
    if (success) {
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    // Cmd+Enter or Ctrl+Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePasteClipboard = async () => {
    try {
      setClipboardError(null);
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputText((prev) => (prev ? `${prev}\n${text}` : text));
        }
      } else {
        setClipboardError('Clipboard reading not supported in this browser.');
      }
    } catch (err) {
      setClipboardError('Clipboard access denied. Please paste directly (Ctrl+V / Cmd+V).');
      setTimeout(() => setClipboardError(null), 3500);
    }
  };

  const handleCopyMessage = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (_) {
      // ignore
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. Composer Card */}
      <div
        {...spotlight}
        className="aesthetic-card w-full bg-gradient-to-b from-white via-white to-slate-50/80 dark:from-[#111118] dark:via-[#0c0c11] dark:to-[#09090d] border border-slate-200/90 dark:border-white/[0.12] rounded-2xl p-4 sm:p-5 shadow-[0_12px_36px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.14)] transition-all duration-300"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Clipboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white leading-tight">
                Quick Text & Clipboard
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-500 leading-tight">
                Send notes, links, code, or copied clipboard instantly
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePasteClipboard}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800/90 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-xs font-medium transition-all active:scale-95 border border-slate-200/80 dark:border-neutral-700/60"
            title="Paste from your device clipboard"
          >
            <Clipboard className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
            <span>Paste Clipboard</span>
          </button>
        </div>

        {/* Text Area */}
        <form onSubmit={handleSend} className="space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isConnected}
              rows={3}
              placeholder={
                isConnected
                  ? 'Type or paste anything here... (Ctrl+Enter to send)'
                  : 'Connect with a peer above to share text & clipboard'
              }
              className="w-full bg-slate-50 dark:bg-[#08080a] border border-slate-200 dark:border-neutral-800 focus:border-violet-500 dark:focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 text-slate-900 dark:text-white text-xs sm:text-sm rounded-xl p-3.5 placeholder:text-slate-400 dark:placeholder:text-neutral-600 outline-none transition-all resize-y min-h-[90px] disabled:opacity-50 disabled:cursor-not-allowed font-sans"
            />
          </div>

          {clipboardError && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 animate-in fade-in">
              {clipboardError}
            </p>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-neutral-500">
              <span>{inputText.length} chars</span>
              {inputText.length > 0 && (
                <>
                  <span>•</span>
                  <span>{inputText.trim().split(/\s+/).filter(Boolean).length} words</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {inputText.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Clear
                </button>
              )}

              <button
                type="submit"
                disabled={!inputText.trim() || !isConnected}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <span>Send Text</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 2. Shared Text Snippets List */}
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-700 dark:text-neutral-200">
              Shared History
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200/80 dark:bg-white/[0.06] text-slate-700 dark:text-neutral-300 border border-slate-300/60 dark:border-white/[0.08]">
              {messages.length}
            </span>
          </div>

          {messages.length > 0 && (
            <button
              onClick={onClearMessages}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 text-xs font-medium border border-slate-200 dark:border-white/[0.06] transition-all active:scale-95"
              title="Clear all shared texts"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {/* Message Items or Empty State */}
        {messages.length === 0 ? (
          <div className="w-full bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-neutral-800/80 rounded-2xl p-6 sm:p-8 text-center text-slate-400 dark:text-neutral-500 shadow-sm">
            <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-30 text-slate-400 dark:text-neutral-400" />
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-neutral-400">
              No shared texts yet
            </p>
            <p className="text-[11px] text-slate-400 dark:text-neutral-600 mt-0.5">
              Type or paste clipboard above to send directly to your peer
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {messages.map((item) => {
              const isMe = item.sender === 'me';
              const isCopied = copiedId === item.id;
              const hasUrl = isUrl(item.text.trim());

              return (
                <div
                  key={item.id}
                  className="group relative bg-white dark:bg-[#0c0c10] border border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] rounded-xl p-3.5 sm:p-4 transition-all duration-200 shadow-sm animate-in fade-in-0 slide-in-from-bottom-1"
                >
                  {/* Meta Bar */}
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 dark:border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded leading-none border ${
                          isMe
                            ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200/80 dark:border-violet-500/20'
                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/20'
                        }`}
                      >
                        {isMe ? 'You sent' : 'Received'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {hasUrl && (
                        <a
                          href={item.text.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors"
                          title="Open URL in new tab"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleCopyMessage(item.id, item.text)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.09] text-slate-700 dark:text-neutral-300 text-xs font-medium transition-all active:scale-95"
                        title="Copy to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500 animate-pop" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              Copied!
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveMessage(item.id)}
                        className="opacity-40 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-white/[0.08] p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 transition-all active:scale-90"
                        title="Delete snippet"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="relative">
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-neutral-100 font-sans whitespace-pre-wrap break-words leading-relaxed select-text font-normal">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
