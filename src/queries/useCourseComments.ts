import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import courseApiRequest from "@/apiRequests/course";

// ============================================
// COURSE COMMENTS (for course detail page)
// ============================================

export const useCourseComments = (courseId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["course-comments", courseId],
    queryFn: () => courseApiRequest.getComments(courseId as string),
    enabled: enabled && !!courseId,
  });
};

export const useAddCourseCommentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      body,
    }: {
      courseId: string;
      body: { content: string; parentId?: string | null };
    }) => courseApiRequest.addComment(courseId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course-comments", variables.courseId] });
    },
  });
};

export const useDeleteCourseCommentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, commentId }: { courseId: string; commentId: string }) =>
      courseApiRequest.deleteComment(courseId, commentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course-comments", variables.courseId] });
    },
  });
};

// ============================================
// LESSON COMMENTS (for learning page)
// ============================================

export const useLessonComments = (
  courseId?: string,
  lessonId?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["lesson-comments", courseId, lessonId],
    queryFn: () => courseApiRequest.getLessonComments(courseId as string, lessonId as string),
    enabled: enabled && !!courseId && !!lessonId,
  });
};

export const useAddLessonCommentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      lessonId,
      body,
    }: {
      courseId: string;
      lessonId: string;
      body: { content: string; parentId?: string | null };
    }) => courseApiRequest.addLessonComment(courseId, lessonId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lesson-comments", variables.courseId, variables.lessonId],
      });
    },
  });
};

export const useDeleteLessonCommentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      lessonId,
      commentId,
    }: {
      courseId: string;
      lessonId: string;
      commentId: string;
    }) => courseApiRequest.deleteLessonComment(courseId, lessonId, commentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lesson-comments", variables.courseId, variables.lessonId],
      });
    },
  });
};
