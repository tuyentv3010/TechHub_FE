"use client";

import { useState } from "react";
import { Bell, CheckCheck, ExternalLink, Trash2 } from "lucide-react";
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
  useDeleteAllNotificationsMutation,
} from "@/queries/useNotification";
import { NotificationType } from "@/schemaValidations/notification.schema";
import { cn } from "@/lib/utils";
import { NotificationAvatar } from "@/components/organisms/NotificationAvatar";

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

  const notifications: NotificationType[] = notificationsData?.payload?.data || [];
  const totalUnread = notificationsData?.payload?.pagination?.totalElements || unreadCount;

  // Mutations
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();
  const deleteAllNotificationsMutation = useDeleteAllNotificationsMutation();

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

  // Handle delete all (with confirmation)
  const handleDeleteAll = () => {
    const ok = window.confirm(
      t("deleteAllConfirmDesc") ||
        "This will remove all your notifications. You can't undo this."
    );
    if (ok) {
      deleteAllNotificationsMutation.mutate();
    }
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
          className={cn("app-control app-control-icon relative", className)}
          aria-label={t("notifications") || "Notifications"}
        >
          <Bell className="h-5 w-5" />
          {!isLoadingCount && totalUnread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center px-1 text-xs"
            >
              {totalUnread > 99 ? "99+" : totalUnread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="app-control-menu w-[calc(100vw-2rem)] max-w-80 sm:w-80"
        align="end"
        sideOffset={8}
        collisionPadding={16}
        forceMount
      >
        {/* Header */}
        <DropdownMenuLabel className="flex items-center justify-between gap-1">
          <span className="font-semibold">
            {t("notifications") || "Notifications"}
          </span>
          <div className="flex items-center gap-0.5">
            {totalUnread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                {t("markAllRead") || "Mark all read"}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                title={t("deleteAll") || "Delete all"}
                onClick={handleDeleteAll}
                disabled={deleteAllNotificationsMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Notifications List */}
        <ScrollArea className="h-[300px]">
          {isLoadingNotifications ? (
            // Loading skeleton
            <div className="p-2 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-2.5">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <div className="flex-1 space-y-2 pt-0.5">
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
            <div className="p-1.5 space-y-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "group flex items-start gap-3 rounded-xl p-2.5 cursor-pointer transition-colors",
                    "focus:bg-accent data-[highlighted]:bg-accent",
                    !notification.read && "bg-primary/[0.06]"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Avatar: course thumbnail or type icon */}
                  <NotificationAvatar notification={notification} size={44} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm line-clamp-1",
                        notification.read ? "font-medium" : "font-semibold"
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.read && (
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              ))}
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
                className="h-9 w-full justify-center rounded-lg text-sm"
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
