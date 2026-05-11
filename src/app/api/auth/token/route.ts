import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { HttpError } from "@/lib/http";
export async function POST(request: Request) {
  const body = (await request.json()) as {
    accessToken: string;
    refreshToken: string;
    remember?: boolean;
  };
  const { accessToken, refreshToken } = body;
  const persistentCookie = body.remember !== false;
  const cookieStore = cookies();
  const isProduction = process.env.NODE_ENV === "production";
  try {
    const decodedAccessToken = jwt.decode(accessToken) as { exp: number };
    const decodedRefreshToken = jwt.decode(refreshToken) as { exp: number };
    (await cookieStore).set("accessToken", accessToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      ...(persistentCookie ? { expires: decodedAccessToken.exp * 1000 } : {}),
    });
    (await cookieStore).set("refreshToken", refreshToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      ...(persistentCookie ? { expires: decodedRefreshToken.exp * 1000 } : {}),
    });
    (await cookieStore).set("authStorageMode", persistentCookie ? "local" : "session", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      ...(persistentCookie ? { expires: decodedRefreshToken.exp * 1000 } : {}),
    });
    return Response.json(body);
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.json(error.payload, {
        status: error.status,
      });
    } else {
      return Response.json(
        { message: "Co Loi Xay Ra" },
        {
          status: 500,
        }
      );
    }
  }
}
