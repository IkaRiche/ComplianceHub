# 🔧 GitHub Actions Setup (После загрузки кода)

После того как код загружен в GitHub, нужно настроить GitHub Actions для автоматического деплоя на Cloudflare.

## 1. Создайте Workflow файл

В GitHub репозитории создайте файл `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Run tests
        run: npm test
        
      - name: Build packages
        run: npm run build

  deploy-api:
    name: Deploy API
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Build API
        run: cd apps/api && npm run build
        
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: apps/api
          command: deploy

  deploy-ui:
    name: Deploy UI
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Build UI
        run: cd apps/ui && npm run build
        
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: apps/ui
          command: pages deploy dist --project-name=compliancehub
```

## 2. Добавьте GitHub Secret

В настройках репозитория → Settings → Secrets and variables → Actions:

```
Name: CLOUDFLARE_API_TOKEN
Value: your-cloudflare-api-token
```

## 3. Получение Cloudflare API Token

1. Идите на https://dash.cloudflare.com/profile/api-tokens
2. Create Token → Custom Token
3. Permissions:
   - Account:Cloudflare Workers:Edit
   - Zone:Zone Settings:Read  
   - Zone:Zone:Read
   - User:User Details:Read

Теперь каждый push в main будет автоматически деплоить на Cloudflare! 🚀