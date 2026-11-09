import { useState, useEffect, useRef, useCallback } from 'react';
import PeerModule from 'peerjs';
import { generateShortCode, sanitizeCode } from '../utils/formatters';

// Handle both default and named export interop across bundlers
const Peer = PeerModule.Peer || PeerModule.default || PeerModule;

const PEER_PREFIX = 'p2p-drop-';
const CHUNK_SIZE = 16 * 1024; // 16 KB chunks as specified
const MAX_BUFFERED_AMOUNT = 64 * 1024; // 64 KB backpressure limit

/**
 * Backpressure handler: pauses if WebRTC buffer is high, awaits 'bufferedamountlow'
 * Supports early abort if transfer is cancelled
 */
function waitForBuffer(dc, maxBuffered = MAX_BUFFERED_AMOUNT, isCancelledFn) {
  if (!dc || dc.bufferedAmount <= maxBuffered) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let resolved = false;

    const cleanup = () => {
      if (resolved) return;
      resolved = true;
      if (dc?.removeEventListener) {
        dc.removeEventListener('bufferedamountlow', onLow);
      }
      clearInterval(pollTimer);
      clearTimeout(safetyTimer);
      resolve();
    };

    const onLow = () => cleanup();

    if (dc?.addEventListener) {
      try {
        dc.bufferedAmountLowThreshold = Math.max(16 * 1024, Math.floor(maxBuffered / 2));
        dc.addEventListener('bufferedamountlow', onLow, { once: true });
      } catch (_e) {
        // Fallback to polling if unsupported
      }
    }

    const pollTimer = setInterval(() => {
      if (isCancelledFn?.() || !dc || dc.bufferedAmount <= maxBuffered) {
        cleanup();
      }
    }, 20);

    const safetyTimer = setTimeout(() => {
      cleanup();
    }, 5000);
  });
}

