import envConfig from "@/config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const taskId = params.taskId;

    const response = await fetch(
      `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/proxy/ai/drafts/${taskId}/approve-learning-path`,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to approve learning path draft";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
