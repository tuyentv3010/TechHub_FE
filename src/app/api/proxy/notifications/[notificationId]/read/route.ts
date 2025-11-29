import envConfig from "@/config";
import { NextRequest, NextResponse } from "next/server";

type Params = {
  notificationId: string;
};

// PATCH /api/proxy/notifications/[notificationId]/read - Mark a single notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { notificationId } = await params;
    const authHeader = request.headers.get("authorization");

    const url = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/proxy/notifications/${notificationId}/read`;
    console.log("🔔 [PROXY NOTIFICATIONS] PATCH mark as read URL:", url);

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json();
    console.log("🔔 [PROXY NOTIFICATIONS] PATCH mark as read response:", data);
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("🔔 [PROXY NOTIFICATIONS] PATCH mark as read error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
