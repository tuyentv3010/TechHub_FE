import authApiRequest from "@/apiRequests/auth";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { HttpError } from "@/lib/http";

export async function POST(request: Request) {
  console.log("🔄 [API /api/auth/refresh-token] Request received");
  
  const cookieStore = cookies();
  const refreshToken = (await cookieStore).get("refreshToken")?.value;
  const accessToken = (await cookieStore).get("accessToken")?.value;
  
  console.log("🔄 [API /api/auth/refresh-token] Cookies:", {
    hasRefreshToken: !!refreshToken,
    hasAccessToken: !!accessToken,
    refreshTokenPreview: refreshToken ? refreshToken.substring(0, 30) + "..." : null,
  });
  
  if (!refreshToken) {
    console.log("🔄 [API /api/auth/refresh-token] No refreshToken in cookies!");
    return Response.json(
      {
        message: "Cant not find refreshToken",
      },
      {
        status: 401,
      }
    );
  }

  try {
    console.log("🔄 [API /api/auth/refresh-token] Calling backend sRefreshToken...");
    const { payload } = await authApiRequest.sRefreshToken({
      refreshToken,
    });
    
    console.log("🔄 [API /api/auth/refresh-token] Backend response:", {
      success: !!payload?.data,
      hasNewAccessToken: !!payload?.data?.accessToken,
      hasNewRefreshToken: !!payload?.data?.refreshToken,
    });
    
    const decodedAccessToken = jwt.decode(payload.data.accessToken) as {
      exp: number;
    };
    const decodedRefreshToken = jwt.decode(payload.data.refreshToken) as {
      exp: number;
    };
    
    console.log("🔄 [API /api/auth/refresh-token] New token expiration:", {
      accessTokenExp: new Date(decodedAccessToken.exp * 1000).toISOString(),
      refreshTokenExp: new Date(decodedRefreshToken.exp * 1000).toISOString(),
    });

    (await cookieStore).set("accessToken", payload.data.accessToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      expires: decodedAccessToken.exp * 1000,
    });
    (await cookieStore).set("refreshToken", payload.data.refreshToken, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      expires: decodedRefreshToken.exp * 1000,
    });
    
    console.log("🔄 [API /api/auth/refresh-token] Cookies updated successfully!");
    return Response.json(payload);
  } catch (error: any) {
    console.error("🔄 [API /api/auth/refresh-token] ERROR:", error);
    if (error instanceof HttpError) {
      console.error("🔄 [API /api/auth/refresh-token] HttpError:", error.payload);
      return Response.json(error.payload, {
        status: error.status,
      });
    } else {
      console.error("🔄 [API /api/auth/refresh-token] Unknown error:", error.message);
      return Response.json(
        { message: error.message ?? "Co Loi Xay Ra" },
        {
          status: 401,
        }
      );
    }
  }
}
