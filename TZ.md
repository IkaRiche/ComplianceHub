Название: Compliance Bridge (рабочее)
Что это: единый микро-SaaS для компаний в ЕС/DE, который делает две вещи:

Peppol UBL Validator & Flattener — проверка электронных счетов UBL/Peppol/XRechnung на соответствие EN 16931/Peppol BIS и «расплющивание» XML → CSV/JSON.

DATEV CSV Normalizer — преобразование «любых» CSV/JSON (Stripe, PayPal, Shopify, ERP) в корректный DATEV-CSV (EXTF) для импорта в бухгалтерию (SKR03/SKR04) + журнал автоисправлений.

Для кого:

Разработчики интеграций/финтех и small/medium бизнесы (DE/EU) с 1–20k счетов/мес.

Бухгалтеры/аудиторы, которым нужно быстро проверить и выгрузить данные «в Excel/BI/DATEV».

Ключевая ценность:

Сэкономить часы на импортах/проверках, снизить отказы импорта и риски комплаенса.

Делать это быстро (секунды), без тяжелой установки и с понятными отчётами.

# Техническое Задание (ТЗ) v2.0: Микро-SaaS "ComplianceHub" — Peppol UBL Validator & Flattener + DATEV CSV Normalizer

**Дата версии:** 06 октября 2025  
**Версия:** 2.0 (на основе v1.1 с интеграцией актуальных стандартов: ViDA в силе с 14 апреля 2025, EN 16931 v2 опубликована в сентябре 2025 с новыми полями для digital reporting; Peppol BIS 4.0 preview-релиз в августе 2025 с mandatory changes с марта 2025; DATEV EXTF без значимых обновлений для 2025, SKR03/04 на 2025).  
**Цель ТЗ:** Предоставить разработчикам полный, actionable план реализации MVP за 3 недели + 1 неделя бета. Фокус: **ЧТО** (функционал, требования) и **КАК** (технические детали, код/библиотеки, тесты).  
**Аудитория:** DE/BE/IT SMB/финтех/devs (ViDA B2G mandatory с января 2025 в DE; B2B prep для 2030).  
**Стек:** TypeScript, React, Cloudflare (Pages/Workers/KV/R2/Queues/D1/Durable Objects), Groq API.  
**Репо:** GitHub monorepo (pnpm + Turborepo).  

---

## 0) Delta к v1.1 и ключевые обновления стандартов

* **ViDA (VAT in the Digital Age):** Директива в силе с 14 апреля 2025. DE: Обязательный приём EN 16931-совместимых e-invoices с 1 января 2025 (B2G full); B2B exemption до 31 декабря 2027, но domestic schemes allowed. Добавлен "ViDA Score" (0-100, weighted по completeness для DRR — Digital Reporting Requirements). Бейдж "ViDA-Aligned" в UI/отчётах.
* **EN 16931 v2 (сентябрь 2025):** Опубликована; новые поля (e.g., BT-DRR-01 для reporting refs, enhanced RC для cross-border). Модуль: Загрузчик правил с v2 support (XPath updates для new BT).
* **Peppol BIS 4.0:** Preview-релиз август 2025 (Q2 updates mandatory с 10 марта 2025: self-billing, enhanced PINT flexibility). Флаг "BIS 4.0 Preview" в UI; hot-swap via KV (cron pull с docs.peppol.eu).
* **DATEV EXTF 2025:** Без изменений; SKR03/04 templates updated (e.g., new BU для e-invoicing RC). Добавлена multi-currency (EUR/USD) в Auto-Fix.
* **Другое:** Groq prompts tuned для v2 rules; chain success ≥90% (тест на ViDA-compliant UBL). SLO: Uptime 99.5% via CF Analytics.

**Общие принципы:** Privacy-by-default (GDPR/GoBD); no PII в логах; fallback offline для Groq (regex/keywords).

---

## 1) Цели и нефункциональные требования (НФТ)

