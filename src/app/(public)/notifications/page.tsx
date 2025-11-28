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
  Filter,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGetNotifications,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "@/queries/useNotification";
import { NotificationType } from "@/schemaValidations/notification.schema";
import { cn } from "@/lib/utils";

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

  const notifications = notificationsData?.payload?.data?.content || [];
  const totalPages = notificationsData?.payload?.data?.totalPages || 0;
  const totalElements = notificationsData?.payload?.data?.totalElements || 0;
  const isFirstPage = notificationsData?.payload?.data?.first ?? true;
  const isLastPage = notificationsData?.payload?.data?.last ?? true;

  // Mutations
  const markAsReadMutation = useMarkAsReadMutation();
  const markAllAsReadMutation = useMarkAllAsReadMutation();

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

  // Get notification style based on type
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "ACCOUNT":
        return {
          bgColor: "bg-blue-100 dark:bg-blue-900/30",
          textColor: "text-blue-600 dark:text-blue-400",
          icon: "👤",
          label: t("typeAccount") || "Account",
        };
      case "BLOG":
        return {
          bgColor: "bg-green-100 dark:bg-green-900/30",
          textColor: "text-green-600 dark:text-green-400",
          icon: "📝",
          label: t("typeBlog") || "Blog",
        };
      case "PROGRESS":
        return {
          bgColor: "bg-purple-100 dark:bg-purple-900/30",
          textColor: "text-purple-600 dark:text-purple-400",
          icon: "📊",
          label: t("typeProgress") || "Progress",
        };
      case "COMMENT":
        return {
          bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
          textColor: "text-yellow-600 dark:text-yellow-400",
          icon: "💬",
          label: t("typeComment") || "Comment",
        };
      case "SYSTEM":
        return {
          bgColor: "bg-gray-100 dark:bg-gray-800",
          textColor: "text-gray-600 dark:text-gray-400",
          icon: "⚙️",
          label: t("typeSystem") || "System",
        };
      default:
        return {
          bgColor: "bg-gray-100 dark:bg-gray-800",
          textColor: "text-gray-600 dark:text-gray-400",
          icon: "🔔",
          label: t("typeOther") || "Other",
        };
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

        {/* Mark all as read button */}
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
              {notifications.map((notification) => {
                const style = getNotificationStyle(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex gap-4 p-4 cursor-pointer transition-colors hover:bg-accent/50",
                      !notification.read && "bg-accent/30"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-xl",
                        style.bgColor
                      )}
                    >
                      {style.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {style.label}
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

                        {/* Mark as read button */}
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsReadMutation.mutate(notification.id);
                            }}
                            disabled={markAsReadMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
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
