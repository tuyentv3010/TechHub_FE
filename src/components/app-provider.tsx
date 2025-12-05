"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { RoleType, Permission, TokenPayload } from "@/types/jwt.types";
import { getAccessTokenFromLocalStorage, decodeToken } from "@/lib/utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import RefreshToken from "@/components/refresh-token";
import { SocketProvider } from "@/providers/SocketProvider";

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
    const checkAuth = () => {
      const token = getAccessTokenFromLocalStorage();
      if (token) {
        try {
          setIsAuth(true);
          const decoded = decodeToken(token);
          setRole(decoded?.role || null);
          // Permissions are fetched separately after login
        } catch (error) {
          console.error("Failed to decode token:", error);
          setIsAuth(false);
          setRole(null);
          setPermissions(null);
        }
      } else {
        // No token - user is logged out
        setIsAuth(false);
        setRole(null);
        setPermissions(null);
      }
    };

    // Check on mount
    checkAuth();

    // Listen to storage changes (for logout in other tabs or auto-logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken" || e.key === "refreshToken") {
        checkAuth();
      }
    };

    // Listen to custom event for same-tab logout
    const handleLogout = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-logout", handleLogout);

    return () => {
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
