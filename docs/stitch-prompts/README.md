# TechHub Stitch Prompt Pack

This folder contains the prompt pack for a full visual refactor of TechHub FE with Stitch.

The pack is intentionally limited to presentation changes only. It must preserve:
- current route paths
- current data fetching and mutations
- current forms, fields, validation, permissions, and role gating
- current loading, empty, error, and success states
- current business logic, response handling, and navigation flows

## Prompt Files

- `00-global-guardrails.md`: global rules, shared app chrome, i18n/theme/notification/auth constraints, and explicit exclusions.
- `01-admin-core.md`: admin shell plus dashboard, accounts, roles, permissions, blogs, files, and unauthorized access.
- `02-admin-courses.md`: admin course list, create/edit flows, course detail, course content builder, progress view, AI exercise flows, and exercise draft review.
- `03-admin-learning-paths.md`: admin learning path list, create/edit flows, AI generation, designer, and draft designer.
- `04-public-home-marketing.md`: home page, about, contact, and public-facing nav/footer chrome.
- `05-public-discovery-commerce.md`: course discovery, course detail, learning path detail, skills, blog, payment, result, and VNPay return.
- `06-public-learning-experience.md`: my learning, recommendations, course learning player, notifications, AI chat, and the internal WebSocket diagnostic page.
- `07-account-auth-profile.md`: login, register, logout, forgot/reset password, verify email, OAuth redirect/login, refresh token, profile, and setting.

## Coverage Map

`00-global-guardrails.md`
- Applies to every screen listed below.

`01-admin-core.md`
- `/manage/dashboard`
- `/manage/accounts`
- `/manage/roles`
- `/manage/permissions`
- `/manage/blogs`
- `/manage/files`
- `/manage/unauthorized`
- shared admin shell on `/manage/*` routes that remain in scope

`02-admin-courses.md`
- `/manage/courses`
- `/manage/courses/[id]`
- `/manage/courses/[id]/content`
- `/manage/courses/[id]/exercise-drafts/[taskId]`

`03-admin-learning-paths.md`
- `/manage/learning-paths`
- `/manage/learning-paths/[id]/designer`
- `/manage/learning-paths/drafts/[taskId]/designer`

`04-public-home-marketing.md`
- `/`
- `/about`
- `/contact`
- shared public nav/footer/header chrome used by marketing pages

`05-public-discovery-commerce.md`
- `/courses`
- `/courses/[slug]`
- `/learning-paths`
- `/learning-paths/[id]`
- `/skills/[id]`
- `/blog`
- `/blog/[slug]`
- `/payment/[slug]`
- `/result`
- `/vnpay-return`

`06-public-learning-experience.md`
- `/my-learning`
- `/recommendations`
- `/courses/[slug]/learn`
- `/notifications`
- `/ai-chat`
- `/test-websocket`

`07-account-auth-profile.md`
- `/login`
- `/register`
- `/logout`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/login/oauth`
- `/oauth2/redirect`
- `/refresh-token`
- `/profile`
- `/setting`

## Explicit Exclusions

Do not use this prompt pack to redesign:
- `/manage/revenue`
- `/manage/payouts`

Finance analytics and payout management are intentionally out of scope.

## Out Of Scope For Visual Prompting

These exist in `src/app` but are not user-facing redesign targets:
- `src/app/api/**`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- static image assets under `src/app`

## Source Of Truth Rules

- FE visible behavior is the primary source of truth.
- BE contracts are used only to confirm payload shape, required fields, statuses, and action constraints.
- If FE and BE differ, preserve what the FE currently exposes unless the BE contract proves a required dependency the FE already relies on.

## Recommended Usage

1. Always give Stitch `00-global-guardrails.md`.
2. Add the area file that matches the screen set being redesigned.
3. If a redesign spans multiple areas, combine the relevant files instead of rewriting the rules manually.
4. Do not ask Stitch to invent new flows, remove fields, rename payload keys, or change permission logic.
5. Treat the cited FE file paths inside each prompt as implementation anchors for exact field names, state handling, and component reuse.
