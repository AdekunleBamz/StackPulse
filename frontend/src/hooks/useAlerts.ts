'use client';

import { useState, useEffect, useCallback } from 'react';

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

interface CreateAlertInput {
  name: string;
  alertType: number;
  threshold?: number;
  targetAddress?: string;
  webhookUrl?: string;
}

interface UseAlertsReturn {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  fetchAlerts: () => Promise<void>;
  createAlert: (input: CreateAlertInput) => Promise<boolean>;
  updateAlert: (id: string, updates: Partial<Alert>) => Promise<boolean>;
  deleteAlert: (id: string) => Promise<boolean>;
  toggleAlert: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stackpulse-b8fw.onrender.com';
type AlertApiRecord = Omit<Alert, 'createdAt' | 'lastTriggered'> & {
  createdAt: string;
  lastTriggered?: string;
};

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
      const response = await fetch(`${SERVER_URL}/api/alerts?address=${address}`);
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
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  const createAlert = useCallback(async (input: CreateAlertInput): Promise<boolean> => {
    if (!address) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${SERVER_URL}/api/alerts?address=${address}`, {
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
      console.error('Error creating alert:', err);
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
      const response = await fetch(`${SERVER_URL}/api/alerts/${id}?address=${address}`, {
        method: 'PATCH',
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
      console.error('Error updating alert:', err);
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
      const response = await fetch(`${SERVER_URL}/api/alerts/${id}?address=${address}`, {
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
      console.error('Error deleting alert:', err);
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
      const response = await fetch(`${SERVER_URL}/api/alerts/${id}/toggle?address=${address}`, {
        method: 'POST',
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
      console.error('Error toggling alert:', err);
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

  return {
    alerts,
    loading,
    error,
    fetchAlerts,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
    refetch: fetchAlerts,
  };
}

export default useAlerts;
