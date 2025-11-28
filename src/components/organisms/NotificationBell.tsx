"use client";

import { useState } from "react";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetUnreadNotifications,
  useGetUnreadCount,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "@/queries/useNotification";
import { NotificationType } from "@/schemaValidations/notification.schema";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const t = useTranslations("Notification");
  const locale = useLocale();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unread count
  const { data: unreadCount = 0, isLoading: isLoadingCount } = useGetUnreadCount();

  // Fetch unread notifications (limit to 5 for dropdown)
  const { data: notificationsData, isLoading: isLoadingNotifications } =
    useGetUnreadNotifications(0, 5, isOpen);

  const notifications: NotificationType[] = notificationsData?.payload?.data?.content || [];
  const totalUnread = notificationsData?.payload?.data?.totalElements || unreadCount;
  console.log("sadasdasdasdasda" , notificationsData);
  // Debug logs
  console.log("🔔 [NotificationBell] isOpen:", isOpen);
  console.log("🔔 [NotificationBell] unreadCount:", unreadCount, "isLoadingCount:", isLoadingCount);
  console.log("🔔 [NotificationBell] notificationsData:", notificationsData);
  console.log("🔔 [NotificationBell] notifications:", notifications);
  console.log("🔔 [NotificationBell] totalUnread:", totalUnread);

  // Mutations
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: locale === "vi" ? vi : enUS,
      });
    } catch {
      return dateString;
    }
  };

  // Get notification icon/color based on type
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "ACCOUNT":
        return {
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          textColor: "text-blue-600 dark:text-blue-400",
          icon: "👤",
        };
      case "BLOG":
        return {
          bgColor: "bg-green-100 dark:bg-green-900/30",
          textColor: "text-green-600 dark:text-green-400",
          icon: "📝",
        };
      case "PROGRESS":
        return {
          bgColor: "bg-purple-100 dark:bg-purple-900/30",
          textColor: "text-purple-600 dark:text-purple-400",
          icon: "📊",
        };
      case "COMMENT":
        return {
          bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
          textColor: "text-yellow-600 dark:text-yellow-400",
          icon: "💬",
        };
      case "SYSTEM":
        return {
          bgColor: "bg-gray-100 dark:bg-gray-800",
          textColor: "text-gray-600 dark:text-gray-400",
          icon: "⚙️",
        };
      default:
        return {
          bgColor: "bg-gray-100 dark:bg-gray-800",
          textColor: "text-gray-600 dark:text-gray-400",
          icon: "🔔",
        };
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: NotificationType) => {
    // Mark as read
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on metadata
    const metadata = notification.metadata;
    if (metadata) {
      if (metadata.blogId) {
        router.push(`/blog/${metadata.blogId}`);
      } else if (metadata.courseId) {
        router.push(`/courses/${metadata.courseId}`);
      }
    }

    setIsOpen(false);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Handle view all
  const handleViewAll = () => {
    router.push("/notifications");
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label={t("notifications") || "Notifications"}
        >
          <Bell className="h-5 w-5" />
          {!isLoadingCount && totalUnread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs flex items-center justify-center"
            >
              {totalUnread > 99 ? "99+" : totalUnread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80" align="end" forceMount>
        {/* Header */}
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">
            {t("notifications") || "Notifications"}
          </span>
          {totalUnread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              {t("markAllRead") || "Mark all read"}
            </Button>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Notifications List */}
        <ScrollArea className="h-[300px]">
          {isLoadingNotifications ? (
            // Loading skeleton
            <div className="p-2 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {t("noNotifications") || "No new notifications"}
              </p>
            </div>
          ) : (
            // Notifications list
            <div className="p-1">
              {notifications.map((notification) => {
                const style = getNotificationStyle(notification.type);
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer rounded-lg mb-1",
                      !notification.read && "bg-accent/50"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-lg",
                        style.bgColor
                      )}
                    >
                      {style.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-sm"
                onClick={handleViewAll}
              >
                {t("viewAll") || "View all notifications"}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;
