import envConfig from "@/config";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/proxy/notifications/read - Mark all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    const url = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/proxy/notifications/read`;
    console.log("🔔 [PROXY NOTIFICATIONS] PATCH mark all as read URL:", url);

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json();
    console.log("🔔 [PROXY NOTIFICATIONS] PATCH mark all as read response:", data);
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("🔔 [PROXY NOTIFICATIONS] PATCH mark all as read error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}