export function usePeer() {
  const [myCode, setMyCode] = useState(() => generateShortCode());
  const [connectionStatus, setConnectionStatus] = useState('idle'); // 'idle' | 'connecting' | 'connected' | 'disconnected'
  const [connectedPeerCode, setConnectedPeerCode] = useState(null);
  const [error, setError] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [isReady, setIsReady] = useState(false);

  // Mutable refs to prevent stale closures and unnecessary re-renders
  const peerRef = useRef(null);
  const activeConnRef = useRef(null);
  const isReadyRef = useRef(false);
  const myCodeRef = useRef(myCode);
  const cancelledTransfersRef = useRef(new Set());
  const receivingBuffersRef = useRef(new Map());
  const autoConnectAttemptedRef = useRef(false);

  // Sequential Send Queue
  const sendQueueRef = useRef([]);
  const isProcessingQueueRef = useRef(false);

  // Keep refs synced via effect instead of during render
  useEffect(() => {
    myCodeRef.current = myCode;
  }, [myCode]);

  // Extract clean 6-char code from full PeerJS ID
  const extractCode = useCallback((peerId) => {
    if (!peerId) return '';
    return peerId.startsWith(PEER_PREFIX) ? peerId.slice(PEER_PREFIX.length) : peerId;
  }, []);

  // Update a transfer by id
  const updateTransfer = useCallback((id, patch) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...(typeof patch === 'function' ? patch(t) : patch) } : t))
    );
  }, []);

  // Register data channel listeners on PeerJS connection
  const setupConnection = useCallback((conn) => {
    activeConnRef.current = conn;
    const remoteCode = extractCode(conn.peer);

    const handleOpen = () => {
      setConnectionStatus('connected');
      setConnectedPeerCode(remoteCode);
      setError(null);
    };

    if (conn.open) {
      handleOpen();
    } else {
      conn.on('open', handleOpen);
    }

    conn.on('data', (data) => {
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'file-meta': {
          const { fileId, name, size, mimeType, totalChunks } = data;

          receivingBuffersRef.current.set(fileId, {
            meta: { fileId, name, size, mimeType, totalChunks },
            chunks: new Array(totalChunks),
            receivedCount: 0,
            bytesReceived: 0,
            lastTime: performance.now(),
            lastBytes: 0,
            speed: 0,
          });

          setTransfers((prev) => [
            {
              id: fileId,
              name,
              size,
              mimeType,
              direction: 'receive',
              status: 'receiving',
              progress: 0,
              bytesTransferred: 0,
              totalBytes: size,
              speed: 0,
              downloadUrl: null,
            },
            ...prev,
          ]);
          break;
        }

        case 'file-chunk': {
          const { fileId, chunkIndex, data: chunkBuffer } = data;
          const record = receivingBuffersRef.current.get(fileId);
          if (!record) return;

          if (cancelledTransfersRef.current.has(fileId)) {
            return;
          }

          record.chunks[chunkIndex] = chunkBuffer;
          record.receivedCount += 1;
          record.bytesReceived += chunkBuffer.byteLength || chunkBuffer.size || 0;

          // Compute receiving speed with exponential smoothing
          const now = performance.now();
          const elapsed = (now - record.lastTime) / 1000;
          if (elapsed >= 0.2) {
            const bytesDelta = record.bytesReceived - record.lastBytes;
            const currentSpeed = elapsed > 0 ? bytesDelta / elapsed : 0;
            record.speed = record.speed === 0 ? currentSpeed : (record.speed * 0.7 + currentSpeed * 0.3);
            record.lastTime = now;
            record.lastBytes = record.bytesReceived;
          }

          const progress = record.meta.size > 0
            ? Math.min(100, Math.round((record.bytesReceived / record.meta.size) * 100))
            : 100;

          updateTransfer(fileId, {
            bytesTransferred: record.bytesReceived,
            progress,
            speed: Math.round(record.speed),
          });
          break;
        }

        case 'file-complete': {
          const { fileId } = data;
          const record = receivingBuffersRef.current.get(fileId);
          if (!record) return;

          try {
            // Reconstruct blob from ordered chunks
            const blob = new Blob(record.chunks, { type: record.meta.mimeType || 'application/octet-stream' });
            const downloadUrl = URL.createObjectURL(blob);

            updateTransfer(fileId, {
              status: 'completed',
              progress: 100,
              bytesTransferred: record.meta.size,
              speed: 0,
              downloadUrl,
              blob,
            });
          } catch (assembleErr) {
            console.error('Failed to reconstruct blob:', assembleErr);
            updateTransfer(fileId, {
              status: 'failed',
              error: 'Failed to reconstruct received file',
              speed: 0,
            });
          } finally {
            receivingBuffersRef.current.delete(fileId);
          }
          break;
        }

        case 'file-cancel': {
          const { fileId } = data;
          receivingBuffersRef.current.delete(fileId);
          cancelledTransfersRef.current.add(fileId);
          updateTransfer(fileId, {
            status: 'cancelled',
            speed: 0,
            error: 'Transfer was cancelled by peer',
          });
          break;
        }

        default:
          break;
      }
    });

    conn.on('close', () => {
      setConnectionStatus('disconnected');
      setConnectedPeerCode(null);
      setError('Peer disconnected.');
      activeConnRef.current = null;
      sendQueueRef.current = [];

      // Fail any in-progress or queued transfers
      setTransfers((prev) =>
        prev.map((t) =>
          t.status === 'sending' || t.status === 'receiving' || t.status === 'pending'
            ? { ...t, status: 'failed', speed: 0, error: 'Peer disconnected' }
            : t
        )
      );
    });

    conn.on('error', (connErr) => {
      console.error('Connection error:', connErr);
      setConnectionStatus('disconnected');
      setError('Connection error occurred.');
    });
  }, [extractCode, updateTransfer]);

  // Connect to another peer with 6-char code
  const connectToPeer = useCallback((codeToConnect) => {
    const sanitized = sanitizeCode(codeToConnect);
    if (!sanitized) {
      setError('Please enter a valid 6-character code.');
      return;
    }
    if (sanitized === myCodeRef.current) {
      setError("You cannot connect to your own code. Share this code with a friend!");
      return;
    }
    if (!peerRef.current || !isReadyRef.current) {
      setError('P2P connection is still initializing. Please wait a moment.');
      return;
    }

    if (activeConnRef.current) {
      try {
        activeConnRef.current.close();
      } catch (_closeErr) {
        // Connection may already be closed
      }
      activeConnRef.current = null;
    }

    setConnectionStatus('connecting');
    setError(null);

    const fullTargetId = `${PEER_PREFIX}${sanitized}`;
    try {
      const conn = peerRef.current.connect(fullTargetId, {
        reliable: true,
      });

      setupConnection(conn);

      // Timeout watchdog
      const timer = setTimeout(() => {
        if (!activeConnRef.current || !activeConnRef.current.open) {
          setConnectionStatus((curr) => {
            if (curr === 'connecting') {
              setError(`Connection timed out. Ensure peer "${sanitized}" is online with this app open.`);
              return 'disconnected';
            }
            return curr;
          });
        }
      }, 15000);

      conn.on('open', () => clearTimeout(timer));
      conn.on('error', () => clearTimeout(timer));
    } catch (connectErr) {
      console.error('Failed to initiate connection:', connectErr);
      setConnectionStatus('disconnected');
      setError('Failed to establish connection to peer.');
    }
  }, [setupConnection]);

  // Keep refs synced via effect (not during render) to satisfy React rules
  const connectToPeerRef = useRef(connectToPeer);
  const setupConnectionRef = useRef(setupConnection);

  useEffect(() => {
    connectToPeerRef.current = connectToPeer;
  }, [connectToPeer]);

  useEffect(() => {
    setupConnectionRef.current = setupConnection;
  }, [setupConnection]);

  // Disconnect from active peer
  const disconnect = useCallback(() => {
    if (activeConnRef.current) {
      try {
        activeConnRef.current.close();
      } catch (_closeErr) {
        // Connection may already be closed
      }
      activeConnRef.current = null;
    }
    sendQueueRef.current = [];
    setConnectionStatus('disconnected');
    setConnectedPeerCode(null);
  }, []);

  // Cancel a transfer
  const cancelTransfer = useCallback((transferId) => {
    cancelledTransfersRef.current.add(transferId);

    // Remove from pending queue if not yet sending
    sendQueueRef.current = sendQueueRef.current.filter((item) => item.id !== transferId);

    if (activeConnRef.current?.open) {
      try {
        activeConnRef.current.send({
          type: 'file-cancel',
          fileId: transferId,
        });
      } catch (_sendErr) {
        // Connection may be closing
      }
    }

    receivingBuffersRef.current.delete(transferId);

    updateTransfer(transferId, {
      status: 'cancelled',
      speed: 0,
      error: 'Cancelled by you',
    });
  }, [updateTransfer]);

  // Process sequential send queue
  const processSendQueue = useCallback(async () => {
    if (isProcessingQueueRef.current) return;
    isProcessingQueueRef.current = true;

    while (sendQueueRef.current.length > 0) {
      const item = sendQueueRef.current.shift();
      if (!item) continue;

      const { id: fileId, name, size, mimeType, _file: file } = item;

      // Skip if cancelled while waiting in queue
      if (cancelledTransfersRef.current.has(fileId)) {
        continue;
      }

      if (!activeConnRef.current?.open) {
        updateTransfer(fileId, {
          status: 'failed',
          speed: 0,
          error: 'Connection lost before sending',
        });
        continue;
      }

      const totalChunks = Math.max(1, Math.ceil(size / CHUNK_SIZE));

      // 1. Send file metadata header
      try {
        activeConnRef.current.send({
          type: 'file-meta',
          fileId,
          name,
          size,
          mimeType,
          totalChunks,
          chunkSize: CHUNK_SIZE,
        });
      } catch (_metaErr) {
        updateTransfer(fileId, { status: 'failed', error: 'Failed to send file header' });
        continue;
      }

      updateTransfer(fileId, { status: 'sending', progress: 0 });

      let bytesSent = 0;
      let lastTime = performance.now();
      let lastBytes = 0;
      let currentSpeed = 0;
      let isCancelled = false;

      const dataChannel = activeConnRef.current.dataChannel || activeConnRef.current._dc;

      // Handle 0-byte file edge case
      if (size === 0) {
        updateTransfer(fileId, { status: 'completed', progress: 100, bytesTransferred: 0, speed: 0 });
        try {
          activeConnRef.current.send({ type: 'file-complete', fileId });
        } catch (_compErr) {
          // ignore
        }
        continue;
      }

      // 2. Send 16 KB chunks with backpressure
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (cancelledTransfersRef.current.has(fileId)) {
          isCancelled = true;
          break;
        }

        if (!activeConnRef.current?.open) {
          updateTransfer(fileId, {
            status: 'failed',
            speed: 0,
            error: 'Connection dropped during transfer',
          });
          isCancelled = true;
          break;
        }

        // Backpressure: pause if WebRTC buffer is full; abort immediately if cancelled
        if (dataChannel && dataChannel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
          await waitForBuffer(dataChannel, MAX_BUFFERED_AMOUNT, () => cancelledTransfersRef.current.has(fileId));
        }

        if (cancelledTransfersRef.current.has(fileId)) {
          isCancelled = true;
          break;
        }

        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, size);
        const slice = file.slice(start, end);
        const buffer = await slice.arrayBuffer();

        try {
          activeConnRef.current.send({
            type: 'file-chunk',
            fileId,
            chunkIndex,
            data: buffer,
          });
        } catch (_chunkErr) {
          updateTransfer(fileId, { status: 'failed', error: 'Send buffer failure' });
          isCancelled = true;
          break;
        }

        bytesSent += buffer.byteLength;

        // Smooth speed calculations
        const now = performance.now();
        const elapsed = (now - lastTime) / 1000;
        if (elapsed >= 0.2 || chunkIndex === totalChunks - 1) {
          const bytesDelta = bytesSent - lastBytes;
          const instantaneousSpeed = elapsed > 0 ? bytesDelta / elapsed : 0;
          currentSpeed = currentSpeed === 0 ? instantaneousSpeed : (currentSpeed * 0.7 + instantaneousSpeed * 0.3);
          lastTime = now;
          lastBytes = bytesSent;

          const progress = size > 0 ? Math.min(100, Math.round((bytesSent / size) * 100)) : 100;
          updateTransfer(fileId, {
            bytesTransferred: bytesSent,
            progress,
            speed: Math.round(currentSpeed),
          });
        }
      }

      if (isCancelled) {
        continue;
      }

      // 3. Complete transfer and ensure buffer drains
      if (activeConnRef.current?.open) {
        if (dataChannel && dataChannel.bufferedAmount > 0) {
          await waitForBuffer(dataChannel, 0, () => cancelledTransfersRef.current.has(fileId));
        }

        try {
          activeConnRef.current.send({
            type: 'file-complete',
            fileId,
          });

          updateTransfer(fileId, {
            status: 'completed',
            progress: 100,
            bytesTransferred: size,
            speed: 0,
          });
        } catch (_compErr) {
          // ignore
        }
      }
    }

    isProcessingQueueRef.current = false;
  }, [updateTransfer]);

  // Send multiple files safely via sequential queue
  const sendFiles = useCallback((files) => {
    if (!activeConnRef.current || !activeConnRef.current.open) {
      setError('Cannot send files: no peer is currently connected.');
      return;
    }

    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const newTransfers = fileList.map((file) => {
      const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      return {
        id: fileId,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        direction: 'send',
        status: 'pending',
        progress: 0,
        bytesTransferred: 0,
        totalBytes: file.size,
        speed: 0,
        _file: file,
      };
    });

    setTransfers((prev) => [...newTransfers, ...prev]);
    sendQueueRef.current.push(...newTransfers);
    processSendQueue();
  }, [processSendQueue]);

  // PeerJS Lifecycle Effect
  useEffect(() => {
    let peerInstance = null;
    let isDisposed = false;
    let initError = null;

    const fullId = `${PEER_PREFIX}${myCode}`;

    try {
      peerInstance = new Peer(fullId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
          ],
        },
      });

      peerRef.current = peerInstance;

      peerInstance.on('open', () => {
        if (isDisposed) return;
        setIsReady(true);
        isReadyRef.current = true;
        setError(null);

        // Check for URL query param auto-connect (?code=XXXXXX)
        if (!autoConnectAttemptedRef.current) {
          autoConnectAttemptedRef.current = true;
          const params = new URLSearchParams(window.location.search);
          const autoCode = sanitizeCode(params.get('code'));

          if (autoCode && autoCode !== myCode) {
            setTimeout(() => {
              if (!isDisposed) {
                connectToPeerRef.current(autoCode);
                // Clean the URL param so refreshing doesn't cause a re-connect loop
                try {
                  const cleanUrl = window.location.pathname;
                  window.history.replaceState({}, document.title, cleanUrl);
                } catch (_urlErr) {
                  // ignore
                }
              }
            }, 600);
          }
        }
      });

      peerInstance.on('connection', (incomingConn) => {
        if (isDisposed) return;
        setupConnectionRef.current(incomingConn);
      });

      peerInstance.on('error', (err) => {
        if (isDisposed) return;
        console.error('Peer error event:', err.type, err.message);

        if (err.type === 'unavailable-id') {
          // If code collision on public broker, regenerate and reload peer
          const newCode = generateShortCode();
          setMyCode(newCode);
          return;
        }

        if (err.type === 'peer-unavailable') {
          setConnectionStatus('disconnected');
          setError('Target peer not found. Check that the 6-character code is correct and your peer is online.');
        } else {
          setError(err.message || 'P2P network error occurred.');
        }
      });

      peerInstance.on('disconnected', () => {
        if (isDisposed) return;
        try {
          peerInstance.reconnect();
        } catch (_reconnectErr) {
          // Signaling server may be unreachable
        }
      });
    } catch (peerErr) {
      console.error('Peer instantiation error:', peerErr);
      initError = 'Failed to initialize WebRTC subsystem.';
    }

    // Defer error state update so it runs after render, not synchronously inside the effect body
    if (initError) {
      const errorTimer = setTimeout(() => {
        if (!isDisposed) setError(initError);
      }, 0);

      return () => {
        isDisposed = true;
        clearTimeout(errorTimer);
        isReadyRef.current = false;
        if (peerInstance) {
          peerInstance.destroy();
        }
      };
    }

    return () => {
      isDisposed = true;
      isReadyRef.current = false;
      if (peerInstance) {
        peerInstance.destroy();
      }
    };
  }, [myCode]);

  // Clean up Object URLs when component unmounts
  useEffect(() => {
    return () => {
      transfers.forEach((t) => {
        if (t.downloadUrl) {
          URL.revokeObjectURL(t.downloadUrl);
        }
      });
    };
  }, [transfers]);

  const shareableUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?code=${myCode}`
    : `?code=${myCode}`;

  const clearError = useCallback(() => setError(null), []);

  const clearCompletedTransfers = useCallback(() => {
    setTransfers((prev) => {
      prev.forEach((t) => {
        if ((t.status === 'completed' || t.status === 'cancelled' || t.status === 'failed') && t.downloadUrl) {
          URL.revokeObjectURL(t.downloadUrl);
        }
      });
      return prev.filter((t) => t.status === 'sending' || t.status === 'receiving' || t.status === 'pending');
    });
  }, []);

  const removeTransfer = useCallback((transferId) => {
    setTransfers((prev) => {
      const target = prev.find((t) => t.id === transferId);
      if (target?.downloadUrl) {
        URL.revokeObjectURL(target.downloadUrl);
      }
      return prev.filter((t) => t.id !== transferId);
    });
  }, []);

  const regenerateCode = useCallback(() => {
    disconnect();
    const freshCode = generateShortCode();
    setMyCode(freshCode);
  }, [disconnect]);

  return {
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
  };
}
