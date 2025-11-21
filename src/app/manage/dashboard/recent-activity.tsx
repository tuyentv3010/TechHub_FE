"use client";

import { FileText, BookOpen, UserPlus, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function RecentActivity() {
  // Hardcoded data for preview
  const activities = [
    {
      id: "1",
      type: "course" as const,
      title: "React Advanced Patterns được tạo",
      created: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 phút trước
      icon: BookOpen,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      id: "2",
      type: "user" as const,
      title: "Nguyễn Văn An đăng ký tài khoản",
      created: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 phút trước
      icon: UserPlus,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      id: "3",
      type: "blog" as const,
      title: "10 mẹo học lập trình hiệu quả cho người mới",
      created: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 giờ trước
      icon: FileText,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      id: "4",
      type: "course" as const,
      title: "Khóa học Node.js Backend được cập nhật",
      created: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 giờ trước
      icon: BookOpen,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      id: "5",
      type: "user" as const,
      title: "Trần Thị Mai đăng ký tài khoản",
      created: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 giờ trước
      icon: UserPlus,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      id: "6",
      type: "blog" as const,
      title: "Roadmap trở thành Full-stack Developer 2024",
      created: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 giờ trước
      icon: FileText,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      id: "7",
      type: "user" as const,
      title: "Lê Hoàng Nam đăng ký tài khoản",
      created: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(), // 10 giờ trước
      icon: UserPlus,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      id: "8",
      type: "course" as const,
      title: "Python for Data Science được xuất bản",
      created: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 giờ trước
      icon: BookOpen,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
  ];

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "blog":
        return "Bài viết mới";
      case "course":
        return "Khóa học mới";
      case "user":
        return "Người dùng mới";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = activity.icon;
        return (
          <div
            key={`${activity.type}-${activity.id}`}
            className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
          >
            <div className={`${activity.bgColor} p-2 rounded-lg flex-shrink-0`}>
              <Icon className={`h-4 w-4 ${activity.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">
                {getActivityLabel(activity.type)}
              </p>
              <p className="font-medium text-sm truncate">{activity.title}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(activity.created), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
