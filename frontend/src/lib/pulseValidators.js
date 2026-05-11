
import { PULSE_MAX_RETRIES } from './pulseConstants.js';

/**
 * Validates that a price value is a non-negative number.
 * @param {*} v - Value to validate
 * @returns {boolean}
 */
export const isValidPulsePrice = (v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0;

/**
 * Validates that a block height is a non-negative integer.
 * @param {*} b - Value to validate
 * @returns {boolean}
 */
export const isValidBlockHeight = (b) => Number.isInteger(b) && b >= 0;

/**
 * Validates that a transaction ID is a 64-character hex string.
 * @param {*} id - Value to validate
 * @returns {boolean}
 */
export const isValidPulseTxId = (id) => typeof id === "string" && id.length === 64;

/**
 * Validates that a Stacks address starts with SP and has sufficient length.
 * @param {*} a - Value to validate
 * @returns {boolean}
 */
export const isValidPulseAddress = (a) => typeof a === "string" && a.startsWith("SP") && a.length > 10;

/**
 * Validates that a network string is a recognized Stacks network name.
 * @param {*} n - Value to validate
 * @returns {boolean}
 */
export const isValidPulseNetwork = (n) => ["mainnet", "testnet"].includes(n);

/**
 * Validates a semantic version string (e.g. "1.0.0").
 * @param {*} v - Value to validate
 * @returns {boolean}
 */
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

/**
 * Validates that a value is a finite number and can represent a price delta.
 * @param {*} d - Value to validate
 * @returns {boolean}
 */
export const isValidPulseDelta = (d) => typeof d === "number" && isFinite(d);

export const isValidPulseVolume = (v) => typeof v === "number" && v >= 0;

export const isValidPriceDecimals = (d) => Number.isInteger(d) && d >= 0 && d <= 18;

export const isValidPulseContractAddress = (a) => typeof a === "string" && a.includes(".");

/**
 * Validates an alert name against length constraints.
 * @param {*} n - Value to validate
 * @returns {boolean}
 */
export const isValidPulseAlertName = (n) => typeof n === 'string' && n.trim().length >= 1 && n.trim().length <= 64;

/**
 * Validates a webhook URL — must be a non-empty https:// URL within max length.
 * @param {*} url - Value to validate
 * @returns {boolean}
 */
export const isValidWebhookUrl = (url) =>
  typeof url === 'string' &&
  url.startsWith('https://') &&
  url.length <= 512;

/**
 * Validates an alert threshold — must be a finite non-negative number.
 * @param {*} t - Value to validate
 * @returns {boolean}
 */
export const isValidAlertThreshold = (t) => typeof t === 'number' && isFinite(t) && t >= 0;
