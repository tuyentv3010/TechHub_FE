import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import blogApiRequest from "@/apiRequests/blog";
import {
  CreateBlogBodyType,
  UpdateBlogBodyType,
} from "@/schemaValidations/blog.schema";
import type { BlogFilters } from "@/types/blog.types";

export const useGetBlogList = (page: number, pageSize: number) => {
  return useQuery({
    queryKey: ["blog-list", page, pageSize],
    queryFn: () => blogApiRequest.getBlogList(page, pageSize),
  });
};

export const useGetBlog = ({ id, enabled }: { id: string; enabled: boolean }) => {
  return useQuery({
    queryKey: ["blog", id],
    queryFn: () => blogApiRequest.getBlogById(id),
    enabled: enabled && !!id,
  });
};

// Public list with filters used on client Blog listing page
export const useBlogs = (filters: BlogFilters) => {
  return useQuery({
    queryKey: ["blogs", filters],
    queryFn: () => blogApiRequest.getBlogs(filters),
  });
};

// Public blog detail
export const useBlog = (id?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["blog-public", id],
    queryFn: () => blogApiRequest.getBlogById(id as string),
    enabled: enabled && !!id,
  });
};

// Tags
export const useBlogTags = () => {
  return useQuery({
    queryKey: ["blog-tags"],
    queryFn: () => blogApiRequest.getTags(),
  });
};

// Comments
export const useBlogComments = (blogId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["blog-comments", blogId],
    queryFn: () => blogApiRequest.getComments(blogId as string),
    enabled: enabled && !!blogId,
  });
};

export const useAddBlogCommentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      blogId,
      body,
    }: {
      blogId: string;
      body: { content: string; parentId?: string | null };
    }) => blogApiRequest.addComment(blogId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", variables.blogId] });
    },
  });
};

export const useCreateBlogMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBlogBodyType) => blogApiRequest.createBlog(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-list"] });
    },
  });
};

export const useUpdateBlogMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateBlogBodyType }) =>
      blogApiRequest.updateBlog(id, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blog-list"] });
      queryClient.invalidateQueries({ queryKey: ["blog", variables.id] });
    },
  });
};

export const useDeleteBlogMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => blogApiRequest.deleteBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-list"] });
    },
  });
};
