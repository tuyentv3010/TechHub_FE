"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { BookOpen, Menu, X, User, LogOut, Settings, BookText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/components/app-provider";
import { NotificationBell } from "@/components/organisms/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { SwitchLanguage } from "@/components/switch-language";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { useLogoutMutation } from "@/queries/useAuth";
import { useAccountProfile } from "@/queries/useAccount";

interface MenuItem {
  title: string;
  href: string;
  role?: string[];
}

interface UserInfo {
  id: string;
  email: string;
  username: string;
  roles: string[];
  status: string;
  avatar?: string;
}

export function DropdownProfile() {
  const t = useTranslations("NavItem");
  const { isAuth, role, setIsAuth, setRole, setPermissions } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const router = useRouter();
  const logoutMutation = useLogoutMutation();
  const { data, isLoading, isError } = useAccountProfile();
  
  const account = data?.payload?.data;
  console.log("🔐 [userInfo?.roles] Account data:", userInfo?.roles);
  // Load user info from localStorage on mount
  useEffect(() => {
    if (isAuth) {
      const storedUserInfo = localStorage.getItem("userInfo");
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

  const navigationItems: MenuItem[] = [
    { title: t("home"), href: "/" },
    { title: t("courses"), href: "/courses" },
    { title: t("learningPaths"), href: "/learning-paths" },
    { title: t("blog"), href: "/blog" },
    { title: t("about"), href: "/about" },
    { title: t("contact"), href: "/contact" },
  ];

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      
      // Clear all auth data
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userInfo");
      
      // Update context
      setIsAuth(false);
      setRole(null);
      setPermissions(null);
      setUserInfo(null);
      
      // Show success message
      toast({
        title: t("logoutSuccess") || "Đăng xuất thành công",
        description: t("logoutSuccessMessage") || "Bạn đã đăng xuất khỏi hệ thống",
      });
      
      // Redirect to home
      router.push("/");
    } catch (error: any) {
      console.error("Logout error:", error);
      
      // Even if API fails, clear local data
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userInfo");
      setIsAuth(false);
      setRole(null);
      setPermissions(null);
      setUserInfo(null);
      
      toast({
        title: t("logoutSuccess") || "Đăng xuất thành công",
        description: t("logoutSuccessMessage") || "Bạn đã đăng xuất khỏi hệ thống",
      });
      
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/logo.png" alt="TechHub Logo" width={80} height={80} />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navigationItems.map((item) => {
            const canShow = !item.role || (role && item.role.includes(role));
            if (canShow) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-colors hover:text-primary text-foreground/80 hover:text-foreground"
                >
                  {item.title}
                </Link>
              );
            }
            return null;
          })}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2">
          {/* Language Switcher */}
          <SwitchLanguage />
          
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notification Bell - Only show when authenticated */}
          {isAuth && <NotificationBell />}

          {/* Auth Section */}
          {isAuth ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={userInfo?.avatar || account?.avatar || "/placeholder-avatar.jpg"} 
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
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userInfo?.username || account?.username || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userInfo?.email || account?.email || ""}
                    </p>
                    {(userInfo?.roles || account?.roles) && (userInfo?.roles || account?.roles).length > 0 && (
                      <p className="text-xs leading-none text-muted-foreground mt-1">
                        <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                          {(userInfo?.roles || account?.roles)?.[0]}
                        </span>
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userInfo?.roles?.includes("ADMIN") && (
                  <DropdownMenuItem asChild>
                    <Link href="/manage/accounts" className="cursor-pointer">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      {t("dashboard") || "Dashboard"}
                    </Link>
                  </DropdownMenuItem>
                )}
                {(userInfo?.roles?.includes("ADMIN") || userInfo?.roles?.includes("INSTRUCTOR")) && (
                  <DropdownMenuItem asChild>
                    <Link href="/manage/courses" className="cursor-pointer">
                      <BookOpen className="mr-2 h-4 w-4" />
                      {t("manageCourses") || "Manage Courses"}
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
                <DropdownMenuItem asChild>
                  <Link href="/setting" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("settings") || "Settings"}
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
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">{t("signIn")}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t("signUp")}</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="md:hidden"
                size="icon"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-4">
                {/* Mobile Navigation */}
                <nav className="flex flex-col space-y-2">
                  {navigationItems.map((item) => {
                    const canShow = !item.role || (role && item.role.includes(role));
                    if (canShow) {
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.title}
                        </Link>
                      );
                    }
                    return null;
                  })}
                </nav>

                {/* Mobile Auth Section */}
                {!isAuth && (
                  <div className="flex flex-col space-y-2 pt-4 border-t">
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        {t("signIn")}
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        {t("signUp")}
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}