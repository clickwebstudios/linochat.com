# Realtime Presence & Broadcasting

## Presence Threshold

A customer is considered **active** if `customer_last_seen_at >= now() - 30 seconds`.

This threshold is applied in two places:
- **Chat list filter** (`AgentController.php` lines 42–43): `active` filter shows chats with `status` in `['active', 'waiting', 'ai_handling']` AND customer seen within 30s
- **Superadmin live visitors** (`SuperadminController.php` line 182–188): same 30s threshold for the live visitor count

`customer_last_seen_at` is updated on every customer message send and heartbeat (via `WidgetController.php`).

## Broadcasting Setup

Broadcasting driver is configured per-environment and injected into the widget at serve time by `WidgetLoaderController.php`.

### Reverb (self-hosted / local)
- Detected when host contains `localhost` or `127.0.0.1`
- Local: HTTP, port 8080
- Production: HTTPS, port 443
- Config keys: `broadcasting.connections.reverb.key / .host / .port`

### Pusher (cloud)
- Default cluster: `us3`
- Config key: `broadcasting.connections.pusher.key`

### SafePusherBroadcaster

`backend/app/Broadcasting/SafePusherBroadcaster.php` wraps Laravel's `PusherBroadcaster`:
- Catches connection errors and logs a warning instead of crashing the request
- Chunks channel broadcasts into groups of 100 (line 26) to stay within Pusher limits

## Broadcast Events

| Event | File | Purpose |
|---|---|---|
| `MessageSent` | `app/Events/MessageSent.php` | New chat message |
| `ChatStatusUpdated` | `app/Events/ChatStatusUpdated.php` | Status change |
| `AgentStatusChanged` | `app/Events/AgentStatusChanged.php` | Agent online/offline |
| `CustomerTyping` | `app/Events/CustomerTyping.php` | Customer typing indicator |
| `AgentTyping` | `app/Events/AgentTyping.php` | Agent typing indicator |
| `AiTyping` | `app/Events/AiTyping.php` | AI processing indicator |
