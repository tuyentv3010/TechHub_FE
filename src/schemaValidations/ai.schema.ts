import z from "zod";

// ============================================
// ENUMS
// ============================================

export const DifficultyLevel = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
export const ExerciseFormat = z.enum(["MCQ", "ESSAY", "CODING"]);
export const ChatMode = z.enum(["AUTO", "GENERAL", "ADVISOR"]);
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
  "CHAT_AUTO",
  "CHAT_GENERAL",
  "CHAT_ADVISOR",
  "CHAT_RESPONSE_REVIEW",
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

export const RecommendationHistoryItem = z.object({
  taskId: z.string(),
  mode: RecommendationMode,
  status: z.string(),
  createdAt: z.string(),
  recommendations: z.array(RecommendationItem),
  metadata: z.record(z.any()).optional(),
});

export type RecommendationHistoryItemType = z.TypeOf<typeof RecommendationHistoryItem>;

// ============================================
// ANALYTICS CONTRACT
// ============================================
// Mirrors app/schemas/analytics_contract.py on the BE. Kept loose with
// passthrough() so future server additions don't break FE parsing.

export const ColumnKind = z.enum([
  "category",
  "numeric",
  "percentage",
  "currency",
  "duration_seconds",
  "datetime",
  "identifier",
  "text",
  "boolean",
]);

export const ColumnMeta = z
  .object({
    name: z.string(),
    kind: ColumnKind.or(z.string()).default("text"),
    unit: z.string().nullable().optional(),
    format: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  })
  .passthrough();

export type ColumnMetaType = z.TypeOf<typeof ColumnMeta>;

export const ChartOptions = z
  .object({
    availableChartTypes: z.array(z.string()).default([]),
    colorPalette: z.array(z.string()).default([]),
    emptyState: z
      .enum(["ok", "empty", "all_zero", "single_category"])
      .default("ok"),
    valueAxisLabel: z.string().nullable().optional(),
    categoryAxisLabel: z.string().nullable().optional(),
    stacked: z.boolean().default(false),
    legend: z.boolean().default(true),
  })
  .passthrough();

export type ChartOptionsType = z.TypeOf<typeof ChartOptions>;

export const SuggestedActionKind = z.enum([
  "prompt",
  "change_chart_type",
  "export_csv",
  "copy_sql",
  "refine_filter",
]);

export const SuggestedAction = z
  .object({
    id: z.string(),
    label: z.string(),
    description: z.string().nullable().optional(),
    kind: SuggestedActionKind.or(z.string()),
    prompt: z.string().nullable().optional(),
    payload: z.record(z.any()).nullable().optional(),
    icon: z.string().nullable().optional(),
    tone: z.enum(["primary", "secondary"]).default("secondary"),
  })
  .passthrough();

export type SuggestedActionType = z.TypeOf<typeof SuggestedAction>;

export const ChartDataset = z
  .object({
    label: z.string().nullable().optional(),
    values: z.array(z.number()).default([]),
  })
  .passthrough();

export const ChartData = z
  .object({
    labels: z.array(z.string()).default([]),
    datasets: z.array(ChartDataset).default([]),
  })
  .passthrough();

export const ChartSpec = z
  .object({
    type: z.string().default("bar"),
    title: z.string().default("TechHub analytics"),
    subtitle: z.string().nullable().optional(),
    scope: z.string().nullable().optional(),
    scopeLabel: z.string().nullable().optional(),
    data: ChartData.default({ labels: [], datasets: [] }),
    options: ChartOptions.optional(),
    note: z.string().nullable().optional(),
  })
  .passthrough();

export type ChartSpecType = z.TypeOf<typeof ChartSpec>;

export const RuntimePolicySnapshot = z
  .object({
    userRole: z.string().nullable().optional(),
    sqlMaxRows: z.number().nullable().optional(),
    piiAccess: z.boolean().nullable().optional(),
  })
  .passthrough();

export const LogicSummary = z
  .object({
    metric: z.string(),
    title: z.string(),
    chartType: z.string(),
    timeRange: z.string(),
    scope: z.string(),
    scopeLabel: z.string(),
    executionMode: z.string(),
    rowCount: z.number(),
  })
  .passthrough();

export const QueryResult = z
  .object({
    metric: z.string().default("analytics"),
    timeRange: z.string().default("all_time"),
    title: z.string().default("TechHub analytics"),
    summary: z.string().default(""),
    rows: z.array(z.record(z.any())).default([]),
    rowCount: z.number().default(0),
    columns: z.array(z.string()).default([]),
    columnMeta: z.array(ColumnMeta).optional(),
    tables: z.array(z.string()).default([]),
    sql: z.string().default(""),
    chartType: z.string().default("bar"),
    executionMode: z.string().default("llm_planner"),
    explanation: z.string().default(""),
    logicSummary: LogicSummary.nullable().optional(),
    scope: z.string().default("platform"),
    scopeLabel: z.string().default(""),
    policy: RuntimePolicySnapshot.optional(),
    suggestedActions: z.array(SuggestedAction).default([]),
    chartOptions: ChartOptions.optional(),
  })
  .passthrough();

export type QueryResultType = z.TypeOf<typeof QueryResult>;

// ============================================
// CHAT SCHEMAS
// ============================================

