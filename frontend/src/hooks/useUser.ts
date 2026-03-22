'use client';

import { useState, useEffect, useCallback } from 'react';

interface User {
  address: string;
  tier: number;
  tierName: string;
  alertCount: number;
  maxAlerts: number;
  totalAlertsTriggers: number;
  registeredAt: Date;
  expiresAt?: Date;
  referrer?: string;
  referralCount: number;
  badges: number[];
}

interface UseUserOptions {
  autoFetch?: boolean;
}

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  register: (referrer?: string) => Promise<boolean>;
  upgrade: (tier: number, txId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stackpulse-b8fw.onrender.com';

export function useUser(address: string | null, options: UseUserOptions = {}): UseUserReturn {
  const { autoFetch = true } = options;

  const [isRegistering, setIsRegistering] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const fetchUser = useCallback(async () => {
    if (!address) {
      setUser(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${SERVER_URL}/api/users/${address}`);
      const data = await response.json();
      const payload = data.user || data.data?.user;

      if (data.success && payload) {
        setUser({
          ...payload,
          registeredAt: new Date(payload.registeredAt),
          expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
        });
      } else {
        setError(data.error || 'Failed to fetch user profile');
      }
    } catch (err: any) {
      setError('Connection refused while fetching user');
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  const register = useCallback(async (referrer?: string): Promise<boolean> => {
    if (!address) return false;

    setIsRegistering(true);
    setError(null);

    try {
      const response = await fetch(`${SERVER_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, referrer }),
      });

      const data = await response.json();
      const payload = data.user || data.data?.user;

      if (data.success && payload) {
        setUser({
          ...payload,
          registeredAt: new Date(payload.registeredAt),
        });
        return true;
      } else {
        setError(data.error || 'Registration failed');
        return false;
      }
    } catch (err) {
      setError('Network error during registration');
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [address]);

  const upgrade = useCallback(async (tier: number, txId: string): Promise<boolean> => {
    if (!address) return false;

    setIsUpgrading(true);
    setError(null);

    try {
      const response = await fetch(`${SERVER_URL}/api/users/${address}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, txId }),
      });

      const data = await response.json();
      const payload = data.user || data.data?.user;

      if (data.success && payload) {
        setUser({
          ...payload,
          registeredAt: new Date(payload.registeredAt),
          expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
        });
        return true;
      } else {
        setError(data.error || 'Tier upgrade failed');
        return false;
      }
    } catch (err) {
      setError('Network error during upgrade');
      return false;
    } finally {
      setIsUpgrading(false);
    }
  }, [address]);

  // Auto-fetch on mount and when address changes
  useEffect(() => {
    if (autoFetch && address) {
      fetchUser();
    }
  }, [address, autoFetch, fetchUser]);

  return {
    user,
    loading,
    error,
    fetchUser,
    register,
    upgrade,
    refetch: fetchUser,
  };
}

export default useUser;
