import envConfig from "@/config";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lessonId = searchParams.get("lessonId");
    const authHeader = request.headers.get("authorization");

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/proxy/ai/drafts/exercises?lessonId=${lessonId}`,
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
      { error: error.message || "Failed to get exercise drafts" },
      { status: 500 }
    );
  }
}
