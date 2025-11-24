import z from "zod";

// ============================================
// ENUMS
// ============================================

export const DifficultyLevel = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
export const ExerciseFormat = z.enum(["MCQ", "ESSAY", "CODING"]);
export const ChatMode = z.enum(["GENERAL", "ADVISOR"]);
export const RecommendationMode = z.enum(["REALTIME", "SCHEDULED"]);
export const AiTaskStatus = z.enum([
  "DRAFT",
  "APPROVED",
  "REJECTED",
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
]);
export const AiTaskType = z.enum([
  "EXERCISE_GENERATION",
  "LEARNING_PATH",
  "LEARNING_PATH_GENERATION",
  "RECOMMENDATION_REALTIME",
  "RECOMMENDATION_SCHEDULED",
  "CHAT_GENERAL",
  "CHAT_ADVISOR",
]);

// ============================================
// AI EXERCISE SCHEMAS
// ============================================

// AI Exercise Generate Request
export const AiExerciseGenerateRequest = z.object({
  courseId: z.string().uuid("Invalid course ID"),
  lessonId: z.string().uuid("Invalid lesson ID"),
  language: z.string().default("vi"),
  difficulties: z.array(DifficultyLevel).min(1, "Select at least one difficulty level"),
  formats: z.array(ExerciseFormat).min(1, "Select at least one format"),
  variants: z.number().min(1, "Variants must be at least 1").default(1),
  includeExplanations: z.boolean().default(true),
  includeTestCases: z.boolean().default(true),
  customInstruction: z.string().optional(),
  count: z.number().min(1).default(5),
  type: z.string().default("MCQ"),
  difficulty: z.string().default("BEGINNER"),
});

export type AiExerciseGenerateRequestType = z.TypeOf<typeof AiExerciseGenerateRequest>;

// MCQ Option
export const McqOption = z.object({
  text: z.string(),
  correct: z.boolean(),
});

// MCQ Exercise
export const McqExercise = z.object({
  question: z.string(),
  options: z.array(McqOption),
  explanation: z.string().optional(),
  difficulty: DifficultyLevel,
});

// Essay Exercise
export const EssayExercise = z.object({
  prompt: z.string(),
  guidelines: z.array(z.string()).optional(),
  suggestedLength: z.string().optional(),
  difficulty: DifficultyLevel,
});

// Test Case
export const TestCase = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  explanation: z.string().optional(),
});

// Coding Exercise
export const CodingExercise = z.object({
  title: z.string(),
  description: z.string(),
  starterCode: z.string().optional(),
  testCases: z.array(TestCase).optional(),
  hints: z.array(z.string()).optional(),
  difficulty: DifficultyLevel,
});

// AI Exercise Generation Response
export const AiExerciseGenerationResponse = z.object({
  taskId: z.string(),
  status: AiTaskStatus,
  exercises: z.object({
    mcq: z.array(McqExercise).optional(),
    essay: z.array(EssayExercise).optional(),
    coding: z.array(CodingExercise).optional(),
  }).optional(),
  metadata: z.object({
    courseId: z.string(),
    lessonId: z.string(),
    generatedAt: z.string(),
    totalCount: z.number(),
  }).optional(),
});

export type AiExerciseGenerationResponseType = z.TypeOf<typeof AiExerciseGenerationResponse>;

// ============================================
// LEARNING PATH AI SCHEMAS
// ============================================

// Learning Path Generate Request
export const LearningPathGenerateRequest = z.object({
  goal: z.string().min(5, "Goal must be at least 5 characters"),
  timeframe: z.string().min(1, "Timeframe is required"),
  language: z.string().default("vi"),
  currentLevel: z.string().min(1, "Current level is required"),
  targetLevel: z.string().min(1, "Target level is required"),
  userId: z.string().uuid("Invalid user ID"),
  preferredCourseIds: z.array(z.string().uuid()).optional(),
  includePositions: z.boolean().default(true),
  includeProjects: z.boolean().default(true),
  duration: z.string().default("1 month"),
  level: z.string().default("BEGINNER"),
});

export type LearningPathGenerateRequestType = z.TypeOf<typeof LearningPathGenerateRequest>;

// Node Position for React Flow
export const NodePosition = z.object({
  x: z.number(),
  y: z.number(),
});

// Learning Path Node
export const LearningPathNode = z.object({
  id: z.string(),
  type: z.string().default("course"),
  data: z.object({
    courseId: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    estimatedWeeks: z.number().optional(),
  }),
  position: NodePosition,
});

// Learning Path Edge
export const LearningPathEdge = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
});

