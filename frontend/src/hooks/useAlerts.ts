'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiUrl } from '@/lib/env';
import logger from '@/lib/logger';

/**
 * Represents a user-configured blockchain event alert.
 */
interface Alert {
  id: string;
  name: string;
  alertType: number;
  threshold?: number;
  targetAddress?: string;
  webhookUrl?: string;
  enabled: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

/**
 * Input data for creating a new alert.
 */
interface CreateAlertInput {
  name: string;
  alertType: number;
  threshold?: number;
  targetAddress?: string;
  webhookUrl?: string;
}

/**
 * Return type for the useAlerts hook.
 */
interface UseAlertsReturn {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  /** Total number of alerts. */
  alertCount: number;
  /** True when the user has at least one alert. */
  hasAlerts: boolean;
  /** Alerts that are currently enabled. */
  activeAlerts: Alert[];
  /** Number of enabled alerts. */
  enabledCount: number;
  fetchAlerts: () => Promise<void>;
  createAlert: (input: CreateAlertInput) => Promise<boolean>;
  updateAlert: (id: string, updates: Partial<Alert>) => Promise<boolean>;
  deleteAlert: (id: string) => Promise<boolean>;
  toggleAlert: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

/**
 * API response record with string dates (before normalization).
 */
type AlertApiRecord = Omit<Alert, 'createdAt' | 'lastTriggered'> & {
  createdAt: string;
  lastTriggered?: string;
};

/**
 * Custom hook for managing a user's blockchain alerts.
 * Provides methods for fetching, creating, updating, and deleting alerts.
 *
 * @param address - The Stacks wallet address of the user.
 * @returns Hook state and alert management functions.
 */
export function useAlerts(address: string | null): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!address) {
      setAlerts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl(`/api/v1/users/${address}/alerts`));
      const data = await response.json();

      if (data.success) {
        const rawAlerts = (data.alerts as AlertApiRecord[]) || [];
        setAlerts(
          rawAlerts.map((alert) => ({
            ...alert,
            createdAt: new Date(alert.createdAt),
            lastTriggered: alert.lastTriggered ? new Date(alert.lastTriggered) : undefined,
          }))
        );
      } else {
        setError(data.error || 'Failed to fetch alerts');
      }
    } catch (err) {
      setError('Network error');
      logger.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  const createAlert = useCallback(async (input: CreateAlertInput): Promise<boolean> => {
    if (!address) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl(`/api/v1/users/${address}/alerts`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (data.success) {
        // Add new alert to list
        setAlerts(prev => [
          {
            ...data.alert,
            createdAt: new Date(data.alert.createdAt),
          },
          ...prev,
        ]);
        return true;
      } else {
        setError(data.error || 'Failed to create alert');
        return false;
      }
    } catch (err) {
      setError('Network error');
      logger.error('Error creating alert:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [address]);

  const updateAlert = useCallback(async (id: string, updates: Partial<Alert>): Promise<boolean> => {
    if (!address) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl(`/api/v1/users/${address}/alerts/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        setAlerts(prev =>
          prev.map(alert =>
            alert.id === id
              ? {
                  ...data.alert,
                  createdAt: new Date(data.alert.createdAt),
                  lastTriggered: data.alert.lastTriggered
                    ? new Date(data.alert.lastTriggered)
                    : undefined,
                }
              : alert
          )
        );
        return true;
      } else {
        setError(data.error || 'Failed to update alert');
        return false;
      }
    } catch (err) {
      setError('Network error');
      logger.error('Error updating alert:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [address]);

  const deleteAlert = useCallback(async (id: string): Promise<boolean> => {
    if (!address) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl(`/api/v1/users/${address}/alerts/${id}`), {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
        return true;
      } else {
        setError(data.error || 'Failed to delete alert');
        return false;
      }
    } catch (err) {
      setError('Network error');
      logger.error('Error deleting alert:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [address]);

  const toggleAlert = useCallback(async (id: string): Promise<boolean> => {
    if (!address) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl(`/api/v1/users/${address}/alerts/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      });

      const data = await response.json();

      if (data.success) {
        setAlerts(prev =>
          prev.map(alert =>
            alert.id === id
              ? {
                  ...data.alert,
                  createdAt: new Date(data.alert.createdAt),
                  lastTriggered: data.alert.lastTriggered
                    ? new Date(data.alert.lastTriggered)
                    : undefined,
                }
              : alert
          )
        );
        return true;
      } else {
        setError(data.error || 'Failed to toggle alert');
        return false;
      }
    } catch (err) {
      setError('Network error');
      logger.error('Error toggling alert:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Auto-fetch on mount and when address changes
  useEffect(() => {
    if (address) {
      fetchAlerts();
    }
  }, [address, fetchAlerts]);

  const activeAlerts = useMemo(() => alerts.filter(a => a.enabled), [alerts]);
  const enabledCount = activeAlerts.length;

  return {
    alerts,
    loading,
    error,
    alertCount: alerts.length,
    hasAlerts: alerts.length > 0,
    activeAlerts,
    enabledCount,
    fetchAlerts,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
    refetch: fetchAlerts,
  };
}

export default useAlerts;
