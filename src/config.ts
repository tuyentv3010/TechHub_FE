/**
 * Application Configuration
 * Centralized configuration management for the TechHub frontend application
 */

const config = {
  // App Information
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'TechHub',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    description: 'Programming Knowledge Sharing and Learning Platform',
  },

  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
    retries: 3,
    retryDelay: 1000,
  },

  // Authentication
  auth: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    refreshTokenThreshold: 5 * 60 * 1000, // 5 minutes before expiry
  },

  // Feature Flags
  features: {
    chatbot: process.env.NEXT_PUBLIC_ENABLE_CHATBOT === 'true',
    payments: process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true',
    analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    // 🔧 MOCK API TOGGLE - Set to false when real API is ready
    useMockApi: process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false', // Default to true for development
  },

  // UI Configuration
  ui: {
    itemsPerPage: 20,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    supportedVideoTypes: ['video/mp4', 'video/webm'],
  },

  // API Endpoints
  endpoints: {
    // Authentication
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      profile: '/auth/profile',
    },
    
    // User Management
    users: {
      base: '/users',
      profile: '/users/profile',
      avatar: '/users/avatar',
    },

    // Course Management
    courses: {
      base: '/courses',
      popular: '/courses/popular',
      categories: '/courses/categories',
      enroll: '/courses/enroll',
      progress: '/courses/progress',
    },

    // Content Management
    content: {
      chapters: '/chapters',
      lessons: '/lessons',
      exercises: '/exercises',
      submissions: '/exercises/submissions',
    },

    // Blog & Community
    blog: {
      posts: '/blog/posts',
      comments: '/blog/comments',
    },

    // Learning Paths
    learningPaths: {
      base: '/learning-paths',
      enroll: '/learning-paths/enroll',
      progress: '/learning-paths/progress',
    },

    // Payments
    payments: {
      checkout: '/payments/checkout',
      history: '/payments/history',
      verify: '/payments/verify',
    },

    // Chatbot
    chatbot: {
      chat: '/chatbot/chat',
      history: '/chatbot/history',
    },

    // Notifications
    notifications: {
      base: '/notifications',
      markRead: '/notifications/mark-read',
    },

    // Analytics
    analytics: {
      events: '/analytics/events',
      progress: '/analytics/progress',
    },
  },
} as const;

export default config;

// Type definitions for better TypeScript support
export type Config = typeof config;
export type ApiEndpoints = typeof config.endpoints;