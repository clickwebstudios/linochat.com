# Module: Live Chat

## Overview

The live chat module connects website visitors (via an embeddable widget) to agents and/or AI. Chats flow through three phases: **AI handling** → **human handover** → **agent active**.

---

## Components

### Widget (Customer-Facing)

- **Embed**: `backend/public/widget.js` — standalone JS loaded on customer sites
- **Inline embed**: `WidgetLoaderController.php` — generates inline JS for embedded use
- **React Widget**: `frontend/src/app/components/ChatWidget.tsx` — React version for internal use
- **Public API**: `/api/widget/{widget_id}/*` — no auth, CORS open, rate limited

The widget is identified by `widget_id` (stored on the `projects` table, format: `wc_` + 32 random chars).

### Agent Inbox

- **Controller**: `AgentController` (`app/Http/Controllers/Api/AgentController.php`)
- **Frontend page**: `frontend/src/app/pages/dashboards/AgentDashboard.tsx`
- **Chat details**: `frontend/src/app/pages/dashboards/ChatDetails.tsx`
- **Service**: none (direct model access in controller)
- **Policy**: `ChatPolicy` (view, sendMessage, close, toggleAi)

### AI Chat Engine

- **Service**: `AiChatService` (`app/Services/AiChatService.php`) — ~1000+ lines
- **Controller**: `AIChatController` — widget-facing AI endpoint
- **Control tokens**: The AI uses control tokens in its responses (not OpenAI function calling) to signal actions like `TRANSFER_TO_HUMAN`, `CREATE_TICKET`, etc.

---

## Chat Status Flow

```
Widget opens
     │
     ▼
  waiting ──── AI picks up ──→ ai_handling
     │                              │
     │                         AI transfers
     │                              │
     ▼◄─────────────────────────────┘
  Agent takes (POST /take)
     │
     ▼
  active  ──── Agent closes ──→ closed
     │
  offline (agent goes offline)
```

States: `waiting`, `ai_handling`, `active`, `offline`, `closed`

---

## Real-Time Events

All events broadcast via Pusher/Reverb. Frontend subscribes via Laravel Echo.

| Event | Trigger | Payload |
|-------|---------|---------|
| `MessageSent` | Any new message | `{message}` |
| `ChatStatusUpdated` | Status change | `{chat_id, status, agent_id?, agent_name?}` |
| `AgentTyping` | Agent types | `{chat_id, agent_id, agent_name, is_typing}` |
| `AiTyping` | AI generating | `{chat_id, is_typing}` |
| `CustomerTyping` | Customer types | `{chat_id, is_typing}` |
| `HumanRequested` | Customer requests human | `{chat_id}` |
| `NewChatForAgent` | New chat assigned | `{chat}` |
| `NewChatAssigned` | Chat assigned to agent | `{chat}` |
| `TransferRequested` | Transfer initiated | `{transfer}` |
| `TransferResolved` | Transfer accepted/rejected | `{transfer}` |
| `AgentStatusChanged` | Agent availability change | `{agent_id, status}` |

Frontend listeners:
- `HumanRequestedListener.tsx` — shows modal when customer requests human
- `TransferRequestsDialog.tsx` — shows incoming transfer requests

---

## Chat Transfer Flow

1. Agent A initiates: `POST /agent/transfer-requests` with `to_agent_id`
2. `TransferRequested` event broadcast to Agent B
3. Agent B sees `InitiateTransferDialog.tsx` and accepts/rejects
4. On accept: `POST /agent/transfer-requests/{id}/accept` → chat reassigned
5. `TransferResolved` event broadcast

Pending handovers (AI → human): `GET /agent/pending-handovers` — chats with `status=waiting` that AI handed off.

---

## File Attachments

Agents can send files via multipart/form-data to `POST /agent/chats/{id}/message`.
- Files stored in `storage/app/public/chat-attachments/{chat_id}/`
- Public URL: `/storage/chat-attachments/{chat_id}/{filename}`
- Max size: 10MB per file
- Multiple files per message supported

---

## AI Chat Logic (`AiChatService`)

Key methods:
- `handleMessage($chat, $project, $message)` — main entry point from widget
- `buildContext($chat, $project)` — assembles KB articles, conversation history, system prompt
- `suggestReplies($chat, $project)` — generates 3 reply suggestions for agents
- `generateResponse(...)` — calls OpenAI API

Context retrieval:
1. Semantic search over KB articles (via embeddings if available, else keyword)
2. Conversation history (last N messages)
3. Project system prompt + AI settings

Control tokens: AI responds with special tokens that trigger actions:
- `[TRANSFER_TO_HUMAN]` → sets `status=waiting`, fires `HumanRequested`
- `[CREATE_TICKET:subject]` → suggests ticket creation
- `[END_CHAT]` → closes chat

AI settings per project (`projects.ai_settings` JSON):
- `ai_name` — display name of the AI
- `system_prompt` — custom instructions
- `response_tone` — `professional`, `friendly`, `formal`, `casual`
- `model` — OpenAI model (default `gpt-4o-mini`)
- `confidence_threshold` — below this, AI defers to human
- `fallback_behavior` — `transfer` or `ticket`
- `auto_learn` — whether to learn from resolved chats

Auto-learn jobs:
- `AutoLearnFromChatJob` — runs when chat is closed, extracts Q&A pairs
- `DailyAutoLearnJob` — scheduled daily batch

---

## Key Caveats

1. `ChatController` (basic CRUD at `/api/chats/*`) is separate from `AgentController` (agent dashboard at `/api/agent/chats/*`). The latter is the primary path used by the frontend.
2. `ChatController::show` references `assignedTo` and `lastMessage` relationships that don't exist on the Chat model — see `issues.md` (M2).
3. Widget CORS is handled by `WidgetApiCors` and `WidgetCorsHeaders` middleware — both must be active for the embed to work cross-domain.
