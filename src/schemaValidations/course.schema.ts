import z from "zod";

export const CourseStatus = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const CourseLevel = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"]);
export const Language = z.enum(["VI", "EN", "JA"]);

// Course Item Response
export const CourseItemRes = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  discountPrice: z.number().nullable(),
  promoEndDate: z.string().nullable(),
  status: CourseStatus,
  level: CourseLevel,
  language: Language,
  categories: z.array(z.string()),
  tags: z.array(z.string()),
  objectives: z.array(z.string()),
  requirements: z.array(z.string()),
  instructorId: z.string(),
  thumbnail: z.object({
    id: z.string(),
    url: z.string(),
    secureUrl: z.string(),
  }).nullable(),
  introVideo: z.object({
    id: z.string(),
    url: z.string(),
    secureUrl: z.string(),
  }).nullable(),
  created: z.string(),
  updated: z.string(),
  active: z.boolean(),
  totalEnrollments: z.number(),
  averageRating: z.number().nullable(),
  ratingCount: z.number(),
});

export type CourseItemResType = z.TypeOf<typeof CourseItemRes>;

// Course List Response (with API wrapper)
export const CourseListRes = z.object({
  success: z.boolean(),
  status: z.string(),
  code: z.number(),
  message: z.string(),
  data: z.array(CourseItemRes),
  pagination: z.object({
    page: z.number(),
    size: z.number(),
    totalElements: z.number(),
    totalPages: z.number(),
    first: z.boolean(),
    last: z.boolean(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
  }),
  timestamp: z.string(),
  path: z.string(),
});

export type CourseListResponseType = z.TypeOf<typeof CourseListRes>;

// Course Detail Response (with API wrapper and nested structure)
export const CourseDetailRes = z.object({
  success: z.boolean(),
  status: z.string(),
  code: z.number(),
  message: z.string(),
  data: z.object({
    summary: CourseItemRes,
    chapters: z.array(z.any()).optional(),
    totalChapters: z.number().optional(),
    totalLessons: z.number().optional(),
    totalEstimatedDurationMinutes: z.number().optional(),
    completedLessons: z.number().optional(),
    overallProgress: z.number().optional(),
    enrolled: z.boolean().optional(),
    enrollmentStatus: z.string().nullable().optional(),
    currentChapterId: z.string().nullable().optional(),
    lockedChapterIds: z.array(z.string()).optional(),
    unlockedChapterIds: z.array(z.string()).optional(),
  }),
  timestamp: z.string(),
  path: z.string(),
});

export type CourseDetailResponseType = z.TypeOf<typeof CourseDetailRes>;

// Create Course Body
export const CreateCourseBody = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be >= 0"),
  discountPrice: z.number().min(0).optional(),
  level: CourseLevel,
  language: Language,
  status: CourseStatus,
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  thumbnailFileId: z.string().optional(),
  introVideoFileId: z.string().optional(),
});

export type CreateCourseBodyType = z.TypeOf<typeof CreateCourseBody>;

// Update Course Body
export const UpdateCourseBody = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  discountPrice: z.number().min(0).optional(),
  level: CourseLevel.optional(),
  language: Language.optional(),
  status: CourseStatus.optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  thumbnailFileId: z.string().optional(),
  introVideoFileId: z.string().optional(),
});

export type UpdateCourseBodyType = z.TypeOf<typeof UpdateCourseBody>;

// Delete Course Response
export const DeleteCourseRes = z.object({
  message: z.string(),
});

export type DeleteCourseResType = z.TypeOf<typeof DeleteCourseRes>;

// ============================================
// CHAPTER SCHEMAS
// ============================================

// Chapter Item
export const ChapterItem = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  order: z.number(),
  created: z.string(),
  updated: z.string(),
  active: z.boolean(),
  lessons: z.array(z.any()).optional(),
});

export type ChapterItemType = z.TypeOf<typeof ChapterItem>;

// Create Chapter Body
export const CreateChapterBody = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  order: z.number().min(1, "Order must be at least 1"),
});

export type CreateChapterBodyType = z.TypeOf<typeof CreateChapterBody>;

// Update Chapter Body
export const UpdateChapterBody = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  order: z.number().min(1).optional(),
});

export type UpdateChapterBodyType = z.TypeOf<typeof UpdateChapterBody>;

// ============================================
// LESSON SCHEMAS
// ============================================

export const ContentType = z.enum(["VIDEO", "TEXT", "QUIZ", "CODING"]);

// Lesson Item
export const LessonItem = z.object({
  id: z.string(),
  chapterId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  contentType: ContentType,
  content: z.string().nullable(),
  duration: z.number().nullable(),
  order: z.number(),
  isFree: z.boolean(),
  created: z.string(),
  updated: z.string(),
  active: z.boolean(),
  assets: z.array(z.any()).optional(),
});

export type LessonItemType = z.TypeOf<typeof LessonItem>;

// Create Lesson Body
export const CreateLessonBody = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  contentType: ContentType,
  content: z.string().optional(),
  duration: z.number().min(0).optional(),
  order: z.number().min(1, "Order must be at least 1"),
  isFree: z.boolean().default(false),
});

export type CreateLessonBodyType = z.TypeOf<typeof CreateLessonBody>;

// Update Lesson Body
export const UpdateLessonBody = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  contentType: ContentType.optional(),
  content: z.string().optional(),
  duration: z.number().min(0).optional(),
  order: z.number().min(1).optional(),
  isFree: z.boolean().optional(),
});

export type UpdateLessonBodyType = z.TypeOf<typeof UpdateLessonBody>;

// ============================================
// ASSET SCHEMAS
// ============================================

export const AssetType = z.enum(["VIDEO", "DOCUMENT", "LINK", "IMAGE", "CODE"]);

// Asset Item
export const AssetItem = z.object({
  id: z.string(),
  lessonId: z.string(),
  type: AssetType,
  title: z.string(),
  url: z.string(),
  order: z.number(),
  created: z.string(),
  updated: z.string(),
  active: z.boolean(),
});

export type AssetItemType = z.TypeOf<typeof AssetItem>;

// Create Asset Body
export const CreateAssetBody = z.object({
  type: AssetType,
  title: z.string().min(1, "Title is required").max(255),
  url: z.string().url("Invalid URL"),
  order: z.number().min(1, "Order must be at least 1"),
});

export type CreateAssetBodyType = z.TypeOf<typeof CreateAssetBody>;

// Update Asset Body
export const UpdateAssetBody = z.object({
  type: AssetType.optional(),
  title: z.string().min(1).max(255).optional(),
  url: z.string().url().optional(),
  order: z.number().min(1).optional(),
});

export type UpdateAssetBodyType = z.TypeOf<typeof UpdateAssetBody>;

// ============================================
// PROGRESS SCHEMAS
// ============================================

// Progress Item
export const ProgressItem = z.object({
  lessonId: z.string(),
  watchedDuration: z.number(),
  lastPosition: z.number(),
  completed: z.boolean(),
  completedAt: z.string().nullable(),
});

export type ProgressItemType = z.TypeOf<typeof ProgressItem>;

// Course Progress Response
export const CourseProgressRes = z.object({
  courseId: z.string(),
  overallProgress: z.number(),
  completedLessons: z.number(),
  totalLessons: z.number(),
  lessons: z.array(ProgressItem),
});

export type CourseProgressResType = z.TypeOf<typeof CourseProgressRes>;

// Update Progress Body
export const UpdateProgressBody = z.object({
  watchedDuration: z.number().min(0),
  lastPosition: z.number().min(0),
});

export type UpdateProgressBodyType = z.TypeOf<typeof UpdateProgressBody>;
