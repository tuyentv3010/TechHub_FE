import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseService, type Course, type CourseFilters } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Course Hooks
 * Custom hooks for course management using TanStack Query
 */

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

// Query keys for better cache management
export const courseQueryKeys = {
  all: ['courses'] as const,
  lists: () => [...courseQueryKeys.all, 'list'] as const,
  list: (filters?: CourseFilters) => [...courseQueryKeys.lists(), filters] as const,
  details: () => [...courseQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseQueryKeys.details(), id] as const,
  enrolled: () => [...courseQueryKeys.all, 'enrolled'] as const,
  progress: (courseId: string) => [...courseQueryKeys.detail(courseId), 'progress'] as const,
};

/**
 * Get courses list with filters
 */
export function useCourses(filters?: CourseFilters) {
  return useQuery({
    queryKey: courseQueryKeys.list(filters),
    queryFn: () => courseService.getCourses(1, 20, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get single course details
 */
export function useCourse(courseId: string) {
  return useQuery({
    queryKey: courseQueryKeys.detail(courseId),
    queryFn: () => courseService.getCourse(courseId),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get enrolled courses for current user
 */
export function useEnrolledCourses() {
  return useQuery({
    queryKey: courseQueryKeys.enrolled(),
    queryFn: () => courseService.getEnrolledCourses(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get course progress
 */
export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: courseQueryKeys.progress(courseId),
    queryFn: () => courseService.getCourseProgress(courseId),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Enroll in a course
 */
export function useEnrollCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => courseService.enrollCourse(courseId),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: courseQueryKeys.enrolled() });
      queryClient.invalidateQueries({ queryKey: courseQueryKeys.lists() });
      toast.success('Đăng ký khóa học thành công!');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as ApiError)?.response?.data?.message || 'Đăng ký khóa học thất bại';
      toast.error(errorMessage);
    },
  });
}

/**
 * Update lesson progress
 */
export function useUpdateLessonProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId }: { lessonId: string }) =>
      courseService.updateLessonProgress(lessonId),
    onSuccess: (data, variables) => {
      // Find courseId from lesson or pass it as parameter
      const courseId = 'course-id'; // This should be derived from context
      queryClient.invalidateQueries({ queryKey: courseQueryKeys.progress(courseId) });
      toast.success('Đã cập nhật tiến độ học tập!');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as ApiError)?.response?.data?.message || 'Có lỗi khi cập nhật tiến độ';
      toast.error(errorMessage);
    },
  });
}

/**
 * Create new course (for instructors)
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseData: Partial<Course>) => courseService.createCourse(courseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseQueryKeys.lists() });
      toast.success('Tạo khóa học thành công!');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as ApiError)?.response?.data?.message || 'Tạo khóa học thất bại';
      toast.error(errorMessage);
    },
  });
}

/**
 * Update course (for instructors)
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, courseData }: { courseId: string; courseData: Partial<Course> }) =>
      courseService.updateCourse(courseId, courseData),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(courseQueryKeys.detail(variables.courseId), data);
      queryClient.invalidateQueries({ queryKey: courseQueryKeys.lists() });
      toast.success('Cập nhật khóa học thành công!');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as ApiError)?.response?.data?.message || 'Cập nhật khóa học thất bại';
      toast.error(errorMessage);
    },
  });
}

/**
 * Delete course (for instructors)
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => courseService.deleteCourse(courseId),
    onSuccess: (data, courseId) => {
      queryClient.removeQueries({ queryKey: courseQueryKeys.detail(courseId) });
      queryClient.invalidateQueries({ queryKey: courseQueryKeys.lists() });
      toast.success('Xóa khóa học thành công!');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as ApiError)?.response?.data?.message || 'Xóa khóa học thất bại';
      toast.error(errorMessage);
    },
  });
}