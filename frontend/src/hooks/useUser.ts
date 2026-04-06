'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '@/lib/env';
import logger from '@/lib/logger';

/**
 * Represents a registered StackPulse user with subscription and activity data.
 */
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

/**
 * Configuration options for the useUser hook.
 */
interface UseUserOptions {
  autoFetch?: boolean;
}

/**
 * Return type for the useUser hook.
 */
interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  register: (referrer?: string) => Promise<boolean>;
  upgrade: (tier: number, txId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useUser(address: string | null, options: UseUserOptions = {}): UseUserReturn {
  const { autoFetch = true } = options;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!address) {
      setUser(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl(`/api/users/${address}`));
      const data = await response.json();

      if (data.success) {
        setUser({
          ...data.user,
          registeredAt: new Date(data.user.registeredAt),
          expiresAt: data.user.expiresAt ? new Date(data.user.expiresAt) : undefined,
        });
      } else {
        setError(data.error || 'Failed to fetch user');
      }
    } catch (err) {
      setError('Network error');
      logger.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  const register = useCallback(async (referrer?: string): Promise<boolean> => {
    if (!address) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/users/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, referrer }),
      });

      const data = await response.json();

      if (data.success) {
        setUser({
          ...data.user,
          registeredAt: new Date(data.user.registeredAt),
        });
        return true;
      } else {
        setError(data.error || 'Registration failed');
        return false;
      }
    } catch (err) {
      setError('Network error');
      logger.error('Error registering user:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [address]);

  const upgrade = useCallback(async (tier: number, txId: string): Promise<boolean> => {
    if (!address) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl(`/api/users/${address}/upgrade`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, txId }),
      });

      const data = await response.json();

      if (data.success) {
        setUser({
          ...data.user,
          registeredAt: new Date(data.user.registeredAt),
          expiresAt: data.user.expiresAt ? new Date(data.user.expiresAt) : undefined,
        });
        return true;
      } else {
        setError(data.error || 'Upgrade failed');
        return false;
      }
    } catch (err) {
      setError('Network error');
      logger.error('Error upgrading user:', err);
      return false;
    } finally {
      setLoading(false);
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
