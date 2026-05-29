import { clsx, type ClassValue } from "clsx";
import { UseFormSetError } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import { BadRequestError, EntityError, HttpError } from "./http";
import { toast } from "@/components/ui/use-toast";
import { OrderStatus, Role, TableStatus } from "@/constants/type";
import envConfig from "@/config";
import jwt from "jsonwebtoken";
import { format } from "date-fns";
import { TokenPayload } from "@/types/jwt.types";
import { BookX, CookingPot, HandCoins, Loader, Truck } from "lucide-react";
import slugify from "slugify";
import { convert } from "html-to-text";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}
export const normalizePath = (path: string) => {
  return path.startsWith("/") ? path.slice(1) : path;
};

export const handleErrorApi = ({
  error,
  setError,
  duration,
}: {
  error: any;
  setError?: UseFormSetError<any>;
  duration?: number;
}) => {
  if (error instanceof EntityError && setError) {
    // Handle 422 errors with field-specific messages
    error.payload.errors.forEach((item) => {
      setError(item.field, {
        type: "server",
        message: item.message,
      });
    });
  } else if (error instanceof BadRequestError) {
    // Handle 400 errors with custom error message
    toast({
      title: "Lỗi",
      description: error.payload.error || "Lỗi yêu cầu không hợp lệ",
      variant: "destructive",
      duration: duration ?? 5000,
    });
    if (setError) {
      // Optionally map to a specific field (e.g., trainName for uniqueness errors)
      setError("trainName", {
        type: "server",
        message: error.payload.error,
      });
    }
  } else if (error instanceof HttpError) {
    // Handle other HTTP errors
    toast({
      title: "Lỗi",
      description: error.payload.message || "Lỗi không xác định",
      variant: "destructive",
      duration: duration ?? 5000,
    });
  } else {
    // Handle unexpected errors
    toast({
      title: "Lỗi",
      description: "Lỗi không xác định",
      variant: "destructive",
      duration: duration ?? 5000,
    });
  }
};
const isBrowser = typeof window !== "undefined";
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_INFO_KEY = "userInfo";
const AUTH_STORAGE_MODE_KEY = "authStorageMode";
type AuthStorageMode = "local" | "session";

const getAuthStorageMode = (): AuthStorageMode => {
  if (!isBrowser) return "local";
  if (sessionStorage.getItem(AUTH_STORAGE_MODE_KEY) === "session") {
    return "session";
  }
  if (localStorage.getItem(AUTH_STORAGE_MODE_KEY) === "local") {
    return "local";
  }
  if (sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
    return "session";
  }
  return "local";
};

const getAuthStorage = (mode = getAuthStorageMode()) =>
  mode === "session" ? sessionStorage : localStorage;

const getAuthStorageItem = (key: string) => {
  if (!isBrowser) return null;
  return sessionStorage.getItem(key) ?? localStorage.getItem(key);
};

const removeAuthStorageItems = (storage: Storage) => {
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
  storage.removeItem(USER_INFO_KEY);
  storage.removeItem(AUTH_STORAGE_MODE_KEY);
};

const setAuthCookie = (key: string, value: string, maxAge?: number) => {
  if (!isBrowser) return;
  const isSecure = window.location.protocol === "https:";
  const cookieOptions = [
    `${key}=${value}`,
    "path=/",
    ...(maxAge ? [`max-age=${maxAge}`] : []),
    "sameSite=Lax",
    ...(isSecure ? ["secure"] : []),
  ].join("; ");
  document.cookie = cookieOptions;
};

export const getAccessTokenFromLocalStorage = () => {
  return getAuthStorageItem(ACCESS_TOKEN_KEY);
};
export const getRefreshTokenFromLocalStorage = () => {
  return getAuthStorageItem(REFRESH_TOKEN_KEY);
};

export const getUserInfoFromStorage = () => {
  return getAuthStorageItem(USER_INFO_KEY);
};

