
const fs = require('fs');
const path = require('path');

const API_Base = 'https://compliancehub-api.heizungsrechner.workers.dev';
const TEST_FILE = path.join(__dirname, '../tests/fixtures/ubl-clean.xml');

// Minimal valid UBL for verification
const SIMPLE_UBL = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_1.2</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>TEST-VERIFY-001</cbc:ID>
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

async function run() {
    console.log(`🔍 Verifying Production API: ${API_Base}\n`);

    // 1. Check Health (NOTE: Production uses standalone.ts with base='/api')
    console.log('1. Checking Health...');
    try {
        const res = await fetch(`${API_Base}/api/health`);
        const text = await res.text();

        let data;
        try { data = JSON.parse(text); } catch { console.error('Received non-JSON:', text.slice(0, 200)); }

        if (res.ok && data?.data?.status === 'healthy') {
            console.log('✅ Health check passed');
        } else {
            console.error('❌ Health check failed:', res.status, data);
            process.exit(1);
        }
    } catch (e) {
        console.error('❌ Network error:', e.message);
        process.exit(1);
    }

    // 2. Test /api/validate (Free Tier)
    console.log('\n2. Testing /api/validate (Free Tier)...');
    try {
        const formData = new FormData();
        const blob = new Blob([SIMPLE_UBL], { type: 'text/xml' });
        formData.append('file', blob, 'test.xml');
        formData.append('vida', 'true');

        const res = await fetch(`${API_Base}/api/validate`, {
            method: 'POST',
            body: formData,
        });

        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { console.error('Received non-JSON:', text.slice(0, 200)); }

        if (res.ok && data?.data?.status) {
            console.log(`✅ Validation successful. Status: ${data.data.status}, Score: ${data.data.vidaScore}`);
            console.log(`   Remaining Quota: ${data.meta?.quota?.remaining}`);
        } else {
            if (data?.error === 'quota_exceeded') {
                console.warn('⚠️ Quota exceeded (expected if run multiple times)');
            } else {
                console.error('❌ Validation failed:', res.status, data);
            }
        }
    } catch (e) {
        console.error('❌ API Error:', e.message);
    }

    // 3. Test /api/flatten (Paywall Check)
    console.log('\n3. Testing /api/flatten (Expect 403)...');
    try {
        const formData = new FormData();
        const blob = new Blob([SIMPLE_UBL], { type: 'text/xml' });
        formData.append('file', blob, 'test.xml');

        const res = await fetch(`${API_Base}/api/flatten`, {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();

        if (res.status === 403 && data.error === 'upgrade_required') {
            console.log('✅ Paywall verify passed (403 Forbidden)');
            console.log(`   Upgrade URL: ${data.upgrade_url}`);
        } else {
            console.error(`❌ Unexpected response: ${res.status}`, data);
        }
    } catch (e) {
        console.error('❌ API Error:', e.message);
    }

    // 4. Test /api/report (Paywall Check)
    console.log('\n4. Testing /api/report (Expect 402/403)...');
    try {
        const formData = new FormData();
        const blob = new Blob([SIMPLE_UBL], { type: 'text/xml' });
        formData.append('file', blob, 'test.xml');
        // Using a fake key or no key to check tier access denied

        const res = await fetch(`${API_Base}/api/report`, {
            method: 'POST',
            body: formData,
        });

        // Without key -> 401 Unauthorized or Free tier logic ?
        // Free tier logic: validateApiKey returns "free" tier.
        // tierHasAccess('free', 'report') -> false.
        // So expect 402 Payment Required or 403 Upgrade Required based on implementation.
        // In code: create403Response if no access? No, for report it returns 402 Payment Required manually.

        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { data = text; }

        if (res.status === 402 || res.status === 403) {
            console.log(`✅ Paywall verify passed (${res.status})`);
            if (typeof data === 'object') console.log(`   Message: ${data.message}`);
        } else if (res.status === 401) {
            // If it requires auth header but we sent none, it falls back to free tier.
            console.warn('⚠️ Received 401 (Unauthorized) - check logic');
        } else {
            console.error(`❌ Unexpected response: ${res.status}`, data);
        }
    } catch (e) {
        console.error('❌ API Error:', e.message);
    }
}

run();
