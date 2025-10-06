# Deployment Guide

## 🚀 Quick Deployment

### 1. Prerequisites
- Node.js 18+
- Cloudflare account with Workers and Pages enabled
- Git repository (GitHub/GitLab)

### 2. Cloudflare Setup

#### Автоматическая настройка KV
KV Namespaces создаются автоматически при первом деплое. Но для полной функциональности квот:

```bash
# После первого успешного deploy Worker'а
chmod +x scripts/setup-kv.sh
./scripts/setup-kv.sh
```

Этот скрипт:
1. ✅ Создаст KV namespace автоматически
2. ✅ Обновит wrangler.toml с правильными ID
3. ✅ Пере-задеплоит Worker с KV биндингами

### 3. Deploy API (Workers)
```bash
cd apps/api
npm run build
wrangler deploy
```

### 4. Deploy UI (Pages)
```bash
cd apps/ui
npm run build
wrangler pages deploy dist --project-name=compliance-hub-ui
```

### 5. Environment Variables
Set these in Cloudflare Workers dashboard:
- `API_VERSION`: `2025-10-06`
- `MAX_FILE_SIZE`: `5242880`
- `FREE_QUOTA_DAILY`: `100`

## 🔧 Development Deployment

### Local Development
```bash
# Terminal 1 - API
cd apps/api
npm run dev  # Starts on localhost:8787

# Terminal 2 - UI
cd apps/ui
npm run dev  # Starts on localhost:5173
```

### Testing
```bash
# Run all tests
npm test

# Package-specific tests
cd packages/core-ubl
npm test
```

## 📊 Production Monitoring

### Cloudflare Analytics
- Worker metrics: Requests, errors, CPU time
- Pages analytics: Page views, bandwidth
- KV usage: Read/write operations

### Key Metrics to Monitor
1. **API Response Times**: p95 ≤ 5s target
2. **Error Rate**: < 1% target
3. **Quota Usage**: Track daily limits
4. **File Size**: 5MB limit enforcement

### Alerts Setup
Configure Cloudflare alerts for:
- Worker errors > 5%
- Response time > 10s
- KV storage > 80% capacity

## 🔐 Security Configuration

### CORS Settings
Already configured in `apps/api/src/index.ts`:
- Allow Origins: `*` (configure for production)
- Methods: GET, POST, OPTIONS
- Headers: Content-Type, Authorization

### Rate Limiting
- Built-in quota system via KV
- 100 requests/day per user (free tier)
- IP-based identification

### File Upload Security
- 5MB file size limit
- XML content type validation
- No file persistence (in-memory only)

## 🌍 Custom Domain Setup

### Cloudflare Pages (UI)
1. Go to Cloudflare Pages dashboard
2. Select your project
3. Custom domains → Add custom domain
4. Configure DNS: CNAME to your-project.pages.dev

### Cloudflare Workers (API)
1. Go to Workers dashboard
2. Select your worker
3. Triggers → Custom domains
4. Add route: api.yourdomain.com/*

### DNS Configuration
```
CNAME app.yourdomain.com your-project.pages.dev
CNAME api.yourdomain.com your-worker.your-subdomain.workers.dev
```

## 🔄 CI/CD Pipeline

### GitHub Actions (`.github/workflows/ci.yml`)
Automatic deployment on push to `main`:

1. **Test Phase**: Run unit tests
2. **Build Phase**: Build all packages
3. **Deploy API**: Deploy to Cloudflare Workers
4. **Deploy UI**: Deploy to Cloudflare Pages

### Required Secrets
Add to GitHub repository secrets:
- `CLOUDFLARE_API_TOKEN`: Account API token with Worker/Pages permissions

### Manual Deployment
```bash
# Deploy everything
npm run deploy

# Deploy specific apps
cd apps/api && npm run deploy
cd apps/ui && npm run deploy
```

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear caches and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### TypeScript Errors
- Ensure all workspace dependencies are built
- Check import paths use `.js` extensions
- Verify type declarations exist

#### Deployment Failures
```bash
# Check Wrangler authentication
wrangler whoami

# Verify KV namespaces
wrangler kv:namespace list

# Check deployment logs
wrangler tail your-worker-name
```

#### CORS Issues
- Verify API endpoints include CORS headers
- Check browser dev tools network tab
- Ensure OPTIONS preflight is handled

### Performance Optimization

#### API Optimization
- Use Workers KV caching for static data
- Implement response compression
- Optimize XML parsing for large files

#### UI Optimization
- Enable Cloudflare minification
- Use CDN for static assets
- Implement code splitting

### Monitoring Commands
```bash
# Check worker logs
wrangler tail compliance-hub-api

# View KV data
wrangler kv:key list --namespace-id=your-kv-id

# Test endpoints
curl -X POST https://your-api-domain/api/validate \
  -F "file=@test.xml" \
  -F "vida=true"
```

## 📈 Scaling Considerations

### Free Tier Limits
- Workers: 100k requests/day
- Pages: Unlimited requests
- KV: 1k writes/day, 10k reads/day

### Paid Tier Benefits
- Workers: $5/month, 10M requests/month
- KV: Additional read/write operations
- Analytics: Extended metrics

### Performance Targets
- **Validation**: p95 ≤ 5s for 1MB files
- **Availability**: 99.9% uptime
- **Accuracy**: 90%+ fixture validation match

---

**Ready for production!** 🎉

After deployment, test with the provided fixtures and monitor metrics in the Cloudflare dashboard.