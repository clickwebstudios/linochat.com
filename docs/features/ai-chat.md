# AI Chat System

LinoChat's AI assistant handles customer conversations autonomously using OpenAI, with control tokens for actions like booking appointments, looking up clients, and creating tickets.

## Architecture

```
Customer → Widget → WidgetController::sendMessage()
                    → AiChatService::generateResponse()
                      → OpenAI API (system prompt + chat history)
                      → Parse control tokens from AI response
                      → Execute actions (Frubix lookup, booking, ticket creation)
                      → Log usage to ai_usage_logs
                    → Broadcast AI message via WebSocket
```

## Model Selection

Users choose their AI model in AI Settings → Configuration:

| Model | Cost/Chat | Temperature | Use Case |
|-------|-----------|-------------|----------|
| `gpt-4o-mini` (default) | ~$0.003 | Configurable | Most support scenarios |
| `gpt-4o` | ~$0.05 | Configurable | Complex queries needing highest quality |

Model stored in `projects.ai_settings.model`, read by AiChatService on each conversation.

## AI Settings (8 configurable fields)

| Field | Used In | Effect |
|-------|---------|--------|
| `ai_enabled` | WidgetController | Controls whether AI responds at all |
| `ai_name` | System prompt + widget | "Your name is {aiName}" |
| `system_prompt` | System prompt | Custom instructions prepended to base prompt |
| `response_tone` | System prompt | "Be direct, friendly, and {tone}" |
| `confidence_threshold` | OpenAI temperature | 95→0.3, 85→0.5, 75→0.7, 60→0.9 |
| `response_language` | System prompt | en/es/fr/de/auto — "Respond in {language}" |
| `fallback_behavior` | Handover logic | transfer/collect/suggest/none |
| `model` | OpenAI API call | gpt-4o or gpt-4o-mini |
| `auto_learn` | ChatObserver | Auto-generates KB from resolved chats |

## Draft/Publish Versioning

- Changes auto-save as draft (1.5s debounce)
- Must click "Publish Changes" to go live
- Version history with restore capability
- AiChatService always reads from `projects.ai_settings` (live only)

## Control Tokens

### Frubix Tokens (when integration connected)
| Token | Purpose |
|-------|---------|
| `[LOOKUP_CLIENT: phone_or_email]` | Search Frubix CRM for client details |
| `[CHECK_SCHEDULE: phone_or_email]` | Get customer's upcoming appointments |
| `[CHECK_SCHEDULE: ALL]` | Get all upcoming schedule entries |
| `[RESCHEDULE_APPOINTMENT: id][NEW_DATE: YYYY-MM-DD][NEW_TIME: HH:MM]` | Reschedule existing appointment |
| `[CREATE_BOOKING]` with `[BOOKING_DATE]` / `[BOOKING_TIME]` | Book new appointment |
| `[HANDOVER]` | Transfer conversation to human agent |

## Fallback Behavior

When AI triggers `[HANDOVER]`, the `fallback_behavior` setting determines what happens:

| Setting | Action |
|---------|--------|
| `transfer` | Hand over to human agent (default) |
| `collect` | Ask for contact info, create ticket |
| `suggest` | Show related KB articles, offer to transfer |
| `none` | Suppress handover, keep AI responding |

## Auto-Learn System

When `auto_learn` is enabled and a chat closes with AI resolving it (no agent takeover):

1. `ChatObserver` sets `resolution_type = 'ai_resolved'`
2. `AutoLearnFromChatJob` dispatched (queued, non-blocking)
3. Extracts Q&A pairs from conversation
4. Calls GPT-4o-mini to generate a structured KB article
5. Creates draft article (`is_ai_generated: true`) if topic is new
6. Skips if conversation is too short or similar article exists

## Customer Feedback

Widget shows 👍/👎 buttons below each AI message:
- `POST /widget/{id}/message-feedback` saves feedback
- Aggregated in AI Stats dashboard
- Negative feedback flags for agent review

## Cost Tracking

Every AI API call is logged to `ai_usage_logs`:
- `input_tokens`, `output_tokens`, `model`
- `base_cost` calculated from OpenAI pricing
- `charged_cost` calculated using platform pricing settings (markup % or fixed price)
- Aggregated in Superadmin → Pricing & Plans dashboard

## Key Files

- `backend/app/Services/AiChatService.php` — Core AI logic, control tokens, booking, auto-learn
- `backend/app/Observers/ChatObserver.php` — Resolution tracking
- `backend/app/Jobs/AutoLearnFromChatJob.php` — KB generation from chats
- `backend/app/Http/Controllers/Api/AISettingsController.php` — Settings CRUD + versions
- `backend/app/Http/Controllers/Api/WidgetController.php` — sendMessage, feedback
- `backend/app/Models/AiUsageLog.php` — Cost tracking model
- `frontend/src/app/components/project-details/AISettingsTab.tsx` — Settings UI
