// API Service with comprehensive error handling and retry logic

export interface ChatRequest {
  message: string;
  personality: string;
  gender: string;
  language: string;
}

export interface ChatResponse {
  response: string;
  fallback?: string;
}

export interface ApiError {
  type: 'network' | 'server' | 'client' | 'timeout' | 'rate_limit' | 'auth' | 'unknown';
  message: string;
  statusCode?: number;
  retryable: boolean;
  retryAfter?: number;
}

export interface ConnectionStatus {
  isOnline: boolean;
  lastChecked: Date;
  responseTime?: number;
}

class ApiService {
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private connectionStatus: ConnectionStatus;
  private requestQueue: Map<string, Promise<unknown>>;
  private circuitBreakerFailures: number;
  private circuitBreakerLastFailure: Date | null;
  private readonly circuitBreakerThreshold = 5;
  private readonly circuitBreakerResetTime = 60000; // 1 minute

  constructor() {
    this.baseUrl = '/api';
    this.timeout = 30000; // 30 seconds
    this.maxRetries = 3;
    this.retryDelay = 1000; // Start with 1 second
    this.connectionStatus = {
      isOnline: navigator.onLine,
      lastChecked: new Date()
    };
    this.requestQueue = new Map();
    this.circuitBreakerFailures = 0;
    this.circuitBreakerLastFailure = null;

    // Monitor online/offline status
    this.setupConnectionMonitoring();
  }

  private setupConnectionMonitoring(): void {
    window.addEventListener('online', () => {
      this.connectionStatus.isOnline = true;
      this.connectionStatus.lastChecked = new Date();
      console.log('Connection restored');
    });

    window.addEventListener('offline', () => {
      this.connectionStatus.isOnline = false;
      this.connectionStatus.lastChecked = new Date();
      console.log('Connection lost');
    });
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<T> {
    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      throw this.createApiError('server', 'Service temporarily unavailable', 503, false);
    }

    // Check if we're offline
    if (!this.connectionStatus.isOnline) {
      throw this.createApiError('network', 'No internet connection', undefined, true);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const startTime = Date.now();
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      
      // Update connection status with response time
      this.connectionStatus.responseTime = Date.now() - startTime;
      this.connectionStatus.lastChecked = new Date();

      // Reset circuit breaker on success
      this.circuitBreakerFailures = 0;
      this.circuitBreakerLastFailure = null;

      if (!response.ok) {
        throw await this.handleHttpError(response);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createApiError('timeout', 'Request timed out', undefined, true);
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw this.createApiError('network', 'Network connection failed', undefined, true);
      }

      // If it's already an ApiError, re-throw it
      if (this.isApiError(error)) {
        this.recordFailure();
        
        // Retry logic
        if (error.retryable && retryCount < this.maxRetries) {
          const delay = this.calculateRetryDelay(retryCount);
          console.log(`Retrying request in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
          
          await this.sleep(delay);
          return this.makeRequest<T>(url, options, retryCount + 1);
        }
        
        throw error;
      }

      // Unknown error
      this.recordFailure();
      throw this.createApiError('unknown', 'An unexpected error occurred', undefined, false);
    }
  }

  private async handleHttpError(response: Response): Promise<ApiError> {
    const statusCode = response.status;
    let message = `HTTP ${statusCode}`;

    try {
      const errorData = await response.json();
      message = errorData.error || errorData.message || message;
    } catch {
      message = response.statusText || message;
    }

    // Classify error types
    if (statusCode >= 500) {
      return this.createApiError('server', message, statusCode, true);
    } else if (statusCode === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      return this.createApiError('rate_limit', 'Too many requests', statusCode, true, retryAfter * 1000);
    } else if (statusCode === 401 || statusCode === 403) {
      return this.createApiError('auth', 'Authentication failed', statusCode, false);
    } else if (statusCode >= 400) {
      return this.createApiError('client', message, statusCode, false);
    }

    return this.createApiError('unknown', message, statusCode, false);
  }

  private createApiError(
    type: ApiError['type'],
    message: string,
    statusCode?: number,
    retryable: boolean = false,
    retryAfter?: number
  ): ApiError {
    return {
      type,
      message,
      statusCode,
      retryable,
      retryAfter
    };
  }

  private isApiError(error: unknown): error is ApiError {
    return error && typeof error === 'object' && 'type' in error && 'retryable' in error;
  }

  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.retryDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.1 * baseDelay;
    return Math.min(baseDelay + jitter, 30000); // Max 30 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private recordFailure(): void {
    this.circuitBreakerFailures++;
    this.circuitBreakerLastFailure = new Date();
  }

  private isCircuitBreakerOpen(): boolean {
    if (this.circuitBreakerFailures < this.circuitBreakerThreshold) {
      return false;
    }

    if (!this.circuitBreakerLastFailure) {
      return false;
    }

    const timeSinceLastFailure = Date.now() - this.circuitBreakerLastFailure.getTime();
    if (timeSinceLastFailure > this.circuitBreakerResetTime) {
      // Reset circuit breaker
      this.circuitBreakerFailures = 0;
      this.circuitBreakerLastFailure = null;
      return false;
    }

    return true;
  }

  // Request deduplication
  private getRequestKey(url: string, options: RequestInit): string {
    return `${url}_${JSON.stringify(options.body || {})}`;
  }

  // Public API methods
  public async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const url = `${this.baseUrl}/chat`;
    const requestKey = this.getRequestKey(url, { body: JSON.stringify(request) });

    // Check if same request is already in progress
    if (this.requestQueue.has(requestKey)) {
      console.log('Deduplicating request');
      return this.requestQueue.get(requestKey)!;
    }

    const requestPromise = this.makeRequest<ChatResponse>(url, {
      method: 'POST',
      body: JSON.stringify(request),
    });

    // Store in queue
    this.requestQueue.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Remove from queue when done
      this.requestQueue.delete(requestKey);
    }
  }

  public getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout for health check
      });
      
      this.connectionStatus.responseTime = Date.now() - startTime;
      this.connectionStatus.isOnline = response.ok;
      this.connectionStatus.lastChecked = new Date();
      
      return response.ok;
    } catch {
      this.connectionStatus.isOnline = false;
      this.connectionStatus.lastChecked = new Date();
      return false;
    }
  }

  public clearRequestQueue(): void {
    this.requestQueue.clear();
  }

  public getMetrics() {
    return {
      circuitBreakerFailures: this.circuitBreakerFailures,
      isCircuitBreakerOpen: this.isCircuitBreakerOpen(),
      queueSize: this.requestQueue.size,
      connectionStatus: this.getConnectionStatus()
    };
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
