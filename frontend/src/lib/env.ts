/**
 * Default StackPulse server URL.
 * Falls back to the production Render deployment URL.
 */
const DEFAULT_SERVER_URL = 'https://stackpulse-b8fw.onrender.com';

/**
 * Removes trailing slashes from a URL string.
 */
const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

/**
 * Converts an HTTP(S) URL to a WebSocket URL.
 * https:// -> wss://, http:// -> ws://
 */
function toWebSocketProtocol(url: string): string {
  return url.replace(/^https?:\/\//, (match) => (match === 'https://' ? 'wss://' : 'ws://'));
}

/**
 * Validates if a string is a properly formatted URL.
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const rawServerUrl = process.env.NEXT_PUBLIC_SERVER_URL || DEFAULT_SERVER_URL;

if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SERVER_URL) {
  console.warn(`[Env] NEXT_PUBLIC_SERVER_URL is not set. Falling back to default: ${DEFAULT_SERVER_URL}`);
}

if (!isValidUrl(rawServerUrl)) {
  console.error(`[Env] Invalid SERVER_URL configured: ${rawServerUrl}`);
}

/**
 * The configured StackPulse server URL.
 * Can be overridden via NEXT_PUBLIC_SERVER_URL environment variable.
 */
export const SERVER_URL = trimTrailingSlashes(rawServerUrl);

/**
 * The configured Clarity contract deployer address.
 * Can be overridden via NEXT_PUBLIC_DEPLOYER_ADDRESS environment variable.
 */
export const DEPLOYER_ADDRESS = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || '';

/**
 * The WebSocket server URL for real-time notifications.
 * Automatically derived from SERVER_URL if not explicitly configured.
 */
export const WS_URL =
  trimTrailingSlashes(process.env.NEXT_PUBLIC_WS_URL || `${toWebSocketProtocol(SERVER_URL)}/ws`);

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

/**
 * Constructs a versioned v1 API URL.
 *
 * @param path - The path after /api/v1 (with or without leading slash).
 * @returns The complete /api/v1 URL.
 */
export function apiV1Url(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SERVER_URL}/api/v1${normalizedPath}`;
}

/**
 * Default page size used across paginated API requests.
 */
export const DEFAULT_PAGINATION_LIMIT = 20;
