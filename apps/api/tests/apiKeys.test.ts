
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateApiKey } from '../src/apiKeys'; // Adjust import path if needed
import { Env, ApiTier } from '../src/types';

// Mock KV Namespace
const createMockKV = (data: Record<string, string> = {}) => ({
    get: vi.fn(async (key: string) => data[key] || null),
    put: vi.fn(async () => { }),
    delete: vi.fn(async () => { }),
    list: vi.fn(async () => ({ keys: [], list_complete: true, cursor: undefined })),
    getWithMetadata: vi.fn(),
});

describe('API Key Validation', () => {
    let env: Env;
    let mockApiKeysKV: any;
    let mockQuotaKV: any;

    beforeEach(() => {
        mockApiKeysKV = createMockKV({
            'key:starter-key': JSON.stringify({
                key: 'starter-key',
                tier: 'starter',
                quotaMonthly: 1000,
                usedThisMonth: 10,
                lastResetMonth: new Date().toISOString().slice(0, 7),
                issuedAt: new Date().toISOString(),
            }),
            'key:revoked-key': JSON.stringify({
                key: 'revoked-key',
                tier: 'growth',
                quotaMonthly: 10000,
                usedThisMonth: 0,
                lastResetMonth: new Date().toISOString().slice(0, 7),
                issuedAt: new Date().toISOString(),
                revoked: true,
            }),
            'key:empty-quota-key': JSON.stringify({
                key: 'empty-quota-key',
                tier: 'starter',
                quotaMonthly: 1000,
                usedThisMonth: 1000, // Fully used
                lastResetMonth: new Date().toISOString().slice(0, 7),
                issuedAt: new Date().toISOString(),
            }),
        });

        mockQuotaKV = createMockKV();

        env = {
            KV_API_KEYS: mockApiKeysKV,
            KV_QUOTA: mockQuotaKV,
            FREE_QUOTA_DAILY: '10',
        } as any;
    });

    describe('Free Tier', () => {
        it('should validate request without auth header as free tier', async () => {
            const req = new Request('http://localhost/api/validate', {
                headers: {
                    'CF-Connecting-IP': '127.0.0.1'
                }
            });

            const result = await validateApiKey(req, env);

            expect(result.valid).toBe(true);
            expect(result.tier).toBe('free');
            expect(result.remaining).toBe(9); // 10 - 1
            expect(mockQuotaKV.put).toHaveBeenCalled();
        });

        it('should rely on X-Forwarded-For if CF header missing', async () => {
            const req = new Request('http://localhost/api/validate', {
                headers: {
                    'X-Forwarded-For': '10.0.0.1'
                }
            });

            const result = await validateApiKey(req, env);

            expect(result.valid).toBe(true);
            expect(result.tier).toBe('free');
        });

        it('should block free tier when quota exceeded', async () => {
            // Mock existing quota
            mockQuotaKV.get.mockResolvedValue(JSON.stringify({
                uses: 10,
                lastReset: new Date().toISOString().split('T')[0],
                resetAt: new Date().toISOString()
            }));

            const req = new Request('http://localhost/api/validate', {
                headers: { 'CF-Connecting-IP': '127.0.0.1' }
            });

            const result = await validateApiKey(req, env);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('quota_exceeded');
            expect(result.upgradeUrl).toBeDefined();
        });
    });

    describe('Paid Tier', () => {
        it('should validate valid Bearer token', async () => {
            const req = new Request('http://localhost/api/validate', {
                headers: {
                    'Authorization': 'Bearer starter-key'
                }
            });

            const result = await validateApiKey(req, env);

            expect(result.valid).toBe(true);
            expect(result.tier).toBe('starter');
            expect(mockApiKeysKV.put).toHaveBeenCalled();
        });

        it('should reject invalid token format', async () => {
            const req = new Request('http://localhost/api/validate', {
                headers: {
                    'Authorization': 'Basic user:pass'
                }
            });

            const result = await validateApiKey(req, env);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('invalid_auth_header');
        });

        it('should reject non-existent key', async () => {
            const req = new Request('http://localhost/api/validate', {
                headers: {
                    'Authorization': 'Bearer unknown-key'
                }
            });

            const result = await validateApiKey(req, env);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('invalid_api_key');
        });

        it('should reject revoked key', async () => {
            const req = new Request('http://localhost/api/validate', {
                headers: {
                    'Authorization': 'Bearer revoked-key'
                }
            });

            const result = await validateApiKey(req, env);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('api_key_revoked');
        });

        it('should reject when monthly quota exceeded', async () => {
            const req = new Request('http://localhost/api/validate', {
                headers: {
                    'Authorization': 'Bearer empty-quota-key'
                }
            });

            const result = await validateApiKey(req, env);

            expect(result.valid).toBe(false);
            expect(result.error).toBe('quota_exceeded');
        });
    });
});