export const persistAuthSession = ({
  accessToken,
  refreshToken,
  userInfo,
  remember,
}: {
  accessToken: string;
  refreshToken: string;
  userInfo?: unknown;
  remember: boolean;
}) => {
  if (!isBrowser) return;
  const mode: AuthStorageMode = remember ? "local" : "session";
  const storage = getAuthStorage(mode);
  const otherStorage = mode === "local" ? sessionStorage : localStorage;

  removeAuthStorageItems(otherStorage);
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  storage.setItem(AUTH_STORAGE_MODE_KEY, mode);
  if (userInfo !== undefined) {
    storage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  }

  const accessTokenMaxAge = remember ? 24 * 60 * 60 : undefined;
  const refreshTokenMaxAge = remember ? 7 * 24 * 60 * 60 : undefined;
  setAuthCookie(ACCESS_TOKEN_KEY, accessToken, accessTokenMaxAge);
  setAuthCookie(REFRESH_TOKEN_KEY, refreshToken, refreshTokenMaxAge);
  setAuthCookie(AUTH_STORAGE_MODE_KEY, mode, refreshTokenMaxAge);
};

export const setUserInfoToAuthStorage = (userInfo: unknown) => {
  if (!isBrowser) return;
  getAuthStorage().setItem(USER_INFO_KEY, JSON.stringify(userInfo));
};

export const setAccessTokenToLocalStorage = (value: string) => {
  if (!isBrowser) return;
  const mode = getAuthStorageMode();
  getAuthStorage(mode).setItem(ACCESS_TOKEN_KEY, value);
  setAuthCookie(ACCESS_TOKEN_KEY, value, mode === "local" ? 24 * 60 * 60 : undefined);
};

export const setRefreshTokenToLocalStorage = (value: string) => {
  if (!isBrowser) return;
  const mode = getAuthStorageMode();
  getAuthStorage(mode).setItem(REFRESH_TOKEN_KEY, value);
  setAuthCookie(REFRESH_TOKEN_KEY, value, mode === "local" ? 7 * 24 * 60 * 60 : undefined);
};

export const removeTokenFromLocalStorage = () => {
  if (!isBrowser) return;
  removeAuthStorageItems(localStorage);
  removeAuthStorageItems(sessionStorage);
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
  document.cookie = `authStorageMode=; ${clearCookieOptions}`;
  
  // Dispatch custom event to notify app-provider
  window.dispatchEvent(new Event("auth-logout"));
};
////
let refreshTokenRequest: Promise<void> | null = null;

