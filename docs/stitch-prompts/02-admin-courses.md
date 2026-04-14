# 02 Admin Courses

## 1. Purpose and route coverage

Use this prompt for the full admin course management stack:
- `/manage/courses`
- `/manage/courses/[id]`
- `/manage/courses/[id]/content`
- `/manage/courses/[id]/exercise-drafts/[taskId]`

This prompt covers list management, create/edit course flows, course structure management, progress review, AI exercise generation, and draft approval.

## 2. Users and roles allowed to access the screens

- Authenticated staff only.
- Final access is controlled by the current course-related role and permission checks in FE.
- Preserve any current differences between viewers who can read versus edit course content.

## 3. Data dependencies from FE

Query hooks:
- `src/queries/useCourse.ts`
- `src/queries/useAi.ts`
- `src/queries/useAccount.ts`

API clients:
- `src/apiRequests/course.ts`
- `src/apiRequests/ai.ts`
- media/file integrations already used by course screens

Validation schemas:
- `src/schemaValidations/course.schema.ts`
- `src/schemaValidations/ai.schema.ts`

Page-local and shared components:
- `src/app/manage/courses/course-table.tsx`
- `src/app/manage/courses/course-filters.tsx`
- `src/app/manage/courses/add-course.tsx`
- `src/app/manage/courses/edit-course.tsx`
- `src/app/manage/courses/[id]/page.tsx`
- `src/app/manage/courses/[id]/content/page.tsx`
- `src/app/manage/courses/[id]/chapter-management.tsx`
- `src/app/manage/courses/[id]/lesson-management.tsx`
- `src/app/manage/courses/[id]/asset-management.tsx`
- `src/app/manage/courses/[id]/exercise-management.tsx`
- `src/app/manage/courses/[id]/progress-tracker.tsx`
- `src/app/manage/courses/[id]/generate-ai-exercise.tsx`
- `src/app/manage/courses/[id]/ai-exercise-panel.tsx`
- `src/app/manage/courses/[id]/exercise-drafts/[taskId]/page.tsx`
- shared media picker, tag manager, and skill manager components already referenced by these flows

## 4. Backend contract anchors

Proxy controllers:
- `CourseProxyController`
- `EnrollmentProxyController`
- `AiProxyController`

Domain anchors:
- `course-service` course, chapter, lesson, asset, progress, rating, comment, exercise, skill, tag, and workspace controllers
- `ai-service` exercise generation and draft approval or rejection controllers

Preserve current FE behavior even if BE exposes more fields than the UI currently renders.

## 5. Screen inventory per route

`/manage/courses`
- paginated course table
- columns: title, thumbnail, intro video, status, level, price, total enrollments, average rating, created date, actions
- search and filter toolbar
- filters: status, level, language, skills, tags, minimum price, maximum price, apply, clear
- add course and edit course flows
- delete confirmation flow

Course create and edit forms
- fields: title, description, level, language, price, discount price, status
- media fields: thumbnail and intro video
- taxonomy fields: skills and tags
- list fields: objectives and requirements
- preserve current default values, optionality, validation, and save flow

`/manage/courses/[id]`
- top-level course detail view
- tabs: content, progress, ai-exercises
- chapter and lesson overview using accordion-style content browsing
- preserve tab semantics, course id routing, and current state restoration

`/manage/courses/[id]/content`
- chapter management: create, edit, delete, reorder
- chapter fields: title, description, order
- lesson management inside chapters
- lesson fields: title, description, content type, content, duration or order index, free-preview flag, video url
- asset management inside lessons
- asset fields: asset type, title, external url or linked media, order index
- exercise management inside lessons
- exercise fields: type, question, order index, options, coding test cases, per-type configuration
- keep drag/drop or current reorder affordances, nested content hierarchy, badges, and action menus
- preserve conditional rendering by lesson type, exercise type, and available media state

`/manage/courses/[id]` progress tab and related tracker
- completion summaries and progress visuals
- lesson completion status
- current mark-complete or tracking affordances already present in FE

AI exercise generation flow
- generation panel and dialog for selecting language, difficulties, formats, variants, count
- boolean options for explanations and test cases
- custom instruction field
- preserve pending, success, failure, and draft handoff behavior

`/manage/courses/[id]/exercise-drafts/[taskId]`
- draft review screen for AI-generated exercises
- preserve draft metadata, generated result preview, per-item selection, approve flow, reject flow, and navigation back to the originating course context

## 6. Non-negotiables

- Preserve all current course fields, list inputs, taxonomy inputs, media inputs, and validation semantics.
- Preserve chapter, lesson, asset, and exercise nesting exactly. No flattening of the authoring model.
- Preserve all content-type and exercise-type specific UI branches.
- Preserve all current tabs, nested routes, dialogs, and approval flows.
- Preserve AI generation request parameters and draft review behavior.
- Preserve loading, empty, error, success, and destructive confirmation states across list and nested editor views.

## 7. Stitch output instructions

Redesign this area as a premium curriculum studio.

Output should:
- keep the current data flow and mutation boundaries
- make nested content authoring easier to scan and safer to edit
- visually separate structure management from metadata editing
- keep the same forms, fields, and action order
- remain implementation-ready for Next.js, Tailwind, shadcn, and the current hook/component architecture

Do not collapse complex authoring screens into simplified marketing cards. This area is an operational editor.

## 8. Visual direction under the shared Two-track SaaS system

- studio-like control surface for curriculum building
- dense but elegant hierarchy for chapter, lesson, asset, and exercise nesting
- strong visual treatment for draft, published, and in-progress states
- clear differentiation between metadata forms, content tree, AI tools, and approval surfaces
