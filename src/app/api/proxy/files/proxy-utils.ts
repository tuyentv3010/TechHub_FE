import envConfig from "@/config";
import { cookies } from "next/headers";

export const FILE_PROXY_BASE_URL = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/app/api/proxy/files`;

export async function buildFileProxyHeaders(
  request: Request,
  initial?: HeadersInit
) {
  const headers = new Headers(initial);
  const authHeader = request.headers.get("authorization");
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
    return headers;
  }

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  return headers;
}

export function relayUpstreamResponse(response: Response) {
  const headers = new Headers();
  [
    "content-type",
    "content-disposition",
    "content-length",
    "cache-control",
  ].forEach((headerName) => {
    const value = response.headers.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
