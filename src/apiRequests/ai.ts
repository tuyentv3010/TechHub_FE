import http from "@/lib/http";
import envConfig from "@/config";
import { EventSourceParserStream } from "eventsource-parser/stream";
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
  AiProviderConfigResponseType,
  UpdateAiProviderRequestType,
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [FE Streaming] HTTP error:", response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      if (!response.body) {
        throw new Error("No readable stream available");
      }

      // Use EventSourceParserStream for proper SSE parsing
      const eventStream = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new EventSourceParserStream());
      
      const reader = eventStream.getReader();
      console.log("✅ [FE Streaming] Using EventSourceParserStream");

      while (true) {
        const { done, value: event } = await reader.read();
        if (done) {
          console.log("✅ [FE Streaming] Stream done");
          break;
        }

        console.log("📨 [FE Streaming] Event:", event);

        const data = event.data;
        const eventType = event.event;
        
        if (data === "[DONE]" || eventType === "done") {
          console.log("🏁 [FE Streaming] Received [DONE] signal");
          onComplete?.();
          return;
        }

        if (data) {
          try {
            // Parse JSON data: {"content":"..."}
            // This preserves leading/trailing spaces that SSE might strip
            const parsed = JSON.parse(data);
            const content = parsed.content;
            if (content !== undefined && content !== null) {
              console.log("✍️ [FE Streaming] Sending chunk:", JSON.stringify(content));
              onChunk(content);
            }
          } catch {
            // If not JSON, use data as-is (fallback for plain text)
            console.log("✍️ [FE Streaming] Sending raw chunk:", JSON.stringify(data));
            onChunk(data);
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

  getProviderConfig: () =>
    http.get<{ payload: { data: AiProviderConfigResponseType } }>(
      "/app/api/proxy/ai/admin/provider-config"
    ),

  updateProviderConfig: (body: UpdateAiProviderRequestType) =>
    http.post<{ payload: { data: AiProviderConfigResponseType } }>(
      "/app/api/proxy/ai/admin/provider-config",
      body
    ),

  // ============================================
  // DRAFT MANAGEMENT
  // ============================================

  // Get exercise drafts for a single lesson
  getExerciseDrafts: (lessonId: string) =>
    http.get<{ payload: { data: DraftItemType[] } }>(
      `/app/api/proxy/ai/drafts/exercises?lessonId=${lessonId}`
    ),

  // Get exercise drafts for multiple lessons (batch request)
  getExerciseDraftsBatch: (lessonIds: string[]) =>
    http.post<{ payload: { data: DraftItemType[] } }>(
      `/app/api/proxy/ai/drafts/exercises/batch`,
      { lessonIds }
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

