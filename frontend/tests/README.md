# LinoChat E2E Tests

Этот каталог содержит end-to-end тесты для LinoChat, написанные с использованием [Playwright](https://playwright.dev/).

## Структура тестов

```
tests/
├── auth.spec.ts      # Тесты авторизации (вход/выход)
├── dashboard.spec.ts # Тесты дашборда
├── projects.spec.ts  # Тесты проектов
├── chat.spec.ts      # Тесты чата
└── widget.spec.ts    # Тесты виджета
```

## Установка

Playwright уже установлен в проекте. Для установки браузеров:

```bash
npx playwright install
```

## Запуск тестов

### Базовые команды

```bash
# Запуск всех тестов
npm run test:e2e

# Запуск в UI режиме (для отладки)
npm run test:e2e:ui

# Запуск в debug режиме
npm run test:e2e:debug

# Запуск в headed режиме (видимые браузеры)
npm run test:e2e:headed
```

### Запуск конкретных тестов

```bash
# Только тесты авторизации
npx playwright test tests/auth.spec.ts

# Только в Chrome
npx playwright test --project=chromium

# Только в Firefox
npx playwright test --project=firefox

# Только в WebKit
npx playwright test --project=webkit
```

### Запуск с параметрами

```bash
# Запуск с определенным URL
PLAYWRIGHT_BASE_URL=https://staging.linochat.com npx playwright test

# Запуск с другими credentials
TEST_EMAIL=user@example.com TEST_PASSWORD=mypassword npx playwright test
```

## Конфигурация

### Локальная конфигурация

Создайте файл `.env.playwright` на основе `.env.playwright.example`:

```bash
cp .env.playwright.example .env.playwright
```

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `TEST_EMAIL` | Email для тестов | admin@clickwebstudio.com |
| `TEST_PASSWORD` | Пароль для тестов | 123123123 |
| `PLAYWRIGHT_BASE_URL` | Базовый URL | https://linochat.com |
| `CI` | Режим CI (авто) | false |

## Отчеты

### HTML Report

После запуска тестов:

```bash
npx playwright show-report
```

### Артефакты

При падении тестов сохраняются:
- **Скриншоты** — в `test-results/`
- **Видео** — в `test-results/`
- **Traces** — для отладки в `test-results/`

## Отладка

### UI Mode

```bash
npm run test:e2e:ui
```

Позволяет:
- Запускать тесты по одному
- Смотреть timeline выполнения
- Дебажить с DOM inspector
- Просматривать network requests

### Debug Mode

```bash
npm run test:e2e:debug
```

Запускает тесты с открытым DevTools.

### Trace Viewer

```bash
npx playwright show-trace test-results/trace.zip
```

## Написание тестов

### Базовый тест

```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading')).toHaveText('Dashboard');
});
```

### Использование test credentials

```typescript
import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@clickwebstudio.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '123123123';

test('should login', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/dashboard/);
});
```

## CI/CD

Тесты запускаются автоматически при:
- Pull Request в `master` или `main`
- Push в `master` или `main`

См. `.github/workflows/playwright.yml`

## Полезные ссылки

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors](https://playwright.dev/docs/selectors)
- [Assertions](https://playwright.dev/docs/test-assertions)
