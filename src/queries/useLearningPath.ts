import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import learningPathApiRequest from "@/apiRequests/learning-path";
import {
  CreateLearningPathBodyType,
  UpdateLearningPathBodyType,
  AddCoursesToPathBodyType,
  ReorderCourseBodyType,
  UpdateProgressBodyType,
} from "@/schemaValidations/learning-path.schema";

// ============================================
// LEARNING PATH CRUD
// ============================================

// Get learning path list with pagination
export const useGetLearningPathList = (params?: {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
  enabled?: boolean;
}) => {
  const { enabled = true, ...queryParams } = params || {};
  return useQuery({
    queryKey: ["learning-path-list", queryParams],
    queryFn: () => learningPathApiRequest.getLearningPathList(queryParams),
    enabled,
  });
};

// Get learning path by ID
export const useGetLearningPathById = (id: string) => {
  return useQuery({
    queryKey: ["learning-path", id],
    queryFn: () => learningPathApiRequest.getLearningPathById(id),
    enabled: !!id,
  });
};

// Create learning path mutation
export const useCreateLearningPathMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateLearningPathBodyType) =>
      learningPathApiRequest.createLearningPath(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-path-list"] });
    },
  });
};

// Update learning path mutation
export const useUpdateLearningPathMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateLearningPathBodyType }) =>
      learningPathApiRequest.updateLearningPath(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["learning-path-list"] });
      queryClient.invalidateQueries({ queryKey: ["learning-path", variables.id] });
    },
  });
};

// Delete learning path mutation
export const useDeleteLearningPathMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => learningPathApiRequest.deleteLearningPath(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-path-list"] });
    },
  });
};

// ============================================
// SEARCH & FILTER
// ============================================

// Search learning paths
export const useSearchLearningPaths = (params: {
  keyword: string;
  page?: number;
  size?: number;
}) => {
  return useQuery({
    queryKey: ["learning-path-search", params],
    queryFn: () => learningPathApiRequest.searchLearningPaths(params),
    enabled: !!params.keyword,
  });
};

// Get learning paths by creator
export const useGetLearningPathsByCreator = (userId: string, params?: {
  page?: number;
  size?: number;
}) => {
  return useQuery({
    queryKey: ["learning-path-creator", userId, params],
    queryFn: () => learningPathApiRequest.getLearningPathsByCreator(userId, params),
    enabled: !!userId,
  });
};

// Get learning paths by course
export const useGetLearningPathsByCourse = (courseId: string) => {
  return useQuery({
    queryKey: ["learning-path-course", courseId],
    queryFn: () => learningPathApiRequest.getLearningPathsByCourse(courseId),
    enabled: !!courseId,
  });
};

// ============================================
// COURSE MANAGEMENT
// ============================================

// Add courses to path
export const useAddCoursesToPathMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pathId, body }: { pathId: string; body: AddCoursesToPathBodyType }) =>
      learningPathApiRequest.addCoursesToPath(pathId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["learning-path", variables.pathId] });
      queryClient.invalidateQueries({ queryKey: ["learning-path-list"] });
    },
  });
};

// Remove course from path
export const useRemoveCourseFromPathMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pathId, courseId }: { pathId: string; courseId: string }) =>
      learningPathApiRequest.removeCourseFromPath(pathId, courseId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["learning-path", variables.pathId] });
      queryClient.invalidateQueries({ queryKey: ["learning-path-list"] });
    },
  });
};

// Reorder courses
export const useReorderCoursesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pathId, body }: { pathId: string; body: ReorderCourseBodyType }) =>
      learningPathApiRequest.reorderCourses(pathId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["learning-path", variables.pathId] });
    },
  });
};

// ============================================
// PROGRESS TRACKING
// ============================================

// Create or update progress
export const useCreateOrUpdateProgressMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProgressBodyType) =>
      learningPathApiRequest.createOrUpdateProgress(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["path-progress"] });
    },
  });
};

// Get progress by user and path
export const useGetProgressByUserAndPath = (userId: string, pathId: string) => {
  return useQuery({
    queryKey: ["path-progress", userId, pathId],
    queryFn: () => learningPathApiRequest.getProgressByUserAndPath(userId, pathId),
    enabled: !!userId && !!pathId,
  });
};

// Get progress by user
export const useGetProgressByUser = (userId: string, params?: {
  page?: number;
  size?: number;
}) => {
  return useQuery({
    queryKey: ["path-progress-user", userId, params],
    queryFn: () => learningPathApiRequest.getProgressByUser(userId, params),
    enabled: !!userId,
  });
};

// Get progress by path
export const useGetProgressByPath = (pathId: string, params?: {
  page?: number;
  size?: number;
}) => {
  return useQuery({
    queryKey: ["path-progress-path", pathId, params],
    queryFn: () => learningPathApiRequest.getProgressByPath(pathId, params),
    enabled: !!pathId,
  });
};

// Delete progress
export const useDeleteProgressMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, pathId }: { userId: string; pathId: string }) =>
      learningPathApiRequest.deleteProgress(userId, pathId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["path-progress"] });
    },
  });
};

// ============================================
// STATISTICS
// ============================================

// Get path statistics
export const useGetPathStatistics = (pathId: string) => {
  return useQuery({
    queryKey: ["path-statistics", pathId],
    queryFn: () => learningPathApiRequest.getPathStatistics(pathId),
    enabled: !!pathId,
  });
};
