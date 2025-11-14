import http from "@/lib/http";
import {
  BlogResponseType,
  BlogListResponseType,
  BlogTagsResponseType,
  BlogCommentListResponseType,
  BlogCommentResponseType,
  BlogCommentBodyType,
  CreateBlogBodyType,
  UpdateBlogBodyType,
} from "@/schemaValidations/blog.schema";
import type { BlogFilters } from "@/types/blog.types";

const blogApiRequest = {
  // Admin or simple list (kept for compatibility)
  getBlogList: (page: number = 1, size: number = 10) =>
    http.get<BlogListResponseType>(
      `/app/api/proxy/blogs?page=${page - 1}&size=${size}`
    ),

  // Public list with filters
  getBlogs: (filters: BlogFilters) => {
    const page = (filters.page ?? 1) - 1;
    const size = filters.size ?? 10;
    let url = `/app/api/proxy/blogs?page=${page}&size=${size}`;
    if (filters.keyword) {
      url += `&keyword=${encodeURIComponent(filters.keyword)}`;
    }
    if (filters.includeDrafts !== undefined) {
      url += `&includeDrafts=${filters.includeDrafts}`;
    }
    if (filters.tags && filters.tags.length > 0) {
      for (const tag of filters.tags) {
        url += `&tags=${encodeURIComponent(tag)}`;
      }
    }
    return http.get<BlogListResponseType>(url);
  },

  // Get single blog by id
  getBlogById: (id: string) =>
    http.get<BlogResponseType>(`/app/api/proxy/blogs/${id}`),

  // Create new blog
  createBlog: (body: CreateBlogBodyType) =>
    http.post<BlogResponseType>(`/app/api/proxy/blogs`, body),

  // Update blog
  updateBlog: (id: string, body: UpdateBlogBodyType) =>
    http.put<BlogResponseType>(`/app/api/proxy/blogs/${id}`, body),

  // Delete blog
  deleteBlog: (id: string) =>
    http.delete<{ success: boolean; message: string }>(`/app/api/proxy/blogs/${id}`),

  // Comments (optional helper endpoints)
  getComments: (blogId: string) =>
    http.get<BlogCommentListResponseType>(`/app/api/proxy/blogs/${blogId}/comments`),
  addComment: (blogId: string, payload: BlogCommentBodyType) =>
    http.post<BlogCommentResponseType>(`/app/api/proxy/blogs/${blogId}/comments`, payload),
  deleteComment: (blogId: string, commentId: string) =>
    http.delete<{ success: boolean; message: string }>(
      `/app/api/proxy/blogs/${blogId}/comments/${commentId}`
    ),

  // Tags
  getTags: () => http.get<BlogTagsResponseType>(`/app/api/proxy/blogs/tags`),
};

export default blogApiRequest;
