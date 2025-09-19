/**
 * Mock Data for Development
 * This file contains hardcoded data for testing UI components
 * TODO: Replace with real API calls when backend is ready
 */

import type { User } from '@/lib/api/auth.service';
import type { Course } from '@/lib/api/course.service';
import type { BlogPost } from '@/lib/api/blog.service';

// Mock Users Data
export const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@demo.com',
    name: 'Admin User',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'instructor@demo.com',
    name: 'Nguyễn Văn Giảng',
    role: 'INSTRUCTOR',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    email: 'learner@demo.com',
    name: 'Trần Thị Học',
    role: 'LEARNER',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
];

// Mock Courses Data
export const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'Lập trình React Native toàn diện',
    description: 'Học xây dựng ứng dụng mobile đa nền tảng với React Native từ cơ bản đến nâng cao. Khóa học bao gồm Navigation, State Management, API Integration, và deployment.',
    price: 1500000,
    imageUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop',
    isPublished: true,
    categoryId: '1',
    instructorId: '2',
    instructor: {
      id: '2',
      name: 'Nguyễn Văn Giảng',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    category: {
      id: '1',
      name: 'Mobile Development',
    },
    enrollmentCount: 234,
    rating: 4.8,
    duration: 3600, // 60 hours
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Node.js và Express Framework',
    description: 'Xây dựng RESTful API và web server với Node.js, Express, MongoDB. Học cách tạo authentication, middleware, và deploy ứng dụng.',
    price: 1200000,
    imageUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=200&fit=crop',
    isPublished: true,
    categoryId: '2',
    instructorId: '2',
    instructor: {
      id: '2',
      name: 'Nguyễn Văn Giảng',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    category: {
      id: '2',
      name: 'Backend Development',
    },
    enrollmentCount: 189,
    rating: 4.6,
    duration: 2700, // 45 hours
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    title: 'UI/UX Design với Figma',
    description: 'Thiết kế giao diện người dùng chuyên nghiệp với Figma. Học về UX research, wireframing, prototyping, và design system.',
    price: 800000,
    imageUrl: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&h=200&fit=crop',
    isPublished: true,
    categoryId: '3',
    instructorId: '2',
    instructor: {
      id: '2',
      name: 'Nguyễn Văn Giảng',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    category: {
      id: '3',
      name: 'Design',
    },
    enrollmentCount: 156,
    rating: 4.9,
    duration: 1800, // 30 hours
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: '4',
    title: 'DevOps với Docker và Kubernetes',
    description: 'Triển khai và quản lý ứng dụng với Docker containers và Kubernetes orchestration. Học CI/CD, monitoring, và best practices.',
    price: 2000000,
    imageUrl: 'https://images.unsplash.com/photo-1605379399642-870262d3d051?w=400&h=200&fit=crop',
    isPublished: true,
    categoryId: '4',
    instructorId: '2',
    instructor: {
      id: '2',
      name: 'Nguyễn Văn Giảng',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    category: {
      id: '4',
      name: 'DevOps',
    },
    enrollmentCount: 78,
    rating: 4.7,
    duration: 4500, // 75 hours
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  }
];

// Mock Blog Posts Data
export const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Xu hướng lập trình 2025: Những công nghệ bạn nên học',
    content: 'Bài viết tổng hợp những xu hướng công nghệ mới nhất...',
    excerpt: 'Khám phá những công nghệ hot nhất năm 2025 và lộ trình học tập hiệu quả.',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=300&fit=crop',
    isPublished: true,
    tags: ['programming', 'trends', '2025'],
    authorId: '2',
    author: {
      id: '2',
      name: 'Nguyễn Văn Giảng',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    commentsCount: 24,
    viewsCount: 1580,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Cách tối ưu hóa performance React Native app',
    content: 'Hướng dẫn chi tiết các kỹ thuật tối ưu hóa hiệu suất...',
    excerpt: '10 tips quan trọng để tăng tốc ứng dụng React Native của bạn.',
    imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&h=300&fit=crop',
    isPublished: true,
    tags: ['react-native', 'performance', 'optimization'],
    authorId: '2',
    author: {
      id: '2',
      name: 'Nguyễn Văn Giảng',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    },
    commentsCount: 18,
    viewsCount: 892,
    createdAt: '2024-03-05T00:00:00Z',
    updatedAt: '2024-03-05T00:00:00Z',
  }
];

// Default passwords for demo accounts
export const DEMO_PASSWORDS = {
  'admin@demo.com': '123456',
  'instructor@demo.com': '123456',
  'learner@demo.com': '123456'
};

// Mock Auth Tokens
export const MOCK_TOKENS = {
  accessToken: 'mock_access_token_' + Date.now(),
  refreshToken: 'mock_refresh_token_' + Date.now(),
  expiresIn: 3600, // 1 hour
};

// Categories
export const MOCK_CATEGORIES = [
  { id: '1', name: 'Mobile Development' },
  { id: '2', name: 'Backend Development' },
  { id: '3', name: 'Design' },
  { id: '4', name: 'DevOps' },
  { id: '5', name: 'Data Science' },
  { id: '6', name: 'Machine Learning' },
];