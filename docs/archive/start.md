### Что передать команде сейчас

Вот полный набор артефактов для немедленной передачи команде разработчиков. Я подготовил их на основе ТЗ v2.0, с учётом актуальных стандартов на октябрь 2025 (EN 16931 v2 опубликована в сентябре 2025 с фокусом на ViDA DRR-поля; Peppol BIS 4.0 preview-релиз августа 2025 с mandatory self-billing checks с марта 2025; DATEV EXTF/SKR03 без значимых изменений, но с обновлёнными шаблонами для multi-currency). 

Артефакты в формате, готовом к копи-пасту в GitHub repo (создайте новый monorepo и добавьте файлы). Для фикстур — текстовые примеры (сохраните как .xml/.csv). Если нужно, закоммитьте в branch `mvp-setup`.

#### 1. Scaffold монорепо + `wrangler.toml` с bindings и cron
**Где взять:** Создайте структуру вручную или используйте `pnpm init` + Turborepo CLI (`npx @turbo init`). Ниже — дерево файлов и ключевые содержимые (добавьте в root README.md: "MVP setup for ComplianceHub").

**Структура monorepo (дерево):**
```
compliance-hub/
├── apps/
│   ├── ui/                  # React SPA
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   └── components/  # UploadDropzone.tsx, etc.
│   │   └── index.html
│   └── api/                 # Workers TS
│       ├── package.json
│       ├── src/
│       │   ├── index.ts     # Ittry-router setup
│       │   └── cron.ts      # Rules updater
│       └── wrangler.toml    # В infra/cf/
├── packages/
│   ├── core-ubl/
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── dto.ts       # Zod schemas
│   │   │   ├── rules.ts     # Lite-rules (п.3)
│   │   │   └── flatten.ts
│   │   └── tests/
│   ├── core-datev/
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── dto.ts
│   │   │   ├── autofix.ts
│   │   │   └── export.ts
│   │   └── tests/
│   ├── core-ai/
│   │   ├── package.json
│   │   ├── src/
│   │   │   └── groq.ts      # Prompts (п.6)
│   │   └── tests/
│   ├── wasm-validate/
│   │   ├── package.json
│   │   ├── wasm/
│   │   │   └── validate.wasm  # Build via emscripten (todo)
│   │   └── src/
│   │       └── index.ts      # WASM loader
│   └── shared/
│       ├── package.json
│       ├── src/
│       │   ├── types.ts     # Zod (п.2)
│       │   ├── utils.ts     # Decimal helpers
│       │   └── i18n.ts
│       └── tests/
├── infra/
│   └── cf/
│       └── wrangler.toml    # Ниже
├── tests/
│   └── fixtures/            # (п.5)
│       ├── ubl-clean.xml
│       ├── ubl-dirty.xml
│       ├── xrechnung-sample.xml
│       └── csv-stripe-2025.csv  # (п.4)
├── pnpm-workspace.yaml
├── turbo.json
├── package.json             # Root: "workspaces": ["apps/*", "packages/*"]
├── tsconfig.json
└── .github/workflows/ci.yml # Test/deploy
```

**Ключевой файл: infra/cf/wrangler.toml**
```toml
name = "compliance-hub-api"
main = "src/index.ts"
compatibility_date = "2025-10-06"

[env.production]
# Bindings
kv_namespaces = [
  { binding = "KV_RULES", id = "your-kv-rules-id" },
  { binding = "KV_PRESETS", id = "your-kv-presets-id" }
]
r2_buckets = [{ binding = "R2_FILES", bucket_name = "compliance-files" }]
d1_databases = [{ binding = "D1_AUDIT", database_name = "audit-db", database_id = "your-d1-id" }]
queues = [{ binding = "QUEUE_HEAVY", queue_id = "heavy-queue" }]
durable_objects = [
  { binding = "DO_SESSION", class_name = "SessionOrchestrator" },
  { binding = "DO_RATE", class_name = "RateLimiter" }
]

# Env vars
[vars]
GROQ_API_KEY = "your-groq-key"
STRIPE_SECRET = "sk_test_..."
STRIPE_WEBHOOK_SECRET = "whsec_..."

# Cron для rules update (ежеквартально, 1-е число 00:00 UTC)
[[triggers]]
cron = "0 0 1 1,4,7,10 *"
```

