
export const formatPulsePrice = (v) => "$" + parseFloat(v).toFixed(2);

export const formatPulseDelta = (d) => (d >= 0 ? "+" : "") + d.toFixed(2) + "%";

export const formatPulseBlock = (b) => "#" + b;

export const formatPulseTxId = (id) => id.slice(0, 8) + "...";

export const formatPulseTimestamp = (ts) => new Date(ts).toLocaleTimeString();

export const formatPulseAddress = (a) => a.slice(0, 6) + "..." + a.slice(-4);
