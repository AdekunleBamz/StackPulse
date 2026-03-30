const DEFAULT_SERVER_URL = 'https://stackpulse-b8fw.onrender.com';

function toWebSocketProtocol(url: string): string {
  return url.replace(/^https?:\/\//, (match) => (match === 'https://' ? 'wss://' : 'ws://'));
}

export const SERVER_URL = (process.env.NEXT_PUBLIC_SERVER_URL || DEFAULT_SERVER_URL).replace(/\/+$/, '');
export const DEPLOYER_ADDRESS = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || '';
export const WS_URL =
  (process.env.NEXT_PUBLIC_WS_URL || `${toWebSocketProtocol(SERVER_URL)}/ws`).replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SERVER_URL}${normalizedPath}`;
}
