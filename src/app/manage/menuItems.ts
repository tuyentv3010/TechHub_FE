"use client";

import { Role } from "@/constants/type";
import {
  Home,
  Newspaper,
  UserCog,
  UserRoundPen,
  Users2,
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
    title: "Quyền hạn",
    href: "/manage/permissions",
    Icon: UserCog,
  },
];

export default menuItems;
