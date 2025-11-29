import envConfig from "@/config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    const response = await fetch(
      `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/api/proxy/ai/admin/reindex-all`,
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
      { error: error.message || "Failed to reindex all" },
      { status: 500 }
    );
  }
}
