import http from "@/lib/http";
import {
  NotificationListResType,
  NotificationResType,
} from "@/schemaValidations/notification.schema";

const notificationApiRequest = {
  // Get all notifications with pagination
  getNotifications: (
    page: number = 0,
    size: number = 10,
    read?: boolean
  ) => {
    let url = `/app/api/proxy/notifications?page=${page}&size=${size}`;
    if (read !== undefined) {
      url += `&read=${read}`;
    }
    return http.get<NotificationListResType>(url);
  },

  // Get unread notifications
  getUnreadNotifications: (page: number = 0, size: number = 10) => {
    return http.get<NotificationListResType>(
      `/app/api/proxy/notifications?page=${page}&size=${size}&read=false`
    );
  },

  // Mark a single notification as read
  markAsRead: (notificationId: string) => {
    return http.patch<NotificationResType>(
      `/app/api/proxy/notifications/${notificationId}/read`,
      {}
    );
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    return http.patch<void>(`/app/api/proxy/notifications/read`, {});
  },

  // Get unread count
  getUnreadCount: () => {
    return http.get<{ statusCode: number; message: string; data: number }>(
      `/app/api/proxy/notifications/count/unread`
    );
  },
};

export default notificationApiRequest;