// Learning Path Generation Response
export const LearningPathGenerationResponse = z.object({
  taskId: z.string(),
  status: AiTaskStatus,
  path: z.object({
    title: z.string(),
    description: z.string(),
    estimatedDuration: z.string().optional(),
    nodes: z.array(LearningPathNode),
    edges: z.array(LearningPathEdge),
    metadata: z.object({
      totalCourses: z.number(),
      estimatedWeeks: z.number().optional(),
    }).optional(),
  }).optional(),
});

export type LearningPathGenerationResponseType = z.TypeOf<typeof LearningPathGenerationResponse>;

// ============================================
// RECOMMENDATION SCHEMAS
// ============================================

// Recommendation Request
export const RecommendationRequest = z.object({
  userId: z.string().uuid("Invalid user ID"),
  mode: RecommendationMode.default("REALTIME"),
  language: z.string().default("vi"),
  excludeCourseIds: z.array(z.string().uuid()).optional(),
  preferredLanguages: z.array(z.string()).optional(),
});

export type RecommendationRequestType = z.TypeOf<typeof RecommendationRequest>;

// Recommendation Item
export const RecommendationItem = z.object({
  courseId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  score: z.number().min(0).max(1),
  reason: z.string(),
  tags: z.array(z.string()).optional(),
  estimatedDuration: z.string().optional(),
});

// Recommendation Response
export const RecommendationResponse = z.object({
  taskId: z.string().optional(),
  recommendations: z.array(RecommendationItem),
  metadata: z.object({
    userId: z.string(),
    generatedAt: z.string(),
    totalRecommendations: z.number(),
  }).optional(),
});

export type RecommendationResponseType = z.TypeOf<typeof RecommendationResponse>;

// ============================================
// CHAT SCHEMAS
// ============================================

// Chat Message Request
export const ChatMessageRequest = z.object({
  sessionId: z.string().uuid().optional(),
  userId: z.string().uuid("Invalid user ID"),
  mode: ChatMode.default("GENERAL"),
  message: z.string().min(1, "Message cannot be empty"),
  context: z.any().optional(),
});

export type ChatMessageRequestType = z.TypeOf<typeof ChatMessageRequest>;

// Chat Message Response
export const ChatMessageResponse = z.object({
  sessionId: z.string(),
  messageId: z.string().optional(),
  timestamp: z.string().optional(),
  mode: ChatMode.optional(),
  message: z.string().optional(), // Unified response field
  answer: z.string().optional(),  // Backward compatibility
  context: z.any().optional(),
  metadata: z
    .object({
      tokensUsed: z.number().optional(),
      model: z.string().optional(),
    })
    .optional(),
});

export type ChatMessageResponseType = z.TypeOf<typeof ChatMessageResponse>;

// Chat Session
export const ChatSession = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  startedAt: z.string(),
  endedAt: z.string().optional().nullable(),
  context: z.any().optional().nullable(),
});

export type ChatSessionType = z.TypeOf<typeof ChatSession>;

// Chat Message
export const ChatMessage = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  sender: z.enum(["USER", "BOT"]),
  content: z.string(),
  timestamp: z.string(),
});

export type ChatMessageType = z.TypeOf<typeof ChatMessage>;

// ============================================
// ADMIN SCHEMAS
// ============================================

// Reindex Response
export const ReindexResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  stats: z.object({
    indexed: z.number(),
    failed: z.number(),
    duration: z.string().optional(),
  }).optional(),
});

export type ReindexResponseType = z.TypeOf<typeof ReindexResponse>;

// Qdrant Stats Response
export const QdrantStatsResponse = z.object({
  collections: z.record(z.object({
    vectorCount: z.number(),
    pointsCount: z.number(),
    status: z.string(),
  })),
  healthy: z.boolean(),
  version: z.string().optional(),
});

export type QdrantStatsResponseType = z.TypeOf<typeof QdrantStatsResponse>;

// ============================================
// DRAFT SCHEMAS (for future use when BE exposes endpoints)
// ============================================

export const DraftItem = z.object({
  taskId: z.string(),
  taskType: AiTaskType,
  status: AiTaskStatus,
  targetReference: z.string().optional(),
  resultPayload: z.any().optional(),
  requestPayload: z.any().optional(),
  prompt: z.string().optional(),
  createdAt: z.string(),
});

export type DraftItemType = z.TypeOf<typeof DraftItem>;

// API Response Wrapper
export const AiApiResponse = z.object({
  success: z.boolean(),
  status: z.string(),
  code: z.number(),
  message: z.string(),
  data: z.any(),
  timestamp: z.string(),
  path: z.string(),
});

export type AiApiResponseType = z.TypeOf<typeof AiApiResponse>;

