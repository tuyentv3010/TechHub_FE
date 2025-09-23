import apiClient from './client';
import config from '@/config';
import { tokenManager } from '@/lib/auth/token-manager';

// Type definitions for API responses
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'LEARNER' | 'INSTRUCTOR';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      config.endpoints.auth.login,
      credentials
    );
    
    // Store tokens using token manager
    tokenManager.setTokens(
      response.data.accessToken,
      response.data.refreshToken,
      response.data.expiresIn
    );
    
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      config.endpoints.auth.register,
      userData
    );
    
    // Store tokens using token manager
    tokenManager.setTokens(
      response.data.accessToken,
      response.data.refreshToken,
      response.data.expiresIn
    );
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(config.endpoints.auth.logout);
    } finally {
      // Clear tokens regardless of API response
      tokenManager.clearTokens();
    }
  }

  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      config.endpoints.auth.profile
    );
    return response.data;
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      config.endpoints.auth.profile,
      userData
    );
    return response.data;
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return tokenManager.hasValidTokens();
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return tokenManager.getAccessToken();
  }

  /**
   * Manually refresh tokens
   */
  async refreshTokens(): Promise<void> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<ApiResponse<{
      accessToken: string;
      refreshToken?: string;
      expiresIn: number;
    }>>(config.endpoints.auth.refresh, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;

    if (newRefreshToken) {
      tokenManager.setTokens(accessToken, newRefreshToken, expiresIn);
    } else {
      tokenManager.updateAccessToken(accessToken, expiresIn);
    }
  }
}