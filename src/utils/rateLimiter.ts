interface RateLimitEntry {
  count: number;
  resetTime: number;
  burstCount: number;
  burstResetTime: number;
}

interface RateLimitConfig {
  perMinute: number;
  perHour: number;
  burstLimit: number;
  burstWindow: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now && entry.burstResetTime < now) {
        this.store.delete(key);
      }
    }
  }

  private getKey(ip: string, endpoint: string): string {
    return `${ip}:${endpoint}`;
  }

  public checkRateLimit(ip: string, endpoint: string, config: RateLimitConfig): {
    allowed: boolean;
    error?: string;
    resetTime?: number;
    remaining?: number;
  } {
    const key = this.getKey(ip, endpoint);
    const now = Date.now();
    
    let entry = this.store.get(key);
    
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + 60 * 1000, // 1 minute
        burstCount: 0,
        burstResetTime: now + config.burstWindow
      };
      this.store.set(key, entry);
    }

    // Reset counters if time windows have passed
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + 60 * 1000;
    }

    if (now >= entry.burstResetTime) {
      entry.burstCount = 0;
      entry.burstResetTime = now + config.burstWindow;
    }

    // Check burst limit first
    if (entry.burstCount >= config.burstLimit) {
      return {
        allowed: false,
        error: "Slow down a bit! Please wait a few seconds before your next message.",
        resetTime: entry.burstResetTime,
        remaining: 0
      };
    }

    // Check per-minute limit
    if (entry.count >= config.perMinute) {
      return {
        allowed: false,
        error: "You're chatting quite actively! Please wait a moment before sending another message.",
        resetTime: entry.resetTime,
        remaining: 0
      };
    }

    // Increment counters
    entry.count++;
    entry.burstCount++;
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: config.perMinute - entry.count,
      resetTime: entry.resetTime
    };
  }

  public getRemainingRequests(ip: string, endpoint: string): number {
    const key = this.getKey(ip, endpoint);
    const entry = this.store.get(key);
    
    if (!entry) return 30; // Default limit
    
    const now = Date.now();
    if (now >= entry.resetTime) return 30;
    
    return Math.max(0, 30 - entry.count);
  }

  public destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Rate limit configurations
export const RATE_LIMITS = {
  chat: {
    perMinute: 30,
    perHour: 100,
    burstLimit: 5,
    burstWindow: 10000 // 10 seconds
  },
  health: {
    perMinute: 60,
    perHour: 200,
    burstLimit: 10,
    burstWindow: 5000 // 5 seconds
  }
};

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // Fallback for development
  return '127.0.0.1';
}
