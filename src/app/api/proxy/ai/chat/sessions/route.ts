import envConfig from "@/config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const mode = searchParams.get("mode");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    let url = `${envConfig.NEXT_PUBLIC_API_URL}/api/proxy/ai/chat/sessions?userId=${userId}`;
    if (mode) {
      url += `&mode=${mode}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
