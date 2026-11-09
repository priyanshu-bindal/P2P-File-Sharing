// Format file sizes into human-readable strings
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${val} ${sizes[i] || 'B'}`;
}

// Format transfer speed
export function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 B/s';
  return `${formatBytes(bytesPerSec, 1)}/s`;
}

// Format estimated time remaining
export function formatETA(bytesRemaining, bytesPerSec) {
  if (!bytesPerSec || bytesPerSec <= 0 || !bytesRemaining) return '';
  const seconds = Math.ceil(bytesRemaining / bytesPerSec);
  if (seconds < 60) return `${seconds}s left`;
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  return `${minutes}m ${remainingSecs}s left`;
}

// Unambiguous characters for readable 6-character room codes (no 0/O, 1/I, L)
const CODE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function generateShortCode(length = 6) {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
    result += CODE_CHARS.charAt(randomIndex);
  }
  return result;
}

// Sanitize user-entered code
export function sanitizeCode(code) {
  if (!code) return '';
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

// Sanitize file names for cross-platform safe downloads
export function sanitizeFileName(name) {
  if (!name || typeof name !== 'string') return 'downloaded_file';
  const cleaned = name.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return cleaned || 'downloaded_file';
}
