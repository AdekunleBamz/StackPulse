
import { PULSE_MICROSTX_PER_STX } from './pulseConstants.js';

/**
 * Formats a STX price value as a USD string.
 * @param {number|string} v - Price value
 * @returns {string} Formatted price, e.g. "$1.23"
 */
export const formatPulsePrice = (v) => "$" + parseFloat(v).toFixed(2);

/**
 * Formats a price delta as a signed percentage string.
 * @param {number} d - Delta value
 * @returns {string} Formatted delta, e.g. "+1.23%" or "-0.50%"
 */
export const formatPulseDelta = (d) => (d >= 0 ? "+" : "") + d.toFixed(2) + "%";

/**
 * Formats a Stacks block height with a # prefix.
 * @param {number} b - Block height
 * @returns {string} Formatted block, e.g. "#123456"
 */
export const formatPulseBlock = (b) => "#" + b;

/**
 * Truncates a transaction ID for display.
 * @param {string|null|undefined} id - Full transaction ID
 * @returns {string} Shortened tx id showing first 8 chars, e.g. "abcd1234..."
 */
export const formatPulseTxId = (id) => {
  if (!id) return '';
  return id.slice(0, 8) + '...';
};

/**
 * Formats a Unix timestamp as a locale time string.
 * @param {number|null|undefined} ts - Unix timestamp (ms)
 * @returns {string} Formatted time or empty string if invalid
 */
export const formatPulseTimestamp = (ts) => {
  if (ts == null) return '';
  return new Date(ts).toLocaleTimeString();
};

/**
 * Truncates a Stacks address for display.
 * @param {string|null|undefined} a - Full Stacks address
 * @returns {string} Truncated address, e.g. "SP1AB...1234"
 */
export const formatPulseAddress = (a) => {
  if (!a) return '';
  return a.slice(0, 6) + '...' + a.slice(-4);
};

/**
 * Formats a microSTX volume as a readable STX million string.
 * @param {number} v - Volume in microSTX
 * @returns {string} e.g. "1.23M STX"
 */
export const formatPulseVolume = (v) => (v / PULSE_MICROSTX_PER_STX).toFixed(2) + "M STX";

export const formatPulseMarketCap = (m) => "$" + (m / 1e9).toFixed(2) + "B";

/**
 * Formats a network name with title-case normalization.
 * @param {string|null|undefined} n - Network identifier
 * @returns {string} Normalized network name, e.g. "Mainnet"
 */
export const formatPulseNetwork = (n) => {
	const normalized = typeof n === 'string' ? n.trim().toLowerCase() : '';
	if (!normalized) return 'Unknown';
	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

/**
 * Formats a status string in uppercase.
 * @param {string|null|undefined} s - Status value
 * @returns {string} Uppercased status or empty string
 */
export const formatPulseStatus = (s) => {
  if (!s) return '';
  return s.toUpperCase();
};

export const formatPulseAge = (blocks) => blocks * 10 + " min ago";

export const formatPulseCount = (n) => n.toLocaleString();

export const formatPulseRatio = (a, b) => b > 0 ? (a / b * 100).toFixed(1) + "%" : "0%";

export const formatPulseLabel = (s) => s.replace(/_/g, " ").toLowerCase();

export const formatPulseDecimal = (v, d) => parseFloat(v).toFixed(d || 6);

/**
 * Formats a microSTX balance as a full STX decimal string.
 * @param {number} v - Amount in microSTX
 * @returns {string} e.g. "1.000000 STX"
 */
export const formatPulseMicroStx = (v) => (v / PULSE_MICROSTX_PER_STX).toFixed(6) + " STX";

export const formatPulseFeedItem = (item) => item.type + " @ " + item.block;

export const formatPulseError = (e) => e && e.message ? e.message : "Unknown error";

export const formatPulseVersion = (v) => "v" + v;

export const formatPulseCategory = (c) => c.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

export const formatPulseTimeAgo = (ts) => {
	const diff = Date.now() - new Date(ts).getTime();
	const seconds = Math.floor(diff / 1000);
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return new Date(ts).toLocaleDateString();
};
