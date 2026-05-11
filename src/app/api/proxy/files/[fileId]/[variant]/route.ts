import { NextRequest, NextResponse } from "next/server";

import {
  buildFileProxyHeaders,
  FILE_PROXY_BASE_URL,
  relayUpstreamResponse,
} from "../../proxy-utils";

type FileVariant = "content" | "thumbnail";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string; variant: string }> }
) {
  try {
    const { fileId, variant } = await params;
    if (variant !== "content" && variant !== "thumbnail") {
      return NextResponse.json(
        { message: "Unsupported file variant" },
        { status: 400 }
      );
    }

    const headers = await buildFileProxyHeaders(request);
    const search = request.nextUrl.search;
    const response = await fetch(
      `${FILE_PROXY_BASE_URL}/${encodeURIComponent(fileId)}/${variant as FileVariant}${search}`,
      {
        method: "GET",
        headers,
      }
    );

    return relayUpstreamResponse(response);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Failed to load file" },
      { status: 500 }
    );
  }
}
