interface ChatRequest {
  message: string;
  personality: string;
  gender: string;
  language: string;
}

interface ChatResponse {
  response: string;
  error?: string;
}

interface ApiServiceOptions {
  maxRetries?: number;
  timeout?: number;
  retryDelay?: number;
}

class ApiService {
  private maxRetries: number;
  private timeout: number;
  private retryDelay: number;

  constructor(options: ApiServiceOptions = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.timeout = options.timeout || 30000; // 30 seconds
    this.retryDelay = options.retryDelay || 1000; // 1 second
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.fetchWithTimeout('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          // Handle HTTP errors
          if (response.status >= 500) {
            // Server errors - retry
            throw new Error(`Server error: ${response.status}`);
          } else if (response.status >= 400) {
            // Client errors - don't retry
            const errorData = await response.json().catch(() => ({}));
            return {
              response: '',
              error: errorData.error || `Request failed with status ${response.status}`
            };
          }
        }

        const data = await response.json();
        return data;

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on abort (timeout) or client errors
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            return {
              response: '',
              error: 'Request timed out. Please try again.'
            };
          }
          
          // Don't retry on network errors if this is the last attempt
          if (attempt === this.maxRetries) {
            break;
          }
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    // All retries failed
    return {
      response: '',
      error: lastError?.message.includes('fetch') 
        ? 'Unable to connect to the server. Please check your internet connection and try again.'
        : lastError?.message || 'An unexpected error occurred. Please try again.'
    };
  }

  // Method to check connection status
  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout('/api/health', {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
