
export const formatPulsePrice = (v) => "$" + parseFloat(v).toFixed(2);

export const formatPulseDelta = (d) => (d >= 0 ? "+" : "") + d.toFixed(2) + "%";

export const formatPulseBlock = (b) => "#" + b;

export const formatPulseTxId = (id) => id.slice(0, 8) + "...";

export const formatPulseTimestamp = (ts) => new Date(ts).toLocaleTimeString();

export const formatPulseAddress = (a) => a.slice(0, 6) + "..." + a.slice(-4);

export const formatPulseVolume = (v) => (v / 1e6).toFixed(2) + "M STX";

export const formatPulseMarketCap = (m) => "$" + (m / 1e9).toFixed(2) + "B";

export const formatPulseNetwork = (n) => n.charAt(0).toUpperCase() + n.slice(1);

export const formatPulseStatus = (s) => s.toUpperCase();

export const formatPulseAge = (blocks) => blocks * 10 + " min ago";

export const formatPulseCount = (n) => n.toLocaleString();

export const formatPulseRatio = (a, b) => b > 0 ? (a / b * 100).toFixed(1) + "%" : "0%";

export const formatPulseLabel = (s) => s.replace(/_/g, " ").toLowerCase();

export const formatPulseDecimal = (v, d) => parseFloat(v).toFixed(d || 6);
