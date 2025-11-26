import z from "zod";

export const CourseStatus = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const CourseLevel = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"]);
export const Language = z.enum(["VI", "EN", "JA"]);

// Skill Schema
export const SkillItem = z.object({
  id: z.string(),
  name: z.string(),
  thumbnail: z.string().nullable(),
  category: z.string().nullable(),
});

export type SkillItemType = z.TypeOf<typeof SkillItem>;

// Tag Schema
export const TagItem = z.object({
  id: z.string(),
  name: z.string(),
});

export type TagItemType = z.TypeOf<typeof TagItem>;

// Skills List Response
export const SkillsListRes = z.object({
  success: z.boolean(),
  status: z.string(),
  code: z.number(),
  message: z.string(),
  data: z.array(SkillItem),
  timestamp: z.string(),
  path: z.string(),
});

export type SkillsListResType = z.TypeOf<typeof SkillsListRes>;

// Tags List Response
export const TagsListRes = z.object({
  success: z.boolean(),
  status: z.string(),
  code: z.number(),
  message: z.string(),
  data: z.array(TagItem),
  timestamp: z.string(),
  path: z.string(),
});

export type TagsListResType = z.TypeOf<typeof TagsListRes>;

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
  categories: z.array(z.string()).nullable(),
  // Updated: skills is now array of objects with id, name, thumbnail, category
  skills: z.array(SkillItem),
  // Updated: tags is now array of objects with id, name
  tags: z.array(TagItem),
  objectives: z.array(z.string()),
  requirements: z.array(z.string()),
  instructorId: z.string(),
  thumbnail: z.object({
    fileId: z.string().nullable(),
    name: z.string().nullable(),
    originalName: z.string().nullable(),
    url: z.string(),
    secureUrl: z.string().nullable(),
    mimeType: z.string().nullable(),
    fileSize: z.number().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    duration: z.number().nullable(),
  }).nullable(),
  introVideo: z.object({
    fileId: z.string().nullable(),
    name: z.string().nullable(),
    originalName: z.string().nullable(),
    url: z.string(),
    secureUrl: z.string().nullable(),
    mimeType: z.string().nullable(),
    fileSize: z.number().nullable(),
    width: z.number().nullable(),
    height: z.number().nullable(),
    duration: z.number().nullable(),
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
  // Frontend should send skills (preferred) — kept optional for compatibility
  skills: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  thumbnail: z.string().max(500).optional(), // URL string
  introVideo: z.string().max(500).optional(), // URL string
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
  skills: z.array(z.string()).optional(), // Add skills field for backend
  tags: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  thumbnail: z.string().max(500).optional(), // URL string
  introVideo: z.string().max(500).optional(), // URL string
}).refine((data) => {
  // If both price and discountPrice are provided, discountPrice must be <= price
  if (data.price !== undefined && data.discountPrice !== undefined && data.discountPrice > 0) {
    return data.discountPrice <= data.price;
  }
  return true;
}, {
  message: "Discount price must be less than or equal to the original price",
  path: ["discountPrice"],
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
  order: z.number().min(1, "Order must be at least 1").optional(),
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

// Lesson Item - Response from backend
export const LessonItem = z.object({
  id: z.string(),
  chapterId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  contentType: ContentType,
  content: z.string().nullable(), // TEXT content for TEXT type lessons
  estimatedDuration: z.number().nullable(), // Backend uses estimatedDuration
  orderIndex: z.number(), // Backend uses orderIndex
  isFree: z.boolean(),
  videoUrl: z.string().nullable().optional(), // For VIDEO type
  created: z.string(),
  updated: z.string(),
  active: z.boolean(),
  assets: z.array(z.any()).optional(),
});

export type LessonItemType = z.TypeOf<typeof LessonItem>;

// Create Lesson Body - For creating new lesson
export const CreateLessonBody = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  contentType: ContentType,
  content: z.string().optional(), // TEXT content for lesson
  duration: z.number().min(0).optional(), // Frontend uses 'duration', will map to estimatedDuration
  orderIndex: z.number().min(0).optional(), // Backend expects orderIndex
  isFree: z.boolean().default(false),
  videoUrl: z.string().optional(), // For VIDEO type lessons
});

export type CreateLessonBodyType = z.TypeOf<typeof CreateLessonBody>;

// Update Lesson Body - For updating existing lesson
export const UpdateLessonBody = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(), // Lesson description/summary
  contentType: ContentType.optional(),
  content: z.string().optional(), // Full TEXT content
  duration: z.number().min(0).optional(), // Frontend field (maps to estimatedDuration)
  estimatedDuration: z.number().min(0).optional(), // Backend field
  videoUrl: z.string().optional(), // Video URL for VIDEO type
  orderIndex: z.number().min(0).optional(), // Backend expects orderIndex
  isFree: z.boolean().optional(), // Free preview lesson flag
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
  assetType: AssetType,
  title: z.string().min(1, "Title is required").max(255),
  externalUrl: z.string().url("Invalid URL"),
  orderIndex: z.number().min(1, "Order must be at least 1").optional(),
});

export type CreateAssetBodyType = z.TypeOf<typeof CreateAssetBody>;

// Update Asset Body
export const UpdateAssetBody = z.object({
  assetType: AssetType.optional(),
  title: z.string().min(1).max(255).optional(),
  externalUrl: z.string().url().optional(),
  orderIndex: z.number().min(1).optional(),
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
