import http from "@/lib/http";
import {
  LearningPathListResponseType,
  LearningPathDetailResponseType,
  CreateLearningPathBodyType,
  UpdateLearningPathBodyType,
  DeleteLearningPathResType,
  AddCoursesToPathBodyType,
  ReorderCourseBodyType,
  PathProgressResponseType,
  PathProgressListResponseType,
  UpdateProgressBodyType,
  PathStatisticsType,
} from "@/schemaValidations/learning-path.schema";

const learningPathApiRequest = {
  // ============================================
  // LEARNING PATH CRUD
  // ============================================

  // Get learning path list with pagination
  getLearningPathList: (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append("page", String(params.page));
    if (params?.size !== undefined) searchParams.append("size", String(params.size));
    if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params?.sortDirection) searchParams.append("sortDirection", params.sortDirection);

    return http.get<LearningPathListResponseType>(
      `/app/api/proxy/learning-paths${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    );
  },

  // Get learning path by ID
  getLearningPathById: (id: string) =>
    http.get<LearningPathDetailResponseType>(`/app/api/proxy/learning-paths/${id}`),

  // Create new learning path
  createLearningPath: (body: CreateLearningPathBodyType) =>
    http.post<LearningPathDetailResponseType>("/app/api/proxy/learning-paths", body),

  // Update learning path
  updateLearningPath: (id: string, body: UpdateLearningPathBodyType) =>
    http.put<LearningPathDetailResponseType>(`/app/api/proxy/learning-paths/${id}`, body),

  // Delete learning path
  deleteLearningPath: (id: string) =>
    http.delete<DeleteLearningPathResType>(`/app/api/proxy/learning-paths/${id}`),

  // ============================================
  // SEARCH & FILTER
  // ============================================

  // Search learning paths
  searchLearningPaths: (params: {
    keyword: string;
    page?: number;
    size?: number;
  }) => {
    const searchParams = new URLSearchParams();
    searchParams.append("keyword", params.keyword);
    if (params.page !== undefined) searchParams.append("page", String(params.page));
    if (params.size !== undefined) searchParams.append("size", String(params.size));

    return http.get<LearningPathListResponseType>(
      `/app/api/proxy/learning-paths/search?${searchParams.toString()}`
    );
  },

  // Get learning paths by creator
  getLearningPathsByCreator: (userId: string, params?: {
    page?: number;
    size?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append("page", String(params.page));
    if (params?.size !== undefined) searchParams.append("size", String(params.size));

    return http.get<LearningPathListResponseType>(
      `/app/api/proxy/learning-paths/creator/${userId}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    );
  },

  // Get learning paths by course
  getLearningPathsByCourse: (courseId: string) =>
    http.get<LearningPathListResponseType>(`/app/api/proxy/learning-paths/by-course/${courseId}`),

  // ============================================
  // COURSE MANAGEMENT
  // ============================================

  // Add courses to path
  addCoursesToPath: (pathId: string, body: AddCoursesToPathBodyType) =>
    http.post<LearningPathDetailResponseType>(`/app/api/proxy/learning-paths/${pathId}/courses`, body),

  // Remove course from path
  removeCourseFromPath: (pathId: string, courseId: string) =>
    http.delete<{ success: boolean; message: string }>(
      `/app/api/proxy/learning-paths/${pathId}/courses/${courseId}`
    ),

  // Reorder courses
  reorderCourses: (pathId: string, body: ReorderCourseBodyType) =>
    http.put<LearningPathDetailResponseType>(
      `/app/api/proxy/learning-paths/${pathId}/courses/reorder`,
      body
    ),

  // ============================================
  // PROGRESS TRACKING
  // ============================================

  // Create or update progress
  createOrUpdateProgress: (body: UpdateProgressBodyType) =>
    http.post<PathProgressResponseType>("/app/api/proxy/learning-paths/progress", body),

  // Get progress by user and path
  getProgressByUserAndPath: (userId: string, pathId: string) =>
    http.get<PathProgressResponseType>(
      `/app/api/proxy/learning-paths/progress/user/${userId}/path/${pathId}`
    ),

  // Get progress by user
  getProgressByUser: (userId: string, params?: {
    page?: number;
    size?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append("page", String(params.page));
    if (params?.size !== undefined) searchParams.append("size", String(params.size));

    return http.get<PathProgressListResponseType>(
      `/app/api/proxy/learning-paths/progress/user/${userId}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    );
  },

  // Get progress by path
  getProgressByPath: (pathId: string, params?: {
    page?: number;
    size?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append("page", String(params.page));
    if (params?.size !== undefined) searchParams.append("size", String(params.size));

    return http.get<PathProgressListResponseType>(
      `/app/api/proxy/learning-paths/progress/path/${pathId}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    );
  },

  // Delete progress
  deleteProgress: (userId: string, pathId: string) =>
    http.delete<{ success: boolean; message: string }>(
      `/app/api/proxy/learning-paths/progress/user/${userId}/path/${pathId}`
    ),

  // ============================================
  // STATISTICS
  // ============================================

  // Get path statistics
  getPathStatistics: (pathId: string) =>
    http.get<PathStatisticsType>(`/app/api/proxy/learning-paths/${pathId}/statistics`),
};

export default learningPathApiRequest;
