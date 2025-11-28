import http from "@/lib/http";
import envConfig from "@/config";
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
  type ChatSessionType,
  type ChatMessageType,
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

  // Send chat message (blocking - original)
  sendChatMessage: (body: ChatMessageRequestType) =>
    http.post<{ payload: { data: ChatMessageResponseType } }>(
      "/app/api/proxy/ai/chat/messages",
      body
    ),

  // Send streaming chat message (SSE)
  sendStreamingChatMessage: async (
    body: ChatMessageRequestType,
    onChunk: (chunk: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> => {
    const baseUrl = envConfig.NEXT_PUBLIC_API_ENDPOINT;
    const url = `${baseUrl}/app/api/proxy/ai/chat/stream`;
    
    console.log("🚀 [FE Streaming] Starting streaming request");
    console.log("🚀 [FE Streaming] URL:", url);
    console.log("🚀 [FE Streaming] Body:", JSON.stringify(body, null, 2));

    try {
      // Via proxy-client for streaming (with proper CORS and auth handling)
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(body),
        credentials: "include",
      });

      console.log("📡 [FE Streaming] Response status:", response.status);
      console.log("📡 [FE Streaming] Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [FE Streaming] HTTP error:", response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        console.error("❌ [FE Streaming] No readable stream available");
        throw new Error("No readable stream available");
      }

      console.log("✅ [FE Streaming] Got reader, starting to read chunks...");
      const decoder = new TextDecoder();
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("✅ [FE Streaming] Stream done, total chunks:", chunkCount);
          break;
        }

        const text = decoder.decode(value, { stream: true });
        console.log(`📦 [FE Streaming] Raw chunk ${++chunkCount}:`, JSON.stringify(text));
        
        const lines = text.split("\n");
        console.log(`📦 [FE Streaming] Lines in chunk:`, lines);

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const data = line.slice(5).trim();
            console.log("📨 [FE Streaming] Data extracted:", data);
            if (data === "[DONE]") {
              console.log("🏁 [FE Streaming] Received [DONE] signal");
              onComplete?.();
              return;
            }
            if (data) {
              console.log("✍️ [FE Streaming] Calling onChunk with:", data);
              onChunk(data);
            }
          } else if (line.startsWith("event:")) {
            console.log("🎫 [FE Streaming] Event line:", line);
          } else if (line.trim()) {
            console.log("❓ [FE Streaming] Unknown line:", line);
          }
        }
      }

      console.log("🏁 [FE Streaming] Stream completed normally");
      onComplete?.();
    } catch (error) {
      console.error("❌ [FE Streaming] Error:", error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  },

  // Simple streaming chat (GET request for quick queries)
  streamSimpleChat: (
    message: string,
    userId: string,
    onChunk: (chunk: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): EventSource => {
    const baseUrl = envConfig.NEXT_PUBLIC_API_ENDPOINT;
    // Via proxy-client for streaming
    const url = `${baseUrl}/app/api/proxy/ai/chat/stream/simple?message=${encodeURIComponent(message)}&userId=${userId}`;

    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener("message", (event) => {
      if (event.data && event.data !== "[DONE]") {
        onChunk(event.data);
      }
    });

    eventSource.addEventListener("done", () => {
      eventSource.close();
      onComplete?.();
    });

    eventSource.onerror = (error) => {
      eventSource.close();
      onError?.(new Error("EventSource connection failed"));
    };

    return eventSource;
  },

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
    http.post<{ payload: { data: DraftItemType } }>(
      `/app/api/proxy/ai/drafts/${taskId}/approve-exercise`,
      {}
    ),

  // Approve learning path draft
  approveLearningPathDraft: (taskId: string) =>
    http.post<{ payload: { data: DraftItemType } }>(
      `/app/api/proxy/ai/drafts/${taskId}/approve-learning-path`,
      {}
    ),

  // Reject draft
  rejectDraft: (taskId: string, reason?: string) =>
    http.post<{ payload: { data: DraftItemType } }>(
      `/app/api/proxy/ai/drafts/${taskId}/reject${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`,
      {}
    ),

  // ============================================
  // CHAT SESSION HISTORY
  // ============================================

  // Create new empty session
  createSession: (userId: string, mode?: "GENERAL" | "ADVISOR") =>
    http.post<{ payload: { data: ChatSessionType } }>(
      `/app/api/proxy/ai/chat/sessions?userId=${userId}${mode ? `&mode=${mode}` : ""}`,
      {}
    ),

  // Get user's chat sessions
  getUserSessions: (userId: string) =>
    http.get<{ payload: { data: ChatSessionType[] } }>(
      `/app/api/proxy/ai/chat/sessions?userId=${userId}`
    ),

  // Get session messages
  getSessionMessages: (sessionId: string) =>
    http.get<{ payload: { data: ChatMessageType[] } }>(
      `/app/api/proxy/ai/chat/sessions/${sessionId}/messages`
    ),

  // Delete session
  deleteSession: (sessionId: string, userId: string) =>
    http.delete<{ payload: { data: null } }>(
      `/app/api/proxy/ai/chat/sessions/${sessionId}?userId=${userId}`
    ),
};

export default aiApiRequest;

