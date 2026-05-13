"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  MessageSquareText,
  Palette,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { useAccountProfile } from "@/queries/useAccount";
import menuItems, { canAccessMenuItem, type MenuItem } from "@/app/manage/menuItems";

type DashboardAction = {
  title: string;
  description: string;
  href: string;
  Icon: LucideIcon;
  badge?: string;
};

type RoleMode = "admin" | "instructor" | "learner" | "general";

const ADMIN_PRIORITY = [
  "accounts",
  "roles",
  "permissions",
  "manageCourses",
  "learningPathsAdmin",
  "instructorApplications",
  "filesAdmin",
  "blogsAdmin",
  "revenue",
  "payouts",
  "aiAnalytics",
  "aiTraces",
  "aiProviders",
];

const INSTRUCTOR_PRIORITY = [
  "manageCourses",
  "learningPathsAdmin",
  "revenue",
  "payouts",
  "filesAdmin",
  "aiAnalytics",
];

export default function DashboardPage() {
  const t = useTranslations("ManageDashboard");
  const navT = useTranslations("AdminNav");
  const locale = useLocale();
  const { data: profileData, isLoading: isProfileLoading } = useAccountProfile();
  const { permissions, hasPermission, isLoading: isPermissionsLoading } = usePermissions();

  const account = profileData?.payload?.data;
  const roles: string[] = Array.isArray(account?.roles) ? account.roles : [];
  const normalizedRoles = roles.map((role) => role.toUpperCase());
  const roleMode: RoleMode = normalizedRoles.some((role) => role === "ADMIN" || role === "SUPER_ADMIN")
    ? "admin"
    : normalizedRoles.includes("INSTRUCTOR")
      ? "instructor"
      : normalizedRoles.includes("LEARNER")
        ? "learner"
        : "general";

  const accessibleItems = useMemo(() => {
    return menuItems.filter((item) => canAccessMenuItem(item, hasPermission));
  }, [hasPermission, permissions]);

  const workspaceItems = accessibleItems.filter((item) => item.href !== "/manage/dashboard");
  const allowedPermissions = permissions.filter((permission) => permission.allowed);
  const resourceCount = new Set(allowedPermissions.map((permission) => permission.resource).filter(Boolean)).size;
  const formattedPermissionCount = allowedPermissions.length.toLocaleString(locale);
  const formattedAreaCount = workspaceItems.length.toLocaleString(locale);

  const roleLabels = roles.length > 0 ? roles.map((role) => getRoleLabel(role, t)) : [t("roles.none")];
  const displayName = account?.username || account?.email || t("accountFallback");
  const statusLabel = account?.status || (account?.isActive ? t("status.active") : t("status.unknown"));

  const manageActions = getRoleManageActions(roleMode, workspaceItems, navT, t);
  const learnerActions = getLearnerActions(t);
  const focusActions = roleMode === "learner" || manageActions.length === 0 ? learnerActions : manageActions;
  const nextAction = focusActions[0] ?? learnerActions[0];
  const attentionItems = getAttentionItems({
    roleMode,
    workspaceItems,
    permissions: allowedPermissions,
    t,
  });

  if (isProfileLoading || isPermissionsLoading) {
    return (
      <AdminPageFrame eyebrow={t("eyebrow")} title={t("title")} description={t("description")}>
        <AdminSurface className="p-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 animate-pulse" />
            {t("loading")}
          </div>
        </AdminSurface>
      </AdminPageFrame>
    );
  }

  return (
    <AdminPageFrame eyebrow={t("eyebrow")} title={t("title")} description={t("description")}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title={t("summary.role.title")}
          value={roleLabels.join(", ")}
          description={t("summary.role.description", { name: displayName })}
          Icon={UserRound}
        />
        <SummaryCard
          title={t("summary.areas.title")}
          value={formattedAreaCount}
          description={t("summary.areas.description", { count: workspaceItems.length })}
          Icon={LayoutDashboard}
        />
        <SummaryCard
          title={t("summary.permissions.title")}
          value={formattedPermissionCount}
          description={t("summary.permissions.description", { count: resourceCount })}
          Icon={ShieldCheck}
        />
        <SummaryCard
          title={t("summary.status.title")}
          value={statusLabel}
          description={t("summary.status.description")}
          Icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <AdminSurface className="p-5 md:p-6">
          <SectionHeading
            title={t(`roleFocus.${roleMode}.title`)}
            description={t(`roleFocus.${roleMode}.description`)}
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {focusActions.slice(0, 6).map((action) => (
              <ActionTile key={action.href} action={action} />
            ))}
          </div>
        </AdminSurface>

        <AdminSurface className="p-5 md:p-6">
          <SectionHeading title={t("next.title")} description={t("next.description")} />
          <div className="mt-5 rounded-lg border bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <nextAction.Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{nextAction.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{nextAction.description}</p>
              </div>
            </div>
            <Button asChild className="mt-4 w-full">
              <Link href={nextAction.href}>
                {t("open")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </AdminSurface>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.45fr)]">
        <AdminSurface className="p-5 md:p-6">
          <SectionHeading title={t("modules.title")} description={t("modules.description")} />
          {workspaceItems.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{t("modules.emptyTitle")}</p>
              <p className="mt-1">{t("modules.emptyDescription")}</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {workspaceItems.map((item) => (
                <ModuleTile key={item.href} item={item} navT={navT} t={t} />
              ))}
            </div>
          )}
        </AdminSurface>

        <AdminSurface className="p-5 md:p-6">
          <SectionHeading title={t("attention.title")} description={t("attention.description")} />
          <div className="mt-5 space-y-3">
            {attentionItems.map((item) => (
              <div key={item.title} className="rounded-lg border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5 rounded-md p-2", item.tone)}>
                    <item.Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminSurface>
      </div>
    </AdminPageFrame>
  );
}

