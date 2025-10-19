import envConfig from "@/config";
import { HttpError } from "@/lib/http";
import { ForgotPasswordBodyType } from "@/schemaValidations/auth.schema";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ForgotPasswordBodyType;

    // Forward the request to the backend API
    const response = await fetch(
      `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/users/forgot-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: body.email,
        }),
        credentials: "include",
      }
    );

    const contentType = response.headers.get("content-type") || "";
    let payload: any;

    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }

    if (!response.ok) {
      return Response.json(payload, {
        status: response.status,
      });
    }

    return Response.json(payload, {
      status: response.status,
    });
  } catch (error) {
    console.error("Forgot password proxy error:", error);
    if (error instanceof HttpError) {
      return Response.json(error.payload, {
        status: error.status,
      });
    }
    return Response.json(
      { 
        success: false,
        message: "Có lỗi xảy ra khi gửi email reset password" 
      },
      { status: 500 }
    );
  }
}