**ЧТО (цели MVP):**  
- Валидация/флэттенинг UBL (EN 16931 v1/v2 + Peppol BIS 3.0/4.0 preview + XRechnung DE).  
- Нормализация CSV/JSON в DATEV EXTF (Buchungen; multi-currency).  
- Сквозной chain: UBL → Validate → Flatten → DATEV Normalize → ZIP-export.  
- ViDA-режим: Чек DRR-hints, score для compliance.  
- API-first: Devs embed в fintech (e.g., Lexoffice).  
- Монетизация: Free/Pro/Scale/Bundle (€25 ViDA Pro).  

**КАК (НФТ):**  
- Latency: p95 ≤5s на 1k lines/инвойс (Workers + Queues для >5MB).  
- Success rate: ≥90% exports без ручных правок (метрика в D1).  
- Uptime: ≥99.5% (CF Analytics; алерты на >1% 5xx).  
- Files: ≤20MB sync; heavy via Queues (async poll via DO session).  
- Локализация: EN/DE (i18next; DE first для DE-market).  
- Scalability: 100 concurrent (load-test Artillery); zero-downtime deploys (CF).  
- Compliance: GDPR (erase-all), GoBD (audit trails в D1 без payload).  

**Метрики успеха:** NPS ≥40; Free→Pro conv ≥15%; chain usage ≥30% сессий.

---

## 2) Архитектура и инфраструктура

**ЧТО:** Monorepo для shared code; CF для serverless (no infra maint).  

**КАК (структура):**  
```
apps/
  ui/          # React SPA (Pages): Vite + React 18 + Router v6
  api/         # Workers TS (Ittry-router): HTTP + cron
packages/
  core-ubl/    # XPath parse (fast-xml-parser + fontoxpath), flatten Zod DTO, lite-rules TS
  core-datev/  # CSV/JSON parse (papaparse/fast-csv), Auto-Fix engine (decimal.js), SKR/BU KV-lookup
  core-ai/     # Groq client (@groq/groq-sdk), prompts TS templates
  wasm-validate/ # WASM build (libxmljs + Saxon-JS for Schematron; emscripten compile)
  shared/      # Zod schemas, i18n (i18next), utils (decimal.js, logger: console + Sentry)
infra/
  cf/          # wrangler.toml: [env.production] bindings KV_RULES, KV_PRESETS, R2_FILES, D1_AUDIT, QUEUE_HEAVY, DO_SESSION, GROQ_API_KEY, STRIPE_SECRET
```

