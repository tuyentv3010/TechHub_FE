import z from "zod";

// Course in Path
export const CourseInPath = z.object({
  courseId: z.string(),
  courseTitle: z.string().optional(),
  order: z.number(),
  isOptional: z.string(), // "Y" or "N"
  title: z.string().optional(), // Additional field for UI
  description: z.string().optional(), // Additional field for UI
  isCompleted: z.boolean().optional(), // Additional field for UI
  positionX: z.number().optional(), // X coordinate for visual designer
  positionY: z.number().optional(), // Y coordinate for visual designer
  duration: z.number().optional(), // Course duration in minutes for calculating total
});

export type CourseInPathType = z.TypeOf<typeof CourseInPath>;

// Learning Path Item Response
export const LearningPathItem = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  skills: z.array(z.string()), // JSON array
  creatorId: z.string(),
  creatorName: z.string().optional(),
  isActive: z.string(), // "Y" or "N"
  created: z.string(),
  updated: z.string(),
  createdAt: z.string().optional(), // Alias for created
  courses: z.array(CourseInPath).optional(),
  totalCourses: z.number().optional(),
  layoutEdges: z.array(z.object({
    source: z.string(),
    target: z.string(),
  })).optional(), // Visual designer edges (stored as JSON in backend)
});

export type LearningPathItemType = z.TypeOf<typeof LearningPathItem>;

// Learning Path List Response
export const LearningPathListRes = z.object({
  success: z.boolean(),
  status: z.string(),
  code: z.number(),
  message: z.string(),
  data: z.array(LearningPathItem),
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

export type LearningPathListResponseType = z.TypeOf<typeof LearningPathListRes>;

// Learning Path Detail Response
export const LearningPathDetailRes = z.object({
  success: z.boolean(),
  status: z.string(),
  code: z.number(),
  message: z.string(),
  data: LearningPathItem,
  timestamp: z.string(),
  path: z.string(),
});

export type LearningPathDetailResponseType = z.TypeOf<typeof LearningPathDetailRes>;

// Create Learning Path Body
export const CreateLearningPathBody = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  layoutEdges: z.array(z.object({
    source: z.string(),
    target: z.string(),
  })).optional(),
  isActive: z.string().default("Y"), // "Y" or "N"
});

export type CreateLearningPathBodyType = z.TypeOf<typeof CreateLearningPathBody>;

// Update Learning Path Body
export const UpdateLearningPathBody = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  skills: z.array(z.string()).optional(),
  layoutEdges: z.array(z.object({
    source: z.string(),
    target: z.string(),
  })).optional(),
  isActive: z.string().optional(), // "Y" or "N"
});

export type UpdateLearningPathBodyType = z.TypeOf<typeof UpdateLearningPathBody>;

// Add Courses to Path
export const AddCoursesToPathBody = z.object({
  courses: z.array(
    z.object({
      courseId: z.string(),
      order: z.number().min(1),
      isOptional: z.string().default("N"), // "Y" or "N"
    })
  ).min(1, "At least one course is required"),
});

export type AddCoursesToPathBodyType = z.TypeOf<typeof AddCoursesToPathBody>;

// Reorder Course
export const ReorderCourseBody = z.array(
  z.object({
    courseId: z.string(),
    order: z.number().min(1),
    positionX: z.number().optional(),
    positionY: z.number().optional(),
    isOptional: z.string().optional(), // "Y" or "N"
  })
);

export type ReorderCourseBodyType = z.TypeOf<typeof ReorderCourseBody>;

// Path Progress
export const PathProgress = z.object({
  id: z.string(),
  userId: z.string(),
  pathId: z.string(),
  pathTitle: z.string().optional(),
  completionPercentage: z.number(),
  milestones: z.record(z.any()), // JSON object
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  lastAccessedAt: z.string(),
});

export type PathProgressType = z.TypeOf<typeof PathProgress>;

// Progress Response
export const PathProgressRes = z.object({
  success: z.boolean(),
  status: z.string(),
  code: z.number(),
  message: z.string(),
  data: PathProgress,
  timestamp: z.string(),
  path: z.string(),
});

export type PathProgressResponseType = z.TypeOf<typeof PathProgressRes>;

// Progress List Response
export const PathProgressListRes = z.object({
  success: z.boolean(),
  status: z.string(),
  code: z.number(),
  message: z.string(),
  data: z.array(PathProgress),
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

export type PathProgressListResponseType = z.TypeOf<typeof PathProgressListRes>;

// Update Progress Body
export const UpdateProgressBody = z.object({
  pathId: z.string(),
  completionPercentage: z.number().min(0).max(100),
  milestones: z.record(z.any()).optional(), // JSON object
});

export type UpdateProgressBodyType = z.TypeOf<typeof UpdateProgressBody>;

// Path Statistics
export const PathStatistics = z.object({
  success: z.boolean(),
  status: z.string(),
  code: z.number(),
  message: z.string(),
  data: z.object({
    pathId: z.string(),
    totalEnrolled: z.number(),
    averageCompletion: z.number(),
    completedUsers: z.number(),
  }),
  timestamp: z.string(),
  path: z.string(),
});

export type PathStatisticsType = z.TypeOf<typeof PathStatistics>;

// Delete Response
export const DeleteLearningPathRes = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type DeleteLearningPathResType = z.TypeOf<typeof DeleteLearningPathRes>;
