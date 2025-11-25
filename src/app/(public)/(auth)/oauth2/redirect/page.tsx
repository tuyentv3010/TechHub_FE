"use client";

import { useAppContext } from "@/components/app-provider";
import { toast } from "@/components/ui/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import envConfig from "@/config";

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
        const userId = searchParams.get("userId");
        const email = searchParams.get("email");
        const username = searchParams.get("username");
        const provider = searchParams.get("provider");
        const oauth2Success = searchParams.get("oauth2Success");
        const error = searchParams.get("error");

        if (error) {
          toast({
            variant: "destructive",
            title: "Đăng nhập thất bại",
            description: error || "Có lỗi xảy ra khi đăng nhập",
          });
          router.push("/login");
          return;
        }

        if (oauth2Success === "true" && userId && email) {
          console.log("Processing OAuth - exchanging for tokens");
          console.log("User ID:", userId, "Email:", email, "Provider:", provider);

          // Exchange OAuth result for JWT tokens
          const response = await fetch(
            `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/app/api/proxy/auth/oauth2/exchange`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId,
                email,
              }),
            }
          );

          console.log("Exchange response status:", response.status);
          const data = await response.json();
          console.log("Exchange response data:", data);

          if (!response.ok || !data.success) {
            console.error("Exchange failed:", {
              status: response.status,
              success: data.success,
              message: data.message,
              fullResponse: data
            });
            throw new Error(data.message || "Failed to exchange OAuth result");
          }

          // Store tokens and user info
          localStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          localStorage.setItem("userInfo", JSON.stringify(data.user));

          // Get user role
          const userRole = data.user.roles[0] || "USER";

          // Update app context
          setIsAuth(true);
          setRole(userRole);

          toast({
            title: "Đăng nhập thành công!",
            description: `Chào mừng ${username || email}! Đã đăng nhập qua ${provider}`,
          });

          // Redirect based on role
          if (userRole === "ADMIN") {
            router.push("/manage/accounts");
          } else {
            router.push("/");
          }
        } else {
          throw new Error("Invalid OAuth callback parameters");
        }
      } catch (error: any) {
        console.error("OAuth processing error:", error);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-700 text-lg">Đang xử lý đăng nhập...</p>
        </div>
      </div>
    );
  }

  return null;
}
