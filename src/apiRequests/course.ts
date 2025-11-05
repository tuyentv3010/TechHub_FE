import http from "@/lib/http";
import {
  CourseListResponseType,
  CourseDetailResponseType,
  CreateCourseBodyType,
  UpdateCourseBodyType,
  DeleteCourseResType,
} from "@/schemaValidations/course.schema";

const courseApiRequest = {
  // Get course list with pagination and filters
  getCourseList: (params?: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) searchParams.append("page", String(params.page));
    if (params?.size !== undefined) searchParams.append("size", String(params.size));
    if (params?.search) searchParams.append("search", params.search);
    if (params?.status) searchParams.append("status", params.status);

    return http.get<CourseListResponseType>(
      `/app/api/proxy/courses${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    );
  },

  // Get course by ID
  getCourseById: (id: string) =>
    http.get<CourseDetailResponseType>(`/app/api/proxy/courses/${id}`),

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

  // Get course progress
  getProgress: (courseId: string) =>
    http.get(`/app/api/proxy/courses/${courseId}/progress`),

  // Get course ratings
  getRatings: (courseId: string) =>
    http.get(`/app/api/proxy/courses/${courseId}/ratings`),

  // Submit course rating
  submitRating: (courseId: string, body: { score: number }) =>
    http.post(`/app/api/proxy/courses/${courseId}/ratings`, body),

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
};

export default courseApiRequest;
