import apiClient from './client';
import config from '@/config';
import { ApiResponse, PaginatedResponse } from './auth.service';

export interface Course {
  id: string;
  title: string;
  description: string;
  price?: number;
  imageUrl?: string;
  isPublished: boolean;
  categoryId?: string;
  instructorId: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
  };
  enrollmentCount: number;
  rating: number;
  duration: number; // in minutes
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  courseId: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  content?: string;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  chapterId: string;
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: 'MULTIPLE_CHOICE' | 'CODING' | 'OPEN_ENDED';
  content: Record<string, unknown>; // JSON content
  points: number;
  lessonId: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number; // 0-100
  createdAt: string;
}

export interface CourseFilters {
  category?: string;
  instructor?: string;
  priceRange?: [number, number];
  rating?: number;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  search?: string;
}

/**
 * Course Service
 * Handles all course-related API calls
 */
export class CourseService {
  async getCourses(
    page = 1,
    limit = config.ui.itemsPerPage,
    filters?: CourseFilters
  ): Promise<PaginatedResponse<Course>> {
    const params = {
      page,
      limit,
      ...filters,
    };

    const response = await apiClient.get<PaginatedResponse<Course>>(
      config.endpoints.courses.base,
      { params }
    );
    return response;
  }

  async getCourse(id: string): Promise<Course> {
    const response = await apiClient.get<ApiResponse<Course>>(
      `${config.endpoints.courses.base}/${id}`
    );
    return response.data;
  }

  async getPopularCourses(limit = 10): Promise<Course[]> {
    const response = await apiClient.get<ApiResponse<Course[]>>(
      config.endpoints.courses.popular,
      { params: { limit } }
    );
    return response.data;
  }

  async getCourseChapters(courseId: string): Promise<Chapter[]> {
    const response = await apiClient.get<ApiResponse<Chapter[]>>(
      `${config.endpoints.courses.base}/${courseId}/chapters`
    );
    return response.data;
  }

  async getChapter(chapterId: string): Promise<Chapter> {
    const response = await apiClient.get<ApiResponse<Chapter>>(
      `${config.endpoints.content.chapters}/${chapterId}`
    );
    return response.data;
  }

  async getLesson(lessonId: string): Promise<Lesson> {
    const response = await apiClient.get<ApiResponse<Lesson>>(
      `${config.endpoints.content.lessons}/${lessonId}`
    );
    return response.data;
  }

  async enrollInCourse(courseId: string): Promise<Enrollment> {
    const response = await apiClient.post<ApiResponse<Enrollment>>(
      config.endpoints.courses.enroll,
      { courseId }
    );
    return response.data;
  }

  async getCourseProgress(courseId: string): Promise<{
    progress: number;
    completedLessons: string[];
    totalLessons: number;
  }> {
    const response = await apiClient.get<ApiResponse<{
      progress: number;
      completedLessons: string[];
      totalLessons: number;
    }>>(
      `${config.endpoints.courses.progress}/${courseId}`
    );
    return response.data;
  }

  async markLessonComplete(lessonId: string): Promise<void> {
    await apiClient.post(
      `${config.endpoints.content.lessons}/${lessonId}/complete`
    );
  }

  async getMyEnrolledCourses(): Promise<Course[]> {
    const response = await apiClient.get<ApiResponse<Course[]>>(
      `${config.endpoints.courses.base}/enrolled`
    );
    return response.data;
  }

  // Instructor methods
  async createCourse(courseData: Partial<Course>): Promise<Course> {
    const response = await apiClient.post<ApiResponse<Course>>(
      config.endpoints.courses.base,
      courseData
    );
    return response.data;
  }

  async updateCourse(id: string, courseData: Partial<Course>): Promise<Course> {
    const response = await apiClient.put<ApiResponse<Course>>(
      `${config.endpoints.courses.base}/${id}`,
      courseData
    );
    return response.data;
  }

  async deleteCourse(id: string): Promise<void> {
    await apiClient.delete(`${config.endpoints.courses.base}/${id}`);
  }

  async uploadCourseImage(courseId: string, file: File): Promise<{ imageUrl: string }> {
    const response = await apiClient.upload<ApiResponse<{ imageUrl: string }>>(
      `${config.endpoints.courses.base}/${courseId}/image`,
      file
    );
    return response.data;
  }
}