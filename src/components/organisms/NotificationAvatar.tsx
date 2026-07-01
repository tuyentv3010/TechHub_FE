"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCourseThumbnail } from "@/queries/useCourse";
import { NotificationType } from "@/schemaValidations/notification.schema";

// Visual style (background + emoji fallback) per notification type.
// Uses theme tokens so it follows the color chosen in /setting.
export function getNotificationStyle(type: string) {
  switch (type) {
    case "ACCOUNT":
      return { bgColor: "bg-primary/10", textColor: "text-primary", icon: "👤" };
    case "BLOG":
      return {
        bgColor: "bg-emerald-500/10",
        textColor: "text-emerald-600 dark:text-emerald-400",
        icon: "📝",
      };
    case "PROGRESS":
      return { bgColor: "bg-primary/10", textColor: "text-primary", icon: "📊" };
    case "COMMENT":
      return {
        bgColor: "bg-amber-500/10",
        textColor: "text-amber-600 dark:text-amber-400",
        icon: "💬",
      };
    case "SYSTEM":
      return { bgColor: "bg-muted", textColor: "text-muted-foreground", icon: "⚙️" };
    default:
      return { bgColor: "bg-muted", textColor: "text-muted-foreground", icon: "🔔" };
  }
}

interface NotificationAvatarProps {
  notification: NotificationType;
  /** Diameter in px. Defaults to 44 (dropdown). Use 48+ for the full page. */
  size?: number;
  className?: string;
}

/**
 * Avatar for a notification row. When the notification relates to a course
 * (metadata.courseId), it shows the course thumbnail; otherwise it falls back
 * to a tinted circle with the type emoji. Image-load failures also fall back.
 */
export function NotificationAvatar({
  notification,
  size = 44,
  className,
}: NotificationAvatarProps) {
  const style = getNotificationStyle(notification.type);
  const courseId = notification.metadata?.courseId as string | undefined;
  const { thumbnailUrl } = useCourseThumbnail(courseId);
  const [imageFailed, setImageFailed] = useState(false);

  const showImage = !!thumbnailUrl && !imageFailed;

  return (
    <div
      className={cn(
        "relative flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-border/50",
        !showImage && "flex items-center justify-center",
        !showImage && style.bgColor,
        className
      )}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <Image
          src={thumbnailUrl}
          alt={notification.title}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
          unoptimized
        />
      ) : (
        <span style={{ fontSize: size * 0.42 }} aria-hidden>
          {style.icon}
        </span>
      )}
    </div>
  );
}

export default NotificationAvatar;
