import { NextRequest, NextResponse } from "next/server";

import {
  buildFileProxyHeaders,
  FILE_PROXY_BASE_URL,
  relayUpstreamResponse,
} from "../../proxy-utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const headers = await buildFileProxyHeaders(request);
    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers.set("content-type", contentType);
    }

    const response = await fetch(`${FILE_PROXY_BASE_URL}/upload/multiple`, {
      method: "POST",
      headers,
      body: request.body,
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    return relayUpstreamResponse(response);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Failed to upload files" },
      { status: 500 }
    );
  }
}
