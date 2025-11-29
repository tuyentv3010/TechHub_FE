import envConfig from "@/config";
import { NextRequest, NextResponse } from "next/server";

// GET /api/proxy/notifications - Get all notifications with pagination
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "0";
    const size = searchParams.get("size") || "10";
    const read = searchParams.get("read");

    let url = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/proxy/notifications?page=${page}&size=${size}`;
    if (read !== null) {
      url += `&read=${read}`;
    }

    console.log("🔔 [PROXY NOTIFICATIONS] GET request URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json();
    console.log("🔔 [PROXY NOTIFICATIONS] GET response:", data);
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("🔔 [PROXY NOTIFICATIONS] GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
