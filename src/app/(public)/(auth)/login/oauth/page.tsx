"use client";

import { useAppContext } from "@/components/app-provider";
import { toast } from "@/components/ui/use-toast";
import { decodeToken } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import envConfig from "@/config";

export default function OauthPage() {
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
        // Check if this is a direct token response (from existing flow)
        const accessToken = searchParams.get("accessToken");
        const refreshToken = searchParams.get("refreshToken");
        const message = searchParams.get("message");

        if (accessToken && refreshToken) {
          // Existing flow - tokens already generated
          console.log("Processing existing OAuth flow with tokens");
          const { role } = decodeToken(accessToken);
          
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          
          setRole(role);
          setIsAuth(true);
          
          toast({
            title: "Login Successful",
            description: message || "You have successfully logged in!",
          });
          
          router.push(role === "ADMIN" ? "/manage/accounts" : "/");
          return;
        }

        // New flow - exchange OAuth result for tokens
        const userId = searchParams.get("userId");
        const email = searchParams.get("email");
        const username = searchParams.get("username");
        const provider = searchParams.get("provider");
        const oauth2Success = searchParams.get("oauth2Success");
        const error = searchParams.get("error");

        if (error) {
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: error || "An error occurred during OAuth login",
          });
          router.push("/login");
          return;
        }

        if (oauth2Success === "true" && userId && email) {
          console.log("Processing new OAuth flow - exchanging for tokens");
          console.log("User ID:", userId, "Email:", email, "Provider:", provider);

          // Exchange OAuth result for JWT tokens
          const response = await fetch(
            `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/proxy/auth/oauth2/exchange`,
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

          const data = await response.json();

          if (!response.ok || !data.success) {
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
            title: "Login Successful",
            description: `Welcome ${username || email}! Logged in via ${provider}`,
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
          title: "Login Failed",
          description: error.message || "An error occurred during login",
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
          <p className="text-gray-700 text-lg">Processing login...</p>
        </div>
      </div>
    );
  }

  return null;
}
