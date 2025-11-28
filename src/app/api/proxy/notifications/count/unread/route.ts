import envConfig from "@/config";
import { NextRequest, NextResponse } from "next/server";

// GET /api/proxy/notifications/count/unread - Get unread notification count
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    const url = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/proxy/notifications/count/unread`;
    console.log("🔔 [PROXY NOTIFICATIONS] GET unread count URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json();
    console.log("🔔 [PROXY NOTIFICATIONS] GET unread count response:", data);
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("🔔 [PROXY NOTIFICATIONS] GET unread count error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch unread count" },
      { status: 500 }
    );
  }
}
