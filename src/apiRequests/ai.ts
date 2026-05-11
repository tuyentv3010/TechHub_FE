import http from "@/lib/http";
import envConfig from "@/config";
import { getAccessTokenFromLocalStorage } from "@/lib/utils";
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
  AiRuntimeStatsResponseType,
  DraftItemType,
  type ChatSessionType,
  type ChatMessageType,
  AiProviderConfigResponseType,
  UpdateAiProviderRequestType,
  RecommendationHistoryItemType,
} from "@/schemaValidations/ai.schema";

export type StreamingChatEvent = {
  event: string;
  data: any;
};

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

  getRecommendationHistory: (userId: string, mode?: "REALTIME" | "SCHEDULED", limit: number = 20) =>
    http.get<{ payload: { data: RecommendationHistoryItemType[] } }>(
      `/app/api/proxy/ai/recommendations/history?userId=${userId}${mode ? `&mode=${mode}` : ""}&limit=${limit}`
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
    handlers: {
      onChunk: (chunk: string) => void;
      onEvent?: (event: StreamingChatEvent) => void;
      onComplete?: (event?: StreamingChatEvent) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<void> => {
    const baseUrl = envConfig.NEXT_PUBLIC_API_ENDPOINT;
    const url = `${baseUrl}/app/api/proxy/ai/chat/stream`;
    
    console.log("🚀 [FE Streaming] Starting streaming request");
    console.log("🚀 [FE Streaming] URL:", url);
    console.log("🚀 [FE Streaming] Body:", JSON.stringify(body, null, 2));

    try {
      const accessToken =
        typeof window !== "undefined" ? getAccessTokenFromLocalStorage() : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
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
        let parsedData: any = data;
        if (typeof data === "string") {
          try {
            parsedData = JSON.parse(data);
          } catch {
            parsedData = data;
          }
        }

        if (eventType === "message") {
          const content =
            parsedData && typeof parsedData === "object" && "content" in parsedData
              ? parsedData.content
              : parsedData;
          if (content !== undefined && content !== null) {
            console.log("✍️ [FE Streaming] Sending chunk:", JSON.stringify(content));
            handlers.onChunk(String(content));
          }
          continue;
        }

        const structuredEvent = {
          event: eventType || "message",
          data: parsedData,
        };
        handlers.onEvent?.(structuredEvent);

        if (data === "[DONE]" || eventType === "done") {
          console.log("🏁 [FE Streaming] Received [DONE] signal");
          handlers.onComplete?.(structuredEvent);
          return;
        }
      }

      console.log("🏁 [FE Streaming] Stream completed normally");
      handlers.onComplete?.();
    } catch (error) {
      console.error("❌ [FE Streaming] Error:", error);
      handlers.onError?.(error instanceof Error ? error : new Error(String(error)));
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

  getRuntimeStats: () =>
    http.get<{ payload: { data: AiRuntimeStatsResponseType } }>(
      "/app/api/proxy/ai/admin/runtime-stats"
    ),

  getProviderConfig: () =>
    http.get<{ payload: { data: AiProviderConfigResponseType } }>(
      "/app/api/proxy/ai/admin/provider-config",
      {
        suppressErrorLog: true,
      }
    ),

  updateProviderConfig: (body: UpdateAiProviderRequestType) =>
    http.post<{ payload: { data: AiProviderConfigResponseType } }>(
      "/app/api/proxy/ai/admin/provider-config",
      body
    ),

  // ============================================
  // LANGFUSE ANALYTICS
  // ============================================

  getLangfuseTraces: (page: number = 1, limit: number = 50) =>
    http.get<{ payload: { data: { traces: any[]; total: number } } }>(
      `/app/api/proxy/ai/admin/langfuse-traces?page=${page}&limit=${limit}`
    ),

  getLangfuseTraceDetail: (traceId: string) =>
    http.get<{ payload: { data: any } }>(
      `/app/api/proxy/ai/admin/langfuse-trace/${traceId}`
    ),

  getProviderHealth: () =>
    http.get<{ payload: { data: any } }>(
      "/app/api/proxy/ai/admin/provider-health"
    ),

  getAvailableModels: () =>
    http.get<{ payload: { data: any } }>(
      "/app/api/proxy/ai/admin/available-models"
    ),

  getLangfuseAnalytics: (days: number = 7) =>
    http.get<{ payload: { data: any } }>(
      `/app/api/proxy/ai/admin/langfuse-analytics?days=${days}`
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
  createSession: (userId: string, mode?: "AUTO" | "GENERAL" | "ADVISOR") =>
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
