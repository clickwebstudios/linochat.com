# AI Chat System

LinoChat's AI assistant handles customer conversations autonomously using OpenAI, with control tokens for actions like booking appointments, looking up clients, and creating tickets.

## Architecture

```
Customer → Widget → WidgetController::sendMessage()
                    → AiChatService::generateResponse()
                      → OpenAI API (system prompt + chat history)
                      → Parse control tokens from AI response
                      → Execute actions (Frubix lookup, booking, ticket creation)
                    → Broadcast AI message via WebSocket
```

## System Prompt

Built dynamically in `AiChatService::buildSystemPrompt()` with:
- Company name, AI name, website
- Knowledge base articles (if any)
- Business-specific rules (from project AI settings)
- Control token instructions for Frubix (when connected)
- Current date/time context

## Control Tokens

The AI embeds these tokens in its responses to trigger backend actions:

### Frubix Tokens (when integration connected)
| Token | Purpose |
|-------|---------|
| `[LOOKUP_CLIENT: phone_or_email]` | Search Frubix CRM for client details |
| `[CHECK_SCHEDULE: phone_or_email]` | Get customer's upcoming appointments |
| `[CHECK_SCHEDULE: ALL]` | Get all upcoming schedule entries |
| `[RESCHEDULE_APPOINTMENT: id][NEW_DATE: YYYY-MM-DD][NEW_TIME: HH:MM]` | Reschedule existing appointment |
| `[CREATE_BOOKING]` | Signal that a booking should be created |
| `[BOOKING_NAME: ...]` | Customer name for booking |
| `[BOOKING_PHONE: ...]` | Customer phone for booking |
| `[BOOKING_EMAIL: ...]` | Customer email for booking |
| `[BOOKING_ADDRESS: ...]` | Service address for booking |
| `[BOOKING_ISSUE: ...]` | Issue/service description |
| `[BOOKING_DATE: YYYY-MM-DD]` | Preferred appointment date |
| `[BOOKING_TIME: HH:MM]` | Preferred appointment time |

### Handover Token
| Token | Purpose |
|-------|---------|
| `[HANDOVER]` | Transfer conversation to human agent |

## Chat Flow

1. Customer sends message via widget
2. `WidgetController::sendMessage()` checks if AI should reply (`ai_enabled && !agent_id`)
3. `AiChatService::generateResponse()` builds system prompt + history, calls OpenAI
4. Response parsed for control tokens
5. If `[LOOKUP_CLIENT]` or `[CHECK_SCHEDULE]` found → execute Frubix lookup, feed results back to AI for a follow-up response
6. If `[CREATE_BOOKING]` found → create ticket + Frubix appointment (with conflict detection)
7. If `[HANDOVER]` found → set chat status to `waiting`, notify agents
8. Clean response (strip tokens) → save as AI message → broadcast

## Handover Prevention (Frubix)

When Frubix is connected and customer asks about appointments/bookings:
- `isAppointmentRelated()` keyword detection intercepts handover intent
- AI asks for phone/email to look up appointments instead of transferring
- Distinguishes: "book new" vs "check existing" vs "reschedule"

## Booking Flow with Conflict Detection

1. AI collects: name, phone, email, address, issue, preferred date/time
2. AI responds with `[CREATE_BOOKING]` + booking tags
3. `createBookingTicket()` creates a ticket in LinoChat
4. If Frubix connected and date/time provided:
   a. Check schedule for conflicts on requested date
   b. If no conflict → `FrubixService::createAppointment()`
   c. If conflict → create ticket without appointment, note conflict in message
5. Confirmation message sent to customer

## Ticket Creation from Chat

`AiChatService::createBookingTicket()`:
- Creates `Ticket` with customer info + full chat transcript
- Creates initial message with transcript
- Optionally creates Frubix appointment
- Returns confirmation to customer with ticket number

## Agent Takeover

When an agent takes over a chat:
- `agent_id` is set on the chat
- AI stops responding (`shouldAiReply` check fails when `agent_id` is set)
- System message "Agent {name} joined the conversation"
- Agent messages sent via `AgentController::sendMessage()`

## Knowledge Base Integration

If the project has knowledge base articles:
- Articles are included in the system prompt as context
- AI references them when answering related questions
- Managed via `KbController` and stored in `kb_articles` table

## Key Files

- `backend/app/Services/AiChatService.php` — Core AI logic, control tokens, booking flow
- `backend/app/Http/Controllers/Api/WidgetController.php` — `sendMessage()`, `generateAIResponse()`
- `backend/app/Http/Controllers/Api/AgentController.php` — Agent message sending
- `backend/app/Services/FrubixService.php` — Frubix API calls from AI tokens
- `backend/app/Models/Chat.php` — Chat model with status management
- `backend/app/Models/ChatMessage.php` — Message storage