export const checkAndRefreshToken = async (param?: {
  onError?: () => void;
  onSuccess?: () => void;
  force?: boolean;
  redirectOnError?: boolean;
}) => {
  // Khong nen dua logic lay access vs refresh token ra khoi cai function 'checkAndRefreshToken'
  // Vi de moi lan ma checkAndRefreshToken() duoc goi thi chung ta se co mot access va refresh token moi
  // tranh hien tuong bug no lay access va refresh token cu o lan dau roi goi cho cac lan goi tiep theo
  const accessToken = getAccessTokenFromLocalStorage();
  const refreshToken = getRefreshTokenFromLocalStorage();
  
  console.log('[checkAndRefreshToken] Starting check...', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    force: param?.force
  });
  
  // Chua dang nhap thi cung khong cho chay
  if (!refreshToken || (!accessToken && !param?.force)) {
    console.log('[checkAndRefreshToken] No tokens found, skipping');
    return;
  }
  
  const decodedAccessToken = accessToken ? decodeToken(accessToken) : null;
  const decodedRefreshToken = decodeToken(refreshToken);
  //Thoi diem het han cua token tinh theo epoch time(s)
  // Con khi cac ban dung cu phap new Date().getTime() thi no se tra ve epoch time (ms)
  const now = Math.round(new Date().getTime() / 1000);
  
  // Check if access token is already expired
  const isAccessTokenExpired = !decodedAccessToken || decodedAccessToken.exp <= now;
  
  console.log('[checkAndRefreshToken] Token status:', {
    accessTokenExp: decodedAccessToken ? new Date(decodedAccessToken.exp * 1000).toLocaleTimeString() : null,
    refreshTokenExp: new Date(decodedRefreshToken.exp * 1000).toLocaleTimeString(),
    now: new Date(now * 1000).toLocaleTimeString(),
    isAccessTokenExpired,
    isRefreshTokenExpired: decodedRefreshToken.exp <= now,
    timeUntilAccessExpiry: decodedAccessToken ? decodedAccessToken.exp - now : null,
    timeUntilRefreshExpiry: decodedRefreshToken.exp - now
  });
  
  // Truong hop refresh token het han thi khong xu li nua
  if (decodedRefreshToken.exp <= now) {
    console.log('[checkAndRefreshToken] Refresh token expired, logging out');
    removeTokenFromLocalStorage();
    param?.onError?.();
    return;
  }
  
  // If access token expired but refresh token still valid, force refresh
  if (isAccessTokenExpired) {
    console.log('[checkAndRefreshToken] Access token expired, forcing refresh');
    param = { ...param, force: true };
  }
  
  // Vi du access token cua chung ta co thoi gian het han la 10s
  // thi minh se kiem tra con 1/3 thoi gian (3s) thi minh se cho refresh token lai
  // thoi gian con lai se tinh dua tren cong thuc :decodedAccessToken.exp - now
  // thoi gian het han cua access token dua tren cong thuc : decodedAccessToken - decodeAccessToken.iat
  if (
    param?.force ||
    !decodedAccessToken ||
    decodedAccessToken.exp - now <
      (decodedAccessToken.exp - decodedAccessToken.iat) / 3
  ) {
    // Call Next.js API route for refresh token
    // This allows server-side to clear httpOnly cookies when token is revoked
    console.log('[checkAndRefreshToken] Calling refresh token API...');
    try {
      if (refreshTokenRequest) {
        await refreshTokenRequest;
        param?.onSuccess?.();
        return;
      }

      refreshTokenRequest = (async () => {
      const response = await fetch("/api/auth/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: include cookies for httpOnly cookies
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to refresh token" }));
        throw new Error(errorData.message || "Failed to refresh token");
      }
      
      const result = await response.json();
      console.log('[checkAndRefreshToken] Refresh successful:', result);
      
      // Update tokens in localStorage
      // Cookies are already set by server-side API route with httpOnly flag
      if (result.success && result.data) {
        setAccessTokenToLocalStorage(result.data.accessToken);
        setRefreshTokenToLocalStorage(result.data.refreshToken);
      } else {
        throw new Error("Invalid refresh token response");
      }
      })();

      await refreshTokenRequest;
      param?.onSuccess?.();
    } catch (error: any) {
      console.error("[checkAndRefreshToken] Failed to refresh token:", error);
      // Clear tokens immediately when refresh fails
      // This handles the case where refresh token was revoked (token rotation)
      // Cookies are already cleared by server-side API route when error occurs
      removeTokenFromLocalStorage();
      
      // If refresh token not found in database (revoked), force redirect to login
      // This happens when token was rotated but old token still in cookies
      if (
        param?.redirectOnError !== false &&
        (error?.status === 401 ||
          error?.message?.includes("not found") ||
          error?.message?.includes("revoked") ||
          error?.message?.includes("Cant not find"))
      ) {
        console.log("[checkAndRefreshToken] Refresh token revoked or invalid, redirecting to login");
        // Use window.location for full page reload to clear all state
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
      
      param?.onError?.();
    } finally {
      refreshTokenRequest = null;
    }
  } else {
    console.log('[checkAndRefreshToken] Token still valid, no refresh needed');
  }
};
/**
 * Format currency input based on currency type
 * @param value - The numeric value
 * @param currency - The currency type ('VND' or 'USD')
 * @returns Formatted string
 */
/**
 * Format giá theo currency của course (BE-driven). Nếu currency null/undefined mặc định VND.
 */
