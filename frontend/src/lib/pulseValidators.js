
import { PULSE_MAX_RETRIES } from './pulseConstants.js';

export const isValidPulsePrice = (v) => !Number.isNaN(Number.parseFloat(v)) && Number.parseFloat(v) >= 0;

export const isValidBlockHeight = (b) => Number.isInteger(b) && b >= 0;

export const isValidPulseTxId = (id) => typeof id === "string" && id.length === 64;

export const isValidPulseAddress = (a) => typeof a === "string" && a.startsWith("SP") && a.length > 10;

export const isValidPulseNetwork = (n) => ["mainnet", "testnet"].includes(n);

export const isValidPulseVersion = (v) => typeof v === "string" && /^\d+\.\d+\.\d+$/.test(v);

export const isValidTickInterval = (t) => Number.isInteger(t) && t > 0;

export const isValidFeedSize = (n) => Number.isInteger(n) && n > 0 && n <= 1000;

export const isValidRetryCount = (n) => Number.isInteger(n) && n >= 0 && n <= PULSE_MAX_RETRIES;

export const isValidCacheTTL = (t) => Number.isInteger(t) && t > 0;

export const isValidChartPoints = (n) => Number.isInteger(n) && n > 0 && n <= 10000;

export const isValidAlertCooldown = (ms) => Number.isInteger(ms) && ms >= 0;

export const isValidPageSize = (n) => Number.isInteger(n) && n > 0 && n <= 100;

export const isValidPulseStatus = (s) => ["pending", "confirmed", "failed"].includes(s);

export const isValidReconnectDelay = (ms) => Number.isInteger(ms) && ms >= 0;

export const isValidStaleThreshold = (ms) => Number.isInteger(ms) && ms > 0;

export const isValidPulseDelta = (d) => typeof d === "number" && Number.isFinite(d);

export const isValidPulseVolume = (v) => typeof v === "number" && v >= 0;

export const isValidPriceDecimals = (d) => Number.isInteger(d) && d >= 0 && d <= 18;

export const isValidPulseContractAddress = (a) => typeof a === "string" && a.includes(".");

export const isValidPulseUsername = (u) => typeof u === "string" && u.length >= 1 && u.length <= 32;
