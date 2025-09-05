import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface IBKRHealthStatus {
  status: 'connected' | 'disconnected' | 'error';
  message: string;
  timestamp: string;
  gateway: string;
  version: string;
  lastSync: string | null;
}

interface IBKRSyncResponse {
  status: 'success' | 'error';
  message: string;
  lastSync: string;
  timestamp: string;
}

export function useIBKRConnection() {
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: healthStatus, error, isLoading } = useQuery({
    queryKey: ['ibkr-health'],
    queryFn: async (): Promise<IBKRHealthStatus> => {
      const response = await fetch('/api/ibkr/health');
      if (!response.ok) {
        throw new Error('Failed to fetch IBKR health status');
      }
      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const syncMutation = useMutation({
    mutationFn: async (): Promise<IBKRSyncResponse> => {
      const response = await fetch('/api/ibkr/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'sync' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync IBKR data');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setLastSyncTime(data.lastSync);
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['ibkr-health'] });
    },
    onError: (error) => {
      console.error('IBKR sync failed:', error);
    },
  });

  const isConnected = healthStatus?.status === 'connected';
  const connectionStatus = healthStatus?.status || 'disconnected';
  const lastSync = lastSyncTime || healthStatus?.lastSync;

  const syncData = () => {
    syncMutation.mutate();
  };

  const getLastSyncText = () => {
    if (!lastSync) return 'Never synced';
    
    const syncDate = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - syncDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return {
    healthStatus,
    isConnected,
    connectionStatus,
    error,
    isLoading,
    lastSync,
    lastSyncText: getLastSyncText(),
    syncData,
    isSyncing: syncMutation.isPending,
    syncError: syncMutation.error,
  };
}
