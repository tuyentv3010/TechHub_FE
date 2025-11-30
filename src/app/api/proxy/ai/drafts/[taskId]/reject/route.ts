import envConfig from "@/config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const { taskId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const reason = searchParams.get("reason");

    const url = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/proxy/ai/drafts/${taskId}/reject${
      reason ? `?reason=${encodeURIComponent(reason)}` : ""
    }`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reject draft";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
