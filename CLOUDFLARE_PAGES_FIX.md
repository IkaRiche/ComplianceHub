# 🔧 Cloudflare Pages Build Fix

## Проблема
Cloudflare Pages не может найти `apps/ui` директорию из-за особенностей клонирования репозитория.

## ✅ Решения

### Вариант 1: Обновить настройки сборки (Рекомендуется)

В Cloudflare Pages dashboard → Settings → Builds and deployments:

**Framework preset:** `None`
**Build command:** `./build.sh`
**Build output directory:** `apps/ui/dist`
**Root directory:** `/` (пустое)

### Вариант 2: Простые настройки для быстрого деплоя

**Framework preset:** `None`
**Build command:** `echo "Using root index.html"`
**Build output directory:** `/` (пустое поле)
**Root directory:** `/` (пустое)

Это будет использовать `index.html` в корне как временную landing page.

### Вариант 3: Ручной деплой (для тестирования)

```bash
# Клонируйте репозиторий локально
git clone https://github.com/IkaRiche/ComplianceHub.git
cd ComplianceHub

# Установите зависимости
npm install

# Сборка UI
cd apps/ui
npm run build

# Деплой через wrangler
npm install -g wrangler
wrangler login
wrangler pages deploy dist --project-name=compliancehub
```

### Вариант 4: Переместить UI в корень (если нужно)

Можно реструктурировать репозиторий, переместив содержимое `apps/ui` в корень:

```bash
# Это делать НЕ нужно сейчас - просто для справки
mv apps/ui/* .
mv apps/ui/.[^.]* .
```

## 🚀 Рекомендация

Используйте **Вариант 1** с `./build.sh` - это правильно обработает monorepo структуру.

Пока работает `index.html` landing page, показывающая что MVP готов!