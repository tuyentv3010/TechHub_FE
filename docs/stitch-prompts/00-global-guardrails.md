# 00 Global Guardrails

## 1. Purpose and route coverage

Use this prompt as the mandatory base prompt for every Stitch redesign in TechHub FE.

It applies to all in-scope screens across:
- public marketing routes
- public discovery and commerce routes
- authenticated learning routes
- auth/profile/settings routes
- admin routes except the explicit finance exclusions

Explicit exclusions:
- `/manage/revenue`
- `/manage/payouts`

## 2. Users and roles allowed to access the screens

- Anonymous visitors can access public marketing, discovery, blog, about/contact, and auth entry flows according to current FE behavior.
- Authenticated learners can access profile, setting, notifications, my-learning, payment continuation, AI chat, recommendations, and course learning flows according to existing guards and redirects.
- Admin and employee users access `/manage/*` through current role and permission checks derived from profile data and permission endpoints.
- Unauthorized users must continue to land on the current unauthorized state instead of seeing hidden content.

## 3. Data dependencies from FE

Shared FE anchors that Stitch must respect:
- `src/app/layout.tsx`
- `src/components/app-provider.tsx`
- `src/app/(public)/layout.tsx`
- `src/app/manage/layout.tsx`
- `src/app/manage/nav-links.tsx`
- `src/app/manage/mobile-nav-links.tsx`
- `src/app/manage/menuItems.ts`
- `src/app/manage/dropdown-avatar.tsx`
- `src/components/organisms/DropdownProfile.tsx`
- `src/components/organisms/NotificationBell.tsx`
- `src/components/footer.tsx`
- `src/hooks/usePermissions.ts`
- `src/components/theme-toggle.tsx`
- `src/components/theme-color-toggle.tsx`
- `src/components/switch-language.tsx`
- `src/providers/socket-provider.tsx` and current websocket consumers
- global UI primitives from `src/components/ui/*`

Shared query and request anchors:
- `src/queries/useAccount.ts`
- `src/queries/useAuth.ts`
- `src/queries/useNotification.ts`
- `src/apiRequests/account.ts`
- `src/apiRequests/auth.ts`
- `src/apiRequests/notification.ts`

Shared validation and state anchors:
- `src/schemaValidations/account.schema.ts`
- `src/schemaValidations/auth.schema.ts`
- `src/schemaValidations/password.schema.ts`
- React Query cache behavior already wired in the existing hooks
- Next Intl message keys and translation namespaces already used by pages/components

## 4. Backend contract anchors

Shared backend anchors that support global app behavior:
- `AuthProxyController`
- `UserProxyController`
- `UserPermissionProxyController`
- `AdminProxyController`
- `NotificationProxyController`

Relevant domain services:
- `user-service` auth, OAuth2, user profile, password, role, and permission controllers
- `notification-service` notification list, read, and count controllers

Do not expand this prompt into finance domain controllers for excluded admin screens.

## 5. Screen inventory per route

Shared app shell inventory:
- Global root layout includes providers for auth/app state, theme, i18n, toast, top loader, and React Query.
- Public shell includes top navigation, auth/profile dropdown, footer, floating AI entry, and responsive mobile behavior.
- Admin shell includes sidebar navigation, mobile nav, language switch, theme controls, notification bell, avatar dropdown, and the AI learning path provider.
- Learning player routes may use a different layout density but still inherit theme, i18n, auth state, and toast behavior.

Shared interactive states that must remain visible where they exist today:
- loading skeletons and spinners
- empty states
- destructive confirmations
- mutation-pending button states
- success and error toasts
- unread notification badges
- auth redirect and token refresh transitions
- unauthorized access screen instead of silent failure

Shared navigation and identity patterns:
- keep the existing route destinations in profile menus, admin menus, footer links, and notification deep links
- keep the current avatar usage, role-aware navigation visibility, and notification read or unread treatment
- keep light mode, dark mode, and theme color switching
- keep language switching and current translation key usage

## 6. Non-negotiables

- UI refresh only. Do not add, remove, or rename any route, query, mutation, payload key, field, state, or permission rule.
- Preserve all existing forms, field sets, validation semantics, required markers, password-confirm flows, and conditional fields.
- Preserve current responsive behavior, including desktop, tablet, and mobile nav patterns.
- Preserve existing websocket-backed real-time behavior for notifications, blog comments, and lesson comments where already implemented.
- Preserve all current loading, empty, error, success, not-found, and unauthorized states.
- Preserve the current use of Next.js, Tailwind CSS, shadcn/ui-style primitives, and current FE hook boundaries.
- Do not convert current business logic into mock data, no-op handlers, or simplified placeholders.
- Do not redesign excluded screens by proxy. Finance analytics visuals and payout management remain untouched.

## 7. Stitch output instructions

Redesign only the visual system, layout hierarchy, spacing, typography, icon treatment, card/table styling, and component presentation.

When generating code or design direction:
- reuse current FE hooks, request clients, and schema contracts
- keep current page boundaries and route structure
- keep the same component responsibilities unless a purely presentational split improves clarity
- keep table columns, filters, dialogs, tabs, forms, and actions intact
- keep all mutation entry points, deep links, and redirect destinations intact
- produce implementation-ready output that fits the existing Next.js plus Tailwind plus shadcn stack

If a detail is not explicitly restated in an area prompt, defer to the current FE implementation.

## 8. Visual direction under the shared Two-track SaaS system

Shared brand language:
- a single brand family across public and admin, with consistent radii, motion language, icons, and color tokens
- clear density contrast between public and admin rather than two unrelated products
- gradients, surface layering, and accent colors may be expressive, but they must remain usable in both light and dark themes

Public track:
- polished, aspirational, marketing-led
- large storytelling sections, strong imagery, generous spacing, persuasive CTAs
- course and community surfaces should feel credible and premium rather than playful or generic

Admin track:
- premium, compact, operational
- high information density with strong visual hierarchy
- tables, filters, dialogs, and status badges should feel controlled, fast, and trustworthy
