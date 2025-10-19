"use client";
import { useAppContext } from "@/components/app-provider";
import { Role } from "@/constants/type";
import {
  cn,
  getAccessTokenFromLocalStorage,
  handleErrorApi,
} from "@/lib/utils";
import { RoleType } from "@/types/jwt.types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
// import { useLogoutMutation } from "@/queries/useAuth";

interface MenuItem {
  title: string;
  href: string;
  role?: RoleType[];
}

export default function NavItems({ className }: { className?: string }) {
  const t = useTranslations("NavItem");
  const loginT = useTranslations("Login");
  const { isAuth, role, setIsAuth, setRole } = useAppContext();
  const router = useRouter();
  // const logoutMutation = useLogoutMutation();

  const menuItems: MenuItem[] = [
    { title: t("home"), href: "/" },
    { title: t("courses"), href: "/courses" },
    { title: t("learningPaths"), href: "/learning-paths" },
    { title: t("blog"), href: "/blog" },
    { title: t("about"), href: "/about" },
    { title: t("contact"), href: "/contact" },
  ];

  return (
    <>
      {menuItems.map((item) => {
        const canShow =
          item.role === undefined || (role && item.role.includes(role));
        if (canShow) {
          return (
            <Link href={item.href} key={item.href} className={className}>
              {item.title}
            </Link>
          );
        }
        return null;
      })}
    </>
  );
}
