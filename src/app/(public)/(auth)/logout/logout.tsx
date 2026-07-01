// "use client";
// import {
//   getAccessTokenFromLocalStorage,
//   getRefreshTokenFromLocalStorage,
// } from "@/lib/utils";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useEffect, useRef, Suspense } from "react";

// export default function Logout() {
//   return <Suspense fallback={<div>Loading...</div>}></Suspense>;
// }

// function LogoutComponent() {
//   const route = useRouter();
//   const searchParams = useSearchParams();
//   const refreshTokenFromUrl = searchParams.get("refreshToken");
//   const accessTokenFromUrl = searchParams.get("accessToken");
//   const ref = useRef<any>(null);

//   // useEffect(() => {
//   //   if (
//   //     ref.current ||
//   //     (refreshTokenFromUrl &&
//   //       refreshTokenFromUrl !== getRefreshTokenFromLocalStorage()) ||
//   //     (accessTokenFromUrl &&
//   //       accessTokenFromUrl !== getAccessTokenFromLocalStorage())
//   //   ) {
//   //     return;
//   //   }
//   //   ref.current = mutateAsync;
//   //   mutateAsync().then(() => {
//   //     setTimeout(() => {
//   //       ref.current = null;
//   //     }, 1000);
//   //     route.push("/login");
//   //   });
//   // }, [mutateAsync, route, refreshTokenFromUrl, accessTokenFromUrl]);

//   return <div>Logout Page</div>;
// }

"use client";
import {
  handleErrorApi,
  removeTokenFromLocalStorage,
} from "@/lib/utils";
import { useEffect, useRef } from "react";
import { useLogoutMutation } from "@/queries/useAuth";
import { useAppContext } from "@/components/app-provider";

export default function Logout() {
  const { setIsAuth, setRole, setPermissions } = useAppContext();
  const logoutMutation = useLogoutMutation();
  const ref = useRef<any>(null);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;

    const performLogout = async () => {
      try {
        await logoutMutation.mutateAsync();
        removeTokenFromLocalStorage();
        setIsAuth(false);
        setRole(null);
        setPermissions(null);
        window.location.replace("/login");
      } catch (error: any) {
        handleErrorApi({ error });
        removeTokenFromLocalStorage();
        setIsAuth(false);
        setRole(null);
        setPermissions(null);
        window.location.replace("/login");
      }
    };

    performLogout();
  }, [logoutMutation, setIsAuth, setRole, setPermissions]);

  return <div>Logging out...</div>;
}
