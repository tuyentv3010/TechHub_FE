"use client";
import { Role } from "@/constants/type";
import {
  Home,
  Newspaper,
  UserCog,
  UserRoundPen,
  Users2,
  FolderOpen,
  School
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    Icon: Home,
    href: "/manage/dashboard",
    roles: [Role.Admin, Role.Staff],
  },
  {
    title: "Nhân viên",
    Icon: Users2,
    href: "/manage/accounts",
  },
  {
    title: "Vai trò",
    Icon: UserRoundPen,
    href: "/manage/roles",
  },
  {
    title: "Bài viết",
    Icon: Newspaper,
    href: "/manage/blogs",
    roles: [Role.Admin, Role.Staff],
  },
  {
    title: "Quản lý File",
    Icon: FolderOpen,
    href: "/manage/files",
    roles: [Role.Admin, Role.Staff],
  },
  {
    title: "Quyền hạn",
    href: "/manage/permissions",
    Icon: UserCog,
  },
  {
    title: "Khóa Học",
    href: "/manage/courses",
    Icon: School,
  },
];

export default menuItems;
