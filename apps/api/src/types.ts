// Cloudflare Workers environment bindings
export interface Env {
  // KV namespaces
  KV_QUOTA: KVNamespace;
  KV_API_KEYS: KVNamespace;
  
  // Environment variables
  API_VERSION: string;
  MAX_FILE_SIZE: string;
  FREE_QUOTA_DAILY: string;
}

// API Key tiers
export type ApiTier = 'free' | 'starter' | 'growth' | 'scale';

// API Key record stored in KV
export interface ApiKeyRecord {
  key: string;
  tier: ApiTier;
  quotaMonthly: number;
  usedThisMonth: number;
  lastResetMonth: string; // YYYY-MM format
  issuedAt: string;
  revoked?: boolean;
  company?: string;
}

// Tier quota limits
export const TIER_QUOTAS: Record<ApiTier, number> = {
  free: 10,        // per day (IP-based)
  starter: 1000,   // per month
  growth: 10000,   // per month
  scale: 50000,    // per month
};

// Quota tracking (for free tier IP-based)
export interface QuotaRecord {
  uses: number;
  lastReset: string; // ISO date
  resetAt: string;   // ISO date for next reset
}

// API Key validation result
export interface ApiKeyValidation {
  valid: boolean;
  tier?: ApiTier;
  remaining?: number;
  error?: string;
  upgradeUrl?: string;
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

// Validate endpoint response
export interface ValidateResponse {
  vidaScore: number;
  status: 'ready' | 'needs_fixes' | 'not_compliant';
  errors: Array<{
    id: string;
    severity: string;
    path: string;
    message: string;
    hint?: string;
  }>;
  warnings: Array<{
    id: string;
    severity: string;
    path: string;
    message: string;
    hint?: string;
  }>;
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

// PDF Report metadata
export interface ReportMetadata {
  fileHash: string;
  timestamp: string;
  vidaScore: number;
  status: 'ready' | 'needs_fixes' | 'not_compliant';
}