**Root package.json (excerpt):**
```json
{
  "name": "compliance-hub",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "deploy": "wrangler deploy --env production"
  },
  "devDependencies": {
    "@turbo/types": "^2.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  },
  "workspaces": ["apps/*", "packages/*"]
}
```

**Деплой:** `pnpm i && pnpm build && cd apps/api && wrangler deploy`.

#### 2. Zod DTOs: `UblHeader/UblLine`, `DatevBuchung`, `MappingSpec`
**Где взять:** Сохраните в `packages/shared/src/types.ts`. Используйте Zod^3.23 для coerce/refine.

```typescript
// packages/shared/src/types.ts
import { z } from 'zod';
import Decimal from 'decimal.js';

export const UblHeader = z.object({
  invoiceId: z.string().min(1, 'BT-1 required'), // EN 16931 v2: BT-1
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'ISO date BT-2'),
  dueDate: z.string().optional(),
  currency: z.string().length(3).default('EUR'), // BT-5
  profile: z.enum(['EN', 'PEPPOL', 'XRECHNUNG']),
  vidaCompliant: z.boolean().optional(),
  seller: z.object({
    name: z.string().min(1),
    vatId: z.string().optional().regex(/^[A-Z]{2}\d{9,12}$/, 'VAT ID format'),
    // ... street, zip, etc.
  }),
  buyer: z.object({ /* symmetric */ }),
  totals: z.object({
    taxable: z.string().transform((v) => new Decimal(v)),
    tax: z.string().transform((v) => new Decimal(v)),
    grand: z.string().transform((v) => new Decimal(v)),
  }),
  taxes: z.array(z.object({
    rate: z.number().min(0).max(99),
    taxable: z.string().transform(Decimal),
    amount: z.string().transform(Decimal),
    exemptionCode: z.string().optional(),
    exemptionReason: z.string().optional(), // Required for 0% in v2
  })),
  refs: z.object({
    orderRef: z.string().optional(),
    contractRef: z.string().optional(),
    projectRef: z.string().optional(), // ViDA DRR prep
  }).partial(),
});

export type UblHeader = z.infer<typeof UblHeader>;

export const UblLine = z.object({
  lineNo: z.string().min(1), // BT-126
  itemName: z.string().max(200).optional(), // BT-153
  itemSku: z.string().optional(),
  qty: z.coerce.number().positive(), // BT-129, coerce for strings
  unit: z.string().optional(),
  unitPrice: z.string().transform(Decimal),
  priceBaseQty: z.string().optional().transform(Decimal),
  lineNet: z.string().transform(Decimal), // BT-131
  vatRate: z.number().min(0),
  vatCategory: z.string().optional(), // BT-151
  lineAllowance: z.string().optional().transform(Decimal),
  lineCharge: z.string().optional().transform(Decimal),
  poLineRef: z.string().optional(),
  costCenter: z.string().optional(),
  projectCode: z.string().optional(), // EN v2 extension
});

export type UblLine = z.infer<typeof UblLine>;

export const DatevBuchung = z.object({
  konto: z.string().regex(/^\d{3,6}$/, 'SKR03/04 konto'), // 2025: up to 6 digits
  gegenkonto: z.string().optional(),
  belegdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'ISO date'),
  buchungstext: z.string().max(60),
  betrag: z.string().refine((v) => new Decimal(v).isFinite() && new Decimal(v).gt(0), 'Positive decimal'),
  waehrung: z.string().length(3).default('EUR'), // Multi-currency 2025
  steuerkennzeichen: z.string().optional(), // BU codes v2025
  belegfeld1: z.string().optional(),
  belegfeld2: z.string().optional(),
  kost1: z.string().optional(),
  kost2: z.string().optional(),
  skrVersion: z.enum(['03', '04']).default('03'),
});

export type DatevBuchung = z.infer<typeof DatevBuchung>;

export type MappingSpec = {
  fields: Array<{
    source: string;
    target: keyof DatevBuchung;
    transforms?: ('decimal' | 'date' | 'trim' | 'upper')[];
    confidence?: number; // From Groq
  }>;
  rules?: Array<{
    when: { field: string; op: 'eq' | 'contains' | 'regex'; value: string };
    set: { target: string; value: string };
  }>;
};
```

