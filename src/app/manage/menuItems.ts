"use client";

import {
  Activity,
  BarChart3,
  Cpu,
  FolderOpen,
  HandCoins,
  Home,
  Newspaper,
  Route,
  School,
  UserCog,
  UserRoundPen,
  Users2,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface MenuItem {
  title: string;
  titleKey?: string;
  Icon: LucideIcon;
  href: string;
  requiredPermission: {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    url: string;
  };
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    titleKey: "dashboard",
    Icon: Home,
    href: "/manage/dashboard",
    requiredPermission: {
      method: "GET",
      url: "/manage/dashboard",
    },
  },
  {
    title: "AI Analytics",
    titleKey: "aiAnalytics",
    Icon: BarChart3,
    href: "/manage/ai-analytics",
    requiredPermission: {
      method: "GET",
      url: "/manage/ai-analytics",
    },
  },
  {
    title: "AI Traces",
    titleKey: "aiTraces",
    Icon: Activity,
    href: "/manage/ai-traces",
    requiredPermission: {
      method: "GET",
      url: "/manage/ai-traces",
    },
  },
  {
    title: "AI Providers",
    titleKey: "aiProviders",
    Icon: Cpu,
    href: "/manage/ai-providers",
    requiredPermission: {
      method: "GET",
      url: "/manage/ai-providers",
    },
  },
  {
    title: "Revenue",
    titleKey: "revenue",
    Icon: HandCoins,
    href: "/manage/revenue",
    requiredPermission: {
      method: "GET",
      url: "/manage/revenue",
    },
  },
  {
    title: "Payouts",
    titleKey: "payouts",
    Icon: WalletCards,
    href: "/manage/payouts",
    requiredPermission: {
      method: "GET",
      url: "/manage/payouts",
    },
  },
  {
    title: "Accounts",
    titleKey: "accounts",
    Icon: Users2,
    href: "/manage/accounts",
    requiredPermission: {
      method: "GET",
      url: "/manage/accounts",
    },
  },
  {
    title: "Instructor Applications",
    titleKey: "instructorApplications",
    Icon: Users2,
    href: "/manage/instructor-applications",
    requiredPermission: {
      method: "GET",
      url: "/manage/instructor-applications",
    },
  },
  {
    title: "Roles",
    titleKey: "roles",
    Icon: UserRoundPen,
    href: "/manage/roles",
    requiredPermission: {
      method: "GET",
      url: "/manage/roles",
    },
  },
  {
    title: "Blogs",
    titleKey: "blogsAdmin",
    Icon: Newspaper,
    href: "/manage/blogs",
    requiredPermission: {
      method: "GET",
      url: "/manage/blogs",
    },
  },
  {
    title: "Files",
    titleKey: "filesAdmin",
    Icon: FolderOpen,
    href: "/manage/files",
    requiredPermission: {
      method: "GET",
      url: "/manage/files",
    },
  },
  {
    title: "Permissions",
    titleKey: "permissions",
    href: "/manage/permissions",
    Icon: UserCog,
    requiredPermission: {
      method: "GET",
      url: "/manage/permissions",
    },
  },
  {
    title: "Courses",
    titleKey: "manageCourses",
    href: "/manage/courses",
    Icon: School,
    requiredPermission: {
      method: "GET",
      url: "/manage/courses",
    },
  },
  {
    title: "Learning Paths",
    titleKey: "learningPathsAdmin",
    href: "/manage/learning-paths",
    Icon: Route,
    requiredPermission: {
      method: "GET",
      url: "/manage/learning-paths",
    },
  },
];

export default menuItems;
