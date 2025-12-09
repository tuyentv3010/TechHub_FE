import envConfig from "@/config";
import { normalizePath } from "@/lib/utils";
import { LoginResType } from "@/schemaValidations/auth.schema";
import { redirect } from "next/navigation";

type CustomOptions = Omit<RequestInit, "method"> & {
  baseUrl?: string | undefined;
  params?: Record<string, string | number | boolean | undefined>;
};

const ENTITY_ERROR_STATUS = 422;
const AUTHENTICATION_ERROR_STATUS = 401;
const FORBIDDEN_ERROR_STATUS = 403;
const BAD_REQUEST_STATUS = 400;

type EntityErrorPayload = {
  message: string;
  errors: {
    field: string;
    message: string;
  }[];
};

type BadRequestErrorPayload = {
  statusCode: number;
  error: string;
  message: string;
  data: any;
};

export class HttpError extends Error {
  status: number;
  payload: any;
  constructor({
    status,
    payload,
    message = "Lỗi HTTP",
  }: {
    status: number;
    payload: any;
    message?: string;
  }) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export class EntityError extends HttpError {
  status: typeof ENTITY_ERROR_STATUS;
  payload: EntityErrorPayload;
  constructor({
    status,
    payload,
  }: {
    status: typeof ENTITY_ERROR_STATUS;
    payload: EntityErrorPayload;
  }) {
    super({ status, payload, message: "Lỗi thực thể" });
    this.status = status;
    this.payload = payload;
  }
}

export class BadRequestError extends HttpError {
  status: typeof BAD_REQUEST_STATUS;
  payload: BadRequestErrorPayload;
  constructor({
    status,
    payload,
  }: {
    status: typeof BAD_REQUEST_STATUS;
    payload: BadRequestErrorPayload;
  }) {
    super({ status, payload, message: payload.error || "Lỗi yêu cầu" });
    this.status = status;
    this.payload = payload;
  }
}

export class ForbiddenError extends HttpError {
  status: typeof FORBIDDEN_ERROR_STATUS;
  payload: any;
  constructor({
    status,
    payload,
    message = "Không có quyền truy cập",
  }: {
    status: typeof FORBIDDEN_ERROR_STATUS;
    payload: any;
    message?: string;
  }) {
    super({ status, payload, message });
    this.status = status;
    this.payload = payload;
  }
}

let clientLogoutRequest: null | Promise<any> = null;
const isClient = typeof window !== "undefined";

const request = async <Response>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  options?: CustomOptions | undefined
) => {
  let body: FormData | string | undefined = undefined;
  if (options?.body instanceof FormData) {
    body = options.body;
  } else if (options?.body) {
    body = JSON.stringify(options.body);
  }

  const baseHeaders: { [key: string]: string } =
    body instanceof FormData
      ? {}
      : {
          "Content-Type": "application/json",
          Accept: "application/json",
        };

  let accessToken: string | null = null;
  if (isClient) {
    accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      baseHeaders.Authorization = `Bearer ${accessToken}`;
    }
  }

  const baseUrl =
    options?.baseUrl === undefined
      ? envConfig.NEXT_PUBLIC_API_ENDPOINT
      : options.baseUrl;

  let fullUrl = `${baseUrl}/${normalizePath(url)}`;
  if (options?.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += `?${queryString}`;
    }
  }

  console.log(`>>>>>>> HTTP ${method} request:`, {
    url: fullUrl,
    body: body instanceof FormData ? "FormData" : body,
    headers: { ...baseHeaders, ...options?.headers },
    accessToken: accessToken ? `${accessToken.slice(0, 10)}...` : "No token",
  });

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        ...baseHeaders,
        ...options?.headers,
      } as any,
      body,
      method,
      credentials: "include", // Support session-based auth if needed
    });

    const contentType = res.headers.get("content-type") || "";
    let payload: any;

    if (contentType.includes("application/json")) {
      payload = await res.json();
    } else {
      payload = await res.text();
      // Attempt to extract error message from HTML
      const messageMatch = payload.match(/<p><b>Message<\/b> (.*?)<\/p>/);
      const extractedMessage = messageMatch
        ? messageMatch[1]
        : payload.slice(0, 100) + "...";
      if (!res.ok) {
        throw new HttpError({
          status: res.status,
          payload,
          message: `Non-JSON response: ${extractedMessage}`,
        });
      }
    }

    const data = {
      status: res.status,
      payload,
    };

    console.log(`✅ HTTP ${method} response:`, {
      url: fullUrl,
      status: res.status,
      payloadPreview: typeof payload === 'object' 
        ? JSON.stringify(payload).slice(0, 200) + (JSON.stringify(payload).length > 200 ? '...' : '')
        : payload,
    });

    if (!res.ok) {
      if (
        res.status === ENTITY_ERROR_STATUS &&
        contentType.includes("application/json")
      ) {
        throw new EntityError(
          data as {
            status: 422;
            payload: EntityErrorPayload;
          }
        );
      } else if (
        res.status === BAD_REQUEST_STATUS &&
        contentType.includes("application/json")
      ) {
        throw new BadRequestError(
          data as {
            status: 400;
            payload: BadRequestErrorPayload;
          }
        );
      } else if (res.status === AUTHENTICATION_ERROR_STATUS) {
        console.warn('🔐 [HTTP] 401 Unauthorized - Token expired or invalid');
        if (isClient && !clientLogoutRequest) {
          console.log('🚪 [HTTP] Logging out user...');
          clientLogoutRequest = fetch("/api/auth/logout", {
            method: "POST",
            headers: {
              ...baseHeaders,
            } as any,
          });
          try {
            await clientLogoutRequest;
            console.log('✅ [HTTP] Logout successful');
          } catch (error) {
            console.error("❌ [HTTP] Logout error:", error);
          } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            console.log('🧹 [HTTP] Tokens cleared from localStorage');
            clientLogoutRequest = null;
            console.log('↪️ [HTTP] Redirecting to /login');
            location.href = `/login`;
          }
        } else if (!isClient) {
          const token = (options?.headers as any)?.Authorization?.split(
            "Bearer "
          )[1];
          redirect(`/logout?accessToken=${token}`);
        }
      } else if (res.status === FORBIDDEN_ERROR_STATUS) {
        let message = "Không có quyền truy cập.";
        if (
          typeof payload === "string" &&
          payload.includes("PermissionException")
        ) {
          message = "Bạn không có quyền truy cập endpoint này.";
        } else if (
          contentType.includes("application/json") &&
          payload.message
        ) {
          message = payload.message;
        }
        throw new ForbiddenError({
          status: FORBIDDEN_ERROR_STATUS,
          payload,
          message,
        });
      } else {
        let message = contentType.includes("application/json")
          ? payload.message || "Lỗi HTTP"
          : `Non-JSON response: ${payload.slice(0, 100)}...`;
        if (
          typeof payload === "string" &&
          payload.includes("PermissionException")
        ) {
          message = "Bạn không có quyền truy cập endpoint này.";
        }
        throw new HttpError({
          status: res.status,
          payload,
          message,
        });
      }
    }

    if (isClient) {
      const normalizeUrl = normalizePath(url);
      if (["app/api/proxy/auth/login", "api/proxy/auth/login", "api/v1/auth/login"].includes(normalizeUrl)) {
        if (payload.success && payload.data) {
          const { accessToken, refreshToken } = payload.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          // Also set in cookies for middleware with proper flags
          const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
          const accessTokenCookieOptions = [
            `accessToken=${accessToken}`,
            "path=/",
            `max-age=${24 * 60 * 60}`, // 24 hours
            "sameSite=Lax",
            ...(isSecure ? ["secure"] : []),
          ].join("; ");
          const refreshTokenCookieOptions = [
            `refreshToken=${refreshToken}`,
            "path=/",
            `max-age=${7 * 24 * 60 * 60}`, // 7 days
            "sameSite=Lax",
            ...(isSecure ? ["secure"] : []),
          ].join("; ");
          document.cookie = accessTokenCookieOptions;
          document.cookie = refreshTokenCookieOptions;
        }
      } else if (["app/api/proxy/auth/refresh-token", "api/proxy/auth/refresh-token", "api/v1/auth/token"].includes(normalizeUrl)) {
        if (payload.success && payload.data) {
          const { accessToken, refreshToken } = payload.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          // Also set in cookies for middleware with proper flags
          const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
          const accessTokenCookieOptions = [
            `accessToken=${accessToken}`,
            "path=/",
            `max-age=${24 * 60 * 60}`, // 24 hours
            "sameSite=Lax",
            ...(isSecure ? ["secure"] : []),
          ].join("; ");
          const refreshTokenCookieOptions = [
            `refreshToken=${refreshToken}`,
            "path=/",
            `max-age=${7 * 24 * 60 * 60}`, // 7 days
            "sameSite=Lax",
            ...(isSecure ? ["secure"] : []),
          ].join("; ");
          document.cookie = accessTokenCookieOptions;
          document.cookie = refreshTokenCookieOptions;
        }
      } else if (["app/api/proxy/auth/logout", "api/proxy/auth/logout", "api/v1/auth/logout"].includes(normalizeUrl)) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userInfo");
        // Also remove from cookies - clear with all possible options
        const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
        const clearCookieOptions = [
          "path=/",
          "max-age=0",
          "expires=Thu, 01 Jan 1970 00:00:00 GMT",
          "sameSite=Lax",
          ...(isSecure ? ["secure"] : []),
        ].join("; ");
        document.cookie = `accessToken=; ${clearCookieOptions}`;
        document.cookie = `refreshToken=; ${clearCookieOptions}`;
      }
    }

    return data;
  } catch (error: any) {
    console.error(`HTTP ${method} error for ${fullUrl}:`, {
      message: error.message,
      status: error.status,
      payload: error.payload,
    });
    throw error;
  }
};

