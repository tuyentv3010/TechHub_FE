"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BookOpen, Menu, X, User, LogOut, Settings, BookText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/components/app-provider";
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

interface MenuItem {
  title: string;
  href: string;
  role?: string[];
}

export function NewHeader() {
  const t = useTranslations("NavItem");
  const { isAuth, role, setIsAuth, setRole } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems: MenuItem[] = [
    { title: t("home"), href: "/" },
    { title: t("courses"), href: "/courses" },
    { title: t("learningPaths"), href: "/learning-paths" },
    { title: t("blog"), href: "/blog" },
    { title: t("about"), href: "/about" },
    { title: t("contact"), href: "/contact" },
  ];

  const handleLogout = () => {
    // Add logout logic here
    setIsAuth(false);
    setRole(null);
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

          {/* Auth Section */}
          {isAuth ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">John Doe</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      john@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    {t("dashboard")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    {t("profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-learning" className="cursor-pointer">
                    <BookText className="mr-2 h-4 w-4" />
                    {t("myLearning")}
                  </Link>
                </DropdownMenuItem>
              <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {t("settings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("logout")}
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