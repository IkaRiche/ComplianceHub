# Техническое Задание (ТЗ) v3.0: MVP "ViDA UBL Validator & Flattener"

**Дата версии:** 06 октября 2025  
**Версия:** 3.0 (MVP "Scalpel": фокус на UBL-only, lite-validation, flattener + ViDA Score чек-лист. Отложено: DATEV, chain, Groq, WASM strict. Актуально на октябрь 2025: EN 16931 v2 release 1.3.13 с updated code lists от октября; Peppol BIS 4.0 preview с self-billing mandatory с 25 августа 2025 и full rollout с 12 марта 2025; ViDA B2G в DE с января 2025).  
**Цель ТЗ:** Полный план реализации MVP за 1-2 часа (scaffold + core) + 1 день polish/deploy. Это "боевой прототип" для beta: users upload XML → get report/score/CSV. Готово к LinkedIn demo.  
**Аудитория:** DE/EU devs/fintech/SMB (ViDA pain: 40%+ не готовы к EN v2/B2G deadline).  
**Стек:** TS, React/Vite (UI), CF Workers (API), pnpm/Turborepo monorepo.  
**Репо:** GitHub (public для beta).  

---

## 0) Delta к v2.0 и цели MVP

**Delta:**  
- **Фокус:** Только UBL Validator (lite-rules 25+, включая EN v2 DRR и BIS 4.0 self-billing preview) + Flattener (CSV/JSON). Нет DATEV/chain/Groq/WASM — static hints/checklist вместо AI.  
- **ViDA:** Score 0-100 с чек-листом (5-7 top rules: DRR refs, VAT exemptions, self-billing flags). Badge "ViDA-Aligned" если ≥80.  
- **Updates:** EN v2 artefacts 1.3.13 (October 2025 code lists); BIS 4.0 self-billing mandatory 12/03/2025 (preview checks в lite-rules).  
- **НФТ:** p95 ≤5s на 1MB XML; 90% fixtures valid/errors match; no storage (in-memory).  

**Цели MVP:**  
- **ЧТО:** Users: Upload UBL XML → Lite-validate → ViDA Score + errors checklist → Flatten CSV/JSON + PDF report. API для devs (cURL-ready).  
- **КАК:** 1-час build (scaffold + core code) + deploy. Тестируем на 6 fixtures (3 clean/3 dirty).  
- **Метрики:** 100% fixtures pass; demo-гифка 20s; beta-ready (Free: 100/mo via KV).  

---

## 1) Архитектура

**Monorepo (pnpm + Turborepo):** Клон abereghici/turborepo-vite-boilerplate (обновлён сентябрь 2025).  

**Структура (минимальная для MVP):**
```
compliance-hub/
├── apps/
│   ├── ui/          # React/Vite (CF Pages)
│   │   ├── package.json
│   │   ├── vite.config.ts  # proxy /api → http://localhost:8787
│   │   └── src/App.tsx     # Dropzone + results
│   └── api/         # CF Workers TS
│       ├── package.json
│       ├── src/index.ts    # Router + endpoints
│       └── wrangler.toml   # Bindings KV_QUOTA
├── packages/
│   ├── core-ubl/    # Validator + flattener
│   │   ├── src/
│   │   │   ├── validator.ts
│   │   │   ├── rules.ts
│   │   │   └── flatten.ts
│   │   └── tests/
│   └── shared/      # Types + utils
│       └── src/types.ts
├── pnpm-workspace.yaml
├── turbo.json
└── package.json     # workspaces: ["apps/*", "packages/*"]
```

**Cloudflare ресурсы (MVP):**  
- **Pages:** UI deploy.  
- **Workers:** API (/validate, /flatten).  
- **KV:** QUOTA (user counters: {userId: {uses: 0}}).  
- **Bindings:** wrangler.toml: kv_namespaces = [{binding="KV_QUOTA", id="..."}]; vars: {STRIPE_SECRET="..."}.  

**Dependencies:** pnpm add fast-xml-parser papaparse decimal.js zod react-dropzone jsPDF (UI). Dev: vitest.  

---

## 2) Функциональные модули

**ЧТО:** Lite-validate (25 rules: core EN v2 BR-01-BR-20, arith/VAT, +5 ViDA/BIS4: DRR, self-billing). Flattener (denorm CSV repeat header). Report: JSON + PDF (score + checklist).  

**КАК (реализация):**  

### 2.1 UBL Validator (Lite)  
- **Вход:** XML string (UBL Invoice/CreditNote). Auto-detect profile (namespace: EN/PEPPOL/XRECHNUNG).  
- **Правила:** 25 TS funcs (array<Rule>): Check required BT (BR-01-BR-10), arith (sum linesNet === taxable, eps=0.01 decimal.js), VAT (0% requires reason BT-121), IDs (VAT/IBAN regex). +ViDA: DRR ref (BT-DRR-01 v2), self-billing flag (BIS4 preview). Severity: ERROR/WARN/INFO.  
- **ViDA Mode:** If true: Score = 100 - (errors*10 + warns*2); checklist: Array< {id, status: '✓ OK' | '✗ Fail', hint} > (5 top: DRR-01, VAT-0, RC-mismatch, self-billing, arith). vidaCompliant: score≥80.  
- **Выход:** {valid: bool, errors/warnings/infos: [{id, severity, path: XPath, msg, hint}], meta: {profile, score?, checklist?}}. Static hints: Map {id: {en: 'Fix: Add <cbc:IssueDate>', de: 'Beheben: Fügen Sie <cbc:IssueDate> hinzu'}}.  

