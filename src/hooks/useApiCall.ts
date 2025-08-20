'use client';

import { useState, useCallback } from 'react';
import { apiService, ApiError, ChatRequest, ChatResponse } from '@/services/apiService';

export interface ApiCallState {
  isLoading: boolean;
  error: ApiError | null;
  retryCount: number;
  isRetrying: boolean;
}

export interface UseApiCallReturn {
  state: ApiCallState;
  sendMessage: (request: ChatRequest) => Promise<ChatResponse | null>;
  retry: () => Promise<ChatResponse | null>;
  clearError: () => void;
  getErrorMessage: () => string;
  canRetry: () => boolean;
}

export function useApiCall(): UseApiCallReturn {
  const [state, setState] = useState<ApiCallState>({
    isLoading: false,
    error: null,
    retryCount: 0,
    isRetrying: false
  });

  const [lastRequest, setLastRequest] = useState<ChatRequest | null>(null);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const sendMessage = useCallback(async (request: ChatRequest): Promise<ChatResponse | null> => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      retryCount: 0,
      isRetrying: false 
    }));
    
    setLastRequest(request);

    try {
      const response = await apiService.sendChatMessage(request);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: null 
      }));
      
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: apiError,
        retryCount: prev.retryCount + 1
      }));
      
      return null;
    }
  }, []);

  const retry = useCallback(async (): Promise<ChatResponse | null> => {
    if (!lastRequest || !state.error?.retryable) {
      return null;
    }

    setState(prev => ({ 
      ...prev, 
      isRetrying: true, 
      error: null 
    }));

    try {
      // Add delay for rate limiting
      if (state.error.type === 'rate_limit' && state.error.retryAfter) {
        await new Promise(resolve => setTimeout(resolve, state.error!.retryAfter));
      }

      const response = await apiService.sendChatMessage(lastRequest);
      
      setState(prev => ({ 
        ...prev, 
        isRetrying: false, 
        error: null 
      }));
      
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      
      setState(prev => ({ 
        ...prev, 
        isRetrying: false, 
        error: apiError,
        retryCount: prev.retryCount + 1
      }));
      
      return null;
    }
  }, [lastRequest, state.error]);

  const getErrorMessage = useCallback((): string => {
    if (!state.error) return '';

    const baseMessage = state.error.message;
    
    switch (state.error.type) {
      case 'network':
        return `${baseMessage} Please check your internet connection.`;
      case 'timeout':
        return `${baseMessage} The request is taking longer than expected.`;
      case 'rate_limit':
        const waitTime = state.error.retryAfter ? Math.ceil(state.error.retryAfter / 1000) : 60;
        return `${baseMessage} Please wait ${waitTime} seconds before trying again.`;
      case 'server':
        return `${baseMessage} Our servers are experiencing issues. Please try again.`;
      case 'auth':
        return `${baseMessage} There's an authentication issue. Please refresh the page.`;
      case 'client':
        return `${baseMessage} Please check your input and try again.`;
      default:
        return baseMessage;
    }
  }, [state.error]);

  const canRetry = useCallback((): boolean => {
    return !!(state.error?.retryable && lastRequest && state.retryCount < 3);
  }, [state.error, lastRequest, state.retryCount]);

  return {
    state,
    sendMessage,
    retry,
    clearError,
    getErrorMessage,
    canRetry
  };
}

// Additional hook for connection monitoring
export function useConnectionMonitor() {
  const [connectionStatus, setConnectionStatus] = useState(apiService.getConnectionStatus());
  const [metrics, setMetrics] = useState(apiService.getMetrics());

  const updateStatus = useCallback(() => {
    setConnectionStatus(apiService.getConnectionStatus());
    setMetrics(apiService.getMetrics());
  }, []);

  const checkHealth = useCallback(async () => {
    const isHealthy = await apiService.checkHealth();
    updateStatus();
    return isHealthy;
  }, [updateStatus]);

  return {
    connectionStatus,
    metrics,
    updateStatus,
    checkHealth
  };
}
