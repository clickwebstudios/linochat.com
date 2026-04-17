# Widget Loader — Two Widget Files

There are two separate widget implementations. They serve different audiences and must be updated independently. Changing one does NOT update the other.

## File 1: `backend/public/widget.js` — Static Embedded Widget

Served as a static file. Customer sites load it via `<script src="...widget.js">`.

**Responsibilities:**
- Resolves its own `BASE_URL` from its `src` attribute (lines 9–27) — no hardcoded URLs
- Collects `lc()` queue calls before the widget loads (lines 18–25)
- Injects all CSS inline (lines 39–80) to avoid CSP issues on customer sites
- Builds complete DOM: button `#lc-btn`, badge `#lc-badge`, panel `#lc-panel`, messages area `#lc-msgs`, input `#lc-input`, pre-chat name screen `#lc-name-screen`

**When to edit:** standalone deployments, customers who embed the static file directly.

## File 2: `backend/app/Http/Controllers/WidgetLoaderController.php` — Server-Rendered Widget

Serves `widget.js?id=WIDGET_ID` as dynamically generated JavaScript. This is the primary path for customer-facing sites.

**Responsibilities:**
- Injects per-request configuration into the JS at serve time (lines 31–59):
  - `WIDGET_ID` from query params
  - `API_URL` from config or auto-detected
  - WebSocket credentials: `WS_KEY`, `WS_CLUSTER`, `WS_HOST`, `WS_PORT`, `WS_SCHEME`
- Detects broadcasting driver and configures accordingly:
  - **Reverb (local/self-hosted):** lines 37–43 — uses `localhost` detection, HTTP on port 8080 locally, HTTPS/443 in production
  - **Pusher (cloud):** lines 44–46 — cluster defaults to `us3`
- Handles reverse proxy headers: `X-Forwarded-Proto` / `X-Forwarded-Host` for Cloudflare Tunnel / nginx (lines 22–26)
- Adds `ngrok-skip-browser-warning` header when ngrok is detected (line 104)

**When to edit:** any customer-facing widget change — this is the file that matters.

## Rule

> Customer-facing changes must go in `WidgetLoaderController.php`, not `widget.js`.
