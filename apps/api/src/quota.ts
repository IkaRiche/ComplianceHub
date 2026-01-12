import { Env, QuotaRecord } from './types.js';

/**
 * Generate a user ID from request (simplified for MVP - using IP)
 */
export function getUserId(request: Request): string {
  // In production, this would use authentication
  // For MVP, we use IP address + User-Agent hash
  const ip = request.headers.get('CF-Connecting-IP') || 
             request.headers.get('X-Forwarded-For') || 
             'unknown';
  const userAgent = request.headers.get('User-Agent') || '';
  
  // Simple hash for demo purposes
  return btoa(ip + userAgent.slice(0, 50)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}

/**
 * Check and update quota for user
 */
export async function checkQuota(userId: string, env: Env): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: string;
}> {
  const maxDaily = parseInt(env.FREE_QUOTA_DAILY || '100');
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Check if KV is available (может не быть на первом деплое)
  if (!env.KV_QUOTA) {
    console.warn('KV_QUOTA not available, allowing request');
    return {
      allowed: true,
      remaining: maxDaily - 1,
      resetAt: getNextResetDate(now).toISOString(),
    };
  }
  
  // Get current quota record
  const quotaKey = `quota:${userId}`;
  const quotaDataStr = await env.KV_QUOTA.get(quotaKey);
  
  let quotaRecord: QuotaRecord;
  
  if (!quotaDataStr) {
    // New user
    quotaRecord = {
      uses: 0,
      lastReset: today,
      resetAt: getNextResetDate(now).toISOString(),
    };
  } else {
    quotaRecord = JSON.parse(quotaDataStr);
    
    // Check if we need to reset daily quota
    if (quotaRecord.lastReset !== today) {
      quotaRecord.uses = 0;
      quotaRecord.lastReset = today;
      quotaRecord.resetAt = getNextResetDate(now).toISOString();
    }
  }
  
  const remaining = Math.max(0, maxDaily - quotaRecord.uses);
  const allowed = remaining > 0;
  
  if (allowed) {
    // Increment usage
    quotaRecord.uses += 1;
    await env.KV_QUOTA.put(quotaKey, JSON.stringify(quotaRecord), {
      expirationTtl: 86400 * 2, // 2 days TTL
    });
  }
  
  return {
    allowed,
    remaining: Math.max(0, remaining - (allowed ? 1 : 0)),
    resetAt: quotaRecord.resetAt,
  };
}

/**
 * Get quota info without consuming
 */
export async function getQuotaInfo(userId: string, env: Env): Promise<{
  used: number;
  remaining: number;
  resetAt: string;
}> {
  const maxDaily = parseInt(env.FREE_QUOTA_DAILY || '100');
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Check if KV is available
  if (!env.KV_QUOTA) {
    return {
      used: 0,
      remaining: maxDaily,
      resetAt: getNextResetDate(now).toISOString(),
    };
  }
  
  const quotaKey = `quota:${userId}`;
  const quotaDataStr = await env.KV_QUOTA.get(quotaKey);
  
  if (!quotaDataStr) {
    return {
      used: 0,
      remaining: maxDaily,
      resetAt: getNextResetDate(now).toISOString(),
    };
  }
  
  const quotaRecord: QuotaRecord = JSON.parse(quotaDataStr);
  
  // Reset if new day
  if (quotaRecord.lastReset !== today) {
    return {
      used: 0,
      remaining: maxDaily,
      resetAt: getNextResetDate(now).toISOString(),
    };
  }
  
  return {
    used: quotaRecord.uses,
    remaining: Math.max(0, maxDaily - quotaRecord.uses),
    resetAt: quotaRecord.resetAt,
  };
}

function getNextResetDate(now: Date): Date {
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow;
}