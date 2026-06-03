"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { RoleType, Permission } from "@/types/jwt.types";
import {
  decodeToken,
  getAccessTokenFromLocalStorage,
  getRefreshTokenFromLocalStorage,
  removeTokenFromLocalStorage,
  setUserInfoToAuthStorage,
} from "@/lib/utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import RefreshToken from "@/components/refresh-token";
import { SocketProvider } from "@/providers/SocketProvider";
import accountApiRequest from "@/apiRequests/account";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

type AppContextType = {
  isAuth: boolean;
  setIsAuth: (isAuth: boolean) => void;
  role: RoleType | null;
  setRole: (role: RoleType | null) => void;
  permissions: Permission[] | null;
  setPermissions: (permissions: Permission[] | null) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const ROLE_PRIORITY: RoleType[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "INSTRUCTOR",
  "STAFF",
  "LEARNER",
  "CUSTOMER",
  "GUEST",
];

const resolvePrimaryRole = (roles?: unknown): RoleType | null => {
  const roleList = Array.isArray(roles)
    ? roles.map((item) => String(item).toUpperCase())
    : roles
      ? [String(roles).toUpperCase()]
      : [];

  for (const role of ROLE_PRIORITY) {
    if (roleList.includes(role)) {
      return role;
    }
  }

  return (roleList[0] as RoleType | undefined) ?? null;
};

const isTokenFresh = (token: string) => {
  try {
    const decoded = decodeToken(token);
    const now = Math.round(Date.now() / 1000);
    return Boolean(decoded?.exp && decoded.exp > now);
  } catch {
    return false;
  }
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(false);
  const [role, setRole] = useState<RoleType | null>(null);
  const [permissions, setPermissions] = useState<Permission[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    const applyProfileRole = async () => {
      const token = getAccessTokenFromLocalStorage();
      const refreshToken = getRefreshTokenFromLocalStorage();
      if (token) {
        if (!isTokenFresh(token)) {
          if (refreshToken) {
            if (isMounted) {
              setIsAuth(true);
              setPermissions(null);
            }
            return;
          }

          removeTokenFromLocalStorage();
          if (isMounted) {
            setIsAuth(false);
            setRole(null);
            setPermissions(null);
          }
          return;
        }

        try {
          setIsAuth(true);
          const profileResponse = await accountApiRequest.getProfile({
            redirectOnUnauthorized: false,
          });
          const profile = profileResponse?.payload?.data;
          const primaryRole = resolvePrimaryRole(profile?.roles);

          if (isMounted) {
            setRole(primaryRole);
            if (profile) {
              setUserInfoToAuthStorage(profile);
            }
          }
        } catch (error) {
          console.error("Failed to load profile for auth role:", error);

          if ((error as { status?: number })?.status === 401) {
            removeTokenFromLocalStorage();
            if (isMounted) {
              setIsAuth(false);
              setRole(null);
              setPermissions(null);
            }
            return;
          }

          try {
            const decoded = decodeToken(token);
            if (isMounted) {
              setRole(resolvePrimaryRole(decoded?.roles ?? decoded?.role));
            }
          } catch (decodeError) {
            console.error("Failed to decode token:", decodeError);
            if (isMounted) {
              setIsAuth(false);
              setRole(null);
              setPermissions(null);
            }
          }
        }
      } else {
        // No token - user is logged out
        if (isMounted) {
          setIsAuth(false);
          setRole(null);
          setPermissions(null);
        }
      }
    };

    // Check on mount
    applyProfileRole();

    // Listen to storage changes (for logout in other tabs or auto-logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken" || e.key === "refreshToken") {
        applyProfileRole();
      }
    };

    // Listen to custom event for same-tab logout
    const handleLogout = () => {
      applyProfileRole();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-logout", handleLogout);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-logout", handleLogout);
    };
  }, []);

  return (
    <AppContext.Provider
      value={{ isAuth, setIsAuth, role, setRole, permissions, setPermissions }}
    >
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          {children}
          <RefreshToken />
          <ReactQueryDevtools initialIsOpen={false} />
        </SocketProvider>
      </QueryClientProvider>
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