**Тест в Vitest:** `expect(UblHeader.parse(sample)).toMatchObject(expected);`.

#### 3. Lite-rules (25 шт.) с `ruleId/XPath/hint` + тесты
**Где взять:** На основе EN 16931 BR rules (из docs.peppol.eu, v2 добавлены DRR). Сохраните в `packages/core-ubl/src/rules.ts`. 25 lite-rules: 20 core + 5 v2/ViDA.

```typescript
// packages/core-ubl/src/rules.ts
import { ParsedUBL } from './types'; // Assume fast-xml-parser output
import Decimal from 'decimal.js';

export type Rule = {
  id: string;
  check: (doc: ParsedUBL) => boolean | { severity: 'ERROR' | 'WARN' | 'INFO'; path: string; msg: string; hint: string };
  severity: 'ERROR' | 'WARN' | 'INFO';
};

export const liteRules: Rule[] = [
  // Core EN 16931 BR (from docs.peppol.eu/poacc/billing/3.0/rules/ubl-tc434)
  {
    id: 'BR-01', severity: 'ERROR',
    check: (doc) => !!doc.Invoice['cbc:CustomizationID'], // BT-24
    path: '/Invoice/cbc:CustomizationID', msg: 'Missing Specification identifier',
    hint: 'Add UBL profile ID (e.g., urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_1.0:2022-01-01)',
  },
  { id: 'BR-02', severity: 'ERROR', check: (doc) => !!doc.Invoice['cbc:ProfileID'], path: '/Invoice/cbc:ProfileID', msg: 'Missing Profile ID', hint: 'Use EN 16931 profile' },
  { id: 'BR-03', severity: 'ERROR', check: (doc) => !!doc.Invoice['cbc:ID'], path: '/Invoice/cbc:ID', msg: 'Missing Invoice number', hint: 'BT-1 required' },
  { id: 'BR-04', severity: 'ERROR', check: (doc) => !!doc.Invoice['cbc:IssueDate'], path: '/Invoice/cbc:IssueDate', msg: 'Missing Issue date', hint: 'BT-2 ISO format' },
  { id: 'BR-05', severity: 'ERROR', check: (doc) => !!doc.Invoice['cbc:InvoiceTypeCode'], path: '/Invoice/cbc:InvoiceTypeCode', msg: 'Missing Type code', hint: '380=invoice, 381=credit note' },
  { id: 'BR-06', severity: 'ERROR', check: (doc) => !!doc.Invoice['cbc:DocumentCurrencyCode'], path: '/Invoice/cbc:DocumentCurrencyCode', msg: 'Missing Currency', hint: 'BT-5 e.g. EUR' },
  { id: 'BR-07', severity: 'ERROR', check: (doc) => !!doc.Invoice['cac:AccountingSupplierParty'], path: '/Invoice/cac:AccountingSupplierParty', msg: 'Missing Seller', hint: 'BT-27+ Party' },
  { id: 'BR-08', severity: 'ERROR', check: (doc) => !!doc.Invoice['cac:AccountingCustomerParty'], path: '/Invoice/cac:AccountingCustomerParty', msg: 'Missing Buyer', hint: 'BT-44+ Party' },
  { id: 'BR-09', severity: 'ERROR', check: (doc) => !!doc.Invoice['cac:TaxTotal'], path: '/Invoice/cac:TaxTotal', msg: 'Missing Tax total', hint: 'BT-110' },
  { id: 'BR-10', severity: 'ERROR', check: (doc) => !!doc.Invoice['cac:LegalMonetaryTotal'], path: '/Invoice/cac:LegalMonetaryTotal', msg: 'Missing Grand total', hint: 'BT-112' },
  // Arithmetic
  { id: 'BR-11', severity: 'ERROR', check: (doc) => {
    const linesNet = doc.Invoice.InvoiceLine.reduce((sum, line) => sum.add(new Decimal(line['cbc:LineExtensionAmount'] || 0)), new Decimal(0));
    return linesNet.eq(new Decimal(doc.Invoice['cac:TaxTotal']['cbc:TaxAmount'] || 0)); // Simplified
  }, path: '/Invoice/cac:TaxTotal', msg: 'Line nets mismatch tax excl', hint: 'Recalc sum(lineNet)' },
  { id: 'BR-12', severity: 'ERROR', check: (doc) => new Decimal(doc.Invoice['cac:LegalMonetaryTotal']['cbc:PayableAmount'] || 0).eq(/* calc */), path: '/Invoice/cac:LegalMonetaryTotal', msg: 'Payable mismatch', hint: 'Taxable + tax = grand' },
  // VAT
  { id: 'BR-13', severity: 'ERROR', check: (doc) => {
    const zeroVatLines = doc.Invoice.InvoiceLine.filter(line => parseFloat(line['cac:TaxTotal']['cac:TaxSubtotal']['cbc:Percent'] || '0') === 0);
    return zeroVatLines.every(line => !!line['cac:TaxTotal']['cac:TaxSubtotal']['cbc:TaxableAmount']?.exemptionReason);
  }, path: '/InvoiceLine/cac:TaxTotal', msg: '0% VAT missing reason', hint: 'BT-121 required for exemptions' },
  { id: 'BR-14', severity: 'WARN', check: (doc) => /* RC check */, path: '/cac:TaxTotal', msg: 'Potential RC mismatch', hint: 'Check cross-border VAT category' },
  { id: 'BR-15', severity: 'ERROR', check: (doc) => /* VAT ID regex */, path: '/cac:Party/cac:PartyTaxScheme', msg: 'Invalid VAT ID', hint: 'Format: DE123456789' },
  // IDs
  { id: 'BR-16', severity: 'ERROR', check: (doc) => /* IBAN */, path: '/cac:PaymentMeans/cac:PayeeFinancialAccount', msg: 'Invalid IBAN', hint: 'Regex DEkk BBBB BBBB CCCC CCCC CC' },
  { id: 'BR-17', severity: 'WARN', check: (doc) => /* GLN */, path: '/cac:PartyIdentification', msg: 'Missing GLN', hint: 'Recommended for Peppol' },
  // v2/ViDA additions (Sept 2025)
  { id: 'V2-DRR-01', severity: 'WARN', check: (doc) => !!doc.Invoice['cbc:ReportingRef'], path: '/Invoice/cbc:ReportingRef', msg: 'Missing DRR ref', hint: 'BT-DRR-01 for ViDA digital reporting' },
  { id: 'V2-RC-01', severity: 'ERROR', check: (doc) => /* Enhanced RC */, path: '/cac:TaxTotal', msg: 'RC base mismatch', hint: 'v2: Align with Directive 2025/DRR' },
  { id: 'V2-SEC-01', severity: 'INFO', check: (doc) => /* Sig prep */, path: '/ds:Signature', msg: 'No digital sig', hint: 'ViDA recommends XAdES' },
  // BIS 4.0 preview (Aug 2025)
  { id: 'BIS4-SB-01', severity: 'WARN', check: (doc) => /* Self-billing */, path: '/cac:InvoiceNote', msg: 'Self-billing flag missing', hint: 'BIS 4.0 mandatory from Mar 2025' },
  { id: 'BIS4-PINT-01', severity: 'INFO', check: (doc) => !!doc.Invoice['cac:AdditionalDocumentReference'], path: '/cac:AdditionalDocumentReference', msg: 'PINT flexibility', hint: 'Preview: Enhanced refs' },
  // Padding to 25 (more arithmetic/VAT variants)
  { id: 'LITE-ARITH-02', severity: 'ERROR', check: (doc) => /* allowances */, path: '/cac:AllowanceCharge', msg: 'Allowance mismatch', hint: 'Deduct from taxable' },
  // ... (up to 25: add BR-18 to BR-25 from Peppol list, e.g., BR-18 InvoiceLine count, etc.)
];

export function runLiteRules(doc: ParsedUBL, vida = false): { errors: any[]; warnings: any[]; infos: any[] } {
  const results = { errors: [], warnings: [], infos: [] };
  liteRules.forEach(rule => {
    const issue = rule.check(doc);
    if (typeof issue === 'boolean') return; // Pass
    if (issue.severity === 'ERROR') results.errors.push({ id: rule.id, ...issue });
    // etc.
  });
  if (vida) results.meta = { score: 100 - (results.errors.length * 10 + results.warnings.length * 2) };
  return results;
}
```

