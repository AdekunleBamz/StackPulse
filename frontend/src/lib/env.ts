const DEFAULT_SERVER_URL = 'https://stackpulse-b8fw.onrender.com';

export const SERVER_URL = (process.env.NEXT_PUBLIC_SERVER_URL || DEFAULT_SERVER_URL).replace(/\/+$/, '');
export const DEPLOYER_ADDRESS = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS || '';

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SERVER_URL}${normalizedPath}`;
}
