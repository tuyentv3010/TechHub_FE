import http from "@/lib/http";
import {
  BlogCommentBody,
  BlogCommentListResponse,
  BlogCommentResponse,
  BlogFilters,
  BlogListResponse,
  BlogMutationResponse,
  BlogResponse,
  BlogTagsResponse,
  CreateBlogBody,
  UpdateBlogBody,
} from "@/types/blog.types";

const buildBlogQueryString = (filters: BlogFilters = {}) => {
  const params = new URLSearchParams();

  if (typeof filters.page === "number" && filters.page > 0) {
    params.set("page", String(filters.page - 1));
  }

  if (typeof filters.size === "number" && filters.size > 0) {
    params.set("size", String(filters.size));
  }

  if (filters.keyword) {
    params.set("keyword", filters.keyword.trim());
  }

  if (filters.tags && filters.tags.length > 0) {
    filters.tags.forEach((tag) => {
      if (tag.trim()) {
        params.append("tags", tag.trim());
      }
    });
  }

  if (filters.includeDrafts) {
    params.set("includeDrafts", "true");
  }

  return params.toString();
};

const blogApiRequest = {
  getBlogs: (filters: BlogFilters = {}) => {
    const query = buildBlogQueryString(filters);
    const endpoint = query ? `/app/api/proxy/blogs?${query}` : "/app/api/proxy/blogs";
    return http.get<BlogListResponse>(endpoint);
  },

  getBlog: (blogId: string) => {
    return http.get<BlogResponse>(`/app/api/proxy/blogs/${blogId}`);
  },

  createBlog: (body: CreateBlogBody) => {
    return http.post<BlogResponse>("/app/api/proxy/blogs", body);
  },

  updateBlog: (blogId: string, body: UpdateBlogBody) => {
    return http.put<BlogResponse>(`/app/api/proxy/blogs/${blogId}`, body);
  },

  deleteBlog: (blogId: string) => {
    return http.delete<BlogMutationResponse>(`/app/api/proxy/blogs/${blogId}`);
  },

  getTags: () => http.get<BlogTagsResponse>("/app/api/proxy/blogs/tags"),

  getComments: (blogId: string) =>
    http.get<BlogCommentListResponse>(`/app/api/proxy/blogs/${blogId}/comments`),

  addComment: (blogId: string, body: BlogCommentBody) =>
    http.post<BlogCommentResponse>(
      `/app/api/proxy/blogs/${blogId}/comments`,
      body
    ),

  deleteComment: (blogId: string, commentId: string) =>
    http.delete<BlogMutationResponse>(
      `/app/api/proxy/blogs/${blogId}/comments/${commentId}`
    ),
};

export default blogApiRequest;