**Cloudflare setup (wrangler deploy):**  
- **Pages:** UI build/deploy auto.  
- **Workers:** API routes (/api/*); cron "0 0 1 * *" для rules update (fetch openpeppol.eu/Datev.de → KV upsert).  
- **KV:** Namespaces: RULES (JSON rules@2025Q4), PRESETS (encrypted user mappings).  
- **R2:** Bucket FILES; lifecycle TTL 24h; public=false.  
- **Queues:** HEAVY for async (e.g., strict validate >1MB; producer in Worker, consumer polls DO).  
- **D1:** Schema: `CREATE TABLE audits (id UUID PRIMARY KEY, userId TEXT, action TEXT, ts TIMESTAMP, size INT, duration MS, profile TEXT, rulesVersion TEXT, outcome TEXT);` (no content).  
- **DO:** RATE for limits (counters/user); SESSION for chain orchestration (stateful multi-step).  
- **Env vars:** GROQ_API_KEY (for core-ai), STRIPE_WEBHOOK_SECRET.  

**Dependencies (pnpm):** React^18, Zod^3, Decimal.js^10, Groq-sdk^0.5, jsPDF^2 (PDF), libsodium-wrappers (encrypt), Sentry^8 (errors). No npm installs in runtime.

---

## 3) Функциональные модули и флоу

**ЧТО:** Три модуля + chain; Groq для smart features.  

**КАК (реализация):**  

### 3.1 Peppol UBL Validator & Flattener  
- **Вход:** XML string/url/base64 (UBL Invoice/CreditNote); PDF/A-3 extract via jszip + pdf-lib (embed XML). Auto-detect: Parse namespace/BT-1 → profile (EN/PEPPOL/XRECHNUNG).  
- **Validate (lite):** TS rules array (25+): Check required BT (e.g., if !issueDate → ERROR LITE-REQ-01), arithmetic (sum(lines.lineNet) === totals.taxable, eps=0.01 via decimal.js), VAT (vatRate=0 requires exemptionReason). Severity: ERROR (block), WARN (log), INFO (hint).  
- **Validate (strict):** WASM call: Load XSD (UBL 2.1) + Schematron (EN v2/PBIS 4.0 preview); output {ruleId: 'EN-BR-CO-09', severity, path: XPath, msg, hint}. For v2: +checks BT-DRR-01 (reporting ref present?).  
- **ViDA-mode:** If vida=true: +score = 100 - (errors*10 + warns*2); flag vidaCompliant if score≥80.  
- **Flatten:** XPath queries (e.g., /Invoice/InvoiceLine[1]/ID → lineNo); map to Zod DTO; denorm CSV (repeat header in lines via papaparse); options: taxColumns (pivot rates to cols like vat_19_base), dateFmt (ISO/EU via date-fns). Output: Stream CSV (Response csv) or JSON.  
- **Выход:** report.json {valid, errors[], warnings[], meta {profile, totals, vidaCompliant, score}}, PDF (jsPDF: table errors + summary).  

### 3.2 DATEV CSV Normalizer  
- **Вход:** CSV/JSON (papaparse for CSV detect delimiter/BOM).  
- **Mapping:** Preset (KV fetch) or manual (UI drag); Groq auto: POST /ai/mapping → array {source, target, confidence, transforms[]}.  
- **Auto-Fix Engine:** Pipeline TS funcs: detectEncoding (iconv-lite stub), fixDelimiter (;), fixDecimal (,)→., normalizeDate (DE dd.mm.yyyy → ISO), trimText (≤60), escapeQuotes, assignBU (if desc contains 'sale' → '19'). Multi-currency: If waehrung≠EUR warn + convert via fixed rate KV (e.g., USD@1.08). Strict: Throw on fail; Soft: Fix + log in report.  
- **Validate:** Zod parse DatevBuchung[] + SKR lookup (KV json {konto: '8400', desc: 'Sales'}); check uniqueness belegfeld1.  
- **Выход:** EXTF-CSV stream (fixed cols: "Konto";"Gegenkonto";... per 2025 spec, ; delimiter, UTF-8 no BOM); report {fixes[], warnings[], errors[]}.  

### 3.3 Compliance Chain  
- **UI:** Wizard (React steps): Step1 Upload UBL; Step2 Validate (show errors); Step3 Flatten options; Step4 (opt) DATEV mapping/AI-suggest; Step5 Export ZIP (jszip: csv + pdfs). Progress bar via Zustand state.  
- **API:** /chain: Orchestrate via DO (state: {step:1, tempCsv: base64}); if toDatev: Flatten → parse CSV → map/fix → export. Return {ublReport, flatten {csv base64}, datevCsv base64?, chained:true}. Async heavy: Queue jobId → poll /status/{id}.  
- **Webhook:** POST /webhooks/success {flow, success} → D1 insert + optional Zapier forward (if user opt-in).  

### 3.4 Groq Integration (core-ai)  
- **Auto-mapping:** Prompt: `You are DATEV expert. Headers: [list]. Sample rows: [2-5]. Suggest JSON: [{source:"amount", target:"betrag", confidence:0.95, transforms:["decimal"], alternatives:[{target:"gegenkonto", confidence:0.6}]}]. Use SKR03/04 2025.` Client: groq.chat.completions.create({model:'llama3-70b-8192', messages:[{role:'user', content:prompt}]}); parse JSON response. Fallback: Keyword match (e.g., /amount/ → betrag).  
- **Smart-hints:** Prompt: `Rule: ${ruleId} at ${xPath}. Snippet: ${snippet (50 chars)}. Explain error in 1 sentence EN/DE + fix step.` Limit: Snippet anonymized (no IDs).  

---

## 4) Модель данных (Zod схемы в shared/types.ts)

**ЧТО:** Strict typing для input/output.  

**КАК:**  
```ts
// UblHeader
export const UblHeader = z.object({
  invoiceId: z.string().min(1), // BT-1
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // BT-2 ISO
  dueDate: z.string().optional(),
  currency: z.string().length(3).default('EUR'), // BT-5
  profile: z.enum(['EN', 'PEPPOL', 'XRECHNUNG']),
  vidaCompliant: z.boolean().optional(),
  // ... seller/buyer as PartySchema, totals as TotalsSchema, taxes: z.array(TaxSchema)
});

// UblLine (array in Flatten)
export const UblLine = z.object({
  lineNo: z.string(),
  // ... qty: z.coerce.number().positive(), etc. Use decimal.js for strings → Decimal
});

// DatevBuchung (array)
export const DatevBuchung = z.object({
  konto: z.string().regex(/^\d{4}$/), // SKR lookup
  // ... betrag: z.string().refine((v) => new Decimal(v).isFinite()),
  skrVersion: z.enum(['03', '04']).default('03'),
});

// MappingSpec
export type MappingSpec = {
  fields: { source: string; target: keyof DatevBuchung; transforms?: string[]; confidence?: number }[];
  rules: { when: { field: string; op: 'eq' | 'contains'; value: string }; set: { target: string; value: string } }[];
};
```

Infer types; coerce для dirty data (e.g., z.coerce.date()).

---

## 5) Правила и версионирование

**ЧТО:** 25+ lite-rules; strict via WASM; quarterly updates.  

**КАК:**  
- **Lite-rules:** Array<Rule> in core-ubl/rules.ts: {id: 'LITE-ARITH-01', check: (doc: ParsedXML) => sumLines(doc) !== totals(doc), severity: 'ERROR', hint: 'Recalculate line nets'}. Run sequential; aggregate errors. For EN v2: + {id: 'V2-DRR-01', check: !doc.query('/Invoice/ReportingRef'), hint: 'Add BT-DRR-01 for ViDA digital reporting'}.  
- **Strict:** WASM module.export('validate', (xmlPtr: number, schemaPtr: number) => { /* Saxon-JS transform */ return {errors: array}; }); Load KV rules as JSON (Schematron XSLT blobs base64).  
- **Версионирование:** /rules/active → {en: 'v2-2025Q3', pbis: '4.0-preview-2025Q3'}. Cron: Fetch https://docs.peppol.eu → parse new Schematron → KV upsert; UI selector for active version. BIS 4.0: If preview, +checks self-billing (new BT-SB-01).  
- **DATEV Rules:** KV SKR2025.json {accounts: [{id: '8400', type: 'revenue'}]}; BU-codes {19: 'Umsatzsteuer 19%', RC: 'Reverse Charge'}.  

