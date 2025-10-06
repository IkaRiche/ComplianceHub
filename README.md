# 🚀 ViDA UBL Validator & Flattener - Production Ready

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://github.com/yourusername/compliancehub)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![EN 16931 v2](https://img.shields.io/badge/EN%2016931-v2-blue.svg)](https://ec.europa.eu/digital-building-blocks/wikis/display/CEFDIGITAL/EN+16931+European+Standard)
[![Peppol BIS 4.0](https://img.shields.io/badge/Peppol%20BIS-4.0-green.svg)](https://docs.peppol.eu/)

> **Fast, secure, and ViDA-compliant UBL invoice validation for the European digital economy**

Validate UBL invoices against EN 16931 v2 and Peppol BIS 4.0 standards with **ViDA Digital Reporting Requirements** scoring. Built for EU developers, fintech companies, and SMBs.

## ⚡ Live Demo

🌐 **Try it now**: [compliancehub.pages.dev](https://compliancehub.pages.dev)  
🔗 **API**: [compliancehub-api.workers.dev](https://compliancehub-api.workers.dev/health)

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

### 🔄 **Data Flattening**
- **CSV Export**: Denormalized invoice data for analysis
- **JSON Output**: Structured data for system integration
- **Tax Columns**: Separate columns for each VAT rate
- **Excel-Ready**: Direct import into spreadsheets and BI tools

### ⚡ **Performance & Security**
- **Sub-5s Processing**: p95 ≤ 5s for 1MB files
- **No Data Storage**: GDPR-compliant in-memory processing
- **100 Free Daily**: Generous quota for testing and development
- **Global CDN**: Cloudflare edge computing

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

## 🚀 Quick Deploy

### 1. **GitHub Setup**
```bash
# Clone and push to your GitHub repo
git clone https://github.com/yourusername/compliancehub.git
cd compliancehub
git remote set-url origin https://github.com/yourusername/your-repo.git
git push origin main
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
curl -X POST https://compliancehub-api.workers.dev/api/validate \
  -F "file=@invoice.xml" \
  -F "vida=true"
```

### **POST /api/flatten**  
Convert UBL to CSV/JSON
```bash
curl -X POST https://compliancehub-api.workers.dev/api/flatten \
  -F "file=@invoice.xml" \
  -F "denormalized=true"
```

### **GET /api/quota**
Check your daily quota
```bash
curl https://compliancehub-api.workers.dev/api/quota
```

## 🧪 Test Files

Use the included test fixtures:
- `tests/fixtures/ubl-clean.xml` - ✅ Valid UBL (Score: 100)
- `tests/fixtures/ubl-dirty.xml` - ❌ Multiple errors (Score: <80)

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
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/compliancehub/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/compliancehub/discussions)
- 📧 **Email**: support@compliancehub.dev

---

**Built for the European ViDA ecosystem** 🇪🇺  
*Compatible with EN 16931 v2, Peppol BIS 4.0, and XRechnung standards*

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://github.com/yourusername/compliancehub)