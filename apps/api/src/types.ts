// Cloudflare Workers environment bindings
export interface Env {
  // KV namespaces
  KV_QUOTA: KVNamespace;
  
  // Environment variables
  API_VERSION: string;
  MAX_FILE_SIZE: string;
  FREE_QUOTA_DAILY: string;
}

// Quota tracking
export interface QuotaRecord {
  uses: number;
  lastReset: string; // ISO date
  resetAt: string;   // ISO date for next reset
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    version: string;
    timestamp: string;
    quota?: {
      remaining: number;
      resetAt: string;
    };
  };
}

// Request validation schemas
export interface ValidateRequestBody {
  vida?: boolean;
}

export interface FlattenRequestBody {
  denormalized?: boolean;
  taxColumns?: boolean;
  format?: 'csv' | 'json';
}