// Chat Message Request
export const ChatMessageRequest = z.object({
  sessionId: z.string().uuid().optional(),
  userId: z.string().uuid("Invalid user ID"),
  mode: ChatMode.default("AUTO"),
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
      requestId: z.string().optional().nullable(),
      tokensUsed: z.number().optional(),
      tokenUsage: z.record(z.any()).optional(),
      model: z.string().optional(),
      requestedMode: ChatMode.optional(),
      resolvedMode: ChatMode.optional(),
      intent: z.string().optional(),
      confidence: z.number().optional(),
      thinkingText: z.string().optional(),
      citations: z.array(z.record(z.any())).optional(),
      queryResult: z.record(z.any()).nullable().optional(),
      chartSpec: z.record(z.any()).nullable().optional(),
      suggestedActions: z.array(z.record(z.any())).optional(),
      artifact: z.record(z.any()).nullable().optional(),
      trace: z.array(z.record(z.any())).optional(),
      pipeline: z.string().optional(),
      nodeTimings: z.record(z.number()).optional(),
      hitlClarifyActive: z.boolean().optional(),
      hitlQuestion: z.string().optional().nullable(),
      hitlOptions: z.array(z.string()).optional(),
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
  title: z.string().optional().nullable(),
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
  metadata: z.record(z.any()).optional().nullable(),
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

export const AiProviderConfigResponse = z.object({
  provider: z.enum(["openai", "gemini"]),
  activeChatModel: z.string().optional(),
  activeEmbeddingModel: z.string().optional(),
  models: z.object({
    openai: z.string(),
    gemini: z.string(),
  }).optional(),
  supportedProviders: z.array(z.enum(["openai", "gemini"])).optional(),
  supportedChatModels: z.object({
    openai: z.array(z.string()),
    gemini: z.array(z.string()),
  }).optional(),
  metadata: z.object({
    requestedProvider: z.enum(["openai", "gemini"]).optional(),
    effectiveProvider: z.enum(["openai", "gemini"]).optional(),
    effectiveEmbeddingProvider: z.enum(["openai", "gemini"]).optional(),
    activeEmbeddingModel: z.string().optional(),
    availableProviders: z.array(z.enum(["openai", "gemini"])).optional(),
    providerAvailability: z.record(z.object({
      available: z.boolean(),
      configuredModel: z.string().optional().nullable(),
      reason: z.string().nullable().optional(),
    })).optional(),
    usingMockFallback: z.boolean().optional(),
    embeddingUsingMockFallback: z.boolean().optional(),
    statusMessage: z.string().optional(),
  }).optional(),
});

export type AiProviderConfigResponseType = z.TypeOf<typeof AiProviderConfigResponse>;

export const UpdateAiProviderRequest = z.object({
  provider: z.enum(["openai", "gemini"]),
  chatModel: z.string().optional(),
});

export type UpdateAiProviderRequestType = z.TypeOf<typeof UpdateAiProviderRequest>;

export const AiRuntimeStatsResponse = z.object({
  overview: z.object({
    chatTotal: z.number(),
    chatSuccess: z.number(),
    chatFailed: z.number(),
    chatLegacyTotal: z.number(),
    chatHitlTotal: z.number(),
    mockChatResponses: z.number(),
    mockEmbeddingCalls: z.number(),
    totalTokens: z.number().optional(),
  }),
  latency: z.object({
    chatAverageMs: z.number(),
    chatP95Ms: z.number(),
    vectorAverageMs: z.number(),
  }),
  tokens: z.object({
    promptTotal: z.number(),
    completionTotal: z.number(),
    embeddingTotal: z.number(),
    averagePerChat: z.number(),
  }).optional(),
  providers: z.object({
    chatFallbacks: z.number(),
    embeddingFallbacks: z.number(),
    recent: z.array(z.record(z.any())).optional(),
  }),
  files: z.object({
    filesSeen: z.number(),
    filesHydrated: z.number(),
    chunksIndexed: z.number(),
    unsupportedFiles: z.number(),
  }),
  vectorOps: z.object({
    recent: z.array(z.record(z.any())).optional(),
  }).optional(),
  chatRuns: z.object({
    recent: z.array(z.record(z.any())).optional(),
  }).optional(),
  counters: z.record(z.number()).optional(),
});

export type AiRuntimeStatsResponseType = z.TypeOf<typeof AiRuntimeStatsResponse>;

// ============================================
// APPROVAL / HITL SCHEMAS
// ============================================

export const ApprovalActionRequest = z.object({
  reviewerId: z.string().uuid().optional(),
  note: z.string().optional(),
});

export type ApprovalActionRequestType = z.TypeOf<typeof ApprovalActionRequest>;

export const ApprovalListItem = z.object({
  approvalId: z.string(),
  taskType: z.string(),
  status: AiTaskStatus,
  sessionId: z.string().uuid().nullable().optional(),
  userId: z.string().uuid().nullable().optional(),
  approvalType: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  requestedMode: z.string().nullable().optional(),
  resolvedMode: z.string().nullable().optional(),
  prompt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ApprovalListItemType = z.TypeOf<typeof ApprovalListItem>;

export const ApprovalDetailResponse = ApprovalListItem.extend({
  requestPayload: z.any().optional(),
  resultPayload: z.any().optional(),
  reviewerNote: z.string().nullable().optional(),
});

export type ApprovalDetailResponseType = z.TypeOf<typeof ApprovalDetailResponse>;

export const ApprovalActionResponse = z.object({
  approvalId: z.string(),
  status: AiTaskStatus,
  sessionId: z.string().uuid().nullable().optional(),
  messageId: z.string().uuid().nullable().optional(),
  publishedMessage: z.string().nullable().optional(),
  reviewerNote: z.string().nullable().optional(),
});

export type ApprovalActionResponseType = z.TypeOf<typeof ApprovalActionResponse>;

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

