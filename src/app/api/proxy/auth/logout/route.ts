import envConfig from "@/config";
import { HttpError } from "@/lib/http";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const clearAuthCookies = (response: NextResponse) => {
  response.cookies.set("accessToken", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  response.cookies.set("refreshToken", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  response.cookies.set("authStorageMode", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  return response;
};

export async function POST() {
  try {
    const cookieStore = cookies();
    const accessToken = (await cookieStore).get("accessToken")?.value;
    const refreshToken = (await cookieStore).get("refreshToken")?.value;

    if (!accessToken && !refreshToken) {
      return clearAuthCookies(
        NextResponse.json(
          { message: "Already logged out" },
          { status: 200 }
        )
      );
    }

    const response = await fetch(
      `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/auth/logout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      }
    );

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : { message: "Logged out successfully" };

    return clearAuthCookies(
      NextResponse.json(payload, {
        status: 200,
      })
    );
  } catch (error) {
    console.error("Logout proxy error:", error);
    if (error instanceof HttpError) {
      return clearAuthCookies(
        NextResponse.json(error.payload, {
          status: error.status,
        })
      );
    }
    return clearAuthCookies(
      NextResponse.json(
        { message: "Logout failed" },
        { status: 500 }
      )
    );
  }
}
