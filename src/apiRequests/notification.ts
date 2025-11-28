import http from "@/lib/http";
import {
  NotificationListResType,
  NotificationResType,
} from "@/schemaValidations/notification.schema";

const notificationApiRequest = {
  // Get all notifications with pagination
  getNotifications: async (
    page: number = 0,
    size: number = 10,
    read?: boolean
  ) => {
    let url = `/app/api/proxy/notifications?page=${page}&size=${size}`;
    if (read !== undefined) {
      url += `&read=${read}`;
    }
    console.log("🔔 [NOTIFICATION API] getNotifications - URL:", url);
    try {
      const response = await http.get<NotificationListResType>(url);
      console.log("🔔 [NOTIFICATION API] getNotifications - Response:", response);
      return response;
    } catch (error) {
      console.error("🔔 [NOTIFICATION API] getNotifications - Error:", error);
      throw error;
    }
  },

  // Get unread notifications
  getUnreadNotifications: async (page: number = 0, size: number = 10) => {
    const url = `/app/api/proxy/notifications?page=${page}&size=${size}&read=false`;
    console.log("🔔 [NOTIFICATION API] getUnreadNotifications - URL:", url);
    try {
      const response = await http.get<NotificationListResType>(url);
      console.log("🔔 [NOTIFICATION API] getUnreadNotifications - Response:", response);
      return response;
    } catch (error) {
      console.error("🔔 [NOTIFICATION API] getUnreadNotifications - Error:", error);
      throw error;
    }
  },

  // Mark a single notification as read
  markAsRead: async (notificationId: string) => {
    const url = `/app/api/proxy/notifications/${notificationId}/read`;
    console.log("🔔 [NOTIFICATION API] markAsRead - URL:", url);
    try {
      const response = await http.put<NotificationResType>(url, {});
      console.log("🔔 [NOTIFICATION API] markAsRead - Response:", response);
      return response;
    } catch (error) {
      console.error("🔔 [NOTIFICATION API] markAsRead - Error:", error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const url = `/app/api/proxy/notifications/read`;
    console.log("🔔 [NOTIFICATION API] markAllAsRead - URL:", url);
    try {
      const response = await http.put<void>(url, {});
      console.log("🔔 [NOTIFICATION API] markAllAsRead - Response:", response);
      return response;
    } catch (error) {
      console.error("🔔 [NOTIFICATION API] markAllAsRead - Error:", error);
      throw error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    const url = `/app/api/proxy/notifications/count/unread`;
    console.log("🔔 [NOTIFICATION API] getUnreadCount - URL:", url);
    try {
      const response = await http.get<{ statusCode: number; message: string; data: number }>(url);
      console.log("🔔 [NOTIFICATION API] getUnreadCount - Response:", response);
      return response;
    } catch (error) {
      console.error("🔔 [NOTIFICATION API] getUnreadCount - Error:", error);
      throw error;
    }
  },
};

export default notificationApiRequest;
