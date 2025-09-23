/**
 * Mock Service Implementation
 * This file implements all API services with mock data
 * 
 * 🔧 TO INTEGRATE WITH REAL API:
 * 1. Update config.ts with real API endpoints
 * 2. Set NEXT_PUBLIC_USE_MOCK_API=false in .env.local
 * 3. All hooks will automatically use real API calls
 */

import type { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  ApiResponse,
  PaginatedResponse 
} from '@/lib/api/auth.service';
import type { Course, CourseFilters } from '@/lib/api/course.service';
import type { BlogPost, BlogFilters } from '@/lib/api/blog.service';
import { 
  MOCK_USERS, 
  MOCK_COURSES, 
  MOCK_BLOG_POSTS, 
  DEMO_PASSWORDS, 
  MOCK_TOKENS,
  MOCK_CATEGORIES
} from './data';

// Simulate network delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock localStorage for server-side compatibility
const mockStorage = {
  getItem: (key: string) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

/**
 * Mock Authentication Service
 */
export class MockAuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    await delay();
    
    // Check demo credentials
    const { email, password } = credentials;
    const user = MOCK_USERS.find(u => u.email === email);
    
    if (!user || DEMO_PASSWORDS[email as keyof typeof DEMO_PASSWORDS] !== password) {
      throw new Error('Invalid credentials');
    }
    
    // Store current user in mock storage
    mockStorage.setItem('mock_current_user', JSON.stringify(user));
    
    return {
      user,
      accessToken: MOCK_TOKENS.accessToken,
      refreshToken: MOCK_TOKENS.refreshToken,
      expiresIn: MOCK_TOKENS.expiresIn,
    };
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    await delay();
    
    // Check if email already exists
    const existingUser = MOCK_USERS.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }
    
    // Create new user
    const newUser: User = {
      id: String(MOCK_USERS.length + 1),
      email: userData.email,
      name: userData.name,
      role: userData.role || 'LEARNER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add to mock users (in memory)
    MOCK_USERS.push(newUser);
    
    // Store current user
    mockStorage.setItem('mock_current_user', JSON.stringify(newUser));
    
    return {
      user: newUser,
      accessToken: MOCK_TOKENS.accessToken,
      refreshToken: MOCK_TOKENS.refreshToken,
      expiresIn: MOCK_TOKENS.expiresIn,
    };
  }

  async logout(): Promise<void> {
    await delay(300);
    mockStorage.removeItem('mock_current_user');
  }

  async getProfile(): Promise<User> {
    await delay();
    
    const userStr = mockStorage.getItem('mock_current_user');
    if (!userStr) {
      throw new Error('No authenticated user');
    }
    
    return JSON.parse(userStr);
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    await delay();
    
    const userStr = mockStorage.getItem('mock_current_user');
    if (!userStr) {
      throw new Error('No authenticated user');
    }
    
    const currentUser = JSON.parse(userStr);
    const updatedUser = {
      ...currentUser,
      ...userData,
      updatedAt: new Date().toISOString(),
    };
    
    mockStorage.setItem('mock_current_user', JSON.stringify(updatedUser));
    return updatedUser;
  }

  isAuthenticated(): boolean {
    return !!mockStorage.getItem('mock_current_user');
  }
}

/**
 * Mock Course Service
 */
export class MockCourseService {
  async getCourses(
    page = 1, 
    limit = 20, 
    filters?: CourseFilters
  ): Promise<PaginatedResponse<Course>> {
    await delay();
    
    let filteredCourses = [...MOCK_COURSES];
    
    // Apply filters
    if (filters?.category) {
      filteredCourses = filteredCourses.filter(course => 
        course.category?.name.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }
    
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredCourses = filteredCourses.filter(course =>
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters?.priceRange) {
      const [min, max] = filters.priceRange;
      filteredCourses = filteredCourses.filter(course =>
        (course.price || 0) >= min && (course.price || 0) <= max
      );
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex);
    
    return {
      data: paginatedCourses,
      pagination: {
        page,
        limit,
        total: filteredCourses.length,
        totalPages: Math.ceil(filteredCourses.length / limit),
      },
    };
  }

  async getCourse(id: string): Promise<Course> {
    await delay();
    
    const course = MOCK_COURSES.find(c => c.id === id);
    if (!course) {
      throw new Error('Course not found');
    }
    
    return course;
  }

  async getEnrolledCourses(): Promise<Course[]> {
    await delay();
    
    // Return first 2 courses as "enrolled"
    return MOCK_COURSES.slice(0, 2);
  }

  async enrollCourse(courseId: string): Promise<void> {
    await delay();
    
    const course = MOCK_COURSES.find(c => c.id === courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Simulate enrollment
    console.log(`Enrolled in course: ${course.title}`);
  }
}

/**
 * Mock Blog Service  
 */
export class MockBlogService {
  async getPosts(
    page = 1,
    limit = 10,
    filters?: BlogFilters
  ): Promise<PaginatedResponse<BlogPost>> {
    await delay();
    
    let filteredPosts = [...MOCK_BLOG_POSTS];
    
    // Apply filters
    if (filters?.tags && filters.tags.length > 0) {
      filteredPosts = filteredPosts.filter(post =>
        post.tags.some(tag => filters.tags!.includes(tag))
      );
    }
    
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredPosts = filteredPosts.filter(post =>
        post.title.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm)
      );
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
    
    return {
      data: paginatedPosts,
      pagination: {
        page,
        limit,
        total: filteredPosts.length,
        totalPages: Math.ceil(filteredPosts.length / limit),
      },
    };
  }

  async getPost(id: string): Promise<BlogPost> {
    await delay();
    
    const post = MOCK_BLOG_POSTS.find(p => p.id === id);
    if (!post) {
      throw new Error('Post not found');
    }
    
    return post;
  }
}

// Export mock service instances
export const mockAuthService = new MockAuthService();
export const mockCourseService = new MockCourseService();
export const mockBlogService = new MockBlogService();