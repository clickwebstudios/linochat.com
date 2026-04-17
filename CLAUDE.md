# LinoChat — Project Instructions for Claude

## Overview
LinoChat is a SaaS customer support platform with a Laravel API backend and a React + Vite + Tailwind CSS v4 frontend.

## Project Structure
- `backend/` — Laravel 11 API (PHP 8.4, Sanctum auth, OpenAI integration)
- `frontend/` — React 18 + Vite 6 + TypeScript + Tailwind CSS v4 + Radix UI

## Tech Stack
- **Backend**: Laravel 11, PHP 8.4, MySQL, Sanctum, OpenAI SDK, Pusher/Reverb for WebSocket
- **Frontend**: React 18, Vite 6, TypeScript, Tailwind CSS v4 (CSS-first, no tailwind.config.js), Radix UI primitives (shadcn/ui pattern), React Router DOM v7, Recharts, Sonner toasts
- **Icons**: Lucide React
- **Build**: `pnpm` for frontend, `composer` for backend

## Key Conventions
- UI components live in `frontend/src/app/components/ui/` (shadcn-style)
- Services are thin axios/fetch wrappers in `frontend/src/app/services/`
- API client at `frontend/src/app/api/client.ts` handles auth tokens and refresh
- Backend uses `App\Services\` for business logic, `App\Http\Controllers\Api\` for endpoints
- Routes in `backend/routes/api.php`, grouped under `auth:sanctum` middleware
- AI chat handled by `App\Services\AiChatService` using control tokens (not OpenAI function calling)

## Coding Standards
- PHP: PSR-12, type hints, return types
- TypeScript: strict mode, functional components, hooks
- Keep changes minimal — don't refactor unrelated code
- No unnecessary comments or docstrings on obvious code
- Prefer editing existing files over creating new ones

## Testing
- Frontend: `cd frontend && pnpm run build` (type checks during build)
- Backend: `php -l <file>` for syntax checks
- No test suite yet — validate with build + syntax checks

## Git Workflow
- **Always use a feature branch + PR**, never commit directly to `master`. Branch naming: short kebab-case (e.g. `superadmin-add-company`).
- **Batch multiple commits per PR.** When the user gives several small tasks in a row, commit each one to the same feature branch as you go. Do NOT open a new PR per fix — that floods the review queue. Open the PR only when the user explicitly signals readiness ("PR it", "ship it", "merge it", "deploy") or when they pivot to an unrelated area. Tell them the running commit count on the branch when you're between tasks so they know what's queued.
- Open the PR with `gh pr create`. Push to `master` is auto-deployed to prod by the `Deploy to Production` workflow (no manual deploy step).

## Common Pitfalls
- Tailwind v4 uses CSS-first config — no `tailwind.config.js`
- The `api.get()` client doesn't accept params object — build query strings into the URL
- Two widget files exist: `backend/public/widget.js` (standalone) and `WidgetLoaderController.php` (generates inline JS for customer sites). Customer-facing changes must go in the controller.
- SSG (react-snap) only pre-renders marketing pages — dashboards are client-only