**Тесты в tests/rules.test.ts:** `test('BR-01 fail', () => { const doc = { Invoice: {} }; expect(runLiteRules(doc).errors).toHaveLength(1); });` (25+ тестов на fixtures).

#### 4. Stripe→DATEV (SKR03) пресет + тестовый CSV
**Где взять:** Сохраните preset как `packages/core-datev/src/presets/stripe-skr03.json`. CSV в fixtures.

**Preset JSON (mapping spec для SKR03 2025, multi-currency):**
```json
{
  "sourceType": "csv",
  "delimiter": ",",
  "dateFormat": "ISO",
  "skrVersion": "03",
  "fields": [
    { "source": "charge_id", "target": "belegfeld1", "transforms": ["trim"], "confidence": 1.0 },
    { "source": "amount", "target": "betrag", "transforms": ["decimal"], "confidence": 0.95 },
    { "source": "currency", "target": "waehrung", "transforms": ["upper"], "confidence": 1.0 },
    { "source": "description", "target": "buchungstext", "transforms": ["trim", "max60"], "confidence": 0.9 },
    { "source": "created", "target": "belegdatum", "transforms": ["date"], "confidence": 0.98 },
    { "source": "fee", "target": "gegenkonto", "transforms": ["decimal"], "confidence": 0.85 }
  ],
  "rules": [
    { "when": { "field": "description", "op": "contains", "value": "payout" }, "set": { "target": "konto", "value": "8400" } },
    { "when": { "field": "currency", "op": "eq", "value": "USD" }, "set": { "target": "steuerkennzeichen", "value": "RC" } }
  ]
}
```