export function formatPrice(value: number | null | undefined, currency?: string | null): string {
  const amount = value ?? 0;
  const code = (currency || "VND").toUpperCase();
  if (code === "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  }
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

export function formatCurrencyByType(value: number, currency: 'VND' | 'USD'): string {
  if (currency === 'USD') {
    return value.toFixed(2);
  }
  return formatCurrencyInput(value);
}

/**
 * Parse currency input based on currency type
 * @param value - The formatted string
 * @param currency - The currency type ('VND' or 'USD')
 * @returns Numeric value
 */
export function parseCurrencyByType(value: string, currency: 'VND' | 'USD'): number {
  if (currency === 'USD') {
    // Remove all characters except digits and decimal points
    let cleaned = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point - keep the first one
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return parseCurrencyInput(value);
}

export const formatCurrency = (number: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(number);
};

/**
 * Format number to display with spaces (e.g., 120000 -> "120 000")
 * @param value - The number or string to format
 * @returns Formatted string with spaces
 */
export function formatCurrencyInput(value: string | number): string {
  // Remove all non-digit characters
  const numericValue = String(value).replace(/\D/g, '');

  if (!numericValue) return '';

  // Add spaces every 3 digits from the right
  return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Parse formatted currency string back to number (e.g., "120 000" -> 120000)
 * @param value - The formatted string
 * @returns The numeric value
 */
export function parseCurrencyInput(value: string): number {
  // Remove all spaces and non-digit characters
  const numericValue = value.replace(/\s/g, '').replace(/\D/g, '');
  return numericValue ? parseInt(numericValue, 10) : 0;
}

// export const getVietnameseDishStatus = (
//   status: (typeof DishStatus)[keyof typeof DishStatus]
// ) => {
//   switch (status) {
//     case DishStatus.Available:
//       return "Có sẵn";
//     case DishStatus.Unavailable:
//       return "Không có sẵn";
//     default:
//       return "Ẩn";
//   }
// };

export const getVietnameseOrderStatus = (
  status: (typeof OrderStatus)[keyof typeof OrderStatus]
) => {
  switch (status) {
    case OrderStatus.Delivered:
      return "Đã phục vụ";
    case OrderStatus.Paid:
      return "Đã thanh toán";
    case OrderStatus.Pending:
      return "Chờ xử lý";
    case OrderStatus.Processing:
      return "Đang nấu";
    default:
      return "Từ chối";
  }
};

export const getVietnameseTableStatus = (
  status: (typeof TableStatus)[keyof typeof TableStatus]
) => {
  switch (status) {
    case TableStatus.Available:
      return "Có sẵn";
    case TableStatus.Reserved:
      return "Đã đặt";
    default:
      return "Ẩn";
  }
};
export const getTableLink = ({
  token,
  tableNumber,
}: {
  token: string;
  tableNumber: number;
}) => {
  return (
    envConfig.NEXT_PUBLIC_URL + "/tables/" + tableNumber + "?token=" + token
  );
};

export const decodeToken = (token: string) => {
  return jwt.decode(token) as TokenPayload;
};

export function removeAccents(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export const simpleMatchText = (fullText: string, matchText: string) => {
  return removeAccents(fullText.toLowerCase()).includes(
    removeAccents(matchText.trim().toLowerCase())
  );
};

export const formatDateTimeToLocaleString = (date: string | Date) => {
  return format(
    date instanceof Date ? date : new Date(date),
    "HH:mm:ss dd/MM/yyyy"
  );
};

export const formatDateTimeToTimeString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), "HH:mm:ss");
};

export const OrderStatusIcon = {
  [OrderStatus.Pending]: Loader,
  [OrderStatus.Processing]: CookingPot,
  [OrderStatus.Rejected]: BookX,
  [OrderStatus.Delivered]: Truck,
  [OrderStatus.Paid]: HandCoins,
};
export const wrapServerApi = async <T>(fn: () => Promise<T>) => {
  let result = null;
  try {
    result = await fn();
  } catch (error: any) {
    if (error.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
  }
  return result;
};

export const generateSlugUrl = ({ name, id }: { name: string; id: number }) => {
  return `${slugify(name)}-i.${id}`;
};
export const getIdFromSlugUrl = (slug: string) => {
  return Number(slug.split("-i.")[1]);
};

export const htmlToTextForDescription = (html: string) => {
  return convert(html, {
    limits: {
      maxInputLength: 140,
    },
  });
};
import { useAppContext } from "@/components/app-provider";
import { Permission } from "@/types/jwt.types";

export function usePermissions() {
  const { permissions } = useAppContext();

  const hasPermission = (permissionName: string): boolean => {
    if (!permissions) return false;
    return permissions.some((perm: Permission) => perm.name === permissionName);
  };

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    if (!permissions) return false;
    return permissionNames.some((name) =>
      permissions.some((perm: Permission) => perm.name === name)
    );
  };

  const hasModulePermission = (module: Permission["module"]): boolean => {
    if (!permissions) return false;
    return permissions.some((perm: Permission) => perm.module === module);
  };

  return { hasPermission, hasAnyPermission, hasModulePermission };
}