// Token refresh logic
// Use Next.js API route instead of direct backend call to enable server-side cookie clearing
const refreshToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    throw new HttpError({
      status: 401,
      payload: null,
      message: "No refresh token available",
    });
  }
  try {
    // Use Next.js API route instead of direct backend call
    // This allows server-side to clear httpOnly cookies on error
    const response = await fetch("/api/auth/refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important: include cookies
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Failed to refresh token" }));
      throw new HttpError({
        status: response.status,
        payload: errorData,
        message: errorData.message || "Failed to refresh token",
      });
    }
    
    const result = await response.json();
    
    // Handle response format: { success: true, data: { accessToken, refreshToken, ... } }
    if (result.success && result.data) {
      const { accessToken, refreshToken: newRefreshToken } = result.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      // Cookies are already set by server-side API route with httpOnly flag
      // But we also set in localStorage for client-side access
      return accessToken;
    } else {
      throw new HttpError({
        status: 401,
        payload: result,
        message: result.message || "Failed to refresh token",
      });
    }
  } catch (error) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userInfo"); // Also clear user info
    // Cookies are cleared by server-side API route when error occurs
    // But try to clear non-httpOnly cookies just in case
    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
    const clearCookieOptions = [
      "path=/",
      "max-age=0",
      "expires=Thu, 01 Jan 1970 00:00:00 GMT",
      "sameSite=Lax",
      ...(isSecure ? ["secure"] : []),
    ].join("; ");
    document.cookie = `accessToken=; ${clearCookieOptions}`;
    document.cookie = `refreshToken=; ${clearCookieOptions}`;
    location.href = "/login";
    throw error;
  }
};

