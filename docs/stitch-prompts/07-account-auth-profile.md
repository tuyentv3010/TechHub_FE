# 07 Account Auth Profile

## 1. Purpose and route coverage

Use this prompt for account entry, recovery, profile, and personal settings:
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

## 2. Users and roles allowed to access the screens

- Guests use login, register, forgot password, reset password, verify email, login/oauth, and oauth2/redirect.
- Authenticated users use logout, refresh-token, profile, and setting.
- Some auth routes may be reachable during transition states even when the user already has a token; preserve current FE redirect handling.

## 3. Data dependencies from FE

Query hooks:
- `src/queries/useAuth.ts`
- `src/queries/useAccount.ts`

API clients:
- `src/apiRequests/auth.ts`
- `src/apiRequests/account.ts`

Validation schemas:
- `src/schemaValidations/auth.schema.ts`
- `src/schemaValidations/account.schema.ts`
- `src/schemaValidations/password.schema.ts`

Page-local and shared components:
- `src/app/(public)/(auth)/_components/auth-form.tsx`
- `src/app/(public)/(auth)/forgot-password/new-forgot-password-form.tsx`
- `src/app/(public)/(auth)/reset-password/new-reset-password-form.tsx`
- `src/app/(public)/(auth)/verify-email/new-verify-email-form.tsx`
- `src/app/(public)/(auth)/logout/logout.tsx`
- `src/app/(public)/(auth)/refresh-token/refresh-token.tsx`
- `src/app/(public)/(auth)/login/oauth/page.tsx`
- `src/app/(public)/(auth)/oauth2/redirect/page.tsx`
- `src/app/(public)/profile/page.tsx`
- `src/app/(public)/setting/page.tsx`
- `src/components/app-provider.tsx`
- shared media picker, theme, and language components used by profile and setting

## 4. Backend contract anchors

Proxy controllers:
- `AuthProxyController`
- `UserProxyController`

Domain anchors:
- `user-service` auth, OAuth2, user, password, activation, and profile controllers

Keep the current FE-exposed field set even if backend contracts support additional account attributes not shown on these screens.

## 5. Screen inventory per route

`/login`
- fields: email, password
- submit action
- links to register and forgot password
- current callback or redirect handling
- preserve loading, error, and success states

`/register`
- fields: username, email, password, confirm password
- submit action
- preserve validation and post-register verify-email flow

`/forgot-password`
- field: email
- submit action
- preserve resend or continuation behavior already present in FE

`/reset-password`
- fields: otp, new password, confirm password
- reset submit action
- resend code action
- success transition after reset

`/verify-email`
- verification code input flow
- verify action
- resend code action
- success and failure states

`/login/oauth`
- OAuth provider handoff entry
- loading and redirect treatment

`/oauth2/redirect`
- token exchange or callback completion screen
- loading, success, and failure transitions

`/refresh-token`
- silent refresh workflow with redirect target handling
- fallback when refresh fails

`/logout`
- logout processing state and redirect handoff

`/profile`
- tabs: profile and password
- profile fields: avatar, username
- password fields: current password, new password, confirm password
- preserve media selection flow for avatar and current profile update mutations

`/setting`
- language settings with display language switcher
- appearance settings with theme mode toggle and theme color toggle
- preserve current local or provider-backed setting behavior

## 6. Non-negotiables

- Preserve every current auth, password, verification, redirect, and token-refresh flow.
- Preserve all current fields and validation rules exactly.
- Preserve callback URL handling and OAuth redirect behavior.
- Preserve profile update and password change behavior.
- Preserve language, theme mode, and theme color controls.
- Preserve loading, error, success, and transitional processing states on all auth routes.

## 7. Stitch output instructions

Redesign this area as the identity and personal control layer of the product.

Output should:
- keep all current auth and recovery flows intact
- make high-friction screens like reset password and verify email feel clearer and safer
- preserve current hook and schema contracts
- remain implementation-ready for Next.js, Tailwind, shadcn, and the current auth-provider wiring

Do not merge distinct flows together or remove intermediate states just to simplify the visuals.

## 8. Visual direction under the shared Two-track SaaS system

- clean, high-trust account experience
- auth screens should feel premium and calm, with strong clarity around next steps
- profile and setting should feel like a polished personal workspace, lighter than admin but more functional than marketing pages
