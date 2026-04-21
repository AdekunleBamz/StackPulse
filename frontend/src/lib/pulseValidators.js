
export const isValidPulsePrice = (v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0;

export const isValidBlockHeight = (b) => Number.isInteger(b) && b >= 0;

export const isValidPulseTxId = (id) => typeof id === "string" && id.length === 64;

export const isValidPulseAddress = (a) => typeof a === "string" && a.startsWith("SP") && a.length > 10;

export const isValidPulseNetwork = (n) => ["mainnet","testnet"].includes(n);

export const isValidPulseVersion = (v) => typeof v === "string" && /^\d+\.\d+\.\d+$/.test(v);

export const isValidTickInterval = (t) => Number.isInteger(t) && t > 0;

export const isValidFeedSize = (n) => Number.isInteger(n) && n > 0 && n <= 1000;

export const isValidRetryCount = (n) => Number.isInteger(n) && n >= 0;

export const isValidCacheTTL = (t) => Number.isInteger(t) && t > 0;

export const isValidChartPoints = (n) => Number.isInteger(n) && n > 0 && n <= 10000;

export const isValidAlertCooldown = (ms) => Number.isInteger(ms) && ms >= 0;

export const isValidPageSize = (n) => Number.isInteger(n) && n > 0 && n <= 100;

export const isValidPulseStatus = (s) => ["pending","confirmed","failed"].includes(s);

export const isValidReconnectDelay = (ms) => Number.isInteger(ms) && ms >= 0;

export const isValidStaleThreshold = (ms) => Number.isInteger(ms) && ms > 0;

export const isValidPulseDelta = (d) => typeof d === "number" && isFinite(d);
