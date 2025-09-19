import apiClient from './client';
import config from '@/config';
import { ApiResponse, PaginatedResponse } from './auth.service';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  isPublished: boolean;
  tags: string[];
  authorId: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  courseId?: string;
  blogPostId?: string;
  parentId?: string;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogFilters {
  tags?: string[];
  author?: string;
  search?: string;
  isPublished?: boolean;
}

/**
 * Blog Service
 * Handles all blog and comment-related API calls
 */
export class BlogService {
  async getPosts(
    page = 1,
    limit = config.ui.itemsPerPage,
    filters?: BlogFilters
  ): Promise<PaginatedResponse<BlogPost>> {
    const params = {
      page,
      limit,
      ...filters,
    };

    const response = await apiClient.get<PaginatedResponse<BlogPost>>(
      config.endpoints.blog.posts,
      { params }
    );
    return response;
  }

  async getPost(id: string): Promise<BlogPost> {
    const response = await apiClient.get<ApiResponse<BlogPost>>(
      `${config.endpoints.blog.posts}/${id}`
    );
    return response.data;
  }

  async createPost(postData: Partial<BlogPost>): Promise<BlogPost> {
    const response = await apiClient.post<ApiResponse<BlogPost>>(
      config.endpoints.blog.posts,
      postData
    );
    return response.data;
  }

  async updatePost(id: string, postData: Partial<BlogPost>): Promise<BlogPost> {
    const response = await apiClient.put<ApiResponse<BlogPost>>(
      `${config.endpoints.blog.posts}/${id}`,
      postData
    );
    return response.data;
  }

  async deletePost(id: string): Promise<void> {
    await apiClient.delete(`${config.endpoints.blog.posts}/${id}`);
  }

  async getPostComments(postId: string, page = 1, limit = 20): Promise<PaginatedResponse<Comment>> {
    const response = await apiClient.get<PaginatedResponse<Comment>>(
      `${config.endpoints.blog.posts}/${postId}/comments`,
      { params: { page, limit } }
    );
    return response;
  }

  async addComment(postId: string, content: string, parentId?: string): Promise<Comment> {
    const response = await apiClient.post<ApiResponse<Comment>>(
      config.endpoints.blog.comments,
      { postId, content, parentId }
    );
    return response.data;
  }

  async updateComment(id: string, content: string): Promise<Comment> {
    const response = await apiClient.put<ApiResponse<Comment>>(
      `${config.endpoints.blog.comments}/${id}`,
      { content }
    );
    return response.data;
  }

  async deleteComment(id: string): Promise<void> {
    await apiClient.delete(`${config.endpoints.blog.comments}/${id}`);
  }

  async getFeaturedPosts(limit = 5): Promise<BlogPost[]> {
    const response = await apiClient.get<ApiResponse<BlogPost[]>>(
      `${config.endpoints.blog.posts}/featured`,
      { params: { limit } }
    );
    return response.data;
  }

  async getPopularTags(): Promise<string[]> {
    const response = await apiClient.get<ApiResponse<string[]>>(
      `${config.endpoints.blog.posts}/tags/popular`
    );
    return response.data;
  }

  async uploadPostImage(postId: string, file: File): Promise<{ imageUrl: string }> {
    const response = await apiClient.upload<ApiResponse<{ imageUrl: string }>>(
      `${config.endpoints.blog.posts}/${postId}/image`,
      file
    );
    return response.data;
  }
}