import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import blogApiRequest from "@/apiRequests/blog";
import {
  BlogCommentBody,
  BlogCommentResponse,
  BlogFilters,
  BlogMutationResponse,
  BlogResponse,
  CreateBlogBody,
  UpdateBlogBody,
} from "@/types/blog.types";

const buildBlogListQueryKey = (filters: BlogFilters = {}) => [
  "blogs",
  filters.page ?? 1,
  filters.size ?? 10,
  filters.keyword ?? "",
  filters.includeDrafts ?? false,
  (filters.tags ?? []).slice().sort().join("|"),
];

export const useBlogs = (filters: BlogFilters = {}) => {
  return useQuery({
    queryKey: buildBlogListQueryKey(filters),
    queryFn: () => blogApiRequest.getBlogs(filters),
    keepPreviousData: true,
  });
};

export const useBlog = (blogId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["blog", blogId],
    queryFn: () => blogApiRequest.getBlog(blogId as string),
    enabled: enabled && Boolean(blogId),
  });
};

export const useBlogTags = () => {
  return useQuery({
    queryKey: ["blog-tags"],
    queryFn: () => blogApiRequest.getTags(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useBlogComments = (blogId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["blog-comments", blogId],
    queryFn: () => blogApiRequest.getComments(blogId as string),
    enabled: enabled && Boolean(blogId),
  });
};

export const useCreateBlogMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<BlogResponse, unknown, CreateBlogBody>({
    mutationFn: (body) => blogApiRequest.createBlog(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
    },
  });
};

export const useUpdateBlogMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BlogResponse,
    unknown,
    { blogId: string; body: UpdateBlogBody }
  >({
    mutationFn: ({ blogId, body }) =>
      blogApiRequest.updateBlog(blogId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blog", variables.blogId] });
      queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
    },
  });
};

export const useDeleteBlogMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<BlogMutationResponse, unknown, string>({
    mutationFn: (blogId) => blogApiRequest.deleteBlog(blogId),
    onSuccess: (_, blogId) => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["blog-tags"] });
      queryClient.removeQueries({ queryKey: ["blog", blogId] });
      queryClient.removeQueries({ queryKey: ["blog-comments", blogId] });
    },
  });
};

export const useAddBlogCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BlogCommentResponse,
    unknown,
    { blogId: string; body: BlogCommentBody }
  >({
    mutationFn: ({ blogId, body }) => blogApiRequest.addComment(blogId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["blog-comments", variables.blogId],
      });
    },
  });
};

export const useDeleteBlogCommentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BlogMutationResponse,
    unknown,
    { blogId: string; commentId: string }
  >({
    mutationFn: ({ blogId, commentId }) =>
      blogApiRequest.deleteComment(blogId, commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["blog-comments", variables.blogId],
      });
    },
  });
};
