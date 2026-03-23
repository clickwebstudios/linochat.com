# Widget Embed System

The LinoChat widget is a self-contained JavaScript snippet that embeds a live chat interface on customer websites.

## Architecture

```
Customer site loads:
  <script src="https://api.linochat.com/widget?id=WIDGET_ID"></script>

→ WidgetLoaderController::widget() generates full inline JS
→ Widget JS:
    1. loadConfig() — GET /api/widget/{id}/config
    2. init() — check is_online, create button
    3. On click — initChat() → POST /api/widget/{id}/init
    4. Real-time messages via Pusher/Reverb WebSocket
    5. Page tracking — polls URL changes, sends page views
    6. Customer feedback — 👍/👎 on AI messages
```

## Features

### Live Visitor Tracking
- Widget sends heartbeat every 15s with current page URL
- Detects page navigation via URL polling (3s) + popstate/hashchange
- Sends `POST /page-view` on each navigation with URL + title
- Pages stored in `chat.metadata.pages_visited[]` (max 50)
- `GET /superadmin/live-visitors` returns active visitors (last 2 min)

### Customer Feedback
- 👍/👎 buttons below each AI message
- `POST /widget/{id}/message-feedback` saves to `chat_messages.feedback`
- Replaced with "Thanks!" after clicking

### Popover System
- 5 designs: Urgent, Luxury, Modern, Bold, Minimal
- Configurable: heading, description, buttons (text + icon + action), online status
- Triggers: immediate, delay, scroll %, exit intent
- Max displays per session (1/2/3/5+/unlimited)
- Background overlay: dark/light/none + blur
- Size: small/medium/large + color theme
- Rendered by `showPopover()` in widget JS

### Offline Handling
- `is_online=false` + `hide` → widget not rendered
- `is_online=false` + other → button with red offline dot

### Verify Installation
- `POST /projects/{id}/verify-widget` fetches customer website, checks for widget script
- "Verify Installation" button in Embed Code section

## Design Variants

8 designs: modern, minimal, classic, bubble, compact, professional, friendly, gradient

## Widget Settings

Stored as JSON in `projects.widget_settings`. Includes: color, design, position, button text, font size (12-16px), greeting, animations, schedule, popover.

## Key Files

- `backend/app/Http/Controllers/WidgetLoaderController.php` — Generates widget JS
- `backend/app/Http/Controllers/Api/WidgetController.php` — Public config + chat + feedback API
- `backend/app/Http/Controllers/Api/WidgetSettingsController.php` — Admin settings CRUD + verify
- `frontend/src/app/components/project-details/ChatWidgetTab.tsx` — Settings UI
- `frontend/src/app/components/project-details/PopoversTab.tsx` — Popover settings UI
