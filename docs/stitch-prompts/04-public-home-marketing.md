# 04 Public Home Marketing

## 1. Purpose and route coverage

Use this prompt for TechHub's marketing-facing public surfaces:
- `/`
- `/about`
- `/contact`
- shared public header, nav, footer, and floating entry points used by these pages

## 2. Users and roles allowed to access the screens

- Anonymous visitors and authenticated users can access these pages.
- Preserve the current auth-aware header behavior so the shell still adapts between guest and signed-in states.

## 3. Data dependencies from FE

Query hooks:
- `src/queries/useCourse.ts`
- `src/queries/useAccount.ts`
- queries used by `src/components/footer.tsx` for recent blogs and skills

API clients:
- `src/apiRequests/course.ts`
- `src/apiRequests/account.ts`
- `src/apiRequests/blog.ts`
- any request clients already used by footer or section components

Validation or state anchors:
- contact page currently uses local component state plus toast only; do not invent a backend submission flow

Page-local and shared components:
- `src/app/(public)/layout.tsx`
- `src/app/(public)/page.tsx`
- `src/app/(public)/about/page.tsx`
- `src/app/(public)/contact/page.tsx`
- `src/app/(public)/nav-items.tsx`
- `src/components/organisms/DropdownProfile.tsx`
- `src/components/footer.tsx`
- `src/components/organisms/HeroSection.tsx`
- `src/components/organisms/NewCategoriesSection.tsx`
- `src/components/organisms/CoursesGridSection.tsx`
- `src/components/organisms/LearningPathsSection.tsx`
- `src/components/organisms/NewSkillsSection.tsx`
- `src/components/organisms/CommunitySectionNew.tsx`
- `src/components/organisms/InstructorsSection.tsx`
- `src/components/organisms/BlogSection.tsx`

## 4. Backend contract anchors

Proxy controllers:
- `CourseProxyController` for public course list data rendered on home
- `UserProxyController` for public instructor data
- `BlogProxyController` and course or skill endpoints consumed by footer and content sections

Domain anchors:
- `course-service` course, skill, and tag endpoints used for discovery surfaces
- `user-service` public instructor/profile exposure used on home
- `blog-service` recent blog data used in footer or blog highlights

## 5. Screen inventory per route

`/`
- hero section with welcome copy, title, subtitle, CTA, and instructor presence
- category section
- featured courses section with loading skeletons, view-all action, and empty-state fallback
- learning paths section
- skills section
- community or trust section with stats
- instructors section with loading skeletons
- blog section
- footer

`/about`
- hero section with background image, title, and descriptive copy
- goal section with heading, supporting copy, and image grid
- mission section with image and checklist-style mission bullets
- stats section with headline metrics
- CTA section with background image and login/get-started action
- footer

`/contact`
- hero section with background image, title, and descriptive copy
- contact info cards for email, phone, and address
- supporting image grid
- contact form with fields: name, email, subject, message
- submit button and success toast
- embedded map section
- footer

Shared public shell
- top nav with public links, auth entry or profile dropdown, and responsive mobile treatment
- floating AI chat entry and current footer composition must remain intact

## 6. Non-negotiables

- Preserve all current sections on each page. Do not remove entire narrative blocks.
- Preserve current CTA destinations and header/footer links.
- Preserve current home page data wiring to published courses and public instructors.
- Preserve contact form fields and current toast-based submission behavior without adding new backend logic.
- Preserve image-driven storytelling on about and contact pages.
- Preserve loading and empty states where already present.

## 7. Stitch output instructions

Redesign this area as the polished marketing track of the product.

Output should:
- keep all current sections and CTAs
- improve storytelling, rhythm, and visual hierarchy
- keep the current FE data sources and shell behavior
- remain practical for implementation in Next.js, Tailwind, and the existing component structure

Do not turn these pages into generic SaaS templates. Preserve the education brand and trust-building emphasis.

## 8. Visual direction under the shared Two-track SaaS system

- premium marketing-led landing experience
- bold hero composition, strong section breaks, and richer surfaces than the admin area
- aspirational but credible education branding
- use imagery, editorial typography, and clean motion to make the product feel established and high-quality
