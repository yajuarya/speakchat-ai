'use client';

import { useState, useEffect } from 'react';
import { apiService, ConnectionStatus as IConnectionStatus } from '@/services/apiService';

interface ConnectionStatusProps {
  className?: string;
}

export default function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const [status, setStatus] = useState<IConnectionStatus>({
    isOnline: true,
    lastChecked: new Date()
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Initial status
    setStatus(apiService.getConnectionStatus());

    // Update status periodically
    const interval = setInterval(() => {
      const currentStatus = apiService.getConnectionStatus();
      setStatus(currentStatus);
      
      // Show status indicator when offline or slow connection
      const shouldShow = !currentStatus.isOnline || 
                        (currentStatus.responseTime && currentStatus.responseTime > 5000);
      setIsVisible(shouldShow);
    }, 1000);

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus(apiService.getConnectionStatus());
      setIsVisible(false);
      
      // Hide after 3 seconds when back online
      setTimeout(() => setIsVisible(false), 3000);
    };

    const handleOffline = () => {
      setStatus(apiService.getConnectionStatus());
      setIsVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isVisible && status.isOnline) {
    return null;
  }

  const getStatusColor = () => {
    if (!status.isOnline) return 'bg-red-500';
    if (status.responseTime && status.responseTime > 5000) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!status.isOnline) return 'Offline';
    if (status.responseTime && status.responseTime > 5000) return 'Slow connection';
    return 'Connected';
  };

  const getStatusIcon = () => {
    if (!status.isOnline) return '🔴';
    if (status.responseTime && status.responseTime > 5000) return '🟡';
    return '🟢';
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className={`
        flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg
        ${getStatusColor()} bg-opacity-90 text-white text-sm font-medium
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}>
        <span className="text-xs">{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
        {status.responseTime && (
          <span className="text-xs opacity-75">
            ({Math.round(status.responseTime)}ms)
          </span>
        )}
      </div>
    </div>
  );
}