function SummaryCard({
  title,
  value,
  description,
  Icon,
}: {
  title: string;
  value: string;
  description: string;
  Icon: LucideIcon;
}) {
  return (
    <Card className="border-border/70">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 truncate text-2xl font-semibold text-foreground">{value}</p>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ActionTile({ action }: { action: DashboardAction }) {
  return (
    <Link
      href={action.href}
      className="group flex min-h-[132px] flex-col justify-between rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <action.Icon className="h-5 w-5" />
        </div>
        {action.badge ? <Badge variant="secondary">{action.badge}</Badge> : null}
      </div>
      <div className="mt-4">
        <p className="font-semibold text-foreground">{action.title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{action.description}</p>
      </div>
    </Link>
  );
}

function ModuleTile({
  item,
  navT,
  t,
}: {
  item: MenuItem;
  navT: ReturnType<typeof useTranslations<"AdminNav">>;
  t: ReturnType<typeof useTranslations<"ManageDashboard">>;
}) {
  const titleKey = item.titleKey ?? "dashboard";

  return (
    <Link
      href={item.href}
      className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-muted p-2 text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <item.Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{navT(titleKey as never)}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {t(getModuleDescriptionKey(titleKey) as never)}
          </p>
        </div>
        <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}

function getRoleLabel(
  role: string,
  t: ReturnType<typeof useTranslations<"ManageDashboard">>
) {
  const normalized = role.toUpperCase();
  if (normalized === "SUPER_ADMIN") return t("roles.superAdmin");
  if (normalized === "ADMIN") return t("roles.admin");
  if (normalized === "INSTRUCTOR") return t("roles.instructor");
  if (normalized === "LEARNER") return t("roles.learner");

  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getRoleManageActions(
  roleMode: RoleMode,
  workspaceItems: MenuItem[],
  navT: ReturnType<typeof useTranslations<"AdminNav">>,
  t: ReturnType<typeof useTranslations<"ManageDashboard">>
): DashboardAction[] {
  const priority = roleMode === "instructor" ? INSTRUCTOR_PRIORITY : ADMIN_PRIORITY;
  const orderedItems = [
    ...priority
      .map((key) => workspaceItems.find((item) => item.titleKey === key))
      .filter(Boolean),
    ...workspaceItems.filter((item) => !priority.includes(item.titleKey ?? "")),
  ] as MenuItem[];

  return orderedItems.map((item) => {
    const titleKey = item.titleKey ?? "dashboard";
    return {
      title: navT(titleKey as never),
      description: t(getModuleDescriptionKey(titleKey) as never),
      href: item.href,
      Icon: item.Icon,
      badge: t("badges.manage"),
    };
  });
}

function getLearnerActions(
  t: ReturnType<typeof useTranslations<"ManageDashboard">>
): DashboardAction[] {
  return [
    {
      title: t("learnerActions.myLearning.title"),
      description: t("learnerActions.myLearning.description"),
      href: "/my-learning",
      Icon: GraduationCap,
    },
    {
      title: t("learnerActions.courses.title"),
      description: t("learnerActions.courses.description"),
      href: "/courses",
      Icon: BookOpen,
    },
    {
      title: t("learnerActions.paths.title"),
      description: t("learnerActions.paths.description"),
      href: "/learning-paths",
      Icon: LibraryBig,
    },
    {
      title: t("learnerActions.aiChat.title"),
      description: t("learnerActions.aiChat.description"),
      href: "/ai-chat",
      Icon: MessageSquareText,
    },
    {
      title: t("learnerActions.notifications.title"),
      description: t("learnerActions.notifications.description"),
      href: "/notifications",
      Icon: Bell,
    },
    {
      title: t("learnerActions.settings.title"),
      description: t("learnerActions.settings.description"),
      href: "/setting",
      Icon: Palette,
    },
  ];
}

function getAttentionItems({
  roleMode,
  workspaceItems,
  permissions,
  t,
}: {
  roleMode: RoleMode;
  workspaceItems: MenuItem[];
  permissions: Array<{ resource: string; url: string }>;
  t: ReturnType<typeof useTranslations<"ManageDashboard">>;
}) {
  const hasAiAccess = workspaceItems.some((item) => item.titleKey?.startsWith("ai"));
  const hasUserAdmin = workspaceItems.some((item) =>
    ["accounts", "roles", "permissions"].includes(item.titleKey ?? "")
  );
  const hasCurriculum = workspaceItems.some((item) =>
    ["manageCourses", "learningPathsAdmin"].includes(item.titleKey ?? "")
  );

  const items = [
    {
      title: t(`attention.role.${roleMode}.title`),
      description: t(`attention.role.${roleMode}.description`),
      Icon: roleMode === "learner" ? GraduationCap : ShieldCheck,
      tone: "bg-primary/10 text-primary",
    },
  ];

  if (workspaceItems.length === 0) {
    items.push({
      title: t("attention.limited.title"),
      description: t("attention.limited.description"),
      Icon: LayoutDashboard,
      tone: "bg-muted text-muted-foreground",
    });
  }

  if (hasCurriculum) {
    items.push({
      title: t("attention.curriculum.title"),
      description: t("attention.curriculum.description"),
      Icon: BookOpen,
      tone: "bg-emerald-500/10 text-emerald-600",
    });
  }

  if (hasUserAdmin) {
    items.push({
      title: t("attention.governance.title"),
      description: t("attention.governance.description"),
      Icon: Users,
      tone: "bg-sky-500/10 text-sky-600",
    });
  }

  if (hasAiAccess || permissions.some((permission) => permission.resource.toLowerCase().includes("ai"))) {
    items.push({
      title: t("attention.ai.title"),
      description: t("attention.ai.description"),
      Icon: Sparkles,
      tone: "bg-violet-500/10 text-violet-600",
    });
  }

  return items.slice(0, 4);
}

function getModuleDescriptionKey(titleKey: string) {
  switch (titleKey) {
    case "aiAnalytics":
      return "moduleDescriptions.aiAnalytics";
    case "aiTraces":
      return "moduleDescriptions.aiTraces";
    case "aiProviders":
      return "moduleDescriptions.aiProviders";
    case "revenue":
      return "moduleDescriptions.revenue";
    case "payouts":
      return "moduleDescriptions.payouts";
    case "accounts":
      return "moduleDescriptions.accounts";
    case "instructorApplications":
      return "moduleDescriptions.instructorApplications";
    case "roles":
      return "moduleDescriptions.roles";
    case "blogsAdmin":
      return "moduleDescriptions.blogsAdmin";
    case "filesAdmin":
      return "moduleDescriptions.filesAdmin";
    case "permissions":
      return "moduleDescriptions.permissions";
    case "manageCourses":
      return "moduleDescriptions.manageCourses";
    case "learningPathsAdmin":
      return "moduleDescriptions.learningPathsAdmin";
    default:
      return "moduleDescriptions.default";
  }
}
