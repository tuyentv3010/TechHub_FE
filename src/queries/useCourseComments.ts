import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import courseApiRequest from "@/apiRequests/course";
import type { CourseComment } from "@/types/course-comment.types";

type CommentCache = {
  payload?: {
    data?: CourseComment[];
    [key: string]: any;
  };
  [key: string]: any;
};

const getCurrentUserId = (queryClient: ReturnType<typeof useQueryClient>) => {
  const profile = queryClient.getQueryData<any>(["account-profile"]);
  return profile?.payload?.data?.id ?? "pending-user";
};

const createOptimisticComment = (
  content: string,
  parentId: string | null | undefined,
  userId: string
): CourseComment => {
  const now = new Date().toISOString();
  return {
    id: `optimistic-${Date.now()}`,
    userId,
    content,
    parentId: parentId ?? null,
    parentCommentId: parentId ?? undefined,
    created: now,
    updated: now,
    replies: [],
    isPending: true,
  };
};

const addCommentToTree = (
  comments: CourseComment[],
  optimisticComment: CourseComment
): CourseComment[] => {
  if (!optimisticComment.parentId) {
    return [optimisticComment, ...comments];
  }

  return comments.map((comment) => {
    if (comment.id === optimisticComment.parentId) {
      return {
        ...comment,
        replies: [...(comment.replies ?? []), optimisticComment],
      };
    }

    return {
      ...comment,
      replies: addCommentToTree(comment.replies ?? [], optimisticComment),
    };
  });
};

const replaceCommentInTree = (
  comments: CourseComment[],
  tempId: string,
  savedComment: CourseComment
): CourseComment[] => {
  return comments.map((comment) => {
    if (comment.id === tempId) {
      return {
        ...savedComment,
        replies: savedComment.replies ?? [],
        isPending: false,
      };
    }

    return {
      ...comment,
      replies: replaceCommentInTree(comment.replies ?? [], tempId, savedComment),
    };
  });
};

const setOptimisticComment = (
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  optimisticComment: CourseComment
) => {
  queryClient.setQueryData<CommentCache>(queryKey, (current) => {
    if (!current?.payload?.data) return current;
    return {
      ...current,
      payload: {
        ...current.payload,
        data: addCommentToTree(current.payload.data, optimisticComment),
      },
    };
  });
};

const replaceOptimisticComment = (
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  tempId: string,
  savedComment?: CourseComment
) => {
  if (!savedComment) return;
  queryClient.setQueryData<CommentCache>(queryKey, (current) => {
    if (!current?.payload?.data) return current;
    return {
      ...current,
      payload: {
        ...current.payload,
        data: replaceCommentInTree(current.payload.data, tempId, savedComment),
      },
    };
  });
};

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
    onMutate: async (variables) => {
      const queryKey = ["course-comments", variables.courseId] as const;
      await queryClient.cancelQueries({ queryKey });
      const previousComments = queryClient.getQueryData<CommentCache>(queryKey);
      const optimisticComment = createOptimisticComment(
        variables.body.content,
        variables.body.parentId,
        getCurrentUserId(queryClient)
      );
      setOptimisticComment(queryClient, queryKey, optimisticComment);
      return { previousComments, optimisticId: optimisticComment.id, queryKey };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(context.queryKey, context.previousComments);
      }
    },
    onSuccess: (data, _variables, context) => {
      replaceOptimisticComment(
        queryClient,
        context?.queryKey ?? [],
        context?.optimisticId ?? "",
        data?.payload?.data
      );
    },
    onSettled: (_data, _error, variables) => {
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
    onMutate: async (variables) => {
      const queryKey = ["lesson-comments", variables.courseId, variables.lessonId] as const;
      await queryClient.cancelQueries({ queryKey });
      const previousComments = queryClient.getQueryData<CommentCache>(queryKey);
      const optimisticComment = createOptimisticComment(
        variables.body.content,
        variables.body.parentId,
        getCurrentUserId(queryClient)
      );
      setOptimisticComment(queryClient, queryKey, optimisticComment);
      return { previousComments, optimisticId: optimisticComment.id, queryKey };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(context.queryKey, context.previousComments);
      }
    },
    onSuccess: (data, _variables, context) => {
      replaceOptimisticComment(
        queryClient,
        context?.queryKey ?? [],
        context?.optimisticId ?? "",
        data?.payload?.data
      );
    },
    onSettled: (_data, _error, variables) => {
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