---

## 6) Контракты API (Workers/itty-router)

**ЧТО:** RESTful; auth Bearer API-key (KV validate); version X-API-Version: 2025-10-01.  

**КАК:**  
```ts
// POST /api/ubl/validate
router.post('/api/ubl/validate', async (req) => {
  const { xml, profile = 'AUTO', mode = 'lite', vida = false } = await req.json();
  const parsed = fastXmlParser.parse(xml); // or fetch url
  const rulesVersion = await KV_RULES.get('active');
  if (mode === 'strict') {
    const wasm = await wasmValidate.instantiate(); // WASM
    const result = wasm.validate(xml, rulesVersion.en); // EN v2
  } else { result = runLiteRules(parsed, vida); }
  if (vida) result.meta.vidaCompliant = calcScore(result.errors);
  return json({ valid: !result.errors.length, ...result });
});

// POST /api/compliance/chain
router.post('/api/compliance/chain', async (req, env) => {
  const { xml, chain: { toDatev = false, datev: { mapping, skrVersion = '03' } }, ...opts } = await req.json();
  const doId = env.DO_SESSION.idFromName(userId); // Stateful
  const state = await doId.get(doId.id); // Or create
  // Step1: Validate UBL
  const ublRes = await validateUbl(xml, opts); // core-ubl
  if (!ublRes.valid) return json({ error: 'UBL invalid' }, 422);
  // Step2: Flatten
  const flattenRes = await flattenUbl(xml, opts); // CSV buffer
  if (toDatev) {
    const datevRes = await normalizeDatev(flattenRes.csv, { mapping, skrVersion }); // core-datev
    state.set({ datev: datevRes }); // Persist if heavy
  }
  // Webhook if success
  if (datevRes?.success) await fetch('/webhooks/success', { method: 'POST', body: json({ flow: 'CHAIN', success: true }) });
  return json({ ublReport: ublRes, flatten: { csv: btoa(flattenRes.buffer) }, chained: true });
});

// POST /api/ai/mapping (Groq)
router.post('/api/ai/mapping', async (req) => {
  const { headers, sampleRows, skrVersion } = await req.json();
  const prompt = buildPrompt(headers, sampleRows, skrVersion); // Template
  const groq = new Groq({ apiKey: GROQ_API_KEY });
  const resp = await groq.chat.completions.create({ model: 'llama3-70b-8192', messages: [{ role: 'user', content: prompt }] });
  const mapping = JSON.parse(resp.choices[0].message.content); // Zod safeParse
  return json({ mapping, fallback: keywordFallback(headers) });
});
```
Errors: 400 (bad input), 422 (validation), 429 (DO counter++ > limit), 500 (Sentry.capture). Streams for CSV: new Response(csvBuffer, { headers: { 'Content-Type': 'text/csv' } }).

