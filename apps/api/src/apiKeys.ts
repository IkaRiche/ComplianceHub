import { Env, ApiKeyRecord, ApiTier, ApiKeyValidation, TIER_QUOTAS, QuotaRecord } from './types.js';

// Production domain
const UPGRADE_URL = 'https://vida.bauklar.com/pricing';

/**
 * Validate API key and check quota
 * Returns validation result with tier info and remaining quota
 */
export async function validateApiKey(
    request: Request,
    env: Env,
    consumeQuota = true
): Promise<ApiKeyValidation> {
    const authHeader = request.headers.get('Authorization');

    // If no auth header, use IP-based free tier
    if (!authHeader) {
        return await checkFreeTierQuota(request, env, consumeQuota);
    }

    // Extract Bearer token
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        return {
            valid: false,
            error: 'invalid_auth_header',
            upgradeUrl: UPGRADE_URL,
        };
    }

    const apiKey = match[1].trim();

    // Check if KV is available
    if (!env.KV_API_KEYS) {
        console.warn('KV_API_KEYS not available');
        return {
            valid: false,
            error: 'service_unavailable',
        };
    }

    // Lookup key in KV
    const keyRecordStr = await env.KV_API_KEYS.get(`key:${apiKey}`);

    if (!keyRecordStr) {
        return {
            valid: false,
            error: 'invalid_api_key',
            upgradeUrl: UPGRADE_URL,
        };
    }

    let keyRecord: ApiKeyRecord;
    try {
        keyRecord = JSON.parse(keyRecordStr);
    } catch {
        return {
            valid: false,
            error: 'corrupted_api_key',
        };
    }

    // Check if revoked
    if (keyRecord.revoked) {
        return {
            valid: false,
            error: 'api_key_revoked',
            upgradeUrl: UPGRADE_URL,
        };
    }

    // Check and reset monthly quota
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    if (keyRecord.lastResetMonth !== currentMonth) {
        keyRecord.usedThisMonth = 0;
        keyRecord.lastResetMonth = currentMonth;
    }

    const monthlyQuota = keyRecord.quotaMonthly || TIER_QUOTAS[keyRecord.tier];
    const remaining = monthlyQuota - keyRecord.usedThisMonth;

    // Check quota exceeded
    if (remaining <= 0) {
        return {
            valid: false,
            tier: keyRecord.tier,
            remaining: 0,
            error: 'quota_exceeded',
            upgradeUrl: UPGRADE_URL,
        };
    }

    // Consume quota if requested
    if (consumeQuota) {
        keyRecord.usedThisMonth++;
        await env.KV_API_KEYS.put(
            `key:${apiKey}`,
            JSON.stringify(keyRecord),
            { expirationTtl: 86400 * 60 } // 60 days TTL
        );
    }

    return {
        valid: true,
        tier: keyRecord.tier,
        remaining: remaining - (consumeQuota ? 1 : 0),
    };
}

/**
 * Check free tier quota (IP-based, 10/day limit)
 */
async function checkFreeTierQuota(
    request: Request,
    env: Env,
    consumeQuota: boolean
): Promise<ApiKeyValidation> {
    const maxDaily = parseInt(env.FREE_QUOTA_DAILY || '10');
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Generate user ID from IP
    const ip = request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
        'unknown';
    const userId = `free:${btoa(ip).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`;

    // Check if KV is available
    if (!env.KV_QUOTA) {
        console.warn('KV_QUOTA not available, allowing request');
        return {
            valid: true,
            tier: 'free',
            remaining: maxDaily - 1,
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

    // Check quota exceeded
    if (remaining <= 0) {
        return {
            valid: false,
            tier: 'free',
            remaining: 0,
            error: 'quota_exceeded',
            upgradeUrl: UPGRADE_URL,
        };
    }

    // Consume quota if requested
    if (consumeQuota) {
        quotaRecord.uses += 1;
        await env.KV_QUOTA.put(quotaKey, JSON.stringify(quotaRecord), {
            expirationTtl: 86400 * 2, // 2 days TTL
        });
    }

    return {
        valid: true,
        tier: 'free',
        remaining: remaining - (consumeQuota ? 1 : 0),
    };
}

/**
 * Check if tier has access to a paid feature
 */
export function tierHasAccess(tier: ApiTier | undefined, feature: 'flatten' | 'report'): boolean {
    if (!tier || tier === 'free') {
        return false;
    }
    // All paid tiers have access to all features
    return true;
}

/**
 * Get next reset date (midnight UTC tomorrow)
 */
function getNextResetDate(now: Date): Date {
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
}

/**
 * Create a new API key (admin function)
 */
export async function createApiKey(
    env: Env,
    tier: ApiTier,
    company?: string,
    customQuota?: number
): Promise<string> {
    // Generate random key
    const keyBytes = new Uint8Array(24);
    crypto.getRandomValues(keyBytes);
    const key = `sk_${tier}_${Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;

    const record: ApiKeyRecord = {
        key,
        tier,
        quotaMonthly: customQuota || TIER_QUOTAS[tier],
        usedThisMonth: 0,
        lastResetMonth: new Date().toISOString().slice(0, 7),
        issuedAt: new Date().toISOString(),
        company,
    };

    await env.KV_API_KEYS.put(`key:${key}`, JSON.stringify(record), {
        expirationTtl: 86400 * 365, // 1 year TTL
    });

    return key;
}
