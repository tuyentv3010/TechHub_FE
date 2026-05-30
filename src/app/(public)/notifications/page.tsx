"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { formatDistanceToNow, format } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useGetNotifications,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
} from "@/queries/useNotification";
import { NotificationType } from "@/schemaValidations/notification.schema";
import { cn } from "@/lib/utils";
import { NotificationAvatar } from "@/components/organisms/NotificationAvatar";

export default function NotificationsPage() {
  const t = useTranslations("Notification");
  const locale = useLocale();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const pageSize = 10;

  // Determine read filter
  const readFilter = filter === "all" ? undefined : filter === "read";

  // Fetch notifications
  const { data: notificationsData, isLoading, isFetching } = useGetNotifications(
    currentPage,
    pageSize,
    readFilter
  );

  const notifications = notificationsData?.payload?.data || [];
  const totalPages = notificationsData?.payload?.pagination?.totalPages || 0;
  const totalElements = notificationsData?.payload?.pagination?.totalElements || 0;
  const isFirstPage = notificationsData?.payload?.pagination?.first ?? true;
  const isLastPage = notificationsData?.payload?.pagination?.last ?? true;

  // Mutations
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();
  const deleteNotificationMutation = useDeleteNotificationMutation();
  const deleteAllNotificationsMutation = useDeleteAllNotificationsMutation();

  // Format time
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

  const formatFullDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPpp", {
        locale: locale === "vi" ? vi : enUS,
      });
    } catch {
      return dateString;
    }
  };

  // Human-readable label per notification type (color/icon come from the
  // shared getNotificationStyle so they stay consistent with the dropdown).
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "ACCOUNT":
        return t("typeAccount") || "Account";
      case "BLOG":
        return t("typeBlog") || "Blog";
      case "PROGRESS":
        return t("typeProgress") || "Progress";
      case "COMMENT":
        return t("typeComment") || "Comment";
      case "SYSTEM":
        return t("typeSystem") || "System";
      default:
        return t("typeOther") || "Other";
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: NotificationType) => {
    // Mark as read if unread
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
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Handle soft-delete a notification (does not navigate)
  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(notificationId);
  };

  // Handle pagination
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            {t("title") || "Notifications"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("subtitle") || "Stay updated with your latest activities"}
          </p>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending || notifications.length === 0}
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-2" />
            )}
            {t("markAllRead") || "Mark all as read"}
          </Button>

          {/* Delete all (with confirmation) */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={
                  deleteAllNotificationsMutation.isPending ||
                  notifications.length === 0
                }
              >
                {deleteAllNotificationsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {t("deleteAll") || "Delete all"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("deleteAllConfirmTitle") || "Delete all notifications?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteAllConfirmDesc") ||
                    "This will remove all your notifications. You can't undo this."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("cancel") || "Cancel"}
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteAllNotificationsMutation.mutate()}
                >
                  {t("deleteAll") || "Delete all"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs
        value={filter}
        onValueChange={(value) => {
          setFilter(value as "all" | "unread" | "read");
          setCurrentPage(0);
        }}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all">{t("filterAll") || "All"}</TabsTrigger>
          <TabsTrigger value="unread">{t("filterUnread") || "Unread"}</TabsTrigger>
          <TabsTrigger value="read">{t("filterRead") || "Read"}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Total count */}
      <p className="text-sm text-muted-foreground mb-4">
        {t("totalNotifications", { count: totalElements }) ||
          `${totalElements} notifications`}
      </p>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            // Loading skeleton
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 p-4">
                  <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t("noNotifications") || "No notifications"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t("noNotificationsDesc") ||
                  "You're all caught up! Check back later for new notifications."}
              </p>
            </div>
          ) : (
            // Notifications list
            <div className="divide-y">
              {notifications.map((notification: NotificationType) => {
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "relative flex gap-4 p-4 cursor-pointer transition-colors hover:bg-accent/50",
                      !notification.read && "bg-primary/[0.05]"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Unread accent bar */}
                    {!notification.read && (
                      <span className="absolute left-0 top-0 h-full w-1 bg-primary" />
                    )}

                    {/* Avatar: course thumbnail or type icon */}
                    <NotificationAvatar notification={notification} size={52} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {getTypeLabel(notification.type)}
                            </Badge>
                            {!notification.read && (
                              <Badge variant="default" className="text-xs">
                                {t("new") || "New"}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-sm">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>

                        {/* Row actions: mark as read + delete */}
                        <div className="flex flex-shrink-0 items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title={t("markRead") || "Mark as read"}
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsReadMutation.mutate(notification.id);
                              }}
                              disabled={markAsReadMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            title={t("delete") || "Delete"}
                            onClick={(e) => handleDelete(e, notification.id)}
                            disabled={
                              deleteNotificationMutation.isPending &&
                              deleteNotificationMutation.variables ===
                                notification.id
                            }
                          >
                            {deleteNotificationMutation.isPending &&
                            deleteNotificationMutation.variables ===
                              notification.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Time */}
                      <p
                        className="text-xs text-muted-foreground mt-2"
                        title={formatFullDate(notification.createdAt)}
                      >
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={isFirstPage || isFetching}
          >
            <ChevronLeft className="h-4 w-4" />
            {t("previous") || "Previous"}
          </Button>

          <span className="text-sm text-muted-foreground px-4">
            {t("pageInfo", { current: currentPage + 1, total: totalPages }) ||
              `Page ${currentPage + 1} of ${totalPages}`}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={isLastPage || isFetching}
          >
            {t("next") || "Next"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
