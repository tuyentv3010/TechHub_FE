import { useAccountProfile, useUserPermissions } from "@/queries/useAccount";
import { useMemo } from "react";

type PermissionMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type PermissionMethodOrWildcard = PermissionMethod | "*";

interface Permission {
  id: string;
  name: string;
  url: string;
  method: PermissionMethodOrWildcard;
  resource: string;
  source: string;
  allowed: boolean;
}

export const usePermissions = () => {
  const { data: profileData } = useAccountProfile();
  console.log("🔍 [usePermissions] Profile data:", profileData);
  
  const userId = profileData?.payload?.data?.id;
  console.log("👤 [usePermissions] User ID:", userId);

  const { data: permissionsData, isLoading, error } = useUserPermissions(
    userId || "",
    !!userId
  );

  console.log("📋 [usePermissions] Permissions API response:", permissionsData);
  console.log("⏳ [usePermissions] Loading:", isLoading);
  console.log("❌ [usePermissions] Error:", error);

  const permissions = useMemo(() => {
    // React Query returns the API response directly, which has structure: { success: boolean, data: Permission[] }
    const perms: Permission[] = permissionsData?.payload?.data || [];
    console.log("✅ [usePermissions] Parsed permissions:", perms);
    console.log("📊 [usePermissions] Total permissions count:", perms.length);
    
    if (perms.length > 0) {
      console.log("📝 [usePermissions] User's permissions:");
      perms.forEach((p: Permission, index: number) => {
        console.log(`   ${index + 1}. ${p.method} ${p.url} - ${p.name} (allowed: ${p.allowed})`);
      });
    } else {
      console.warn("⚠️ [usePermissions] No permissions found for user!");
    }
    
    return perms;
  }, [permissionsData]);

  const hasPermission = (method: PermissionMethod, urlPattern: string) => {
    const result = permissions.some(
      (p: Permission) =>
        methodMatches(p.method, method) &&
        p.allowed &&
        (p.url === urlPattern || matchPattern(p.url, urlPattern))
    );
    console.log(`🔐 [usePermissions] hasPermission(${method}, ${urlPattern}):`, result);
    return result;
  };

  const hasPermissionByName = (permissionName: string) => {
    const result = permissions.some((p: Permission) => p.name === permissionName && p.allowed);
    console.log(`🔐 [usePermissions] hasPermissionByName(${permissionName}):`, result);
    return result;
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    hasPermissionByName,
  };
};

function methodMatches(permissionMethod: PermissionMethodOrWildcard, requestedMethod: PermissionMethod): boolean {
  return permissionMethod === "*" || permissionMethod === requestedMethod;
}

// Simple pattern matching for URLs
function matchPattern(pattern: string, url: string): boolean {
  const regexPattern = pattern
    .replace(/\/\*\*$/g, "__TAIL_WILDCARD__")
    .replace(/\*\*/g, "__DOUBLE_WILDCARD__")
    .replace(/\*/g, "__WILDCARD__")
    .replace(/\{[^/}]+\}/g, "__PATH_PARAM__")
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\//g, "\\/")
    .replaceAll("__TAIL_WILDCARD__", "(?:\\/.*)?")
    .replaceAll("__DOUBLE_WILDCARD__", ".*")
    .replaceAll("__WILDCARD__", "[^/]*")
    .replaceAll("__PATH_PARAM__", "[^/]+");
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(url);
}
