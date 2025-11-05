import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import courseApiRequest from "@/apiRequests/course";
import {
  CreateCourseBodyType,
  UpdateCourseBodyType,
} from "@/schemaValidations/course.schema";

// Get course list with pagination and filters
export const useGetCourseList = (params?: {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ["course-list", params],
    queryFn: () => courseApiRequest.getCourseList(params),
  });
};

// Get course by ID
export const useGetCourseById = (id: string) => {
  return useQuery({
    queryKey: ["course", id],
    queryFn: () => courseApiRequest.getCourseById(id),
    enabled: !!id,
  });
};

// Create course mutation
export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCourseBodyType) => courseApiRequest.createCourse(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-list"] });
    },
  });
};

// Update course mutation
export const useUpdateCourseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCourseBodyType }) =>
      courseApiRequest.updateCourse(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course-list"] });
      queryClient.invalidateQueries({ queryKey: ["course", variables.id] });
    },
  });
};

// Delete course mutation
export const useDeleteCourseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApiRequest.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-list"] });
    },
  });
};

// Enroll in course
export const useEnrollCourseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => courseApiRequest.enrollCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-list"] });
    },
  });
};

// ============================================
// CHAPTER HOOKS
// ============================================

// Get chapters for a course
export const useGetChapters = (courseId: string) => {
  return useQuery({
    queryKey: ["chapters", courseId],
    queryFn: () => courseApiRequest.getChapters(courseId),
    enabled: !!courseId,
  });
};

// Create chapter
export const useCreateChapterMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, body }: { courseId: string; body: any }) =>
      courseApiRequest.createChapter(courseId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chapters", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", variables.courseId] });
    },
  });
};

// Update chapter
export const useUpdateChapterMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, chapterId, body }: { courseId: string; chapterId: string; body: any }) =>
      courseApiRequest.updateChapter(courseId, chapterId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chapters", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", variables.courseId] });
    },
  });
};

// Delete chapter
export const useDeleteChapterMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, chapterId }: { courseId: string; chapterId: string }) =>
      courseApiRequest.deleteChapter(courseId, chapterId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chapters", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", variables.courseId] });
    },
  });
};

// ============================================
// LESSON HOOKS
// ============================================

// Create lesson
export const useCreateLessonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, chapterId, body }: { courseId: string; chapterId: string; body: any }) =>
      courseApiRequest.createLesson(courseId, chapterId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chapters", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", variables.courseId] });
    },
  });
};

// Update lesson
export const useUpdateLessonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, chapterId, lessonId, body }: { courseId: string; chapterId: string; lessonId: string; body: any }) =>
      courseApiRequest.updateLesson(courseId, chapterId, lessonId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chapters", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", variables.courseId] });
    },
  });
};

// Delete lesson
export const useDeleteLessonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, chapterId, lessonId }: { courseId: string; chapterId: string; lessonId: string }) =>
      courseApiRequest.deleteLesson(courseId, chapterId, lessonId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chapters", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", variables.courseId] });
    },
  });
};

// ============================================
// ASSET HOOKS
// ============================================

// Create asset
export const useCreateAssetMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, chapterId, lessonId, body }: { courseId: string; chapterId: string; lessonId: string; body: any }) =>
      courseApiRequest.createAsset(courseId, chapterId, lessonId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chapters", variables.courseId] });
    },
  });
};

// Update asset
export const useUpdateAssetMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, chapterId, lessonId, assetId, body }: { courseId: string; chapterId: string; lessonId: string; assetId: string; body: any }) =>
      courseApiRequest.updateAsset(courseId, chapterId, lessonId, assetId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chapters", variables.courseId] });
    },
  });
};

// Delete asset
export const useDeleteAssetMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, chapterId, lessonId, assetId }: { courseId: string; chapterId: string; lessonId: string; assetId: string }) =>
      courseApiRequest.deleteAsset(courseId, chapterId, lessonId, assetId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chapters", variables.courseId] });
    },
  });
};

// ============================================
// PROGRESS HOOKS
// ============================================

// Get course progress
export const useGetProgress = (courseId: string) => {
  return useQuery({
    queryKey: ["progress", courseId],
    queryFn: () => courseApiRequest.getProgress(courseId),
    enabled: !!courseId,
  });
};

// Update progress
export const useUpdateProgressMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, lessonId, body }: { courseId: string; lessonId: string; body: any }) =>
      courseApiRequest.updateProgress(courseId, lessonId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["progress", variables.courseId] });
    },
  });
};

// Mark lesson complete
export const useMarkLessonCompleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, lessonId }: { courseId: string; lessonId: string }) =>
      courseApiRequest.markLessonComplete(courseId, lessonId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["progress", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", variables.courseId] });
    },
  });
};
