import http from "@/lib/http";
import {
  AiExerciseGenerateRequestType,
  AiExerciseGenerationResponseType,
  LearningPathGenerateRequestType,
  LearningPathGenerationResponseType,
  RecommendationRequestType,
  RecommendationResponseType,
  ChatMessageRequestType,
  ChatMessageResponseType,
  ReindexResponseType,
  QdrantStatsResponseType,
  DraftItemType,
} from "@/schemaValidations/ai.schema";

const aiApiRequest = {
  // ============================================
  // AI EXERCISE GENERATION
  // ============================================

  // Generate exercises for a lesson
  generateExercises: (body: AiExerciseGenerateRequestType) =>
    http.post<{ payload: { data: AiExerciseGenerationResponseType } }>(
      "/app/api/proxy/ai/exercises/generate",
      body
    ),

  // ============================================
  // LEARNING PATH GENERATION
  // ============================================

  // Generate learning path
  generateLearningPath: (body: LearningPathGenerateRequestType) =>
    http.post<{ payload: { data: LearningPathGenerationResponseType } }>(
      "/app/api/proxy/ai/learning-paths/generate",
      body
    ),

  // ============================================
  // RECOMMENDATIONS
  // ============================================

  // Get realtime recommendations
  recommendRealtime: (body: RecommendationRequestType) =>
    http.post<{ payload: { data: RecommendationResponseType } }>(
      "/app/api/proxy/ai/recommendations/realtime",
      body
    ),

  // Trigger scheduled recommendations
  recommendScheduled: (body: RecommendationRequestType) =>
    http.post<{ payload: { data: RecommendationResponseType } }>(
      "/app/api/proxy/ai/recommendations/scheduled",
      body
    ),

  // ============================================
  // CHAT
  // ============================================

  // Send chat message
  sendChatMessage: (body: ChatMessageRequestType) =>
    http.post<{ payload: { data: ChatMessageResponseType } }>(
      "/api/proxy/ai/chat/messages",
      body,
      {
        // Go through Next.js proxy to avoid CORS and ensure auth headers/cookies are forwarded
        baseUrl: "",
      }
    ),

  // ============================================
  // ADMIN OPERATIONS
  // ============================================

  // Reindex courses
  reindexCourses: () =>
    http.post<{ payload: { data: ReindexResponseType } }>(
      "/app/api/proxy/ai/admin/reindex-courses",
      {}
    ),

  // Reindex lessons
  reindexLessons: () =>
    http.post<{ payload: { data: ReindexResponseType } }>(
      "/app/api/proxy/ai/admin/reindex-lessons",
      {}
    ),

  // Reindex all
  reindexAll: () =>
    http.post<{ payload: { data: ReindexResponseType } }>(
      "/app/api/proxy/ai/admin/reindex-all",
      {}
    ),

  // Get Qdrant stats
  getQdrantStats: () =>
    http.get<{ payload: { data: QdrantStatsResponseType } }>(
      "/app/api/proxy/ai/admin/qdrant-stats"
    ),

  // ============================================
  // DRAFT MANAGEMENT
  // ============================================

  // Get exercise drafts
  getExerciseDrafts: (lessonId: string) =>
    http.get<{ payload: { data: DraftItemType[] } }>(
      `/app/api/proxy/ai/drafts/exercises?lessonId=${lessonId}`
    ),

  // Get latest exercise draft for a lesson
  getLatestExerciseDraft: (lessonId: string) =>
    http.get<{ payload: { data: DraftItemType } }>(
      `/app/api/proxy/ai/drafts/exercises/latest?lessonId=${lessonId}`
    ),

  // Get draft by task ID
  getDraftById: (taskId: string) =>
    http.get<{ payload: { data: DraftItemType } }>(
      `/app/api/proxy/ai/drafts/${taskId}`
    ),

  // Get learning path drafts
  getLearningPathDrafts: () =>
    http.get<{ payload: { data: DraftItemType[] } }>(
      "/app/api/proxy/ai/drafts/learning-paths"
    ),

  // Approve exercise draft
  approveExerciseDraft: (taskId: string) =>
    http.post<{ payload: { data: any } }>(
      `/app/api/proxy/ai/drafts/${taskId}/approve-exercise`,
      {}
    ),

  // Approve learning path draft
  approveLearningPathDraft: (taskId: string) =>
    http.post<{ payload: { data: any } }>(
      `/app/api/proxy/ai/drafts/${taskId}/approve-learning-path`,
      {}
    ),

  // Reject draft
  rejectDraft: (taskId: string, reason?: string) =>
    http.post<{ payload: { data: DraftItemType } }>(
      `/app/api/proxy/ai/drafts/${taskId}/reject${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`,
      {}
    ),
};

export default aiApiRequest;

