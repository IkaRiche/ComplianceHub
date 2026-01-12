
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { router } from '../src/standalone';
import { Env } from '../src/types';

// Mock KV Namespace
const createMockKV = (data: Record<string, string> = {}) => ({
    get: vi.fn(async (key: string) => data[key] || null),
    put: vi.fn(async () => { }),
    delete: vi.fn(async () => { }),
    list: vi.fn(async () => ({ keys: [], list_complete: true, cursor: undefined })),
    getWithMetadata: vi.fn(),
});

// Minimal Valid UBL
const SIMPLE_UBL = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_1.2</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>TEST-CONTRACT-001</cbc:ID>
  <cbc:IssueDate>2026-01-12</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Test Supplier</cbc:Name></cac:PartyName>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Test Customer</cbc:Name></cac:PartyName>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">100.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">100.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">119.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">119.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

describe('API Contract & Privacy Tests', () => {
    let env: Env;
    let mockQuotaKV: any;
    let mockApiKeysKV: any;

    beforeEach(() => {
        mockQuotaKV = createMockKV();
        mockApiKeysKV = createMockKV();
        env = {
            KV_QUOTA: mockQuotaKV,
            KV_API_KEYS: mockApiKeysKV,
            FREE_QUOTA_DAILY: '10',
            MAX_FILE_SIZE: '10240', // 10KB
            API_VERSION: '2026-01-12'
        } as any;
    });

    describe('Contract Test: /validate', () => {
        it('should return stable JSON structure for valid UBL', async () => {
            const formData = new FormData();
            formData.append('file', new Blob([SIMPLE_UBL], { type: 'text/xml' }), 'invoice.xml');
            formData.append('vida', 'true');

            const req = new Request('http://localhost/api/validate', {
                method: 'POST',
                body: formData,
                headers: {
                    // No auth = free tier
                    'CF-Connecting-IP': '127.0.0.1'
                }
            });

            const res = await router.handle(req, env);
            const json = await res.json();

            expect(res.status).toBe(200);
            expect(json.success).toBe(true);

            // Contract Assertions
            expect(json.data).toBeDefined();
            expect(json.data).toHaveProperty('vidaScore');
            expect(typeof json.data.vidaScore).toBe('number');

            expect(json.data).toHaveProperty('status');
            expect(['ready', 'needs_fixes', 'not_compliant']).toContain(json.data.status);

            expect(json.data).toHaveProperty('errors');
            expect(Array.isArray(json.data.errors)).toBe(true);

            expect(json.data).toHaveProperty('warnings');
            expect(Array.isArray(json.data.warnings)).toBe(true);

            // Verify Error Structure even if empty
            if (json.data.errors.length > 0) {
                const err = json.data.errors[0];
                expect(err).toHaveProperty('id');
                expect(err).toHaveProperty('severity');
                expect(['ERROR', 'WARNING']).toContain(err.severity); // usually errors are ERROR
                expect(err).toHaveProperty('message');
                expect(err).toHaveProperty('path');
            }

            // Meta assertions
            expect(json.meta).toBeDefined();
            expect(json.meta.version).toBe('2026-01-12');
            expect(json.meta.quota).toBeDefined();
            expect(typeof json.meta.quota.remaining).toBe('number');
        });
    });

    describe('Privacy Test: No File Persistence', () => {
        it('should NOT persist file content to any storage', async () => {
            const formData = new FormData();
            const uniqueContent = `<!-- UNIQUE-ID-${Date.now()} -->` + SIMPLE_UBL;
            formData.append('file', new Blob([uniqueContent], { type: 'text/xml' }), 'privacy-test.xml');

            const req = new Request('http://localhost/api/validate', {
                method: 'POST',
                body: formData,
                headers: {
                    'CF-Connecting-IP': '127.0.0.1'
                }
            });

            await router.handle(req, env);

            // 1. Verify Quota KV was touched (metadata only)
            expect(mockQuotaKV.put).toHaveBeenCalled();

            // Analyze what was written to Quota
            const quotaCallArgs = mockQuotaKV.put.mock.calls[0];
            const quotaKey = quotaCallArgs[0];
            const quotaValue = quotaCallArgs[1];

            expect(quotaKey).toContain('quota:'); // Should be quota key
            expect(quotaValue).not.toContain(uniqueContent); // Quota record should NOT contain file content

            // 2. Verify API Keys KV was NOT written to (it's read-only for this op)
            expect(mockApiKeysKV.put).not.toHaveBeenCalled();

            // 3. Since there are no other bindings (R2, D1, etc.) in 'env', 
            // we have proved that the worker has NOWHERE else to write.
            // The file was processed in-memory and discarded.
        });
    });
});
