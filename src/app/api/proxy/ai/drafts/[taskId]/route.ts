import envConfig from "@/config";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const taskId = params.taskId;

    const response = await fetch(
      `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/proxy/ai/drafts/${taskId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader && { Authorization: authHeader }),
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get draft" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const taskId = params.taskId;
    const url = request.nextUrl;
    const action = url.pathname.split("/").pop();

    let endpoint = "";
    if (action === "approve-exercise") {
      endpoint = `/api/proxy/ai/drafts/${taskId}/approve-exercise`;
    } else if (action === "approve-learning-path") {
      endpoint = `/api/proxy/ai/drafts/${taskId}/approve-learning-path`;
    } else if (action === "reject") {
      const reason = url.searchParams.get("reason");
      endpoint = `/api/proxy/ai/drafts/${taskId}/reject${
        reason ? `?reason=${encodeURIComponent(reason)}` : ""
      }`;
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${envConfig.NEXT_PUBLIC_API_ENDPOINT}${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader && { Authorization: authHeader }),
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process draft action" },
      { status: 500 }
    );
  }
}