// Wrapper for requests with token refresh
const requestWithRefresh = async <Response>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  options?: CustomOptions | undefined
): Promise<any> => {
  try {
    return await request<Response>(method, url, options);
  } catch (error: any) {
    if (error.status === AUTHENTICATION_ERROR_STATUS && isClient) {
      console.log('🔄 [HTTP] Attempting to refresh token...');
      try {
        const newAccessToken = await refreshToken();
        console.log('✅ [HTTP] Token refreshed successfully');
        const newOptions = {
          ...options,
          headers: {
            ...options?.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        };
        console.log('🔁 [HTTP] Retrying request with new token');
        return await request<Response>(method, url, newOptions);
      } catch (refreshError) {
        console.error('❌ [HTTP] Token refresh failed:', refreshError);
        throw refreshError;
      }
    }
    throw error;
  }
};

const http = {
  get<Response>(
    url: string,
    options?: Omit<CustomOptions, "body"> | undefined
  ) {
    return requestWithRefresh<Response>("GET", url, options);
  },
  post<Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, "body"> | undefined
  ) {
    return requestWithRefresh<Response>("POST", url, { ...options, body });
  },
  put<Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, "body"> | undefined
  ) {
    return requestWithRefresh<Response>("PUT", url, { ...options, body });
  },
  delete<Response>(
    url: string,
    options?: Omit<CustomOptions, "body"> | undefined
  ) {
    return requestWithRefresh<Response>("DELETE", url, options);
  },
  patch<Response>(
    url: string,
    body: any,
    options?: Omit<CustomOptions, "body"> | undefined
  ) {
    return requestWithRefresh<Response>("PATCH", url, { ...options, body });
  },
};

export default http;
