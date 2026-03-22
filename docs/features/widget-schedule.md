# Widget Schedule System

Configurable business hours with timezone support, multiple time slots per day, holiday exceptions, and smart offline behaviors.

## Data Model

Schedule data is stored as a `schedule` JSON object inside the existing `widget_settings` column on the `projects` table (no migrations needed).

```json
{
  "schedule": {
    "mode": "always | business_hours | agent_availability",
    "timezone": "America/New_York",
    "weekly": {
      "monday": { "enabled": true, "slots": [{ "start": "09:00", "end": "17:00" }] },
      "tuesday": { "enabled": true, "slots": [{ "start": "09:00", "end": "12:00" }, { "start": "13:00", "end": "17:00" }] }
    },
    "offline_behavior": "hide | show_message | ai_only | contact_form | redirect",
    "offline_message": "We're offline. Back {next_available}.",
    "offline_redirect_url": "https://example.com/contact",
    "offline_redirect_label": "Email us",
    "offline_form_enabled": false,
    "exceptions": [
      {
        "id": "exc_1",
        "date": "2026-12-25",
        "label": "Christmas",
        "all_day_off": true,
        "offline_behavior_override": "show_message",
        "offline_message_override": "Happy Holidays!"
      }
    ]
  }
}
```

## Schedule Modes

| Mode | Behavior |
|------|----------|
| `always` | Widget is always online. No schedule checking. |
| `business_hours` | Online only during configured weekly hours. Checks timezone, exceptions. |
| `agent_availability` | Planned — online when agents are active. Not yet implemented. |

## Weekly Schedule

- Each day has `enabled` (boolean) and `slots` (array of `{start, end}` in `HH:MM` format)
- Up to 4 time slots per day (e.g., morning + afternoon with lunch break)
- "Copy Monday to all weekdays" button for quick setup
- Saturday/Sunday disabled by default

## Holiday / Exception Dates

- Override schedule for specific dates
- `all_day_off: true` marks the entire day as offline
- Optional `offline_behavior_override` and `offline_message_override` per exception
- Up to 50 exceptions

## Offline Behaviors

| Behavior | What happens |
|----------|-------------|
| `hide` | Widget button not rendered at all |
| `show_message` | Widget button shows with red offline dot; displays offline message on open |
| `ai_only` | AI handles conversations when no agents available |
| `contact_form` | Shows a contact form for visitors to leave their details |
| `redirect` | Redirects to a URL (e.g., email contact page) |

## Message Variables

Available in `offline_message`:
- `{company_name}` — project name
- `{next_available}` — computed next online time (e.g., "Monday, 9:00 AM")
- `{support_email}` — project support email

## Server-Side Online Status

`WidgetController::config()` calls `computeScheduleStatus()` which:

1. Returns `is_online: true` for `mode=always`
2. For `mode=business_hours`:
   - Converts current time to configured timezone
   - Checks exception dates (all-day-off overrides)
   - Checks weekly schedule for current day + time slots
   - Computes `next_online_at` by scanning 14 days forward
   - Replaces message variables
3. Returns: `is_online`, `offline_behavior`, `offline_message`, `offline_form_enabled`, `offline_redirect_url`, `offline_redirect_label`, `next_online_at`

## Widget Loader Offline Handling

`WidgetLoaderController.php` `init()` function:
- If `CONFIG.is_online === false` and `offline_behavior === 'hide'` → widget not rendered
- If `CONFIG.is_online === false` and other behavior → button rendered with red offline indicator dot

## Frontend UI

`ChatWidgetTab.tsx` → `WidgetScheduleConfig` component with 7 sections:

1. **Schedule Mode** — 3 radio cards
2. **Status Indicator** — green/red dot with current status (computed client-side via `Intl.DateTimeFormat`)
3. **Timezone Selector** — 23 IANA timezones
4. **Weekly Schedule Grid** — per-day checkbox + time slot rows with add/remove
5. **Offline Behavior** — 5-option radio selector with conditional sub-fields
6. **Offline Message Templates** — 5 clickable presets + variable hints
7. **Holiday/Exception Dates** — add/remove with per-date behavior override

## Validation

Backend validates all nested schedule fields:
- `schedule.mode` — `in:always,business_hours,agent_availability`
- `schedule.timezone` — string, max 100
- `schedule.weekly.*.slots.*.start/end` — `date_format:H:i`
- `schedule.offline_behavior` — `in:hide,show_message,ai_only,contact_form,redirect`
- `schedule.exceptions` — max 50 entries

## Key Files

- `frontend/src/app/components/project-details/ChatWidgetTab.tsx` — Schedule UI (WidgetScheduleConfig)
- `backend/app/Http/Controllers/Api/WidgetSettingsController.php` — Save/load schedule
- `backend/app/Http/Controllers/Api/WidgetController.php` — `computeScheduleStatus()`, public config
- `backend/app/Http/Controllers/WidgetLoaderController.php` — Widget JS offline handling
