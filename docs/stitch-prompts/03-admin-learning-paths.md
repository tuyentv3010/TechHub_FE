# 03 Admin Learning Paths

## 1. Purpose and route coverage

Use this prompt for the admin learning path builder:
- `/manage/learning-paths`
- `/manage/learning-paths/[id]/designer`
- `/manage/learning-paths/drafts/[taskId]/designer`

This includes CRUD, AI generation, course selection, graph layout design, and draft approval.

## 2. Users and roles allowed to access the screens

- Authenticated staff only.
- Preserve existing FE permission checks for learning-path management and AI-assisted operations.

## 3. Data dependencies from FE

Query hooks:
- `src/queries/useLearningPath.ts`
- `src/queries/useCourse.ts`
- `src/queries/useAi.ts`

API clients:
- `src/apiRequests/learning-path.ts`
- `src/apiRequests/course.ts`
- `src/apiRequests/ai.ts`

Validation schemas:
- `src/schemaValidations/learning-path.schema.ts`
- `src/schemaValidations/ai.schema.ts`

Page-local and shared components:
- `src/app/manage/learning-paths/learning-path-table.tsx`
- `src/app/manage/learning-paths/add-learning-path.tsx`
- `src/app/manage/learning-paths/edit-learning-path.tsx`
- `src/app/manage/learning-paths/course-selector.tsx`
- `src/app/manage/learning-paths/generate-ai-learning-path.tsx`
- `src/app/manage/learning-paths/[id]/designer/path-designer.tsx`
- `src/app/manage/learning-paths/drafts/[taskId]/designer/draft-designer.tsx`
- existing React Flow based graph components and provider wiring

## 4. Backend contract anchors

Proxy controllers:
- `LearningPathProxyController`
- `CourseProxyController`
- `AiProxyController`

Domain anchors:
- `learning-path-service` learning path and progress controllers
- `course-service` course discovery used for selection
- `ai-service` learning path generation, draft fetch, approve, and reject controllers

## 5. Screen inventory per route

`/manage/learning-paths`
- paginated learning path table
- columns: title, description, associated courses, skills, created date, actions
- search toolbar
- add and edit flows
- delete flow
- entry points to open the designer
- AI generation trigger
- pending AI draft summary cards or list with approve, reject, and open actions

Learning path create and edit forms
- fields: title, description, skills
- preserve current skill tag management and save or cancel flow

Course selector flow
- searchable list of available courses
- course cards or rows with checkbox selection and summary badges
- preserve current multi-select semantics and any ordering or optional-course flags already present

AI learning path generation
- fields for goal, timeframe, language, current level, target level
- options for including positions and projects
- preserve preferred course input and any hidden defaults already used by FE
- preserve loading, result handoff, and draft creation behavior

`/manage/learning-paths/[id]/designer`
- graph or node-based path designer
- visual course nodes and path edges
- preserve current course ordering, optional markers, drag positioning, save layout, and add/remove course actions
- preserve designer-level metadata and current navigation back to the list

`/manage/learning-paths/drafts/[taskId]/designer`
- draft designer using AI-generated draft data
- preserve approve flow, reject flow, edit-before-approve behavior, and return navigation
- draft-specific status and metadata must remain visible

## 6. Non-negotiables

- Preserve all learning path fields and payload semantics.
- Preserve course selection, ordering, optional-course handling, and saved node positions.
- Preserve AI generation request parameters and draft review lifecycle.
- Preserve graph editing behavior and current route structure.
- Preserve loading, empty, error, success, and confirmation states.

## 7. Stitch output instructions

Redesign this area as a planning and systems-design workspace.

Output should:
- keep the current CRUD and AI flows intact
- make the table, draft queue, and graph designer feel like one coherent toolset
- strengthen the relationship between list mode, selector mode, and canvas mode
- stay implementation-ready for React Flow, Next.js, Tailwind, shadcn, and existing query hooks

Do not replace the graph designer with a static list-only UI.

## 8. Visual direction under the shared Two-track SaaS system

- premium systems-planning aesthetic
- graph designer should feel precise, calm, and operational
- AI draft states should look clearly distinct from manually curated paths
- use compact controls with strong hierarchy around node content, graph actions, and review actions
