#!/bin/bash

# 🔧 Automatic KV Namespace Setup Script
# Запускать ПОСЛЕ первого успешного deploy Worker'а

echo "🚀 Setting up KV Namespaces for ComplianceHub..."

cd apps/api

# 1. Создаем KV namespace для квот
echo "📦 Creating KV_QUOTA namespace..."
PRODUCTION_KV=$(wrangler kv:namespace create "KV_QUOTA" 2>/dev/null | grep -o '"id": "[^"]*"' | cut -d'"' -f4)
PREVIEW_KV=$(wrangler kv:namespace create "KV_QUOTA" --preview 2>/dev/null | grep -o '"id": "[^"]*"' | cut -d'"' -f4)

echo "✅ KV Namespaces created:"
echo "   Production ID: $PRODUCTION_KV"
echo "   Preview ID: $PREVIEW_KV"

# 2. Обновляем wrangler.toml
echo "📝 Updating wrangler.toml..."

# Создаем backup
cp wrangler.toml wrangler.toml.backup

# Обновляем конфигурацию
cat > wrangler.toml << EOF
name = "compliancehub-api"
main = "src/index.ts"
compatibility_date = "2025-10-06"
compatibility_flags = ["nodejs_compat"]

# KV namespaces (auto-generated)
kv_namespaces = [
  { binding = "KV_QUOTA", id = "$PRODUCTION_KV", preview_id = "$PREVIEW_KV" }
]

# Environment variables
[vars]
API_VERSION = "2025-10-06"
MAX_FILE_SIZE = "5242880"  # 5MB
FREE_QUOTA_DAILY = "100"

# Production environment
[env.production]
name = "compliancehub-api"
kv_namespaces = [
  { binding = "KV_QUOTA", id = "$PRODUCTION_KV" }
]

# Staging environment  
[env.staging]
name = "compliancehub-api-staging"
kv_namespaces = [
  { binding = "KV_QUOTA", id = "$PREVIEW_KV" }
]
EOF

echo "✅ wrangler.toml updated with KV namespace IDs"

# 3. Re-deploy с новой конфигурацией
echo "🚀 Re-deploying with KV configuration..."
wrangler deploy

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🎯 Production URLs:"
    echo "   API: https://compliancehub-api.$(wrangler whoami | grep 'Account ID' | cut -d' ' -f3).workers.dev"
    echo "   Health: https://compliancehub-api.$(wrangler whoami | grep 'Account ID' | cut -d' ' -f3).workers.dev/health"
    echo ""
    echo "📊 Test the quota system:"
    echo "   curl https://compliancehub-api.$(wrangler whoami | grep 'Account ID' | cut -d' ' -f3).workers.dev/api/quota"
else
    echo "❌ Deployment failed! Check the logs above."
    echo "💡 Restoring backup..."
    mv wrangler.toml.backup wrangler.toml
    exit 1
fi

echo ""
echo "🎉 KV Setup Complete!"
echo "🔧 Next steps:"
echo "   1. Test API endpoints"
echo "   2. Deploy UI to Pages" 
echo "   3. Set up custom domains (optional)"
EOF