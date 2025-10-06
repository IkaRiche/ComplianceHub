# 🚀 Deployment Guide

This document explains how to deploy ComplianceHub to Cloudflare.

## 📋 Prerequisites

- Cloudflare account with Pages and Workers enabled
- GitHub repository access
- Node.js 18+ installed locally

## 🔧 Environment Setup

### 1. Cloudflare API Token
Create a Cloudflare API token with these permissions:
- **Zone:Zone:Read** (for domain management)
- **Page:Edit** (for Pages deployment)
- **Workers:Edit** (for Workers deployment)

### 2. KV Namespace Setup
Create KV namespaces in Cloudflare dashboard:
```bash
# Production KV namespace
wrangler kv:namespace create "KV_QUOTA"

# Preview KV namespace (for staging)  
wrangler kv:namespace create "KV_QUOTA" --preview
```

Update `apps/api/wrangler.toml` with your KV namespace IDs:
```toml
kv_namespaces = [
  { binding = "KV_QUOTA", id = "your-production-id", preview_id = "your-preview-id" }
]
```

## 🌐 Live Deployment

### Current Production URLs
- **UI**: https://compliancehub.pages.dev
- **API**: https://compliancehub-api.heizungsrechner.workers.dev

### API Endpoints
- `GET /api/quota` - Check daily quota
- `POST /api/validate` - Validate UBL with ViDA scoring
- `POST /api/flatten` - Convert UBL to CSV/JSON
- `POST /api/process` - Combined validation + flattening

## 📦 Manual Deployment

### 1. Deploy API (Cloudflare Workers)
```bash
cd apps/api
wrangler deploy
```

### 2. Deploy UI (Cloudflare Pages)
```bash
cd apps/ui
npm run build
wrangler pages deploy dist --project-name=compliancehub
```

## 🤖 Automatic Deployment (GitHub Actions)

### Setup Repository Secrets
Add these secrets to your GitHub repository:
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### GitHub Actions Workflow
The repository includes `.github/workflows/deploy.yml` for automatic deployment:
- **Trigger**: Push to `main` branch
- **Process**: Build → Test → Deploy to Cloudflare
- **Environments**: Production (main branch)

## 🔍 Monitoring & Debugging

### Check API Health
```bash
curl https://compliancehub-api.heizungsrechner.workers.dev/api/quota
```

### View Worker Logs
```bash
wrangler tail --format=pretty
```

### Pages Build Logs
Check build logs in Cloudflare Pages dashboard under your project.

## ⚙️ Configuration

### Environment Variables
- `CLOUDFLARE_API_TOKEN` - API authentication
- `CLOUDFLARE_ACCOUNT_ID` - Account identification

### Build Settings (Cloudflare Pages)
- **Build command**: `cd apps/ui && npm run build`
- **Build output**: `apps/ui/dist`
- **Node version**: `18`
- **Root directory**: `/` (monorepo setup)

### Custom Domains
To use a custom domain:
1. Add domain in Cloudflare Pages dashboard
2. Update DNS records to point to Cloudflare
3. Enable SSL/TLS encryption

## 🚨 Troubleshooting

### Common Issues
1. **404 on API endpoints**: Check router base path configuration
2. **CORS errors**: Verify API CORS headers in Workers
3. **Build failures**: Check Node.js version and dependencies
4. **KV namespace errors**: Verify namespace IDs in wrangler.toml

### Debug Commands
```bash
# Test API locally
cd apps/api && wrangler dev

# Test UI locally  
cd apps/ui && npm run dev

# Check build output
cd apps/ui && npm run build && ls -la dist/
```

## 📈 Performance Optimization

- **API Response Time**: Target <3s for 1MB files
- **UI Load Time**: Target <2s initial load
- **Caching**: 30-second quota cache, CDN asset caching
- **Bundle Size**: Optimized with Vite code splitting

---

**Support**: For deployment issues, check logs or open a GitHub issue.