import envConfig from "@/config";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

type JwtPayload = {
  id?: string;
  userId?: string;
  roles?: string[] | string;
  authorities?: string[] | string;
};

function getDirectAiEndpoint() {
  if (process.env.AI_SERVICE_DIRECT_ENDPOINT) {
    return process.env.AI_SERVICE_DIRECT_ENDPOINT;
  }
  return envConfig.NEXT_PUBLIC_API_ENDPOINT;
}

function parseBearerToken(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice("Bearer ".length).trim();
}

function normalizeRoles(value: JwtPayload["roles"] | JwtPayload["authorities"]) {
  if (Array.isArray(value)) {
    return value.join(",");
  }
  return value || "INSTRUCTOR";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("authorization");
    const token = parseBearerToken(authHeader);
    const decoded = token ? (jwt.decode(token) as JwtPayload | null) : null;
    const trustedUserId = decoded?.userId || decoded?.id || body?.userId;
    const trustedRoles = normalizeRoles(decoded?.roles || decoded?.authorities);

    const response = await fetch(
      `${getDirectAiEndpoint()}/api/ai/learning-paths/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader && { Authorization: authHeader }),
          ...(trustedUserId && { "X-User-Id": trustedUserId }),
          "X-User-Roles": trustedRoles,
          "X-Request-Source": "proxy-client",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    if (data?.data && !data?.payload) {
      return NextResponse.json(
        {
          ...data,
          payload: { data: data.data },
        },
        { status: response.status }
      );
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate learning path" },
      { status: 500 }
    );
  }
}
