# План интеграции Frontend (LinoChat Dashboard)

## 🎯 Цель
Создать React + TypeScript приложение для агентов с полной интеграцией с backend API.

---

## 📋 Этапы работы

### Этап 1: Настройка проекта (30 мин)
- [ ] Создать Vite проект (React + TypeScript + Tailwind)
- [ ] Установить зависимости: `react-router-dom`, `zustand`, `lucide-react`
- [ ] Настроить `.env` с API URL и Reverb config
- [ ] Создать базовую структуру папок

**Структура:**
```
src/
├── api/           # API клиент и сервисы
├── components/    # React компоненты
├── hooks/         # Custom hooks
├── pages/         # Страницы
├── stores/        # Zustand stores
├── types/         # TypeScript типы
├── websocket/     # Reverb WebSocket
└── utils/         # Утилиты
```

---

### Этап 2: API Client + Auth (1 час)
- [ ] Создать `api/client.ts` с JWT interceptor
- [ ] Создать `api/auth.ts` (login, register, logout, me)
- [ ] Создать `stores/authStore.ts` (Zustand)
- [ ] Создать Login страницу
- [ ] Создать Register страницу с AI анализом
- [ ] Создать ProtectedRoute компонент

**Фичи:**
- Автоматическое обновление токена (refresh)
- Сохранение в localStorage
- Обработка 401 ошибок

---

### Этап 3: Layout + Navigation (45 мин)
- [ ] Создать `Layout` компонент с Sidebar
- [ ] Создать `Header` с user info и logout
- [ ] Создать навигацию:
  - Dashboard
  - Chats
  - Tickets
  - Projects
  - Settings
- [ ] Создать `LoadingSpinner` компонент
- [ ] Создать `ErrorBoundary`

---

### Этап 4: Dashboard страница (1 час)
- [ ] Stats cards (активные чаты, тикеты, агенты)
- [ ] График активности (последние 7 дней)
- [ ] Список recent chats
- [ ] Список recent tickets
- [ ] Создать `api/dashboard.ts` с запросами статистики

**API endpoints:**
- `GET /agent/stats`
- `GET /agent/chats?status=active`
- `GET /agent/tickets`

---

### Этап 5: Chats функционал (2 часа)
- [ ] Создать `api/chats.ts`
- [ ] Создать `stores/chatStore.ts`
- [ ] Создать `ChatList` компонент (таблица/список)
- [ ] Создать `ChatView` компонент (детали чата)
- [ ] Создать `MessageList` с авто-скроллом
- [ ] Создать `MessageInput` с typing indicator
- [ ] Фильтры: Active, Mine, Unassigned, Closed
- [ ] Кнопки: Take Chat, Close Chat
- [ ] WebSocket подключение для real-time messages

**Компоненты:**
```
ChatsPage/
├── ChatList.tsx
├── ChatView.tsx
├── MessageList.tsx
├── MessageInput.tsx
└── ChatFilters.tsx
```

---

### Этап 6: Tickets функционал (1.5 часа)
- [ ] Создать `api/tickets.ts`
- [ ] Создать `stores/ticketStore.ts`
- [ ] Создать `TicketList` с фильтрами
- [ ] Создать `TicketView` с деталями
- [ ] Создать `TicketReply` форму
- [ ] Статусы: open, in_progress, waiting, resolved, closed
- [ ] Приоритеты: low, medium, high, urgent
- [ ] Assign to agent dropdown
- [ ] Кнопки: Take, Reply, Change Status

---

### Этап 7: Projects страница (1 час)
- [ ] Создать `api/projects.ts`
- [ ] Список проектов (карточки/таблица)
- [ ] Create Project модалка
- [ ] Edit Project форма
- [ ] Project detail с агентами
- [ ] Invite agent форма
- [ ] Remove agent кнопка

---

### Этап 8: Widget Settings (45 мин)
- [ ] Создать `api/widget.ts`
- [ ] Color picker для темы
- [ ] Position selector (bottom-right/left)
- [ ] Welcome message textarea
- [ ] Button text input
- [ ] Embed code display
- [ ] Live preview (опционально)

---

### Этап 9: WebSocket интеграция (1.5 часа)
- [ ] Создать `websocket/reverb.ts`
- [ ] Подключение к `ws://localhost:8080`
- [ ] Авто-реконнект при disconnect
- [ ] Подписка на `chat.{id}` для messages
- [ ] Подписка на `agent.{user_id}` для новых чатов
- [ ] Обработка событий:
  - MessageSent
  - AgentTyping
  - ChatStatusUpdated
  - NewChatForAgent
- [ ] Toast notifications для новых событий

---

### Этап 10: Полировка (1 час)
- [ ] Добавить loading states
- [ ] Добавить error handling
- [ ] Добавить empty states
- [ ] Responsive design проверка
- [ ] Dark mode (опционально)
- [ ] Финальное тестирование

---

## 📦 Stack

| Технология | Назначение |
|------------|------------|
| **Vite** | Build tool |
| **React 18** | UI Framework |
| **TypeScript** | Типизация |
| **Tailwind CSS** | Стили |
| **React Router v6** | Навигация |
| **Zustand** | State management |
| **Lucide React** | Иконки |
| **date-fns** | Форматирование дат |

---

## 🔗 API Integration Points

```typescript
// Auth
POST /auth/login
POST /auth/register
POST /auth/logout
GET  /auth/me

// Chats
GET    /agent/chats
GET    /agent/chats/:id
POST   /agent/chats/:id/take
POST   /agent/chats/:id/message
POST   /agent/chats/:id/close
POST   /agent/chats/:id/typing
GET    /agent/stats

// Tickets
GET    /agent/tickets
POST   /agent/tickets
GET    /agent/tickets/:id
POST   /agent/tickets/:id/take
POST   /agent/tickets/:id/assign
POST   /agent/tickets/:id/status
POST   /agent/tickets/:id/reply

// Projects
GET    /projects
POST   /projects
GET    /projects/:id
PUT    /projects/:id
DELETE /projects/:id
GET    /projects/:id/agents
DELETE /projects/:id/agents/:agentId

// Widget Settings
GET    /projects/:id/widget-settings
PUT    /projects/:id/widget-settings
GET    /projects/:id/embed-code

// Invitations
GET    /projects/:id/invitations
POST   /projects/:id/invitations
```

---

## 📁 Файлы для создания

```
src/
├── api/
│   ├── client.ts
│   ├── auth.ts
│   ├── chats.ts
│   ├── tickets.ts
│   ├── projects.ts
│   └── widget.ts
├── components/
│   ├── Layout.tsx
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── ProtectedRoute.tsx
│   ├── LoadingSpinner.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       └── Modal.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useChats.ts
│   ├── useTickets.ts
│   └── useReverb.ts
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── ChatsPage/
│   │   ├── index.tsx
│   │   ├── ChatList.tsx
│   │   ├── ChatView.tsx
│   │   ├── MessageList.tsx
│   │   └── MessageInput.tsx
│   ├── TicketsPage/
│   │   ├── index.tsx
│   │   ├── TicketList.tsx
│   │   └── TicketView.tsx
│   ├── ProjectsPage/
│   │   ├── index.tsx
│   │   ├── ProjectList.tsx
│   │   └── ProjectForm.tsx
│   └── SettingsPage.tsx
├── stores/
│   ├── authStore.ts
│   ├── chatStore.ts
│   └── ticketStore.ts
├── types/
│   └── index.ts
├── websocket/
│   └── reverb.ts
└── utils/
    └── format.ts
```

---

## ⏱️ Общее время: ~10-11 часов

Готов начать с **Этапа 1**? 🚀
