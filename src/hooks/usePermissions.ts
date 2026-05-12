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
  const { data: profileData, isLoading: isProfileLoading } = useAccountProfile();
  const userId = profileData?.payload?.data?.id;

  const {
    data: permissionsData,
    isLoading: isPermissionsLoading,
    error,
  } = useUserPermissions(userId || "", !!userId);

  const permissions = useMemo<Permission[]>(() => {
    return permissionsData?.payload?.data || [];
  }, [permissionsData]);

  const hasPermission = (method: PermissionMethod, urlPattern: string) => {
    return permissions.some(
      (permission) =>
        methodMatches(permission.method, method) &&
        permission.allowed &&
        (permission.url === urlPattern || matchPattern(permission.url, urlPattern))
    );
  };

  const hasPermissionByName = (permissionName: string) => {
    return permissions.some(
      (permission) => permission.name === permissionName && permission.allowed
    );
  };

  return {
    permissions,
    error,
    isLoading: isProfileLoading || (!!userId && isPermissionsLoading),
    hasPermission,
    hasPermissionByName,
  };
};

function methodMatches(
  permissionMethod: PermissionMethodOrWildcard,
  requestedMethod: PermissionMethod
): boolean {
  return permissionMethod === "*" || permissionMethod === requestedMethod;
}

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