---

## 7) UI/UX (React в apps/ui)

**ЧТО:** Intuitive SPA; wizard для chain.  

**КАК:**  
- **Структура:** Router: / (dashboard tabs), /ubl, /datev, /chain (wizard). Zustand store: { file: File, state: { step: 1, errors: [] } }.  
- **Компоненты:**  
  - UploadDropzone (react-dropzone): onDrop → base64 → API post.  
  - ValidationReport: Table (TanStack) errors {col: ruleId, severity (badge), path (copy btn), hint (Groq /ai/hint fetch → tooltip)}.  
  - MappingBuilder: Drag (react-dnd) source→target; AI-Suggest btn → /ai/mapping → populate with confidence badges (>0.8 green).  
  - Wizard (react-joyride for tour): Steps array; progress <Progress value={step/5*100} />.  
  - Reports: PDF preview (jsPDF render to canvas? Or download link); complianceScore: Radial chart (Recharts) 0-100.  
  - Billing: Stripe Elements Checkout; quota bar (KV fetch limits).  
- **i18n:** i18next: en.json/de.json; detect via navigator.language.  
- **Onboarding:** Tour on first visit: "Upload your UBL → See ViDA score → Chain to DATEV".  

---

## 8) Security & Privacy

**ЧТО:** GDPR/GoBD; no storage default.  

**КАК:**  
- **Input:** Sanitize XML/CSV (no XXE via libxml safeParse); size limit 20MB (req.bodySize). WAF: CF ruleset block oversized/malformed.  
- **KV:** Encrypt presets: libsodium.crypto_box_seal(JSON.stringify(spec), publicKey) → decrypt on read.  
- **R2:** If opt-in: Upload temp key = userId+uuid; lifecycle policy delete after 24h.  
- **D1 Audit:** On action: env.D1_AUDIT.prepare('INSERT INTO audits ...').bind(userId, 'validate_ubl', Date.now(), size, duration, profile, rulesVersion, outcome).run(); No content.  
- **Auth:** Clerk or JWT (sign with Stripe customerId); API-key = hash(userId + secret).  
- **Erase-all:** Btn → KV delete prefixes, R2 delete objects (list + bulkDelete), D1 soft-delete (flag). Policy: /privacy (short MD).  

---

## 9) Мониторинг и SLO

**ЧТО:** Track perf/business; алерты.  

**КАК:**  
- **Sentry:** Init in Worker/UI: Sentry.captureException(err, {tags: {module: 'ubl'}}); No PII (scrub user data).  
- **CF Analytics:** Custom metrics (Workers trace: setCustomMetric('latency', ms)); Dashboard query p95.  
- **Бизнес:** Umami events: track('chain_success', {user: anonId}); CR calc: Stripe webhook → KV conv count.  
- **Алерты:** Workers cron check: If p95>5s (Analytics API) → email (via CF Email? Or external). Queue depth >100 → alert.  
- **Pro UI:** /metrics: Fetch personal KV (avg latency last 30d).  

