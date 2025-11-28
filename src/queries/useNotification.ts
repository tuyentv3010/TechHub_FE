import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import notificationApiRequest from "@/apiRequests/notification";

// Query key constants
const NOTIFICATION_BASE_KEY = ["notifications"] as const;

export const NOTIFICATION_QUERY_KEYS = {
  all: NOTIFICATION_BASE_KEY,
  list: (page: number, size: number, read?: boolean) =>
    [...NOTIFICATION_BASE_KEY, "list", page, size, read] as const,
  unread: (page: number, size: number) =>
    [...NOTIFICATION_BASE_KEY, "unread", page, size] as const,
  unreadCount: [...NOTIFICATION_BASE_KEY, "unreadCount"] as const,
};

// Get notifications with pagination
export const useGetNotifications = (
  page: number = 0,
  size: number = 10,
  read?: boolean,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(page, size, read),
    queryFn: () => notificationApiRequest.getNotifications(page, size, read),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Get unread notifications
export const useGetUnreadNotifications = (
  page: number = 0,
  size: number = 10,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unread(page, size),
    queryFn: () => notificationApiRequest.getUnreadNotifications(page, size),
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
  });
};

// Get unread count
export const useGetUnreadCount = (enabled: boolean = true) => {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount,
    queryFn: async () => {
      const response = await notificationApiRequest.getUnreadCount();
      return response.payload.data;
    },
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

// Mark single notification as read
export const useMarkAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationApiRequest.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate all notification queries to refetch
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
    },
  });
};

// Mark all notifications as read
export const useMarkAllAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApiRequest.markAllAsRead(),
    onSuccess: () => {
      // Invalidate all notification queries to refetch
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
    },
  });
};
