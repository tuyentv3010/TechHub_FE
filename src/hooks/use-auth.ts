import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, type LoginRequest, type RegisterRequest, type User } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

/**
 * Authentication Hooks
 * Custom hooks for authentication using TanStack Query
 */

// Error type for API responses
interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

// Query keys for better cache management
export const authQueryKeys = {
  profile: ['auth', 'profile'] as const,
  user: (id: string) => ['auth', 'user', id] as const,
};

/**
 * Login mutation hook
 */
export function useLogin() {
  const { setUser, setLoading } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (data) => {
      setUser(data.user);
      setLoading(false);
      
      // Cache user data
      queryClient.setQueryData(authQueryKeys.profile, data.user);
      
      toast.success('Đăng nhập thành công!');
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    },
    onError: (error: unknown) => {
      setLoading(false);
      const errorMessage = (error as ApiError)?.response?.data?.message || 'Đăng nhập thất bại';
      toast.error(errorMessage);
    },
  });
}

/**
 * Register mutation hook
 */
export function useRegister() {
  const { setUser, setLoading } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (data) => {
      setUser(data.user);
      setLoading(false);
      
      // Cache user data
      queryClient.setQueryData(authQueryKeys.profile, data.user);
      
      toast.success('Đăng ký thành công!');
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    },
    onError: (error: unknown) => {
      setLoading(false);
      const errorMessage = (error as ApiError)?.response?.data?.message || 'Đăng ký thất bại';
      toast.error(errorMessage);
    },
  });
}

/**
 * Logout mutation hook
 */
export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
      
      // Clear all cached data
      queryClient.clear();
      
      toast.success('Đăng xuất thành công!');
      
      // Redirect to home page
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    },
    onError: (error: unknown) => {
      // Still logout even if API call fails
      logout();
      queryClient.clear();
      
      const errorMessage = (error as ApiError)?.response?.data?.message || 'Có lỗi khi đăng xuất';
      toast.error(errorMessage);
    },
  });
}

/**
 * Get current user profile query hook
 */
export function useProfile() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: authQueryKeys.profile,
    queryFn: () => authService.getProfile(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: unknown) => {
      // Don't retry on 401 errors
      if ((error as ApiError)?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Update profile mutation hook
 */
export function useUpdateProfile() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: Partial<User>) => authService.updateProfile(userData),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      
      // Update cached data
      queryClient.setQueryData(authQueryKeys.profile, updatedUser);
      
      toast.success('Cập nhật thông tin thành công!');
    },
    onError: (error: unknown) => {
      const errorMessage = (error as ApiError)?.response?.data?.message || 'Cập nhật thông tin thất bại';
      toast.error(errorMessage);
    },
  });
}

/**
 * Check if user is authenticated (with loading state)
 */
export function useAuthStatus() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { data: profileData, isLoading: isProfileLoading } = useProfile();

  return {
    isAuthenticated,
    isLoading: isLoading || isProfileLoading,
    user: profileData || user,
  };
}