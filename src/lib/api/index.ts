/**
 * Main API Service
 * Centralized export of all API services for easy import and usage
 * 
 * 🔧 MOCK vs REAL API SWITCHING:
 * - Set NEXT_PUBLIC_USE_MOCK_API=false in .env.local to use real API
 * - Services will automatically switch between mock and real implementations
 */

import config from '@/config';
import { AuthService } from './auth.service';
import { CourseService } from './course.service';
import { BlogService } from './blog.service';

// Import mock services
import { 
  mockAuthService, 
  mockCourseService, 
  mockBlogService 
} from '@/lib/mock/services';

// Create service instances
const realAuthService = new AuthService();
const realCourseService = new CourseService();
const realBlogService = new BlogService();

// 🔧 Auto-switch between mock and real services based on config
export const authService = config.features.useMockApi ? mockAuthService : realAuthService;
export const courseService = config.features.useMockApi ? mockCourseService : realCourseService;
export const blogService = config.features.useMockApi ? mockBlogService : realBlogService;

// Log current mode for debugging
if (typeof window !== 'undefined') {
  console.log(`🔧 API Mode: ${config.features.useMockApi ? 'MOCK' : 'REAL'} - Services ready!`);
}

// Export services - these will be mock or real based on config
export {
  authService,
  courseService,
  blogService,
};

// Export types for convenience
export type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiResponse,
  PaginatedResponse,
} from './auth.service';

export type {
  Course,
  Chapter,
  Lesson,
  Exercise,
  Enrollment,
  CourseFilters,
} from './course.service';

export type {
  BlogPost,
  Comment,
  BlogFilters,
} from './blog.service';

// Export API client for direct usage if needed (only for real API)
export { default as apiClient } from './client';

/**
 * Usage examples:
 * 
 * // Authentication
 * import { authService } from '@/lib/api';
 * const user = await authService.login({ email: 'user@example.com', password: 'password' });
 * 
 * // Courses
 * import { courseService } from '@/lib/api';
 * const courses = await courseService.getCourses(1, 20, { category: 'programming' });
 * 
 * // Blog
 * import { blogService } from '@/lib/api';
 * const posts = await blogService.getPosts(1, 10, { tags: ['react', 'nextjs'] });
 * 
 * // Direct API client usage
 * import { apiClient } from '@/lib/api';
 * const customData = await apiClient.get('/custom-endpoint');
 */