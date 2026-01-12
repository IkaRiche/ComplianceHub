# 🚀 Cloudflare Production Setup Guide

## 1. Cloudflare Pages Configuration

### **Project Settings**
- **Project Name**: `compliancehub` (без дефисов!)
- **Production URL**: `https://compliancehub.pages.dev`
- **Git Repository**: Connect to your GitHub repository
- **Production Branch**: `main`

### **Build Settings**
```
Build command: cd apps/ui && npm run build
Build output directory: apps/ui/dist
Root directory: / (оставить пустым - корень репозитория)
Node.js version: 18
```

### **Environment Variables (Pages)**
```
NODE_VERSION=18
VITE_API_URL=https://compliancehub-api.your-domain.workers.dev
```

## 2. Cloudflare Workers Configuration  

### **Worker Settings**
- **Worker Name**: `compliancehub-api` (без дефисов!)
- **Production URL**: `https://compliancehub-api.your-domain.workers.dev`

### **Environment Variables (Workers)**
```
API_VERSION=2025-10-06
MAX_FILE_SIZE=5242880
FREE_QUOTA_DAILY=100
```

## 3. KV Namespaces (Auto-Creation)

### **Automatic KV Creation**
При первом деплое Worker'а, KV namespace будет создан автоматически. После этого:

```bash
# 1. Получите список KV namespaces
wrangler kv:namespace list

# 2. Найдите ID для KV_QUOTA namespace
# Пример вывода:
# [
#   {
#     "id": "abc123def456",
#     "title": "compliancehub-api-KV_QUOTA"
#   }
# ]

# 3. Обновите wrangler.toml с реальными ID:
```

### **wrangler.toml Update After First Deploy**
```toml
kv_namespaces = [
  { binding = "KV_QUOTA", id = "your-real-production-id", preview_id = "your-real-preview-id" }
]

[env.production]
kv_namespaces = [
  { binding = "KV_QUOTA", id = "your-real-production-id" }
]
```

## 4. GitHub Repository Setup

### **Required GitHub Secrets**
В настройках репозитория GitHub → Settings → Secrets and variables → Actions:

```
CLOUDFLARE_API_TOKEN = your-cloudflare-api-token
```

### **How to Get Cloudflare API Token**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. **Permissions**:
   - `Zone:Zone:Read`
   - `Zone:Zone Settings:Edit` 
   - `User:User Details:Read`
   - `Account:Cloudflare Workers:Edit`
   - `Zone:Page Rules:Edit`

## 5. Auto-Deploy Process

### **Workflow**
1. **Push to main** → GitHub Actions triggers
2. **Build & Test** → All packages build successfully
3. **Deploy API** → Wrangler deploys Worker
4. **Deploy UI** → Wrangler deploys Pages
5. **Live URLs** → Both services available

### **Manual Deploy Commands**
```bash
# Deploy API only
cd apps/api
wrangler deploy

# Deploy UI only  
cd apps/ui
npm run build
wrangler pages deploy dist --project-name=compliancehub

# Deploy both
npm run deploy
```

## 6. Domain Configuration (Optional)

### **Custom Domains**
```
# Pages (UI)
app.yourdomain.com → compliancehub.pages.dev

# Workers (API) 
api.yourdomain.com → compliancehub-api.your-subdomain.workers.dev
```

### **DNS Records**
```
CNAME app CNAME compliancehub.pages.dev
CNAME api CNAME compliancehub-api.your-subdomain.workers.dev
```

## 7. Production Monitoring

### **Key Metrics**
- **Workers**: Request rate, error rate, CPU time
- **Pages**: Bandwidth, cache hit ratio
- **KV**: Read/write operations, storage usage

### **Alerts Setup**
Configure in Cloudflare Dashboard:
- Worker errors > 5%
- Response time > 10s  
- KV operations > 80% quota

## 8. First Deployment Checklist

### **Before Deploy**
- [ ] GitHub repo with code in `main` branch
- [ ] CLOUDFLARE_API_TOKEN in GitHub secrets
- [ ] Cloudflare account with Workers & Pages enabled

### **Deploy Steps**
1. **Connect Repository** to Cloudflare Pages
2. **Configure Build Settings** (see above)
3. **Push to main** → Auto-deploy starts
4. **Update KV IDs** in wrangler.toml after first deploy
5. **Test APIs** with provided fixtures

### **Post-Deploy Verification**
```bash
# Test health endpoint
curl https://compliancehub-api.your-domain.workers.dev/health

# Test quota endpoint  
curl https://compliancehub-api.your-domain.workers.dev/api/quota

# Test UI
open https://compliancehub.pages.dev
```

---

## 🎯 Production URLs (After Deploy)

- **UI**: https://compliancehub.pages.dev
- **API**: https://compliancehub-api.your-subdomain.workers.dev  
- **Health**: https://compliancehub-api.your-subdomain.workers.dev/health

**Ready for production deployment!** 🚀