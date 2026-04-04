# Flow: Widget Chat (Visitor → AI → Agent)

End-to-end flow from a visitor opening the widget to a human agent handling the chat.

---

## Step 1 — Widget Loads on Customer Site

**File**: `backend/public/widget.js` (or `WidgetLoaderController.php` for inline embed)

1. Customer visits a site that has the LinoChat embed snippet
2. Browser loads `widget.js` from `GET /api/widget-assets/widget.js`
3. Widget fetches project config: `GET /api/widget/{widget_id}/config`
   - Returns: brand colors, greeting, AI name, availability
4. Widget checks agent status: `GET /api/widget/{widget_id}/status`
   - Returns: whether any agents are online

---

## Step 2 — Chat Session Starts

**File**: `WidgetController::init`  
**Route**: `POST /api/widget/{widget_id}/init`

1. Widget posts visitor info (name, email, current page URL, browser, device)
2. Controller looks up project by `widget_id`
3. Creates a new `Chat` record:
   - `project_id` = resolved project
   - `status` = `waiting`
   - `ai_enabled` = true (from project AI settings)
   - `metadata` = `{current_page, browser, device, referrer, ...}`
4. Returns `{chat_id, session_token}`

Session token is stored in browser (sessionStorage or cookie) for the duration of the visit.

---

## Step 3 — Visitor Sends First Message

**File**: `WidgetController::sendMessage`  
**Route**: `POST /api/widget/{widget_id}/message`

1. Widget posts `{message, session_token}`
2. Controller creates `ChatMessage` (`sender_type=customer`)
3. Updates `chat.last_message_at`
4. Broadcasts `MessageSent` event (agents see the message in real-time)
5. If `chat.ai_enabled = true` → hands off to `AiChatService::handleMessage()`

---

## Step 4 — AI Responds

**File**: `AiChatService::handleMessage()`  
**Service**: `app/Services/AiChatService.php`

1. Embeds the customer message (OpenAI embeddings)
2. Searches KB articles for relevant context (semantic similarity)
3. Assembles prompt:
   - System prompt from `project.ai_settings.system_prompt`
   - KB article context
   - Recent conversation history
   - Customer message
4. Calls OpenAI API (model from `project.ai_settings.model`, default `gpt-4o-mini`)
5. Parses response for control tokens:
   - `[TRANSFER_TO_HUMAN]` → triggers step 5
   - `[CREATE_TICKET:subject]` → suggests ticket to customer
   - `[END_CHAT]` → closes chat
6. Saves AI response as `ChatMessage` (`sender_type=ai`, `is_ai=true`)
7. Broadcasts `AiTyping` (is_typing=false) and `MessageSent`
8. Saves AI usage to `ai_usage_logs`

---

## Step 5 — AI Transfers to Human

**Trigger**: Control token `[TRANSFER_TO_HUMAN]` or customer clicks "Talk to a human"

**Route (customer)**: `POST /api/widget/{widget_id}/handover`  
**File**: `WidgetController::requestHuman`

1. Sets `chat.status = waiting`
2. Creates system message: "Customer requested a human agent"
3. Fires `HumanRequested` event
4. Frontend: `HumanRequestedListener.tsx` shows modal to all available agents
5. Broadcasts `ChatStatusUpdated` (status=waiting)

---

## Step 6 — Agent Takes Chat

**Route**: `POST /api/agent/chats/{chat_id}/take`  
**File**: `AgentController::take`

1. Uses `DB::transaction` + `lockForUpdate()` — prevents two agents taking same chat
2. Sets `chat.agent_id = user.id`, `chat.status = active`
3. Creates system message: "{agent name} has joined the chat."
4. Broadcasts `ChatStatusUpdated` (status=active, agent_id, agent_name)
5. Broadcasts `MessageSent` (system message)
6. Agent's dashboard refreshes — chat appears in "Mine" list

---

## Step 7 — Agent Sends Messages

**Route**: `POST /api/agent/chats/{chat_id}/message`  
**File**: `AgentController::sendMessage`

1. Validates `{message}` (max 5000 chars)
2. Checks `ChatPolicy::sendMessage` — must be assigned agent / project member / owner / superadmin
3. Handles optional file attachments (max 10MB each, stored in `storage/app/public/chat-attachments/`)
4. Creates `ChatMessage` (`sender_type=agent`, `sender_id=user.id`)
5. Updates `chat.last_message_at`
6. Broadcasts `MessageSent` — widget receives and displays
7. If Frubix integration active: forwards to Frubix via `FrubixService::sendMessage()`

---

## Step 8 — Chat Closed

**Route**: `POST /api/agent/chats/{chat_id}/close`  
**File**: `AgentController::close`

1. Sets `chat.status = closed`
2. Creates system message: "This chat has been closed."
3. Broadcasts `ChatStatusUpdated` (status=closed)
4. Broadcasts `MessageSent` (system message)
5. If `ai_settings.auto_learn = true`: dispatches `AutoLearnFromChatJob`

---

## WebSocket Channel Structure

| Channel | Type | Who listens |
|---------|------|-------------|
| `chat.{chat_id}` | Private | Widget (customer) |
| `agent.{user_id}` | Private | Individual agent |
| `project.{project_id}` | Presence | All agents on project |
