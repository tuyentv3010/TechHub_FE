import http from "@/lib/http";
import {
  CourseListResponseType,
  CourseDetailResponseType,
  CreateCourseBodyType,
  UpdateCourseBodyType,
  DeleteCourseResType,
} from "@/schemaValidations/course.schema";
import { CoursesResponse, ApiCourse } from "@/types/course";

const courseApiRequest = {
  // Get instructor's own courses for Manage page (all statuses including DRAFT)
  getMyCourses: (params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    level?: string;
    language?: string;
    minPrice?: number;
    maxPrice?: number;
    skillIds?: string[];
    tagIds?: string[];
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append("page", String(params.page));
    if (params?.size !== undefined) searchParams.append("size", String(params.size));
    if (params?.search) searchParams.append("search", params.search);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.level) searchParams.append("level", params.level);
    if (params?.language) searchParams.append("language", params.language);
    if (params?.minPrice !== undefined) searchParams.append("minPrice", String(params.minPrice));
    if (params?.maxPrice !== undefined) searchParams.append("maxPrice", String(params.maxPrice));
    if (params?.skillIds && params.skillIds.length > 0) {
      params.skillIds.forEach((id) => searchParams.append("skillIds", id));
    }
    if (params?.tagIds && params.tagIds.length > 0) {
      params.tagIds.forEach((id) => searchParams.append("tagIds", id));
    }

    const url = `/app/api/proxy/courses/my-courses${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    return http.get<CourseListResponseType>(url);
  },

  // Get course list with pagination and filters (New API)
  getCourses: (params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    level?: string;
    language?: string;
    instructorId?: string;
    minPrice?: number;
    maxPrice?: number;
    skillIds?: string[];
    tagIds?: string[];
  }) => {
    console.log("🔍 [FE] getCourses called with params:", JSON.stringify(params, null, 2));
    
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append("page", String(params.page));
    if (params?.size !== undefined) searchParams.append("size", String(params.size));
    if (params?.search) searchParams.append("search", params.search);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.level) searchParams.append("level", params.level);
    if (params?.language) searchParams.append("language", params.language);
    if (params?.instructorId) searchParams.append("instructorId", params.instructorId);
    if (params?.minPrice !== undefined) searchParams.append("minPrice", String(params.minPrice));
    if (params?.maxPrice !== undefined) searchParams.append("maxPrice", String(params.maxPrice));
    if (params?.skillIds && params.skillIds.length > 0) {
      console.log("🏷️ [FE] skillIds array:", params.skillIds);
      params.skillIds.forEach((id) => searchParams.append("skillIds", id));
    }
    if (params?.tagIds && params.tagIds.length > 0) {
      console.log("🏷️ [FE] tagIds array:", params.tagIds);
      params.tagIds.forEach((id) => searchParams.append("tagIds", id));
    }

    const url = `/app/api/proxy/courses${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    console.log("🌐 [FE] Request URL:", url);
    console.log("📋 [FE] Search params:", searchParams.toString());

    return http.get<CoursesResponse>(url);
  },

  // Legacy method for backward compatibility
  getCourseList: (params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    level?: string;
    language?: string;
    instructorId?: string;
    minPrice?: number;
    maxPrice?: number;
    skillIds?: string[];
    tagIds?: string[];
  }, options?: Parameters<typeof http.get>[1]) => {
    console.log("🔍 [FE] getCourseList called with params:", JSON.stringify(params, null, 2));
    
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append("page", String(params.page));
    if (params?.size !== undefined) searchParams.append("size", String(params.size));
    if (params?.search) searchParams.append("search", params.search);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.level) searchParams.append("level", params.level);
    if (params?.language) searchParams.append("language", params.language);
    if (params?.instructorId) searchParams.append("instructorId", params.instructorId);
    if (params?.minPrice !== undefined) searchParams.append("minPrice", String(params.minPrice));
    if (params?.maxPrice !== undefined) searchParams.append("maxPrice", String(params.maxPrice));
    if (params?.skillIds && params.skillIds.length > 0) {
      console.log("🏷️ [FE] skillIds array:", params.skillIds);
      params.skillIds.forEach((id) => searchParams.append("skillIds", id));
    }
    if (params?.tagIds && params.tagIds.length > 0) {
      console.log("🏷️ [FE] tagIds array:", params.tagIds);
      params.tagIds.forEach((id) => searchParams.append("tagIds", id));
    }

    const url = `/app/api/proxy/courses${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    console.log("🌐 [FE] Request URL:", url);
    console.log("📋 [FE] Search params:", searchParams.toString());

    return http.get<CourseListResponseType>(url, options);
  },

  // Get course by ID
  getCourseById: (id: string) =>
    http.get<CourseDetailResponseType>(`/app/api/proxy/courses/${id}`),

  // Get current user's learning streak
  getLearningStreak: () =>
    http.get(`/app/api/proxy/courses/streak`),

  // Create new course
  createCourse: (body: CreateCourseBodyType) =>
    http.post<CourseDetailResponseType>("/app/api/proxy/courses", body),

  // Update course
  updateCourse: (id: string, body: UpdateCourseBodyType) =>
    http.put<CourseDetailResponseType>(`/app/api/proxy/courses/${id}`, body),

  // Delete course (soft delete)
  deleteCourse: (id: string) =>
    http.delete<DeleteCourseResType>(`/app/api/proxy/courses/${id}`),

  // Enroll in course
  enrollCourse: (courseId: string) =>
    http.post<{ message: string }>(`/app/api/proxy/courses/${courseId}/enroll`, {}),

  // Get course chapters
  getChapters: (courseId: string) =>
    http.get(`/app/api/proxy/courses/${courseId}/chapters`),

  // Get all available skills (from course-service)
  getSkills: (options?: Parameters<typeof http.get>[1]) =>
    http.get(`/app/api/proxy/courses/skills`, {
      redirectOnUnauthorized: false,
      ...options,
    }),
  // Get single skill by id
  getSkill: (id: string) => http.get(`/app/api/proxy/courses/skills/${id}`),

  // Create/update/delete skill
  createSkill: (body: any) => http.post(`/app/api/proxy/courses/skills`, body),
  updateSkill: (id: string, body: any) => http.put(`/app/api/proxy/courses/skills/${id}`, body),
  deleteSkill: (id: string) => http.delete(`/app/api/proxy/courses/skills/${id}`),

  // Get all available tags (from course-service)
  getTags: (options?: Parameters<typeof http.get>[1]) =>
    http.get(`/app/api/proxy/courses/tags`, {
      redirectOnUnauthorized: false,
      ...options,
    }),

  // Create/update/delete tag
  createTag: (body: any) => http.post(`/app/api/proxy/courses/tags`, body),
  updateTag: (id: string, body: any) => http.put(`/app/api/proxy/courses/tags/${id}`, body),
  deleteTag: (id: string) => http.delete(`/app/api/proxy/courses/tags/${id}`),

  // Get course progress
  getProgress: (courseId: string) =>
    http.get(`/app/api/proxy/courses/${courseId}/progress`),

  // Get course ratings
  getRatings: (courseId: string) =>
    http.get(`/app/api/proxy/courses/${courseId}/ratings`),

  // Submit course rating
  submitRating: (courseId: string, body: { score: number }) =>
    http.post(`/app/api/proxy/courses/${courseId}/ratings`, body),

  // ============================================
  // MY LEARNING / ENROLLMENTS
  // ============================================

  // Get current user's enrollments (my learning)
  getMyEnrollments: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return http.get(`/app/api/proxy/enrollments/my-enrollments${params}`);
  },

  // Get course comments
  getComments: (courseId: string) =>
    http.get(`/app/api/proxy/courses/${courseId}/comments`),

  // Add course comment
  addComment: (
    courseId: string,
    body: { content: string; parentId?: string | null }
  ) => http.post(`/app/api/proxy/courses/${courseId}/comments`, body),

  // Delete comment
  deleteComment: (courseId: string, commentId: string) =>
    http.delete(`/app/api/proxy/courses/${courseId}/comments/${commentId}`),

  // ============================================
  // LESSON COMMENTS
  // ============================================

  // Get lesson comments
  getLessonComments: (courseId: string, lessonId: string) =>
    http.get(`/app/api/proxy/courses/${courseId}/lessons/${lessonId}/comments`),

  // Add lesson comment
  addLessonComment: (
    courseId: string,
    lessonId: string,
    body: { content: string; parentId?: string | null }
  ) => http.post(`/app/api/proxy/courses/${courseId}/lessons/${lessonId}/comments`, body),

  // Delete lesson comment
  deleteLessonComment: (courseId: string, lessonId: string, commentId: string) =>
    http.delete(`/app/api/proxy/courses/${courseId}/lessons/${lessonId}/comments/${commentId}`),

  // ============================================
  // CHAPTER MANAGEMENT
  // ============================================
  
  // Create chapter
  createChapter: (courseId: string, body: any) =>
    http.post(`/app/api/proxy/courses/${courseId}/chapters`, body),

  // Update chapter
  updateChapter: (courseId: string, chapterId: string, body: any) =>
    http.put(`/app/api/proxy/courses/${courseId}/chapters/${chapterId}`, body),

  // Delete chapter
  deleteChapter: (courseId: string, chapterId: string) =>
    http.delete(`/app/api/proxy/courses/${courseId}/chapters/${chapterId}`),

  // ============================================
  // LESSON MANAGEMENT
  // ============================================

  // Get lesson by ID
  getLesson: (courseId: string, chapterId: string, lessonId: string) =>
    http.get(`/app/api/proxy/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/detail`),

  // Create lesson
  createLesson: (courseId: string, chapterId: string, body: any) =>
    http.post(`/app/api/proxy/courses/${courseId}/chapters/${chapterId}/lessons`, body),

  // Update lesson
  updateLesson: (courseId: string, chapterId: string, lessonId: string, body: any) =>
    http.put(`/app/api/proxy/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`, body),

  // Delete lesson
  deleteLesson: (courseId: string, chapterId: string, lessonId: string) =>
    http.delete(`/app/api/proxy/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`),

  // ============================================
  // ASSET MANAGEMENT
  // ============================================

  // Create asset
  createAsset: (courseId: string, chapterId: string, lessonId: string, body: any) =>
    http.post(`/app/api/proxy/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/assets`, body),

  // Update asset
  updateAsset: (courseId: string, chapterId: string, lessonId: string, assetId: string, body: any) =>
    http.put(`/app/api/proxy/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/assets/${assetId}`, body),

  // Delete asset
  deleteAsset: (courseId: string, chapterId: string, lessonId: string, assetId: string) =>
    http.delete(`/app/api/proxy/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/assets/${assetId}`),

  // ============================================
  // PROGRESS TRACKING
  // ============================================

  // Update lesson progress
  updateProgress: (courseId: string, lessonId: string, body: any) =>
    http.put(`/app/api/proxy/courses/${courseId}/lessons/${lessonId}/progress`, body),

  // Mark lesson as complete
  markLessonComplete: (courseId: string, lessonId: string) =>
    http.post(`/app/api/proxy/courses/${courseId}/lessons/${lessonId}/progress/complete`, {}),

  // ============================================
  // EXERCISE MANAGEMENT
  // ============================================

  // Get lesson exercise (single exercise per lesson)
  getLessonExercise: (courseId: string, lessonId: string) =>
    http.get(`/app/api/proxy/courses/${courseId}/lessons/${lessonId}/exercise`),

  // Upsert exercise for a lesson (PUT - create or update single exercise)
  upsertExercise: (courseId: string, lessonId: string, body: any) =>
    http.put(`/app/api/proxy/courses/${courseId}/lessons/${lessonId}/exercise`, body),

  // Get all exercises for a lesson
  getExercises: (courseId: string, lessonId: string) =>
    http.get(`/app/api/proxy/courses/${courseId}/lessons/${lessonId}/exercises`),

  // Create multiple exercises for a lesson at once
  createExercises: (courseId: string, lessonId: string, body: any[]) =>
    http.post(`/app/api/proxy/courses/${courseId}/lessons/${lessonId}/exercises`, body),
  bulkCreateExercises: (courseId: string, lessonId: string, body: { exercises: any[] }) =>
    http.post(`/app/api/proxy/courses/${courseId}/lessons/${lessonId}/exercises/bulk`, body),

  // Submit learner answer and receive grading feedback
  submitExercise: (courseId: string, lessonId: string, body: any) =>
    http.post(`/app/api/proxy/courses/${courseId}/lessons/${lessonId}/exercise/submissions`, body),

  // Lesson leaderboard (top N learners by submission grade)
  getLessonLeaderboard: (courseId: string, lessonId: string, limit: number = 10) =>
    http.get<any>(
      `/app/api/proxy/courses/${courseId}/lessons/${lessonId}/leaderboard?limit=${limit}`,
    ),

  // Update exercise
  updateExercise: (courseId: string, lessonId: string, exerciseId: string, body: any) => {
    const url = `/app/api/proxy/courses/${courseId}/lessons/${lessonId}/exercises/${exerciseId}`;
    console.log('🔧 [API] PUT updateExercise:', {
      url,
      courseId,
      lessonId,
      exerciseId,
      body,
    });
    return http.put(url, body);
  },

  // Delete exercise
  deleteExercise: (courseId: string, lessonId: string, exerciseId: string) => {
    const url = `/app/api/proxy/courses/${courseId}/lessons/${lessonId}/exercises/${exerciseId}`;
    console.log('🗑️ [API] DELETE deleteExercise:', {
      url,
      courseId,
      lessonId,
      exerciseId,
    });
    return http.delete(url);
  },
};

export default courseApiRequest;