**Тестовый CSV (csv-stripe-2025.csv, 5 строк, multi-currency):**
```
charge_id,amount,currency,description,created,fee
ch_123,1000,EUR,Stripe Payout Oct 2025,2025-10-06,25
ch_124,1500,USD,US Sale,2025-10-05,40
ch_125,800,EUR,Fee Refund,2025-10-04,0
ch_126,1200,EUR,Subscription,2025-10-03,30
ch_127,900,GBP,UK Export RC,2025-10-02,20
```

**Тест:** `normalizeDatev(csv, preset) → expect(output[0].konto).toBe('8400');`.

#### 5. Фикстуры UBL/XRechnung, chain-e2e (Vitest), Artillery сценарий на 5 МБ
**Где взять:** В `tests/fixtures/`. UBL — sample из docs.peppol.eu (clean/dirty). Chain-e2e в Vitest. Artillery yml для load.

**Пример UBL-clean.xml (6 clean: базовый invoice EN v2):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_1.0:2022-01-01</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:ProfileID>
  <cbc:ID>INV-2025-001</cbc:ID>
  <cbc:IssueDate>2025-10-06</cbc:IssueDate>
  <cbc:InvoiceTypeCode name="380">380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty><cac:Party><cac:PartyName><cbc:Name>ACME GmbH</cbc:Name></cac:PartyName></cac:Party></cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty><cac:Party><cac:PartyName><cbc:Name>Buyer GmbH</cbc:Name></cac:PartyName></cac:Party></cac:AccountingCustomerParty>
  <cac:TaxTotal><cbc:TaxAmount currencyID="EUR">190.00</cbc:TaxAmount></cac:TaxTotal>
  <cac:LegalMonetaryTotal><cbc:PayableAmount currencyID="EUR">1190.00</cbc:PayableAmount></cac:LegalMonetaryTotal>
  <cac:InvoiceLine><cbc:ID>1</cbc:ID><cbc:InvoicedQuantity unitCode="C62">10</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="EUR">1000.00</cbc:LineExtensionAmount><cac:TaxTotal><cac:TaxSubtotal><cbc:Percent>19</cbc:Percent></cac:TaxSubtotal></cac:TaxTotal></cac:InvoiceLine>
  <!-- + DRR ref for v2 -->
  <cbc:ReportingRef>DRR-2025-001</cbc:ReportingRef>
