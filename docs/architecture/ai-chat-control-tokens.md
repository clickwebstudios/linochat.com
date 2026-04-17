# AI Chat Control Tokens

**File:** `backend/app/Services/AiChatService.php`

Instead of OpenAI function calling, LinoChat uses control tokens — special bracketed tags embedded in AI responses that trigger backend logic. This keeps the AI model unaware of backend internals and allows the same prompt to work with any chat model.

## How It Works

1. **Prompt injection** (lines 755–852): system prompt instructs the AI on when and how to emit tokens
2. **Token detection**: dedicated `is*()` methods parse the raw response before it reaches the customer
3. **Handlers**: methods act on detected tokens (create tickets, trigger handovers, etc.)
4. **Cleanup**: `cleanAiResponse()` (line 1000) strips all tokens before the response is shown

## Token Reference

| Token | Trigger Method | Handler | Purpose |
|---|---|---|---|
| `[HANDOVER]` | `isHandoverRequest()` L897 | `createHandoverResponse()` L905 | Transfer chat to human agent |
| `[REQUEST_CONTACT]` | `isContactRequest()` L958 | `createContactRequestResponse()` L966 | Ask customer for name/email |
| `[CREATE_BOOKING]` | `isBookingRequest()` L1061 | `createBookingTicket()` L1069 | Create support ticket/booking |
| `[CUSTOMER_NAME: ...]` | inline in `generateResponse()` | updates chat record | Store detected customer name |
| `[LOOKUP_CLIENT: ...]` | `isFrubixLookup()` L1334 | `handleFrubixLookup()` L1367 | Frubix: look up client by phone/email |
| `[CHECK_SCHEDULE: ...]` | `isFrubixLookup()` | `handleFrubixLookup()` L1403 | Frubix: check existing appointments |
| `[CHECK_AVAILABILITY: YYYY-MM-DD]` | `isFrubixLookup()` | L1462 | Frubix: check slot availability |
| `[RESCHEDULE_APPOINTMENT: id]` | `isFrubixLookup()` | L1433 | Frubix: reschedule with `[NEW_DATE]` / `[NEW_TIME]` |
| `[CREATE_LEAD: Name\|Phone\|Email\|Notes]` | `isFrubixLookup()` | L1483 | Frubix: create lead for enquiries |

### Booking companion tags (required with `[CREATE_BOOKING]`)

`[BOOKING_NAME]`, `[BOOKING_PHONE]`, `[BOOKING_EMAIL]`, `[BOOKING_ADDRESS]`, `[BOOKING_ISSUE]`

Optional for Frubix: `[BOOKING_DATE: YYYY-MM-DD]`, `[BOOKING_TIME: HH:MM]`

## Key Constraints

- **All 5 contact fields are required** before `[CREATE_BOOKING]` fires — partial bookings are rejected (rule 10 in prompt, line 810)
- **Safety net** (lines 304–314): if the AI says "booked/confirmed/scheduled" without `[CREATE_BOOKING]`, the service re-prompts the model automatically
- **Frubix tokens take precedence** over `[HANDOVER]` — `isFrubixLookup()` is checked first
- OpenAI calls use 3-attempt retry logic: `callOpenAIWithRetry()` (line 400)

## Why Not Function Calling?

Function calling requires OpenAI to be aware of backend schema and forces structured outputs. Control tokens let the AI narrate naturally and embed actions inline — the same mechanism works on any model that can follow text instructions.
