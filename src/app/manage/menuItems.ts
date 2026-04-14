"use client";

import { Role } from "@/constants/type";
import {
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

export interface MenuItem {
  title: string;
  titleKey?: string;
  Icon: any;
  href: string;
  roles?: string[];
  requiredPermission?: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    url: string;
  };
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    titleKey: "dashboard",
    Icon: Home,
    href: "/manage/dashboard",
    roles: [Role.Admin],
  },
  {
    title: "Doanh thu",
    titleKey: "revenue",
    Icon: HandCoins,
    href: "/manage/revenue",
    roles: [Role.Admin, Role.SuperAdmin, Role.Instructor],
  },
  {
    title: "Payouts",
    titleKey: "payouts",
    Icon: WalletCards,
    href: "/manage/payouts",
    roles: [Role.Admin, Role.SuperAdmin, Role.Instructor],
  },
  {
    title: "Nhân viên",
    titleKey: "accounts",
    Icon: Users2,
    href: "/manage/accounts",
    roles: [Role.Admin],
    requiredPermission: {
      method: "GET",
      url: "/api/users",
    },
  },
  {
    title: "Vai trò",
    titleKey: "roles",
    Icon: UserRoundPen,
    href: "/manage/roles",
    roles: [Role.Admin],
    requiredPermission: {
      method: "GET",
      url: "/api/admin/roles",
    },
  },
  {
    title: "Bài viết",
    titleKey: "blogsAdmin",
    Icon: Newspaper,
    href: "/manage/blogs",
    roles: [Role.Admin],
    requiredPermission: {
      method: "GET",
      url: "/api/blogs",
    },
  },
  {
    title: "Quản lý file",
    titleKey: "filesAdmin",
    Icon: FolderOpen,
    href: "/manage/files",
    roles: [Role.Admin, Role.Instructor],
    requiredPermission: {
      method: "GET",
      url: "/api/files",
    },
  },
  {
    title: "Quyền hạn",
    titleKey: "permissions",
    href: "/manage/permissions",
    Icon: UserCog,
    roles: [Role.Admin],
    requiredPermission: {
      method: "GET",
      url: "/api/admin/permissions",
    },
  },
  {
    title: "Khóa học",
    titleKey: "manageCourses",
    href: "/manage/courses",
    Icon: School,
    roles: [Role.Admin, Role.Instructor],
    requiredPermission: {
      method: "GET",
      url: "/api/courses",
    },
  },
  {
    title: "Lộ trình học tập",
    titleKey: "learningPathsAdmin",
    href: "/manage/learning-paths",
    Icon: Route,
    roles: [Role.Admin, Role.Instructor],
    requiredPermission: {
      method: "GET",
      url: "/api/learning-paths",
    },
  },
];

export default menuItems;
