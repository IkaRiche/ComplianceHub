# 🚀 ViDA UBL Validator & Flattener - Production Ready

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://github.com/IkaRiche/ComplianceHub)
**Note: This project has merged into [kilu-sdk](https://github.com/IkaRiche/kilu-sdk/tree/main/examples/vi-da-ubl-validator).**
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[![EN 16931 v2](https://img.shields.io/badge/EN%2016931-v2-blue.svg)](https://ec.europa.eu/digital-building-blocks/wikis/display/CEFDIGITAL/EN+16931+European+Standard)
[![Peppol BIS 4.0](https://img.shields.io/badge/Peppol%20BIS-4.0-green.svg)](https://docs.peppol.eu/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()

> **Fast, secure, and ViDA-compliant UBL invoice validation with PDF reports for the European digital economy**

Validate UBL invoices against EN 16931 v2 and Peppol BIS 4.0 standards with **ViDA Digital Reporting Requirements** scoring. Built for EU developers, fintech companies, and SMBs. Now with professional PDF reporting and enhanced UX.

## ⚡ Live Demo

🌐 **Try it now**: [compliancehub.pages.dev](https://compliancehub.pages.dev)  
🔗 **API**: [compliancehub-api.heizungsrechner.workers.dev](https://compliancehub-api.heizungsrechner.workers.dev/api/quota)  
📊 **Test instantly**: Upload any UBL XML • Get instant ViDA scoring • Export to PDF/CSV/JSON

## 🎯 Key Features

### ✅ **25 Validation Rules**
- **EN 16931 v2**: Core business rules (BR-01 to BR-20)
- **ViDA Extensions**: Digital Reporting Reference validation
- **Peppol BIS 4.0**: Self-billing and enhanced document references
- **Real-time Feedback**: Detailed error messages with fix hints

### 📊 **ViDA Compliance Scoring**
- **0-100 Score**: Automated compliance calculation
- **≥80 = ViDA Aligned**: Ready for EU Digital Reporting
- **5-Point Checklist**: DRR, VAT, arithmetic, reverse charge, self-billing
- **Compliance Dashboard**: Visual scoring with actionable insights

### 🔄 **Data Export & Reporting**
- **CSV Export**: Denormalized invoice data for analysis
- **JSON Output**: Structured data for system integration  
- **PDF Reports**: Professional compliance reports for audits
- **Tax Columns**: Separate columns for each VAT rate
- **Excel-Ready**: Direct import into spreadsheets and BI tools

### ⚡ **Performance & UX**
- **Sub-3s Processing**: p95 ≤ 3s for 1MB files (optimized)
- **Smart File Validation**: Friendly error messages for non-XML files
- **No Data Storage**: GDPR-compliant in-memory processing
- **100 Free Daily**: Generous quota for testing and development  
- **Global CDN**: Cloudflare edge computing
- **Mobile Responsive**: Works perfectly on all devices

## 🏗️ Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   React UI  │───▶│ CF Workers   │───▶│ UBL Parser  │
│  (Vite SPA) │    │   (API)      │    │ (25 Rules)  │
└─────────────┘    └──────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ CF Pages    │    │ KV Storage   │    │ CSV/JSON    │
│ (Static)    │    │ (Quotas)     │    │ Flattener   │
└─────────────┘    └──────────────┘    └─────────────┘
```

## 🆕 Latest Features (v2025-10-06)

### 🎯 **Enhanced UX & Polish**
- ✅ **Smart File Validation**: Friendly error handling with helpful tips for non-XML uploads
- ✅ **PDF Report Generation**: Professional compliance reports with ViDA checklist and detailed issues  
- ✅ **API Integration Teaser**: Built-in cURL examples and beta API signup in footer
- ✅ **Performance Optimized**: Fixed infinite quota requests, improved caching
- ✅ **Always-Available Exports**: PDF reports for all validations, CSV/JSON for valid files

### 🔧 **Developer Experience**
```bash
# API Integration - Ready to use
curl -X POST -F "file=@invoice.xml" -F "vida=true" \
  https://compliancehub-api.heizungsrechner.workers.dev/api/validate

# Response: {"success":true,"data":{"score":80,"aligned":true}}
```

## 🚀 Quick Deploy

### 1. **GitHub Setup**
```bash
# Clone the production-ready repository
git clone https://github.com/IkaRiche/ComplianceHub.git
cd ComplianceHub
npm install
npm run build
```

### 2. **Cloudflare Setup**
1. **Connect Repository** to [Cloudflare Pages](https://pages.cloudflare.com)
2. **Build Settings**:
   - Build command: `cd apps/ui && npm run build`
   - Build output: `apps/ui/dist`
   - Node version: `18`

### 3. **GitHub Secrets**
Add to repository secrets:
```
CLOUDFLARE_API_TOKEN = your-cloudflare-api-token
```

### 4. **Auto-Deploy**
Push to `main` branch → GitHub Actions → Auto-deploy to Cloudflare! 🎉

## 📚 API Documentation

### **POST /api/validate**
Validate UBL XML with optional ViDA scoring
```bash
curl -X POST https://compliancehub-api.heizungsrechner.workers.dev/api/validate \
  -F "file=@invoice.xml" \
  -F "vida=true"
```

### **POST /api/flatten**  
Convert UBL to CSV/JSON
```bash
curl -X POST https://compliancehub-api.heizungsrechner.workers.dev/api/flatten \
  -F "file=@invoice.xml" \
  -F "denormalized=true"
```



### **POST /api/process**
Combined validation + flattening (recommended)
```bash
curl -X POST https://compliancehub-api.heizungsrechner.workers.dev/api/process \
  -F "file=@invoice.xml" \
  -F "vida=true" \
  -F "denormalized=true"
```

## 🧪 Test Files

Use the included test fixtures:
- `tests/fixtures/ubl-clean.xml` - ✅ Valid UBL (Score: 100)
- `tests/fixtures/ubl-dirty.xml` - ❌ Multiple errors (Score: <80)

## 📄 PDF Compliance Reports

Generate professional PDF reports for:
- **Compliance Audits**: Full validation summary with ViDA checklist
- **Stakeholder Sharing**: Executive-friendly format with scores and recommendations  
- **Issue Tracking**: Detailed error/warning breakdown with rule references
- **Certification**: Official-looking reports with timestamps and branding

**Sample PDF Contents:**
- Validation status (PASSED/FAILED) with color coding
- ViDA Compliance Score (0-100) and alignment status  
- 5-point ViDA checklist with ✓/✗ indicators
- Detailed issues breakdown with rule IDs and fix suggestions
- ComplianceHub branding and generation metadata

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📋 Validation Rules

| Rule ID | Standard | Description | Severity |
|---------|----------|-------------|----------|
| BR-01 | EN 16931 | Specification identifier | ERROR |
| BR-04 | EN 16931 | Invoice issue date | ERROR |
| BR-13 | EN 16931 | VAT exemption reason | ERROR |
| V2-DRR-01 | ViDA | Digital Reporting Reference | WARN |
| BIS4-SB-01 | Peppol BIS 4.0 | Self-billing indicator | WARN |

[📖 View all 25 rules](docs/validation-rules.md)

## 🎯 ViDA Compliance

The **ViDA (ViDA in the EU)** initiative requires:
- ✅ **EN 16931 v2** compliance (September 2025)
- ✅ **Digital Reporting References** (DRR fields)
- ✅ **B2G mandatory** from January 2025
- ✅ **Enhanced VAT handling** for cross-border

**ComplianceHub ensures your invoices are ViDA-ready!**

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-rule`
3. Commit changes: `git commit -m "feat: add BR-XX validation"`
4. Push branch: `git push origin feature/new-rule`
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: [/docs](docs/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/IkaRiche/ComplianceHub/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/IkaRiche/ComplianceHub/discussions)
- 📧 **Email**: api@compliancehub.dev

---

**Built for the European ViDA ecosystem** 🇪🇺  
*Compatible with EN 16931 v2, Peppol BIS 4.0, and XRechnung standards*

---

**🎯 Production Status:** MVP Complete • PDF Reports • API Ready • UX Polished  
**📊 Current Version:** v2025-10-06 with enhanced UX and professional reporting

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://github.com/IkaRiche/ComplianceHub)