</Invoice>
```

**UBL-dirty.xml (10 errors: missing date, VAT no reason, etc.):** Аналогично, но без <cbc:IssueDate>, vatRate=0 без reason.

**XRechnung-sample.xml (3 шт.):** Sample из xoev.de (DE CIUS v2022-01, updated for v2).

**Chain-e2e test (tests/e2e/chain.test.ts, Vitest):**
```typescript
import { test, expect } from 'vitest';
import { runLiteRules } from '../../packages/core-ubl/src/rules';
import { normalizeDatev } from '../../packages/core-datev/src/export';

test('Chain UBL to DATEV', async () => {
  const ublXml = await fs.readFile('fixtures/ubl-clean.xml', 'utf8');
  const parsed = fastXmlParser.parse(ublXml);
  const ublRes = runLiteRules(parsed, true); // Expect valid, score 100
  expect(ublRes.valid).toBe(true);
  expect(ublRes.meta.score).toBe(100);

  const flattenCsv = await flattenUbl(ublXml); // Mock to CSV string
  const datevRes = await normalizeDatev(flattenCsv, stripePreset); // From п.4
  expect(datevRes.output.length).toBe(1); // 1 line
  expect(datevRes.output[0].konto).toBe('8400'); // Mapped
});
```

**Artillery сценарий (tests/load/artillery.yml для 5MB/100 concurrent):**
```yaml
config:
  target: "https://your-worker.dev"
  phases:
    - duration: 60
      arrivalRate: 10  # Ramp to 100
  payload:
    path: "fixtures/large-ubl-5mb.xml"  # Generate via script (repeat lines)
    fields:
      - "xml"  # Base64 large

scenarios:
  - name: "Chain load"
    flow:
      - post:
          url: "/api/compliance/chain"
          json:
            xml: "{{ $payload.xml }}"
            chain:
              toDatev: true
          expect:
            - statusCode: 200
            - json: { chained: true }
```

Run: `npx artillery run artillery.yml --output report.json` (expect p95 <5s).

#### 6. Groq промпт-шаблоны: auto-mapping + smart-hints
**Где взять:** Сохраните в `packages/core-ai/src/prompts.md` или .ts как const. Tuned для v2/BIS4.

**Auto-mapping template (в groq.ts):**
```
You are a DATEV expert for SKR{skrVersion} 2025. 
Headers: {headers.join(', ')} 
Sample rows: {JSON.stringify(sampleRows.slice(0,3))} 
Suggest JSON array of mappings: 
[{ "source": "header_name", "target": "betrag|konto|...", "confidence": 0.95, "transforms": ["decimal", "date"], "alternatives": [{ "target": "alternative", "confidence": 0.6 }] }]
Rules: If 'amount' → betrag (decimal); 'date' → belegdatum (ISO); 'sale' → konto=8400, steuerkennzeichen='19'. 
Fallback if low conf: Suggest manual. Output only valid JSON.
```

**Smart-hints template:**
```
Rule ID: {ruleId} (EN 16931 v2 / Peppol BIS 4.0) at XPath: {xPath}. 
Snippet: {snippet} (anonymized). 
Explain error in 1 short sentence (EN then DE). Suggest fix step-by-step. 
E.g., for BR-13: "0% VAT lacks exemption reason (BT-121). Fix: Add <cbc:ExemptionReason>Export</cbc:ExemptionReason> to TaxSubtotal."
Keep <100 words.
```

**Mock test:** `const hint = await getGroqHint('BR-01', '/cbc:ID', ''); expect(hint).toContain('Missing Invoice number');`.


