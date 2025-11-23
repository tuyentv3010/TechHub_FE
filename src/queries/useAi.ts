import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import aiApiRequest from "@/apiRequests/ai";
import {
  AiExerciseGenerateRequestType,
  LearningPathGenerateRequestType,
  RecommendationRequestType,
  ChatMessageRequestType,
} from "@/schemaValidations/ai.schema";

// ============================================
// AI EXERCISE HOOKS
// ============================================

// Generate exercises mutation
export const useGenerateExercisesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AiExerciseGenerateRequestType) =>
      aiApiRequest.generateExercises(body),
    onSuccess: (_data, variables) => {
      // Invalidate exercise drafts for the lesson
      queryClient.invalidateQueries({
        queryKey: ["exercise-drafts", variables.lessonId],
      });
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
};

// Get exercise drafts
export const useGetExerciseDrafts = (lessonId: string) => {
  return useQuery({
    queryKey: ["exercise-drafts", lessonId],
    queryFn: () => aiApiRequest.getExerciseDrafts(lessonId),
    enabled: !!lessonId,
  });
};

// Get latest exercise draft for a lesson
export const useGetLatestExerciseDraft = (lessonId: string) => {
  return useQuery({
    queryKey: ["latest-exercise-draft", lessonId],
    queryFn: () => aiApiRequest.getLatestExerciseDraft(lessonId),
    enabled: !!lessonId,
  });
};

// ============================================
// LEARNING PATH AI HOOKS
// ============================================

// Generate learning path mutation
export const useGenerateLearningPathMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LearningPathGenerateRequestType) =>
      aiApiRequest.generateLearningPath(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-path-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
};

// Get learning path drafts
export const useGetLearningPathDrafts = () => {
  return useQuery({
    queryKey: ["learning-path-drafts"],
    queryFn: () => aiApiRequest.getLearningPathDrafts(),
  });
};

// ============================================
// RECOMMENDATION HOOKS
// ============================================

// Get realtime recommendations mutation
export const useRecommendRealtimeMutation = () => {
  return useMutation({
    mutationFn: (body: RecommendationRequestType) =>
      aiApiRequest.recommendRealtime(body),
  });
};

// Trigger scheduled recommendations mutation
export const useRecommendScheduledMutation = () => {
  return useMutation({
    mutationFn: (body: RecommendationRequestType) =>
      aiApiRequest.recommendScheduled(body),
  });
};

// ============================================
// CHAT HOOKS
// ============================================

// Send chat message mutation
export const useSendChatMessageMutation = () => {
  return useMutation({
    mutationFn: (body: ChatMessageRequestType) =>
      aiApiRequest.sendChatMessage(body),
  });
};

// ============================================
// ADMIN HOOKS
// ============================================

// Reindex courses mutation
export const useReindexCoursesMutation = () => {
  return useMutation({
    mutationFn: () => aiApiRequest.reindexCourses(),
  });
};

// Reindex lessons mutation
export const useReindexLessonsMutation = () => {
  return useMutation({
    mutationFn: () => aiApiRequest.reindexLessons(),
  });
};

// Reindex all mutation
export const useReindexAllMutation = () => {
  return useMutation({
    mutationFn: () => aiApiRequest.reindexAll(),
  });
};

// Get Qdrant stats query
export const useGetQdrantStats = () => {
  return useQuery({
    queryKey: ["qdrant-stats"],
    queryFn: () => aiApiRequest.getQdrantStats(),
    enabled: false, // Manual trigger
  });
};

// ============================================
// DRAFT MANAGEMENT HOOKS
// ============================================

// Get draft by task ID
export const useGetDraftById = (taskId: string) => {
  return useQuery({
    queryKey: ["draft", taskId],
    queryFn: () => aiApiRequest.getDraftById(taskId),
    enabled: !!taskId,
  });
};

// Approve exercise draft mutation
export const useApproveExerciseDraftMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => aiApiRequest.approveExerciseDraft(taskId),
    onSuccess: (_data, taskId) => {
      queryClient.invalidateQueries({ queryKey: ["exercise-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["draft", taskId] });
    },
  });
};

// Approve learning path draft mutation
export const useApproveLearningPathDraftMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => aiApiRequest.approveLearningPathDraft(taskId),
    onSuccess: (_data, taskId) => {
      queryClient.invalidateQueries({ queryKey: ["learning-path-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["draft", taskId] });
    },
  });
};

// Reject draft mutation
export const useRejectDraftMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason?: string }) =>
      aiApiRequest.rejectDraft(taskId, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exercise-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["learning-path-drafts"] });
      queryClient.invalidateQueries({ queryKey: ["draft", variables.taskId] });
    },
  });
};

