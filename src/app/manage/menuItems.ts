"use client";
import { Role } from "@/constants/type";
import {
  Home,
  Newspaper,
  UserCog,
  UserRoundPen,
  Users2,
  FolderOpen,
  School,
  Route
} from "lucide-react";

export interface MenuItem {
  title: string;
  Icon: any;
  href: string;
  roles?: string[];
  // Permission required to view this menu (method and URL for permission check)
  requiredPermission?: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    url: string;
  };
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    Icon: Home,
    href: "/manage/dashboard",
    roles: [Role.Admin], // Chỉ ADMIN
  },
  {
    title: "Nhân viên",
    Icon: Users2,
    href: "/manage/accounts",
    roles: [Role.Admin], // Chỉ ADMIN
    requiredPermission: {
      method: "GET",
      url: "/api/users",
    },
  },
  {
    title: "Vai trò",
    Icon: UserRoundPen,
    href: "/manage/roles",
    roles: [Role.Admin], // Chỉ ADMIN
    requiredPermission: {
      method: "GET",
      url: "/api/admin/roles",
    },
  },
  {
    title: "Bài viết",
    Icon: Newspaper,
    href: "/manage/blogs",
    roles: [Role.Admin], // Chỉ ADMIN
    requiredPermission: {
      method: "GET",
      url: "/api/blogs",
    },
  },
  {
    title: "Quản lý File",
    Icon: FolderOpen,
    href: "/manage/files",
    roles: [Role.Admin, Role.Instructor], // ADMIN và INSTRUCTOR
    requiredPermission: {
      method: "GET",
      url: "/api/files",
    },
  },
  {
    title: "Quyền hạn",
    href: "/manage/permissions",
    Icon: UserCog,
    roles: [Role.Admin], // Chỉ ADMIN
    requiredPermission: {
      method: "GET",
      url: "/api/admin/permissions",
    },
  },
  {
    title: "Khóa Học",
    href: "/manage/courses",
    Icon: School,
    roles: [Role.Admin, Role.Instructor], // ADMIN và INSTRUCTOR
    requiredPermission: {
      method: "GET",
      url: "/api/courses",
    },
  },
  {
    title: "Lộ trình Học tập",
    href: "/manage/learning-paths",
    Icon: Route,
    roles: [Role.Admin, Role.Instructor], // ADMIN và INSTRUCTOR
    requiredPermission: {
      method: "GET",
      url: "/api/learning-paths",
    },
  },
];

export default menuItems;
