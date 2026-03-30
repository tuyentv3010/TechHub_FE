# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with Turbopack
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint check

ANALYZE=true npm run build  # Bundle size analysis
```

No test runner is configured in this project.

## Architecture

**Stack:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS + next-intl (EN/VI/JA i18n)

### Route Groups

- `src/app/(public)/` — Public-facing routes: auth, blog, courses, learning paths, AI chat
- `src/app/(learning)/` — Course learning views, recommendations
- `src/app/manage/` — Admin dashboard (accounts, roles, permissions, blogs, files)
- `src/app/api/` — Next.js API routes used as backend proxy

### API Layer

All client-side API calls go through Next.js proxy routes at `/app/api/proxy/*`, which forward to the backend at `NEXT_PUBLIC_API_ENDPOINT` (default `http://localhost:8443`).

- `src/lib/http.ts` — Core fetch wrapper with auto token injection, 401 auto-refresh, and typed error classes (`HttpError`, `EntityError`, `BadRequestError`, `ForbiddenError`)
- `src/apiRequests/` — Per-domain request functions (auth, course, blog, account, ai, etc.)
- `src/queries/` — TanStack Query hooks wrapping apiRequests for caching and status

### State Management

- **Auth state** — `src/components/app-provider.tsx` uses React Context; reads `accessToken`/`refreshToken`/`userInfo` from localStorage and decodes JWT to expose `isAuth`, `role`, `permissions`
- **Server state** — TanStack Query (configured in AppProvider, `refetchOnWindowFocus: false`)
- **Real-time** — Socket.IO via `src/providers/SocketProvider.tsx`; STOMP-over-WebSocket in `src/services/websocket/`
- **AI learning paths** — `src/contexts/AiLearningPathContext.tsx`

### Auth & Middleware

`src/middleware.ts` runs on every request: validates JWT expiry from cookies, redirects expired sessions to `/logout`, and enforces role-based access to `/manage` routes. Tokens are stored in both localStorage (for the HTTP client) and cookies (for middleware).

Token refresh is transparent — `http.ts` intercepts 401 responses, calls the refresh endpoint, updates storage, and retries the original request.

### Forms & Validation

React Hook Form + Zod schemas (defined in `src/schemaValidations/`). Use `@hookform/resolvers/zod` for integration.

### Path Alias

`@/*` resolves to `src/*`.

### Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_ENDPOINT` | Backend base URL |
| `NEXT_PUBLIC_URL` | Frontend base URL |
| `NEXT_PUBLIC_WS_BASE` | WebSocket base URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth |
| `NEXT_PUBLIC_MINIO_PUBLIC_URL` | MinIO/S3 image CDN |