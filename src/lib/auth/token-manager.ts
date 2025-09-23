/**
 * Token Management Service
 * Handles Bearer token and Refresh token storage and management
 */

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp
}

class TokenManager {
  private readonly ACCESS_TOKEN_KEY = 'techhub_access_token';
  private readonly REFRESH_TOKEN_KEY = 'techhub_refresh_token';
  private readonly EXPIRES_AT_KEY = 'techhub_token_expires_at';

  /**
   * Set cookie helper
   */
  private setCookie(name: string, value: string, expiresIn: number): void {
    if (typeof document === 'undefined') return;
    
    const expires = new Date(Date.now() + expiresIn * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; secure; samesite=strict`;
  }

  /**
   * Get cookie helper
   */
  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  /**
   * Delete cookie helper
   */
  private deleteCookie(name: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  /**
   * Store tokens in both localStorage and cookies
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number = 3600): void {
    if (typeof window === 'undefined') return;

    const expiresAt = Date.now() + expiresIn * 1000; // Convert seconds to milliseconds

    // Store in localStorage
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());

    // Store in cookies for middleware
    this.setCookie('auth-token', accessToken, expiresIn);
    this.setCookie('refresh-token', refreshToken, expiresIn);
  }

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Get token expiration timestamp
   */
  getTokenExpiration(): number | null {
    if (typeof window === 'undefined') return null;
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
    return expiresAt ? parseInt(expiresAt, 10) : null;
  }

  /**
   * Check if access token is expired or will expire soon (within 5 minutes)
   */
  isTokenExpired(): boolean {
    const expiresAt = this.getTokenExpiration();
    if (!expiresAt) return true;

    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000; // 5 minutes buffer
    return expiresAt <= fiveMinutesFromNow;
  }

  /**
   * Check if user has valid tokens
   */
  hasValidTokens(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    
    return !!(accessToken && refreshToken && !this.isTokenExpired());
  }

  /**
   * Clear all tokens from localStorage and cookies
   */
  clearTokens(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);

    // Clear cookies
    this.deleteCookie('auth-token');
    this.deleteCookie('refresh-token');
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader(): string | null {
    const token = this.getAccessToken();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Get all token data
   */
  getTokenData(): TokenData | null {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const expiresAt = this.getTokenExpiration();

    if (!accessToken || !refreshToken || !expiresAt) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  /**
   * Update only access token (for refresh token flow)
   */
  updateAccessToken(accessToken: string, expiresIn: number = 3600): void {
    if (typeof window === 'undefined') return;

    const expiresAt = Date.now() + expiresIn * 1000;
    
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());
    
    // Update cookie
    this.setCookie('auth-token', accessToken, expiresIn);
  }
}

// Create singleton instance
export const tokenManager = new TokenManager();

// Export types
export type { TokenData };