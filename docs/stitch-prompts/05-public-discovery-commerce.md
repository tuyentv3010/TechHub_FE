# 05 Public Discovery Commerce

## 1. Purpose and route coverage

Use this prompt for the browse, detail, blog, and checkout surfaces:
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

## 2. Users and roles allowed to access the screens

- Anonymous visitors can browse discovery and content pages according to current FE behavior.
- Purchase and some interactive actions may require authentication; keep the current gating and redirect logic.
- Authenticated learners can continue from discovery into purchase or learning without any route changes.

## 3. Data dependencies from FE

Query hooks:
- `src/queries/useCourse.ts`
- `src/queries/useLearningPath.ts`
- `src/queries/useBlog.ts`
- `src/queries/usePayment.ts`
- comment, rating, and notification hooks already consumed by these pages

API clients:
- `src/apiRequests/course.ts`
- `src/apiRequests/learning-path.ts`
- `src/apiRequests/blog.ts`
- `src/apiRequests/payment.ts`

Validation or state anchors:
- `src/schemaValidations/blog.schema.ts`
- `src/schemaValidations/course.schema.ts`
- payment and local-storage continuity behavior already implemented in FE

Page-local and shared components:
- `src/app/(public)/courses/CoursesClient.tsx`
- `src/app/(public)/courses/[slug]/page.tsx`
- course detail components already imported by that page, including rating and comments UI
- `src/app/(public)/learning-paths/LearningPathsClient.tsx`
- `src/app/(public)/learning-paths/learning-path-list.tsx`
- `src/app/(public)/learning-paths/[id]/learning-path-detail.tsx`
- `src/app/(public)/learning-paths/[id]/path-viewer.tsx`
- `src/app/(public)/skills/[id]/page.tsx`
- `src/app/(public)/blog/BlogListClient.tsx`
- `src/app/(public)/blog/[slug]/page.tsx`
- `src/app/(public)/payment/[slug]/page.tsx`
- `src/app/(public)/result/page.tsx`
- `src/app/(public)/vnpay-return/page.tsx`

## 4. Backend contract anchors

Proxy controllers:
- `CourseProxyController`
- `EnrollmentProxyController`
- `LearningPathProxyController`
- `BlogProxyController`
- `PaymentProxyController`

Domain anchors:
- `course-service` course, skill, tag, rating, comment, enrollment, exercise summary, and workspace-related read endpoints used on public detail pages
- `learning-path-service` learning path read endpoints
- `blog-service` blog and blog comment controllers
- `payment-service` VNPay, PayPal, and payment query controllers

## 5. Screen inventory per route

`/courses`
- page heading or hero
- search input
- filter bar and mobile or sheet filter UI
- level filter, language filter, skill multi-select, tag multi-select, price range
- active filter chips
- clear filters action
- course grid or list cards
- pagination
- loading and empty states

`/courses/[slug]`
- course hero with title, badges, pricing summary, and purchase CTA
- wishlist or save action if currently shown
- curriculum overview and chapter or lesson breakdown
- instructor information
- ratings summary and review UI
- comments or discussion thread with current real-time behavior
- skills, tags, objectives, requirements, and related metadata already surfaced by FE
- loading, not-found, and purchase-state handling

`/learning-paths`
- page heading or hero
- search input
- learning path cards with title, skills, summary, and CTA
- pagination and empty state

`/learning-paths/[id]`
- hero with learning path title and summary
- tabs for diagram view and list view
- skills section
- path visualization or viewer
- sidebar or secondary cards for path metadata, share, and CTA
- preserve copy-link and share affordances

`/skills/[id]`
- hero section for the selected skill
- related courses section
- related learning paths section
- loading and empty handling for each related content block

`/blog`
- heading and supporting copy
- search input
- tag filters
- blog cards or list
- pagination
- loading and empty states

`/blog/[slug]`
- article hero with title, metadata, and tags
- rich content body
- attachments section
- table of contents
- share actions
- comments and replies with the current live-update behavior
- preserve author, timestamp, and not-found treatment

`/payment/[slug]`
- order or checkout summary
- course card with thumbnail, lesson count, duration, and pricing
- payment method selection including VNPay and PayPal
- security or trust messaging
- final payment action
- preserve local continuity state and current redirect behavior

`/result`
- success and failure result states
- current recovery or next-step CTAs

`/vnpay-return`
- transaction processing state
- success or failure handoff
- redirect or final messaging behavior exactly as current FE uses it

## 6. Non-negotiables

- Preserve all filters, chips, sort or pagination behavior currently present on discovery pages.
- Preserve course detail interactions, including rating, comments, and purchase navigation.
- Preserve blog attachments, TOC, and real-time comment behavior.
- Preserve learning path diagram and list tabs.
- Preserve both payment methods and current handoff or return flows.
- Preserve loading, empty, error, success, and not-found states across every page.

## 7. Stitch output instructions

Redesign this area as the product's high-conversion discovery and purchase journey.

Output should:
- keep all current search, filter, detail, and purchase functionality
- strengthen information hierarchy so browsing, evaluation, and checkout feel faster
- keep current route and state transitions intact
- remain implementation-ready for Next.js, Tailwind, and existing data hooks and comment widgets

Do not reduce complex detail pages into shallow hero-plus-card templates.

## 8. Visual direction under the shared Two-track SaaS system

- polished discovery storefront with strong merchandising cues
- course and learning path detail pages should feel premium, credible, and content-rich
- checkout should feel calm, trustworthy, and conversion-oriented
- blog should read like a serious editorial surface connected to the same brand system
