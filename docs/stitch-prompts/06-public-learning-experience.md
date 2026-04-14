# 06 Public Learning Experience

## 1. Purpose and route coverage

Use this prompt for the authenticated learning and support experience:
- `/my-learning`
- `/recommendations`
- `/courses/[slug]/learn`
- `/notifications`
- `/ai-chat`
- `/test-websocket`

The last route is an internal diagnostic page, but it is still part of FE route coverage and should remain functionally intact.

## 2. Users and roles allowed to access the screens

- These screens are primarily for authenticated learners.
- Preserve current login redirects, enrollment checks, and access guards exactly as implemented in FE.
- `/test-websocket` is a developer or diagnostic utility page; keep it functional rather than marketing-oriented.

## 3. Data dependencies from FE

Query hooks:
- `src/queries/useMyLearning.ts`
- `src/queries/useCourse.ts`
- `src/queries/useCourseProgress.ts`
- `src/queries/useCourseComments.ts`
- `src/queries/useNotification.ts`
- `src/queries/useAi.ts`
- `src/queries/useAccount.ts`

API clients:
- `src/apiRequests/course.ts`
- `src/apiRequests/notification.ts`
- `src/apiRequests/ai.ts`
- related auth/profile request clients already used for guards and user identity

Validation or state anchors:
- `src/schemaValidations/ai.schema.ts`
- course learning local-storage keys for last lesson position and onboarding tour seen-state
- websocket-driven live update behavior already implemented in course learning and diagnostic views

Page-local and shared components:
- `src/app/(public)/my-learning/page.tsx`
- `src/app/(learning)/recommendations/page.tsx`
- `src/app/(learning)/courses/[slug]/learn/page.tsx`
- `src/components/course/CourseLearningLayout.tsx`
- `src/components/course/CourseOnboardingTour.tsx`
- `src/components/course/CourseCommentsList.tsx`
- `src/components/course/ExercisePlayer.tsx`
- `src/components/course/ExerciseDisplay.tsx`
- `src/components/course/VideoPlayer.tsx`
- `src/app/(public)/notifications/page.tsx`
- `src/app/(public)/ai-chat/page.tsx`
- `src/app/test-websocket/page.tsx`

## 4. Backend contract anchors

Proxy controllers:
- `CourseProxyController`
- `EnrollmentProxyController`
- `NotificationProxyController`
- `AiProxyController`
- `AiStreamingProxyController`
- `UserProxyController`

Domain anchors:
- `course-service` enrollment, progress, lesson comment, exercise, and workspace-related controllers
- `notification-service` notification list, unread count, and read-marking controllers
- `ai-service` recommendation, chat, streaming chat, and draft controllers where referenced by FE
- `user-service` profile and access checks that inform learner gating

## 5. Screen inventory per route

`/my-learning`
- page heading and summary
- tabs for all, enrolled, in-progress, completed, and dropped
- course cards with status badge, progress information, and action CTA
- loading and empty states per learner inventory

`/recommendations`
- filter card
- language selector
- exclusion controls for existing courses
- action buttons for realtime and scheduled generation
- tabs for realtime versus scheduled results
- stats cards
- recommendation cards with scores, badges, tags, and detail dialog
- preserve loading, error, pending, and empty states

`/courses/[slug]/learn`
- enrollment and auth guard flow
- loading state for course data and access check
- course learning header with back action, course title, progress summary, and onboarding trigger
- main lesson content area with video or content player
- lesson description and content rendering
- exercise section and exercise player
- lesson assets and resources with external links and document download behavior
- sticky bottom navigation with previous, complete, Q and A, exercise jump, and next lesson actions
- right sidebar lesson list with chapter accordion, completion badges, lock states, current lesson state, lesson duration, and exercise badge
- comment modal with live lesson discussion and reply flow
- onboarding tour and local continuation behavior
- preserve confetti, completion, progress invalidation, and websocket updates

`/notifications`
- header and unread summary
- mark-all-read action
- tabs for all, unread, and read
- notification list items with status, metadata, timestamps, per-item read action, and deep-link behavior
- loading, empty, and pagination states

`/ai-chat`
- chat mode selection for general and advisor
- session list and search
- new chat action
- preset prompts or quick starters
- message list with streaming or pending states
- composer, send action, and supporting controls
- settings or guide affordances already present in FE
- preserve current session persistence and message fetch behavior

`/test-websocket`
- connection status display
- websocket endpoint display
- blog id input
- connect and disconnect buttons
- message input and send action
- terminal-style log view
- clear-log action
- instructions block

## 6. Non-negotiables

- Preserve learner access checks, login redirects, and enrollment enforcement.
- Preserve course progress tracking, lesson completion, and local-storage continuation behavior.
- Preserve real-time comments and websocket-backed updates.
- Preserve all tabs, filters, recommendation modes, and chat modes.
- Preserve notification deep links and read or unread behavior.
- Preserve the internal diagnostic behavior of `/test-websocket`.
- Preserve loading, empty, error, success, and pending states across all pages.

## 7. Stitch output instructions

Redesign this area as the product's immersive learning workspace.

Output should:
- keep every current learner action and access rule intact
- improve focus, concentration, and scanability in the course player
- keep recommendations and AI chat clearly related but visually distinct from the course player
- preserve current websocket, comment, and progress integrations
- remain implementation-ready for Next.js, Tailwind, shadcn, and the current learning components

Do not simplify the course player into a basic video page. It is a multi-panel learning interface.

## 8. Visual direction under the shared Two-track SaaS system

- focused, calm, high-trust learning environment
- the course player should feel immersive and task-oriented, with strong attention on lesson content and progress
- recommendations and AI chat should feel like intelligent companions, not separate products
- internal diagnostic UI can stay utilitarian but should still align with the shared component language
