import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import courseApiRequest from "@/apiRequests/course";
import type { UpdateProgressRequest } from "@/types/course-progress.types";

// ============================================
// COURSE PROGRESS
// ============================================

export const useCourseProgress = (courseId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["course-progress", courseId],
    queryFn: () => courseApiRequest.getProgress(courseId as string),
    enabled: enabled && !!courseId,
  });
};

export const useUpdateLessonProgressMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      lessonId,
      body,
    }: {
      courseId: string;
      lessonId: string;
      body: UpdateProgressRequest;
    }) => courseApiRequest.updateProgress(courseId, lessonId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course-progress", variables.courseId] });
    },
  });
};

export const useMarkLessonCompleteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, lessonId }: { courseId: string; lessonId: string }) =>
      courseApiRequest.markLessonComplete(courseId, lessonId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["course-progress", variables.courseId] });
    },
  });
};
