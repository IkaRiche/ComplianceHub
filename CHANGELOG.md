# Changelog

All notable changes to ComplianceHub will be documented in this file.

## [2025-10-06] - Production Ready MVP + PDF Encoding Fix

### ✨ Added
- **PDF Report Generation**: Professional compliance reports with jsPDF
  - Full validation summary with color-coded status
  - ViDA compliance checklist with ✓/✗ indicators
  - Detailed issues breakdown with rule references
  - Executive-friendly format for stakeholders and audits
- **API Integration Teaser**: Built-in developer onboarding
  - Collapsible footer section with cURL examples
  - Beta API access signup (api@compliancehub.dev)
  - Free tier information (100 requests/day)
- **Enhanced File Validation**: Friendly error handling
  - Smart detection of non-XML files with helpful tips
  - Improved error messages for file type, size, and format issues
  - UBL-specific guidance for users

### 🔧 Fixed
- **PDF UTF-8 Encoding Issues**: Resolved garbled text in compliance reports
  - Created dedicated pdfGenerator utility with proper character handling
  - Implemented safeText() function to sanitize problematic UTF-8 characters
  - Replaced Unicode symbols (✓✗) with ASCII-safe alternatives ([OK]/[X])
  - Added jspdf-autotable for professional table formatting
  - Enhanced font selection (Times) for better character support
  - **Result**: Clean "Status: FAILED [X]" instead of "�S�t�a�t�u�s�: �F�A�I�L�E�D"
- **Infinite Quota Requests**: Resolved React useEffect dependency loop
  - Removed getQuota from useEffect dependencies
  - Implemented global quota cache (30-second TTL)
  - Optimized API calls to reduce server load
- **Router Configuration**: Complete API endpoint implementation
  - Added Router({ base: '/api' }) configuration
  - Implemented all endpoints: /quota, /validate, /flatten, /process
  - Fixed 404 errors and CORS connectivity issues

### 🎨 Improved
- **User Experience**: Enhanced UI/UX across the board
  - Always-available export options (PDF for all, CSV/JSON for valid)
  - Better visual feedback for file uploads and validation
  - Mobile-responsive design improvements
- **Performance**: Optimized for production use
  - Sub-3s processing time for 1MB files
  - Efficient caching mechanisms
  - Reduced bundle size with code splitting

### 📦 Dependencies
- Added `jspdf` + `jspdf-autotable` for professional PDF generation
- Updated React components with enhanced error handling
- Optimized build process with Vite bundling
- Enhanced UTF-8 text processing utilities

## [Previous Versions] - MVP Development

### Core Features Implemented
- ✅ 25+ validation rules (EN 16931 v2, Peppol BIS 4.0)
- ✅ ViDA compliance scoring (0-100 scale)
- ✅ CSV/JSON data flattening
- ✅ Cloudflare Workers API (serverless)
- ✅ Cloudflare Pages UI (static hosting)
- ✅ KV storage for quota management
- ✅ Monorepo architecture with Turborepo

---

**Next Planned Features:**
- [ ] Multi-language support (DE/EN)
- [ ] Enhanced API documentation
- [ ] User authentication and premium tiers
- [ ] Batch processing for multiple files
- [ ] Webhook integration for automated workflows