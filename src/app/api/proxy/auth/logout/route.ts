import envConfig from "@/config";
import { HttpError } from "@/lib/http";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const accessToken = (await cookieStore).get("accessToken")?.value;
    const refreshToken = (await cookieStore).get("refreshToken")?.value;

    // Clear cookies
    (await cookieStore).delete("accessToken");
    (await cookieStore).delete("refreshToken");

    if (!accessToken && !refreshToken) {
      return Response.json(
        { message: "Already logged out" },
        { status: 200 }
      );
    }

    // Forward the request to the backend API
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
    let payload: any;

    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      payload = { message: "Logged out successfully" };
    }

    return Response.json(payload, {
      status: 200,
    });
  } catch (error) {
    console.error("Logout proxy error:", error);
    if (error instanceof HttpError) {
      return Response.json(error.payload, {
        status: error.status,
      });
    }
    return Response.json(
      { message: "Có lỗi xảy ra khi đăng xuất" },
      { status: 500 }
    );
  }
}
