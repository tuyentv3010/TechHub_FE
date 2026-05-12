import authApiRequest from "@/apiRequests/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const clearAuthCookies = (response: NextResponse) => {
  response.cookies.set("accessToken", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  response.cookies.set("refreshToken", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  response.cookies.set("authStorageMode", "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  return response;
};

export async function POST() {
  const cookieStore = cookies();
  const accessToken = (await cookieStore).get("accessToken")?.value;
  const refreshToken = (await cookieStore).get("refreshToken")?.value;

  if (!accessToken || !refreshToken) {
    return clearAuthCookies(
      NextResponse.json(
        {
          message: "Khong nhan duoc access Token",
        },
        {
          status: 200,
        }
      )
    );
  }
  
  try {
    const result = await authApiRequest.sLogout(accessToken);
    return clearAuthCookies(NextResponse.json(result.payload));
  } catch (error) {
    console.log(error);
    return clearAuthCookies(
      NextResponse.json(
        { message: "Loi khi goi api den server backend" },
        {
          status: 200,
        }
      )
    );
  }
}
