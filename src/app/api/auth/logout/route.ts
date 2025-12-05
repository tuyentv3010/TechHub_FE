import authApiRequest from "@/apiRequests/auth";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();
  const accessToken = (await cookieStore).get("accessToken")?.value;
  const refreshToken = (await cookieStore).get("refreshToken")?.value;
  
  // Delete cookies first (so user is logged out on frontend regardless of backend response)
  (await cookieStore).delete("refreshToken");
  (await cookieStore).delete("accessToken");
  
  if (!accessToken || !refreshToken) {
    return Response.json(
      {
        message: "Khong nhan duoc access Token",
      },
      {
        status: 200,
      }
    );
  }
  
  try {
    const result = await authApiRequest.sLogout(accessToken);
    return Response.json(result.payload);
  } catch (error: any) {
    console.log("Logout error:", error);
    
    // If token is expired (401), consider logout successful since user is already logged out
    // Cookies are already deleted above, so user is effectively logged out on frontend
    if (error?.status === 401) {
      return Response.json(
        { 
          message: "Token expired - already logged out",
          success: true 
        },
        {
          status: 200,
        }
      );
    }
    
    // For other errors, still return success since cookies are already cleared
    // User is logged out on frontend regardless of backend response
    return Response.json(
      { 
        message: "Logged out successfully (backend call failed but frontend cleared)",
        success: true 
      },
      {
        status: 200,
      }
    );
  }
}
