"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { RoleType, Permission } from "@/types/jwt.types";
import {
  decodeToken,
  getAccessTokenFromLocalStorage,
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(false);
  const [role, setRole] = useState<RoleType | null>(null);
  const [permissions, setPermissions] = useState<Permission[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    const applyProfileRole = async () => {
      const token = getAccessTokenFromLocalStorage();
      if (token) {
        try {
          setIsAuth(true);
          const profileResponse = await accountApiRequest.getProfile();
          const profile = profileResponse?.payload?.data;
          const primaryRole = profile?.roles?.[0] || null;

          if (isMounted) {
            setRole(primaryRole as RoleType | null);
            if (profile) {
              setUserInfoToAuthStorage(profile);
            }
          }
        } catch (error) {
          console.error("Failed to load profile for auth role:", error);

          try {
            const decoded = decodeToken(token);
            if (isMounted) {
              setRole(decoded?.role || null);
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
