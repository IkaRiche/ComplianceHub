# ViDA UBL Validator & Flattener MVP

A fast, secure, and compliant UBL invoice validation and flattening service built for European developers and SMBs. Validates against EN 16931 v2 and Peppol BIS 4.0 standards with ViDA Digital Reporting Requirements support.

## 🚀 Features

### 🛡️ Validation
- **25+ Lite Rules**: Core EN 16931 BR rules + ViDA/BIS 4.0 extensions
- **Multiple Profiles**: UBL, XRechnung, Peppol BIS support
- **ViDA Compliance**: Scoring (0-100) with detailed checklist
- **Real-time Feedback**: Errors, warnings, and improvement hints

### 📊 Flattening
- **CSV/JSON Export**: Multiple output formats
- **Denormalized Mode**: Repeat header in each line
- **Tax Columns**: Pivot VAT rates as separate columns
- **Decimal Precision**: Accurate calculations with decimal.js

### ⚡ Performance
- **Sub-5s Processing**: p95 ≤ 5s for 1MB XML files
- **Cloudflare Edge**: Global CDN and serverless compute
- **No Storage**: In-memory processing for security

### 🔒 Security & Compliance
- **GDPR Compliant**: No data persistence
- **Free Tier**: 100 validations/day
- **Rate Limited**: Anti-abuse protection
- **Secure Upload**: 5MB file size limit

## 🏗️ Architecture

### Monorepo Structure
```
compliance-hub/
├── apps/
│   ├── ui/          # React + Vite UI
│   └── api/         # Cloudflare Workers API
├── packages/
│   ├── core-ubl/    # Validation & flattening logic
│   └── shared/      # Common types & utilities
└── tests/
    └── fixtures/    # Test UBL files
```

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Zustand
- **API**: Cloudflare Workers, itty-router, KV storage
- **Validation**: fast-xml-parser, Zod, decimal.js
- **Build**: Vite, Turborepo, pnpm workspaces
- **Deploy**: Cloudflare Pages + Workers

## 🛠️ Development

### Prerequisites
- Node.js 18+
- pnpm 8+
- Cloudflare account (for deployment)

### Quick Start
```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### Development URLs
- **UI**: http://localhost:5173
- **API**: http://localhost:8787

### Environment Setup
1. Copy `wrangler.toml.example` to `apps/api/wrangler.toml`
2. Update KV namespace IDs
3. Set environment variables

## 📋 API Endpoints

### POST /api/validate
Validate UBL XML file with optional ViDA scoring.

**Request**: `multipart/form-data`
- `file`: UBL XML file (max 5MB)
- `vida`: "true" for ViDA mode (optional)

**Response**: 
```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": [],
    "warnings": [],
    "infos": [],
    "meta": {
      "profile": "PEPPOL",
      "score": 100,
      "vidaCompliant": true,
      "checklist": [...]
    }
  }
}
```

### POST /api/flatten
Flatten UBL XML to CSV/JSON format.

**Request**: `multipart/form-data`
- `file`: UBL XML file (max 5MB)
- `denormalized`: "true" for denormalized output
- `taxColumns`: "true" for tax rate columns
- `format`: "csv" | "json" (default: csv)

**Response**: CSV file or JSON data

### POST /api/process
Combined validation and flattening in single request.

### GET /api/quota
Get current quota usage and limits.

## 🧪 Testing

### Test Fixtures
- `ubl-clean.xml`: Valid UBL invoice (score: 100)
- `ubl-dirty.xml`: Invalid UBL with multiple errors

### Running Tests
```bash
# All tests
pnpm test

# Package-specific tests
cd packages/core-ubl
pnpm test
```

### Coverage
Target: 80%+ test coverage for core validation logic.

## 🚀 Deployment

### Cloudflare Setup
1. Create KV namespace: `wrangler kv:namespace create "KV_QUOTA"`
2. Update `wrangler.toml` with namespace ID
3. Deploy API: `cd apps/api && pnpm deploy`
4. Deploy UI: `cd apps/ui && pnpm deploy`

### Production URLs
- **API**: `https://compliancehub-api.your-domain.workers.dev`
- **UI**: `https://compliancehub.pages.dev`

### Monitoring
- Cloudflare Analytics for usage metrics
- Worker logs for error tracking
- KV storage for quota management

## 📜 Validation Rules

### Core EN 16931 Rules (BR-01 to BR-20)
- Document structure validation
- Required fields checking  
- Arithmetic calculations
- VAT handling
- Party information

### ViDA Extensions (V2-*)
- Digital Reporting Reference (DRR)
- Enhanced reverse charge validation
- Digital signature readiness

### Peppol BIS 4.0 Preview (BIS4-*)
- Self-billing indicators
- Enhanced document references

## 🎯 ViDA Compliance

### Scoring Algorithm
- **Errors**: -10 points each
- **Warnings**: -2 points each
- **Base Score**: 100 points
- **ViDA Aligned**: Score ≥ 80

### Checklist Items
1. ✅ Digital Reporting Reference (DRR-01)
2. ✅ VAT Exemption Reasons
3. ✅ Arithmetic Calculations
4. ✅ Reverse Charge Handling
5. ✅ Self-billing Flags

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript strict mode
2. Write tests for new features
3. Use conventional commits
4. Update documentation

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-validation-rule
git commit -m "feat: add BR-XX validation rule"
git push origin feature/new-validation-rule
```

## 📊 Performance Targets

- **Validation**: p95 ≤ 5s for 1MB files
- **Accuracy**: 90%+ fixture validation match
- **Availability**: 99.9% uptime
- **Quota**: 100 free validations/day

## 🆘 Support

### Common Issues
1. **Large Files**: Max 5MB limit
2. **Quota Exceeded**: Wait for daily reset
3. **Validation Errors**: Check rule hints

### Contact
- Issues: GitHub Issues
- Documentation: `/docs` 
- Email: support@compliancehub.dev

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built for the EU ViDA ecosystem** 🇪🇺  
Compatible with EN 16931 v2, Peppol BIS 4.0, and XRechnung standards.