### 2.2 UBL Flattener  
- **Вход:** Validated XML + options {denormalized: true, taxColumns: false}.  
- **Логика:** Parse XML (fast-xml-parser) → Extract header (Zod UblHeader) → Lines array (Zod UblLine) → If denorm: Repeat header in each row; taxColumns: Pivot rates (e.g., vat_19_base).  
- **Выход:** {csv: string (papaparse.unparse), json: {header, lines}}. PDF: jsPDF table (summary + checklist).  

**Error Handling:** Try-catch везде: Invalid XML → 400 {error: 'Not valid UBL'}.  

---

## 3) Контракты API (Workers)

**Auth:** None для MVP (beta free); quota check KV (if >100/day → 429).  

**КАК:** itty-router в index.ts. Version: X-API-Version: 2025-10-06.  

- **POST /api/validate**  
  In: FormData {file: XML, vida?: 'true'}.  
  Out: JSON {valid, errors[], meta {score, checklist if vida}}.  
  Code:  
  ```ts:disable-run
  router.post('/validate', async (req) => {
    try {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const xml = await file.text();
      const vida = formData.get('vida') === 'true';
      const result = validateUbl(xml, vida);
      return json(result);
    } catch (e) {
      return json({ error: 'Invalid XML' }, 400);
    }
  });
  ```

- **POST /api/flatten**  
  In: FormData {file: XML, denormalized?: 'true'}.  
  Out: CSV stream (text/csv) или JSON if ?json=true.  
  Code: Similar, return new Response(csv, {headers: {'Content-Type': 'text/csv'}}).  

- **GET /api/quota** (stub): {uses: 50/100}.  

---

## 4) UI/UX (React в apps/ui)

**ЧТО:** Single-page: Dropzone + checkbox ViDA + results (score, checklist accordion, download buttons).  

**КАК:** Vite + React 18. Zustand для state (loading/results).  

- **App.tsx:**  
  ```tsx
  import { useState } from 'react';
  import { useDropzone } from 'react-dropzone';

  function App() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [vida, setVida] = useState(false);

    const onDrop = async (files) => {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', files[0]);
        if (vida) formData.append('vida', 'true');

        const res = await fetch('/api/validate', { method: 'POST', body: formData });
        const data = await res.json();
        setResult(data);
      } catch (e) {
        alert('Upload failed');
      } finally {
        setLoading(false);
      }
    };

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    return (
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">ViDA UBL Validator</h1>
        <label className="flex items-center">
          <input type="checkbox" checked={vida} onChange={(e) => setVida(e.target.checked)} />
          <span className="ml-2">ViDA Mode</span>
        </label>
        <div {...getRootProps()} className="border-2 border-dashed p-4 mt-4">
          <input {...getInputProps()} />
          <p>Drop UBL XML here</p>
        </div>
        {loading && <p>Loading...</p>}
        {result && (
          <div className="mt-4">
            <h2 className="text-xl">Score: {result.meta?.score || 'N/A'}/100 {result.meta?.vidaCompliant ? '(Aligned)' : ''}</h2>
            <ul className="mt-2">
              {result.meta?.checklist?.map((item) => (
                <li key={item.id} className={item.status.includes('✓') ? 'text-green-600' : 'text-red-600'}>
                  {item.status} - {item.hint}
                </li>
              ))}
            </ul>
            <ul className="mt-2">
              {result.errors?.map((err) => <li key={err.id} className="text-red-500">{err.msg} ({err.hint})</li>)}
            </ul>
            <button onClick={() => {/* fetch /flatten, download */}} className="bg-blue-500 text-white px-4 py-2 mt-2">Download CSV</button>
          </div>
        )}
      </div>
    );
  }
  ```
- **Стили:** Tailwind (если в boilerplate) или plain CSS.  

---

## 5) Тесты

**ЧТО:** Unit для rules/flatten; e2e для flow.  

**КАK:** Vitest.  

- **core-ubl/tests/validator.test.ts:**  
  ```ts
  import { validateUbl } from '../src/validator';
  import fs from 'fs';

  test('Clean UBL valid + score 100', () => {
    const xml = fs.readFileSync('fixtures/ubl-clean.xml', 'utf8');
    const result = validateUbl(xml, true);
    expect(result.valid).toBe(true);
    expect(result.meta.score).toBe(100);
  });

  test('Dirty UBL catches BR-04 missing date', () => {
    const xml = fs.readFileSync('fixtures/ubl-dirty.xml', 'utf8');
    const result = validateUbl(xml);
    expect(result.errors.some(e => e.id === 'BR-04')).toBe(true);
  });
  ```
- **Fixtures:** 6 XML (3 clean: full EN v2/BIS4; 3 dirty: missing date/VAT reason/self-billing flag).  
- **Run:** `pnpm test` (80% coverage).  

---

## 6) Deploy & Quota

**ЧТО:** Live за 15 мин; Free quota 100/mo.  

**КАK:**  
- Build: `pnpm build`.  
- API: `wrangler deploy` (quota check: In /validate, get KV {uses: await env.KV_QUOTA.get(userId) || 0}; if >100 return 429; else ++ and set).  
- UI: `wrangler pages deploy` (vite build → dist).  
- Domain: compliancehub.dev (CF free).  

---

## 7) Приёмочные критерии

- **Validate:** 6 fixtures: Clean → valid + score 100/checklist all ✓; Dirty → 2-3 errors (e.g., BR-04, V2-DRR-01).  
- **Flatten:** CSV gen ≤5s, sums match (decimal.js exact).  
- **UI:** Upload → results display; loading spinner; Download triggers CSV.  
- **API:** cURL /validate → JSON 200; >quota → 429.  
- **Deploy:** Live URLs; p95 <5s (console.time).  

Это ТЗ — на 1 час реализации. Код из сниппетов копипаст + тесты. Готов приступать? Что первым: Клон boilerplate или full rules.ts?
```
