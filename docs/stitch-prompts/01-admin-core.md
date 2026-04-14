# 01 Admin Core

## 1. Purpose and route coverage

Use this prompt for the non-finance admin surfaces:
- `/manage/dashboard`
- `/manage/accounts`
- `/manage/roles`
- `/manage/permissions`
- `/manage/blogs`
- `/manage/files`
- `/manage/unauthorized`
- shared admin shell and navigation used by in-scope `/manage/*` pages

Do not redesign:
- `/manage/revenue`
- `/manage/payouts`

## 2. Users and roles allowed to access the screens

- These screens are for authenticated staff users only.
- Final visibility is controlled by current profile roles plus permission checks from `usePermissions` and related role/permission hooks.
- `/manage/unauthorized` must remain available as the fallback screen for authenticated users who fail a permission gate.

## 3. Data dependencies from FE

Query hooks:
- `src/queries/useAccount.ts`
- `src/queries/useRole.ts`
- `src/queries/usePermission.ts`
- `src/queries/useBlog.ts`
- `src/queries/useFile.ts`
- `src/queries/useAi.ts`

API clients:
- `src/apiRequests/account.ts`
- `src/apiRequests/role.ts`
- `src/apiRequests/permission.ts`
- `src/apiRequests/blog.ts`
- `src/apiRequests/file.ts`
- `src/apiRequests/ai.ts`

Validation schemas:
- `src/schemaValidations/account.schema.ts`
- `src/schemaValidations/role.schema.ts`
- `src/schemaValidations/permission.schema.ts`
- `src/schemaValidations/blog.schema.ts`
- `src/schemaValidations/file.schema.ts`

Page-local and shared components:
- `src/app/manage/layout.tsx`
- `src/app/manage/nav-links.tsx`
- `src/app/manage/mobile-nav-links.tsx`
- `src/app/manage/dropdown-avatar.tsx`
- `src/app/manage/dashboard/page.tsx`
- `src/app/manage/accounts/account-table.tsx`
- `src/app/manage/accounts/add-employee.tsx`
- `src/app/manage/accounts/edit-employee.tsx`
- `src/app/manage/roles/role-table.tsx`
- `src/app/manage/roles/role-modal.tsx`
- `src/app/manage/permissions/permission-table.tsx`
- `src/app/manage/permissions/add-permission.tsx`
- `src/app/manage/permissions/edit-permission.tsx`
- `src/app/manage/blogs/blog-table.tsx`
- `src/app/manage/blogs/add-blog.tsx`
- `src/app/manage/blogs/edit-blog.tsx`
- `src/app/manage/files/file-table.tsx`
- `src/app/manage/files/upload-file-dialog.tsx`
- `src/app/manage/files/folder-tree-dialog.tsx`
- `src/components/organisms/NotificationBell.tsx`
- media picker and editor components already referenced by these screens

## 4. Backend contract anchors

Proxy controllers:
- `AuthProxyController`
- `UserProxyController`
- `UserPermissionProxyController`
- `AdminProxyController`
- `BlogProxyController`
- `FileProxyController`
- `AiProxyController`
- `NotificationProxyController`

Domain anchors:
- `user-service` user, auth, role, permission, and admin permission controllers
- `blog-service` blog and blog comment controllers
- `file-service` file, folder, and file usage controllers
- `ai-service` admin AI config, qdrant stats, reindex, and draft controllers

Confirm DTO and response shape from the existing FE hooks before changing presentation, but preserve the current FE-visible behavior as the source of truth.

## 5. Screen inventory per route

`/manage/dashboard`
- admin overview cards for pending drafts, indexed courses, indexed lessons, and provider or qdrant health summary
- runtime AI provider selection, model selection, provider status badge, and refresh actions
- reindex action group for courses, lessons, and full reindex
- qdrant statistics views including chart cards, table detail, and stats dialog
- pending learning path draft review table with approve and reject actions
- loading, refreshing, mutation-pending, and result dialog states

`/manage/accounts`
- table columns: id, avatar, username, email, roles, actions
- row actions for edit and delete
- add employee dialog and edit employee dialog
- form fields: avatar, username, email, roles, password, confirm password, and the edit-only change-password toggle path
- role badge rendering and staff account state handling
- validation and destructive confirmation states

`/manage/roles`
- table columns: name, description, active state, permission summary, actions
- create and edit modal
- form fields: name, description, active switch, permission selection list or badges
- assign and remove permission behavior must remain intact

`/manage/permissions`
- table columns: name, description, method, url, resource, actions
- create dialog and edit dialog
- form fields: name, description, method, resource, url, active switch
- keep resource and method semantics exactly as today

`/manage/blogs`
- filter controls for title or search term and status
- paginated table columns: id, thumbnail, title, status, tags, created date, actions
- add and edit blog dialogs or pages
- blog form fields: title, thumbnail, status, tags, rich content body
- tag management, media selection, preview imagery, and delete confirmation
- preserve current published versus draft behavior and author context

`/manage/files`
- file manager surface with statistics summary, folder-aware listing, and action toolbar
- upload file dialog for file selection, tags, description, and current upload flow
- folder tree dialog for navigating the current folder hierarchy and creating folders
- preserve file and folder browsing, per-user and per-folder loading states, and delete or management actions already present in the FE

`/manage/unauthorized`
- keep the explicit unauthorized screen with its current fallback purpose, messaging, and recovery navigation

Shared admin shell
- left sidebar with current route structure and icon semantics
- mobile nav sheet behavior
- top-right notification bell, language switch, theme controls, and avatar dropdown
- maintain current badge, unread count, and role-aware navigation visibility

## 6. Non-negotiables

- Preserve all current table columns, row actions, filters, dialogs, and forms.
- Preserve all current field names and validation rules from the existing schemas.
- Preserve permission and role gating exactly as implemented now.
- Preserve AI provider configuration, qdrant stats, and reindex actions exactly; only change layout and visual hierarchy.
- Preserve blog editor capabilities, tag editing, thumbnail behavior, and status workflow.
- Preserve file manager actions, folder tree behavior, and upload flows.
- Keep success, error, confirmation, loading, empty, and unauthorized states.

## 7. Stitch output instructions

Redesign this area as a premium operations console.

Output should:
- keep the current admin route structure and data wiring
- retain every existing action, dialog, and mutation trigger
- improve scanability for dense tables and dashboards
- use stronger visual grouping for filters, actions, summaries, and destructive controls
- stay compatible with existing Next.js, Tailwind, shadcn, React Query, and current editor/media picker integrations

Do not simplify the dashboard into static cards. Do not remove operational controls.

## 8. Visual direction under the shared Two-track SaaS system

- compact, high-clarity, executive-operations look
- premium dark/light surfaces with disciplined spacing and clear state badges
- dashboard cards should feel analytical but not finance-branded
- tables should feel modern and fast, with strong hover, selection, and toolbar treatments
- dialogs should feel sharp and focused, not oversized marketing modals
