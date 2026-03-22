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
```

## Widget Loader (`WidgetLoaderController.php`)

The controller generates a complete, self-contained JavaScript file. No external dependencies — everything is inline:

- CSS injection via `injectStyles()`
- Configuration fetching via `loadConfig()`
- Chat initialization via `initChat()`
- Message rendering with avatars, timestamps, typing indicators
- WebSocket connection for real-time updates
- Heartbeat mechanism (every 15s)
- Settings polling (checks for config changes every 60s)

### Key Functions
| Function | Purpose |
|----------|---------|
| `init()` | Entry point — loads config, checks online status, creates button |
| `loadConfig()` | Fetches widget config from `/api/widget/{id}/config` |
| `createButtonOnly()` | Renders floating chat button |
| `updateButtonAppearance()` | Applies design, color, position, animation |
| `openChat()` / `closeChat()` | Toggle chat panel |
| `initChat()` | Creates or resumes chat session |
| `sendMessage()` | Sends customer message, receives AI response |
| `showGreeting()` | Shows greeting bubble after configured delay |

### Offline Handling
In `init()`:
- `is_online=false` + `hide` → widget not rendered
- `is_online=false` + other → button rendered with red offline indicator dot

## Config Endpoint (`WidgetController::config()`)

Public endpoint returning widget appearance + schedule status:

```json
{
  "widget_id": "...",
  "company_name": "...",
  "color": "#4F46E5",
  "design": "modern",
  "position": "bottom-right",
  "welcome_message": "Hi! How can we help?",
  "widget_title": "...",
  "is_online": true,
  "offline_behavior": "show_message",
  "offline_message": "We're offline...",
  "next_online_at": "2026-03-22T09:00:00-04:00",
  "greeting_enabled": true,
  "greeting_message": "👋 Hi there!",
  "greeting_delay": 3,
  "ai_name": "Lino",
  "settings_updated_at": "..."
}
```

Supports JSONP via `?callback=fn` for sites with strict CSP.

## Design Variants

8 design variants controlled by `design` setting:

| Design | Description |
|--------|-------------|
| `modern` | Default — clean card layout |
| `minimal` | Simplified, less chrome |
| `classic` | Traditional chat window |
| `bubble` | Rounded bubble style |
| `compact` | Smaller footprint |
| `professional` | Corporate/business look |
| `friendly` | Warm, approachable |
| `gradient` | Gradient header with customizable colors |

## Button Animations

10 animation options: `bounce`, `pulse`, `shake`, `wobble`, `tada`, `heartbeat`, `rubber-band`, `swing`, `jello`, `float`

Configurable: repeat count, delay, duration, stop-after timer.

## Greeting Bubble

- Configurable message, delay, auto-dismiss
- Appears next to the chat button
- Position-aware (matches button position)
- Dismissible via close button

## WebSocket (Real-time)

Supports both Reverb (self-hosted) and Pusher (cloud):
- Chat channel: `chat.{chat_id}`
- Events: `MessageSent`, `ChatStatusUpdated`, `CustomerTyping`
- Auto-reconnect on disconnect
- Agent typing indicators

## JSONP Fallback

All public endpoints support JSONP for sites where `fetch()` is blocked by CSP:
- `GET /api/widget/{id}/config?callback=fn`
- `GET /api/widget/{id}/init?callback=fn&customer_id=xxx`
- `GET /api/widget/{id}/send-message?callback=fn&chat_id=&customer_id=&message=`

## Embed Code

```html
<script>
  (window.requestIdleCallback || function(fn){ setTimeout(fn, 1) })(function() {
    var script = document.createElement('script');
    script.src = 'https://api.linochat.com/widget?id=YOUR_WIDGET_ID';
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  });
</script>
```

## Settings Management

Admin configures via Project Details → Chat Widget tab (`ChatWidgetTab.tsx`):
- **Appearance**: color, design, position, button text, font size, title
- **Greeting**: enable/disable, message, delay
- **Animations**: type, repeat, delay, duration
- **Schedule**: mode, timezone, weekly hours, offline behavior, exceptions
- **Embed**: copy-paste installation snippet

Settings saved to `projects.widget_settings` JSON column via `WidgetSettingsController`.

## Key Files

- `backend/app/Http/Controllers/WidgetLoaderController.php` — Generates widget JS
- `backend/app/Http/Controllers/Api/WidgetController.php` — Public config + chat API
- `backend/app/Http/Controllers/Api/WidgetSettingsController.php` — Admin settings CRUD
- `frontend/src/app/components/project-details/ChatWidgetTab.tsx` — Settings UI
