
import { PULSE_MICROSTX_PER_STX } from './pulseConstants.js';

export const formatPulsePrice = (v) => "$" + Number.parseFloat(v).toFixed(2);

export const formatPulseDelta = (d) => (d >= 0 ? "+" : "") + d.toFixed(2) + "%";

export const formatPulseBlock = (b) => "#" + b;

export const formatPulseTxId = (id) => id.slice(0, 8) + "...";

export const formatPulseTimestamp = (ts) => new Date(ts).toLocaleTimeString();

export const formatPulseAddress = (a) => a.slice(0, 6) + "..." + a.slice(-4);

export const formatPulseVolume = (v) => (v / PULSE_MICROSTX_PER_STX).toFixed(2) + "M STX";

export const formatPulseMarketCap = (m) => "$" + (m / 1e9).toFixed(2) + "B";

export const formatPulseNetwork = (n) => {
	const normalized = typeof n === 'string' ? n.trim().toLowerCase() : '';
	if (!normalized) return 'Unknown';
	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const formatPulseStatus = (s) => s.toUpperCase();

export const formatPulseAge = (blocks) => blocks * 10 + " min ago";

export const formatPulseCount = (n) => n.toLocaleString();

export const formatPulseRatio = (a, b) => b > 0 ? (a / b * 100).toFixed(1) + "%" : "0%";

export const formatPulseLabel = (s) => s.replace(/_/g, " ").toLowerCase();

export const formatPulseDecimal = (v, d) => Number.parseFloat(v).toFixed(d ?? 6);

export const formatPulseMicroStx = (v) => (v / PULSE_MICROSTX_PER_STX).toFixed(6) + " STX";

export const formatPulseFeedItem = (item) => item.type + " @ " + item.block;

export const formatPulseError = (e) => e && e.message ? e.message : "Unknown error";

export const formatPulseVersion = (v) => "v" + v;

export const formatPulseCategory = (c) => c.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
