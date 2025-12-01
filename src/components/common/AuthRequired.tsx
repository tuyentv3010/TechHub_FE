"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, Lock } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface AuthRequiredProps {
  title?: string;
  description?: string;
  showCard?: boolean;
}

export default function AuthRequired({ 
  title, 
  description,
  showCard = true 
}: AuthRequiredProps) {
  const t = useTranslations("auth");

  const content = (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-3">
        {title || "Yêu cầu đăng nhập"}
      </h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        {description || "Vui lòng đăng nhập để xem nội dung này và trải nghiệm đầy đủ các tính năng."}
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/login">
            <LogIn className="w-4 h-4 mr-2" />
            {t("signIn") || "Đăng nhập"}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/register">
            {t("signUp") || "Đăng ký"}
          </Link>
        </Button>
      </div>
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card className="max-w-lg mx-auto mt-8">
      <CardContent className="pt-6">
        {content}
      </CardContent>
    </Card>
  );
}
