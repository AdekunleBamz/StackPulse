/**
 * Default StackPulse server URL.
 * Falls back to the production Render deployment URL.
 */
const DEFAULT_SERVER_URL = 'https://stackpulse-b8fw.onrender.com';

/**
 * Removes trailing slashes from a URL string.
 */
const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');
const normalizeEnvValue = (value?: string): string => (typeof value === 'string' ? value.trim() : '');

/**
 * Converts an HTTP(S) URL to a WebSocket URL.
 * https:// -> wss://, http:// -> ws://
 */
function toWebSocketProtocol(url: string): string {
  return url.replace(/^https?:\/\//, (match) => (match === 'https://' ? 'wss://' : 'ws://'));
}

/**
 * The configured StackPulse server URL.
 * Can be overridden via NEXT_PUBLIC_SERVER_URL environment variable.
 */
const configuredServerUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SERVER_URL);
export const SERVER_URL = trimTrailingSlashes(configuredServerUrl || DEFAULT_SERVER_URL);

/**
 * The configured Clarity contract deployer address.
 * Can be overridden via NEXT_PUBLIC_DEPLOYER_ADDRESS environment variable.
 */
export const DEPLOYER_ADDRESS = normalizeEnvValue(process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS);

/**
 * The WebSocket server URL for real-time notifications.
 * Automatically derived from SERVER_URL if not explicitly configured.
 */
const configuredWsUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_WS_URL);
export const WS_URL =
  trimTrailingSlashes(configuredWsUrl || `${toWebSocketProtocol(SERVER_URL)}/ws`);

/**
 * Constructs a full API URL by combining SERVER_URL with a path.
 *
 * @param path - The API path (with or without leading slash).
 * @returns The complete API URL.
 */
export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SERVER_URL}${normalizedPath}`;
}
