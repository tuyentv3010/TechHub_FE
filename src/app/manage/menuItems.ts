"use client";
import { Role } from "@/constants/type";
import { useAccountProfile } from "@/queries/useAccount";
import {
  Home,
  LineChart,
  ShoppingCart,
  Users2,
  Salad,
  Table,
  Caravan,
  TrainFront,
  BellElectric,
  BadgeCent,
  Newspaper,
  LockKeyholeOpen,
  UserRoundPen,
  UserCog,
  TrainFrontTunnel,
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
    title: "Vai Trò",
    Icon: UserRoundPen,
    href: "/manage/roles",
  },
  {
    title: "Quyền Hạn",
    href: "/manage/permissions",
    Icon: UserCog,
  },
];

export default menuItems;
