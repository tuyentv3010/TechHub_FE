import envConfig from "@/config";
import { HttpError } from "@/lib/http";
import { LoginBodyType } from "@/schemaValidations/auth.schema";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBodyType;

    // Forward the request to the backend API
    const response = await fetch(
      `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: body.email,
          password: body.password,
        }),
        credentials: "include",
      }
    );

    const contentType = response.headers.get("content-type") || "";
    let payload: any;

    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }

    if (!response.ok) {
      return Response.json(payload, {
        status: response.status,
      });
    }

    // Extract tokens from the response and set them as cookies
    const cookieStore = cookies();
    if (payload.success && payload.data) {
      const { accessToken, refreshToken } = payload.data;
      
      // Decode tokens to get expiration
      const decodedAccessToken = jwt.decode(accessToken) as { exp: number };
      const decodedRefreshToken = jwt.decode(refreshToken) as { exp: number };
      
      // Set access token cookie
      (await cookieStore).set("accessToken", accessToken, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires: decodedAccessToken?.exp ? new Date(decodedAccessToken.exp * 1000) : undefined,
      });

      // Set refresh token cookie
      (await cookieStore).set("refreshToken", refreshToken, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        expires: decodedRefreshToken?.exp ? new Date(decodedRefreshToken.exp * 1000) : undefined,
      });
    }

    return Response.json(payload, {
      status: response.status,
    });
  } catch (error) {
    console.error("Login proxy error:", error);
    if (error instanceof HttpError) {
      return Response.json(error.payload, {
        status: error.status,
      });
    }
    return Response.json(
      { message: "Có lỗi xảy ra khi đăng nhập" },
      { status: 500 }
    );
  }
}
