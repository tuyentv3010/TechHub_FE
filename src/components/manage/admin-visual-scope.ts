const ADMIN_CORE_ROUTES = [
  "/manage/dashboard",
  "/manage/accounts",
  "/manage/roles",
  "/manage/permissions",
  "/manage/blogs",
  "/manage/files",
  "/manage/unauthorized",
] as const;

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isAdminCourseStudioRoute(pathname: string) {
  return matchesRoute(pathname, "/manage/courses");
}

export function isAdminCoreCommandRoute(pathname: string) {
  return ADMIN_CORE_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function getAdminVisualVariant(pathname: string) {
  if (isAdminCourseStudioRoute(pathname)) {
    return "studio" as const;
  }

  if (isAdminCoreCommandRoute(pathname)) {
    return "command" as const;
  }

  return "default" as const;
}
