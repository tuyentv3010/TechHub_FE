import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import courseApiRequest from "@/apiRequests/course";
import {
  CreateCourseBodyType,
  UpdateCourseBodyType,
} from "@/schemaValidations/course.schema";
import { CoursesResponse, transformApiCourse } from "@/types/course";

// New API - Get courses with new response format
export const useGetCourses = (params?: {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  level?: string;
  language?: string;
  skillIds?: string[];
  tagIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  instructorId?: string;
}) => {
  return useQuery({
    queryKey: ["courses", params],
    queryFn: () => courseApiRequest.getCourses(params),
    select: (response: CoursesResponse) => ({
      ...response,
      // Transform ApiCourse[] to Course[] for backward compatibility
      transformedData: response.data.map(transformApiCourse),
    }),
  });
};

// Legacy - Get course list with pagination and filters (for backward compatibility)
export const useGetCourseList = (params?: {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  level?: string;
  language?: string;
  skillIds?: string[];
  tagIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  instructorId?: string;
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

// ============================================
// SKILL & TAG HOOKS
// ============================================

// Get all skills
export const useGetSkills = () => {
  return useQuery({
    queryKey: ["skills"],
    queryFn: () => courseApiRequest.getSkills(),
  });
};

// Create skill
export const useCreateSkillMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => courseApiRequest.createSkill(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
};

// Update skill
export const useUpdateSkillMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => courseApiRequest.updateSkill(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
};

// Delete skill
export const useDeleteSkillMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApiRequest.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
};

// Get all tags
export const useGetTags = () => {
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => courseApiRequest.getTags(),
  });
};

// Create tag
export const useCreateTagMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => courseApiRequest.createTag(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
};

// Update tag
export const useUpdateTagMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => courseApiRequest.updateTag(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
};

// Delete tag
export const useDeleteTagMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApiRequest.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
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

// Get lesson by ID
export const useGetLesson = (courseId: string, chapterId: string, lessonId: string) => {
  return useQuery({
    queryKey: ["lesson", courseId, chapterId, lessonId],
    queryFn: () => courseApiRequest.getLesson(courseId, chapterId, lessonId),
    enabled: !!courseId && !!chapterId && !!lessonId,
  });
};

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
// EXERCISE HOOKS
// ============================================

// Get lesson exercise (single - legacy)
export const useGetLessonExercise = (courseId: string, lessonId: string) => {
  return useQuery({
    queryKey: ["lesson-exercise", courseId, lessonId],
    queryFn: () => courseApiRequest.getLessonExercise(courseId, lessonId),
    enabled: !!courseId && !!lessonId,
  });
};

// Get all exercises for a lesson
export const useGetExercises = (courseId: string, lessonId: string) => {
  return useQuery({
    queryKey: ["exercises", courseId, lessonId],
    queryFn: () => courseApiRequest.getExercises(courseId, lessonId),
    enabled: !!courseId && !!lessonId,
  });
};

// Upsert exercise (single - legacy)
export const useUpsertExerciseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, lessonId, body }: { courseId: string; lessonId: string; body: any }) =>
      courseApiRequest.upsertExercise(courseId, lessonId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lesson-exercise", variables.courseId, variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ["exercises", variables.courseId, variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ["chapters", variables.courseId] });
    },
  });
};

// Create multiple exercises
export const useCreateExercisesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, lessonId, body }: { courseId: string; lessonId: string; body: any[] }) =>
      courseApiRequest.createExercises(courseId, lessonId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["exercises", variables.courseId, variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ["chapters", variables.courseId] });
    },
  });
};

// Update exercise
export const useUpdateExerciseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, lessonId, exerciseId, body }: { courseId: string; lessonId: string; exerciseId: string; body: any }) => {
      console.log('🔧 [useCourse] updateExercise mutation called:', {
        courseId,
        lessonId,
        exerciseId,
        body,
        url: `/courses/${courseId}/lessons/${lessonId}/exercises/${exerciseId}`,
      });
      return courseApiRequest.updateExercise(courseId, lessonId, exerciseId, body);
    },
    onSuccess: (_data, variables) => {
      console.log('✅ [useCourse] updateExercise success:', _data);
      queryClient.invalidateQueries({ queryKey: ["exercises", variables.courseId, variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ["chapters", variables.courseId] });
    },
    onError: (error, variables) => {
      console.error('❌ [useCourse] updateExercise error:', {
        error,
        variables,
      });
    },
  });
};

// Delete exercise
export const useDeleteExerciseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, lessonId, exerciseId }: { courseId: string; lessonId: string; exerciseId: string }) => {
      console.log('🗑️ [useCourse] deleteExercise mutation called:', {
        courseId,
        lessonId,
        exerciseId,
        url: `/courses/${courseId}/lessons/${lessonId}/exercises/${exerciseId}`,
      });
      return courseApiRequest.deleteExercise(courseId, lessonId, exerciseId);
    },
    onSuccess: (_data, variables) => {
      console.log('✅ [useCourse] deleteExercise success:', _data);
      queryClient.invalidateQueries({ queryKey: ["exercises", variables.courseId, variables.lessonId] });
      queryClient.invalidateQueries({ queryKey: ["chapters", variables.courseId] });
    },
    onError: (error, variables) => {
      console.error('❌ [useCourse] deleteExercise error:', {
        error,
        variables,
      });
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

// ============================================
// RATING HOOKS
// ============================================

// Get course ratings
export const useGetCourseRatings = (courseId: string) => {
  return useQuery({
    queryKey: ["course-ratings", courseId],
    queryFn: () => courseApiRequest.getRatings(courseId),
    enabled: !!courseId,
  });
};

// Submit course rating
export const useSubmitCourseRatingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, score }: { courseId: string; score: number }) =>
      courseApiRequest.submitRating(courseId, { score }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course-ratings", variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ["course", variables.courseId] });
    },
  });
};
