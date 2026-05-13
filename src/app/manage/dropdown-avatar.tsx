"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLogoutMutation } from "@/queries/useAuth";
import { toast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useAppContext } from "@/components/app-provider";
import { useAccountProfile } from "@/queries/useAccount";
import { getUserInfoFromStorage, removeTokenFromLocalStorage } from "@/lib/utils";
import { normalizePersistedMediaUrl } from "@/lib/file-media";
import { User, LogOut, BookText, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

interface UserInfo {
  id: string;
  email: string;
  username: string;
  roles: string[];
  status: string;
  avatar?: string;
}

export default function DropdownAvatar() {
  const t = useTranslations("NavItem");
  const logoutMutation = useLogoutMutation();
  const { data, isLoading, isError, error } = useAccountProfile();
  const { isAuth, setIsAuth, setRole, setPermissions } = useAppContext();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  const account = data?.payload?.data;
  const currentRoles = userInfo?.roles || account?.roles || [];
  const canAccessManageDashboard =
    isAuth && !currentRoles.includes("GUEST");

  // Load user info from localStorage on mount
  useEffect(() => {
    if (isAuth) {
      const storedUserInfo = getUserInfoFromStorage();
      if (storedUserInfo) {
        try {
          setUserInfo(JSON.parse(storedUserInfo));
        } catch (e) {
          console.error("Failed to parse user info:", e);
        }
      }
    }
  }, [isAuth]);

  // Update userInfo when account data changes
  useEffect(() => {
    if (account) {
      setUserInfo({
        id: account.id,
        email: account.email,
        username: account.username,
        roles: account.roles || [],
        status: account.status,
        avatar: account.avatar,
      });
    }
  }, [account]);

  const handleLogout = async () => {
    if (logoutMutation.isPending) {
      return;
    }

    try {
      await logoutMutation.mutateAsync();
      
      // Clear all auth data
      removeTokenFromLocalStorage();
      
      // Update context
      setIsAuth(false);
      setRole(null);
      setPermissions(null);
      setUserInfo(null);
      
      toast({
        title: t("logoutSuccess") || "Đăng xuất thành công",
        description: t("logoutSuccessMessage") || "Bạn đã đăng xuất khỏi hệ thống",
      });
      
      window.location.replace("/login");
    } catch (error: unknown) {
      console.error("Logout error:", error);
      
      // Even if API fails, clear local data
      removeTokenFromLocalStorage();
      setIsAuth(false);
      setRole(null);
      setPermissions(null);
      setUserInfo(null);
      
      toast({
        title: t("logoutSuccess") || "Đăng xuất thành công",
        description: t("logoutSuccessMessage") || "Bạn đã đăng xuất khỏi hệ thống",
      });
      
      window.location.replace("/login");
    }
  };

  if (isLoading) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="app-control app-control-icon relative"
      >
        <Avatar className="app-control-avatar">
          <AvatarFallback>...</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  if (isError) {
    console.error("Account profile error:", error);
    return (
      <Button
        variant="ghost"
        size="icon"
        className="app-control app-control-icon relative"
      >
        <Avatar className="app-control-avatar">
          <AvatarFallback>??</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  const avatarUrl =
    normalizePersistedMediaUrl(userInfo?.avatar) ||
    normalizePersistedMediaUrl(account?.avatar) ||
    "/placeholder-avatar.jpg";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="app-control app-control-icon relative"
        >
            <Avatar className="app-control-avatar">
              <AvatarImage
              src={avatarUrl}
              alt={userInfo?.username || account?.username || "User"}
              className="object-cover"
            />
            <AvatarFallback>
              {(userInfo?.username || account?.username) 
                ? (userInfo?.username || account?.username).substring(0, 2).toUpperCase() 
                : <User className="h-4 w-4" />
              }
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="app-control-menu w-64 p-2"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="space-y-1 rounded-xl border border-border/40 bg-card/70 px-3 py-3">
            <p className="text-sm font-medium leading-none">
              {userInfo?.username || account?.username || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {userInfo?.email || account?.email || ""}
            </p>
            {(userInfo?.roles || account?.roles) && (userInfo?.roles || account?.roles).length > 0 && (
              <p className="text-xs leading-none text-muted-foreground mt-1">
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {(userInfo?.roles || account?.roles)?.[0]}
                </span>
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {canAccessManageDashboard && (
          <DropdownMenuItem asChild>
            <Link href="/manage/dashboard" className="cursor-pointer">
              <BarChart3 className="mr-2 h-4 w-4" />
              {t("dashboard") || "Dashboard"}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            {t("profile") || "Profile"}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-learning" className="cursor-pointer">
            <BookText className="mr-2 h-4 w-4" />
            {t("myLearning") || "My Learning"}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="cursor-pointer text-red-600 dark:text-red-400"
          disabled={logoutMutation.isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {logoutMutation.isPending ? (t("loggingOut") || "Đang đăng xuất...") : (t("logout") || "Logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


