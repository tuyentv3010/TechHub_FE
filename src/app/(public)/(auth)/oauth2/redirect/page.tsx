"use client";

import { useAppContext } from "@/components/app-provider";
import { toast } from "@/components/ui/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import envConfig from "@/config";
import authApiRequest from "@/apiRequests/auth";

export default function OAuth2RedirectPage() {
  const { setRole, setIsAuth } = useAppContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const count = useRef(0);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Prevent double execution
    if (count.current > 0) return;
    count.current++;

    const processOAuth = async () => {
      try {
        console.log("🔐 OAuth2 Redirect - Starting processOAuth");
        console.log("🔐 OAuth2 Redirect - Full URL:", window.location.href);
        console.log("🔐 OAuth2 Redirect - Search params:", searchParams.toString());
        
        const userId = searchParams.get("userId");
        const email = searchParams.get("email");
        const username = searchParams.get("username");
        const provider = searchParams.get("provider");
        const oauth2Success = searchParams.get("oauth2Success");
        const error = searchParams.get("error");

        console.log("🔐 OAuth2 Redirect - Parsed params:", { userId, email, username, provider, oauth2Success, error });

        if (error) {
          console.log("🔐 OAuth2 Redirect - Error received:", error);
          toast({
            variant: "destructive",
            title: "Đăng nhập thất bại",
            description: error || "Có lỗi xảy ra khi đăng nhập",
          });
          router.push("/login");
          return;
        }

        if (oauth2Success === "true" && userId && email) {
          console.log("🔐 OAuth2 Redirect - Processing OAuth - exchanging for tokens");
          console.log("🔐 OAuth2 Redirect - User ID:", userId, "Email:", email, "Provider:", provider);

          // Exchange OAuth result for JWT tokens
          const exchangeUrl = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/app/api/proxy/auth/oauth2/exchange`;
          console.log("🔐 OAuth2 Redirect - Exchange URL:", exchangeUrl);
          
          const response = await fetch(exchangeUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId,
              email,
            }),
          });

          console.log("🔐 OAuth2 Redirect - Exchange response status:", response.status);
          const data = await response.json();
          console.log("🔐 OAuth2 Redirect - Exchange response data:", data);

          if (!response.ok || !data.success) {
            console.error("🔐 OAuth2 Redirect - Exchange failed:", {
              status: response.status,
              success: data.success,
              message: data.message,
              fullResponse: data
            });
            throw new Error(data.message || "Failed to exchange OAuth result");
          }

          console.log("🔐 OAuth2 Redirect - Storing tokens to localStorage");
          // Store tokens in localStorage
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          localStorage.setItem("userInfo", JSON.stringify(data.user));

          console.log("🔐 OAuth2 Redirect - Setting tokens to cookies");
          // Set tokens to cookies for middleware auth check
          try {
            await authApiRequest.setTokenToCookie({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            });
            console.log("🔐 OAuth2 Redirect - Cookies set successfully");
          } catch (cookieError) {
            console.error("🔐 OAuth2 Redirect - Failed to set cookies:", cookieError);
          }

          // Get user role
          const userRole = data.user.roles[0] || "USER";
          console.log("🔐 OAuth2 Redirect - User role:", userRole);

          // Update app context
          setIsAuth(true);
          setRole(userRole);

          toast({
            title: "Đăng nhập thành công!",
            description: `Chào mừng ${username || email}! Đã đăng nhập qua ${provider}`,
          });

          // Redirect based on role
          console.log("🔐 OAuth2 Redirect - Redirecting user, role:", userRole);
          if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
            router.push("/manage/accounts");
          } else {
            router.push("/");
          }
        } else {
          console.log("🔐 OAuth2 Redirect - Invalid params, oauth2Success:", oauth2Success, "userId:", userId, "email:", email);
          throw new Error("Invalid OAuth callback parameters");
        }
      } catch (error: any) {
        console.error("🔐 OAuth2 Redirect - OAuth processing error:", error);
        toast({
          variant: "destructive",
          title: "Đăng nhập thất bại",
          description: error.message || "Có lỗi xảy ra khi đăng nhập",
        });
        router.push("/login");
      } finally {
        setIsProcessing(false);
      }
    };

    processOAuth();
  }, [searchParams, setRole, setIsAuth, router]);

  if (isProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground text-lg">Đang xử lý đăng nhập...</p>
        </div>
      </div>
    );
  }

  return null;
}