---

## 10) Тесты и фикстуры

**ЧТО:** 95% coverage; load-proof.  

**КАК:**  
- **Unit (Vitest):** describe('liteRules', () => { test('arithmetic fail', () => expect(runRule(docDirty)).toHaveLength(1)); }); Mock Groq: vi.mock('@groq', () => ({create: () => ({chat: {completions: {create: async () => ({choices: [{message: {content: '[{"source":"..."}]'}]})}})}));  
- **Integration:** supertest on Worker: await request(worker).post('/validate').send({xml: fixture}).expect(200); Fixtures: /tests/fixtures/ubl-clean.xml (6), ubl-dirty.xml (10 errors), xrechnung-sample.xml (3); csv-stripe.json (multi-currency).  
- **E2E:** Cypress: cy.visit('/chain'); cy.get('input[type=file]').attachFile('ubl.xml'); cy.get('.score').should('have.text', '85'); Chain test: Assert ZIP download contains datev.csv.  
- **Fuzz/Load:** Vitest fuzz: random CSV (faker.js) → expect(no crash); Artillery: config.yml POST /chain 100 users ramp 10s → p95<5s.  
- **Chain:** Fixture UBL-viDA.xml → expect(datevCsv lines === ubl lines, skr compliant). Groq: Mock 70% accuracy on samples.  

---

## 11) Тарифы и квоты

**ЧТО:** Funnel Free → Bundle.  

**КАК:** Stripe Checkout (session create → KV set plan); Webhook /stripe: Update KV {userId: {plan: 'pro', quota: {reqDay: 100}}}. DO counter: If >quota throw 429. Bundle: €25 unlocks /chain unlimited. UI: Badge "Pro: 50k/mo left".

---

## 12) План работ (3 недели + бета)

**Неделя 1 (Core):**  
- Setup monorepo (turborepo build/watch); UI basics (tabs/upload); /ubl/flatten lite; /datev/export manual; D1/KV init; Vitest 50% coverage.  

**Неделя 2 (Features):**  
- Strict WASM (EN v2/BIS 4.0 preview); PDF/score; Groq /ai/mapping+hints; Presets CRUD; Stripe auth; Joyride tour.  

**Неделя 3 (Polish):**  
- /chain + wizard; Queues/DO; Cron rules; L10n EN/DE; Landing (ViDA SEO: h1 "ViDA UBL Validator 2025"); CLI (ts-node uBlToCsv.ts). Load-test pass.  

**Неделя 4 (Бета):**  
- Deploy prod; Invite 20 DE devs (LinkedIn/Reddit r/einvoicing); Feedback loop (Typeform post-use); Fix SLO breaches; BIS 4.0 flag live.  

**CI/CD:** GitHub Actions: test/build/deploy on push; wrangler publish.

---

## 13) Приёмочные критерии (MVP)

- **UBL:** 100% fixtures pass lite (valid/errors match); strict ≥10 rules trigger (EN v2 DRR); Flatten sums exact (decimal.js).  
- **DATEV:** EXTF import to DATEV test (manual verify cols/SKR2025); Auto-Fix ≥5 types logged; Groq mapping ≥70% accurate (manual benchmark).  
- **Chain:** ≥90% end-to-end success (no errors); ZIP export valid.  
- **ViDA/BIS:** Score calc; Preview flag switches rules without crash.  
- **Perf/Sec:** Artillery p95≤5s; Erase-all clears 100%; No PII in D1 (query verify).  
- **Общее:** Deployed, 0 critical Sentry, NPS survey ≥40 from beta.  

**Что передать команде сейчас:**  
1. GitHub repo scaffold + wrangler.toml (bindings/cron).  
2. Zod DTOs + shared/utils.ts (decimal helpers).  
3. Lite-rules.ts (25 rules с v2 DRR) + tests.  
4. Stripe preset JSON + csv-stripe-2025.json (multi-currency).  
5. Fixtures dir + Vitest e2e/Artillery.yml.  
6. Groq prompts.md (templates + mocks).  

Это полное ТЗ — берите в работу! Вопросы — в issues. Удачи с ViDA-лаунчем!
