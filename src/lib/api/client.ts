import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import config from '@/config';
import { tokenManager } from '@/lib/auth/token-manager';

/**
 * Base API Client
 * Centralized HTTP client with interceptors for authentication, error handling, and logging
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const authHeader = tokenManager.getAuthHeader();
        if (authHeader) {
          config.headers.Authorization = authHeader;
        }

        // Add CORS headers
        config.headers['Access-Control-Allow-Origin'] = '*';
        config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        config.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            data: response.data,
          });
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh token
            await this.refreshToken();
            // Update authorization header with new token
            const authHeader = tokenManager.getAuthHeader();
            if (authHeader) {
              originalRequest.headers.Authorization = authHeader;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Redirect to login if refresh fails
            this.clearAuth();
            if (typeof window !== 'undefined') {
              window.location.href = '/signin';
            }
            return Promise.reject(refreshError);
          }
        }

        // Handle network errors
        if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
          console.error('🌐 Network Error: Backend server is not available');
        }

        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            data: error.response?.data,
          });
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshToken(): Promise<void> {
    const refreshToken = tokenManager.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.client.post(config.endpoints.auth.refresh, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;
    
    // Update tokens
    if (newRefreshToken) {
      // If new refresh token is provided, update both
      tokenManager.setTokens(accessToken, newRefreshToken, expiresIn);
    } else {
      // Otherwise, just update access token
      tokenManager.updateAccessToken(accessToken, expiresIn);
    }
  }

  /**
   * Clear authentication data
   */
  clearAuth(): void {
    tokenManager.clearTokens();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenManager.hasValidTokens();
  }

  // HTTP methods with generic typing
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  /**
   * File upload method
   */
  async upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.round(progress));
        }
      },
    });

    return response.data;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;