import type { PermissionSchemaType } from "@/schemaValidations/permission.schema";

type SupportedLocale = "en" | "ja" | "vi";
type MethodKey = PermissionSchemaType["method"];
type ResourceKey = PermissionSchemaType["resource"];
type ResourceMeta = {
  label: string;
  description: string;
};

type AccessCopy = {
  tabs: {
    business: string;
    technical: string;
    overview: string;
    advanced?: string;
    permissions: string;
  };
  pageDescriptions?: {
    roles: string;
    permissions: string;
  };
  permissionView: {
    title: string;
    description: string;
    resourcesLabel: string;
    actionsLabel: string;
    permissionsLabel: string;
  };
  roleView: {
    title: string;
    description: string;
    resourcesLabel: string;
    actionsLabel: string;
    permissionsLabel: string;
  };
  shared: {
    emptyResources: string;
    emptyActions: string;
    noPermissions: string;
    technicalHint: string;
  };
  methodLabels: Record<MethodKey, string>;
  resourceLabels: Partial<Record<ResourceKey, ResourceMeta>>;
};

type ResolvedAccessCopy = Omit<AccessCopy, "tabs" | "pageDescriptions"> & {
  tabs: {
    business: string;
    technical: string;
    overview: string;
    advanced: string;
    permissions: string;
  };
  pageDescriptions: {
    roles: string;
    permissions: string;
  };
};

const ACCESS_COPY: Record<SupportedLocale, AccessCopy> = {
  en: {
    tabs: {
      business: "Business view",
      technical: "Technical view",
      overview: "Overview",
      advanced: "Advanced",
      permissions: "Permissions",
    },
    pageDescriptions: {
      roles:
        "Start with the Overview tab for operational admins; switch to Advanced when a dev admin needs detailed role control.",
      permissions:
        "Start with the Overview tab for operational admins; use Advanced when a dev admin needs endpoint and HTTP method control.",
    },
    permissionView: {
      title: "Access overview",
      description:
        "For operational admins: review access by functional area and main actions without reading endpoint details.",
      resourcesLabel: "Functional areas",
      actionsLabel: "Allowed actions",
      permissionsLabel: "Permissions",
    },
    roleView: {
      title: "Role overview",
      description:
        "For operational admins: quickly review what each role manages and what it can do.",
      resourcesLabel: "Coverage",
      actionsLabel: "Main actions",
      permissionsLabel: "Permissions",
    },
    shared: {
      emptyResources: "No business areas assigned",
      emptyActions: "No actions assigned",
      noPermissions: "No permissions assigned yet",
      technicalHint:
        "Use the Advanced tab when a dev admin needs the full endpoint and HTTP method mapping.",
    },
    methodLabels: {
      GET: "View",
      POST: "Create",
      PUT: "Update",
      PATCH: "Adjust",
      DELETE: "Remove",
    },
    resourceLabels: {
      USERS: {
        label: "Users",
        description: "Accounts, learners, and staff records.",
      },
      ROLES: {
        label: "Roles",
        description: "Role definitions and responsibility groups.",
      },
      PERMISSIONS: {
        label: "Permissions",
        description: "Access rules and technical overrides.",
      },
      COURSES: {
        label: "Courses",
        description: "Course catalog, publishing, and maintenance.",
      },
      BLOGS: {
        label: "Blogs",
        description: "Articles, editorial workflow, and publishing.",
      },
      LEARNING_PATHS: {
        label: "Learning paths",
        description: "Path structure, sequencing, and approvals.",
      },
    },
  },
  ja: {
    tabs: {
      business: "業務ビュー",
      technical: "技術ビュー",
      overview: "概要",
      permissions: "権限",
    },
    permissionView: {
      title: "業務領域ごとのアクセス",
      description: "まずは業務機能単位で権限を確認し、必要な場合だけエンドポイント詳細を見ます。",
      resourcesLabel: "業務領域",
      actionsLabel: "許可された操作",
      permissionsLabel: "権限数",
    },
    roleView: {
      title: "責務ごとの役割",
      description: "エンドポイント一覧を読まなくても、各役割の担当範囲を確認できます。",
      resourcesLabel: "担当範囲",
      actionsLabel: "主な操作",
      permissionsLabel: "権限数",
    },
    shared: {
      emptyResources: "割り当てられた領域がありません",
      emptyActions: "割り当てられた操作がありません",
      noPermissions: "まだ権限が割り当てられていません",
      technicalHint: "エンドポイントと HTTP メソッドまで確認する場合は技術ビューに切り替えてください。",
    },
    methodLabels: {
      GET: "閲覧",
      POST: "作成",
      PUT: "更新",
      PATCH: "調整",
      DELETE: "削除",
    },
    resourceLabels: {
      USERS: {
        label: "ユーザー",
        description: "アカウント、学習者、スタッフの管理。",
      },
      ROLES: {
        label: "役割",
        description: "役割定義と責務グループ。",
      },
      PERMISSIONS: {
        label: "権限",
        description: "アクセスルールと技術的な上書き設定。",
      },
      COURSES: {
        label: "コース",
        description: "コース管理、公開、メンテナンス。",
      },
      BLOGS: {
        label: "ブログ",
        description: "記事、編集フロー、公開管理。",
      },
      LEARNING_PATHS: {
        label: "学習パス",
        description: "パス構造、順序、承認管理。",
      },
    },
  },
  vi: {
    tabs: {
      business: "Theo nghiệp vụ",
      technical: "Theo kỹ thuật",
      overview: "Tổng quan",
      permissions: "Phân quyền",
    },
    permissionView: {
      title: "Quyền theo nhóm chức năng",
      description: "Nhìn theo nghiệp vụ trước, chỉ xuống endpoint khi cần kiểm tra kỹ thuật.",
      resourcesLabel: "Nhóm chức năng",
      actionsLabel: "Thao tác cho phép",
      permissionsLabel: "Số quyền",
    },
    roleView: {
      title: "Vai trò theo phạm vi công việc",
      description: "Xem nhanh mỗi vai trò đang quản lý gì mà không phải đọc toàn bộ ma trận endpoint.",
      resourcesLabel: "Phạm vi phụ trách",
      actionsLabel: "Thao tác chính",
      permissionsLabel: "Số quyền",
    },
    shared: {
      emptyResources: "Chưa gán nhóm chức năng",
      emptyActions: "Chưa gán thao tác",
      noPermissions: "Vai trò này chưa có quyền nào",
      technicalHint: "Chuyển sang tab kỹ thuật khi cần đối chiếu chính xác endpoint và HTTP method.",
    },
    methodLabels: {
      GET: "Xem",
      POST: "Tạo",
      PUT: "Cập nhật",
      PATCH: "Điều chỉnh",
      DELETE: "Xóa",
    },
    resourceLabels: {
      USERS: {
        label: "Người dùng",
        description: "Tài khoản, learner và nhân sự vận hành.",
      },
      ROLES: {
        label: "Vai trò",
        description: "Nhóm trách nhiệm và cấu hình vai trò.",
      },
      PERMISSIONS: {
        label: "Quyền truy cập",
        description: "Luật truy cập và cấu hình override kỹ thuật.",
      },
      COURSES: {
        label: "Khóa học",
        description: "Danh mục, xuất bản và vận hành khóa học.",
      },
      BLOGS: {
        label: "Bài viết",
        description: "Nội dung blog, biên tập và xuất bản.",
      },
      LEARNING_PATHS: {
        label: "Lộ trình học tập",
        description: "Thiết kế lộ trình, thứ tự và duyệt xuất bản.",
      },
    },
  },
};

const METHOD_ORDER: MethodKey[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export const METHOD_BADGE_TONE: Record<MethodKey, string> = {
  GET: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  POST: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
  PUT: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
  PATCH: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200",
  DELETE: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200",
};

const toSupportedLocale = (locale: string): SupportedLocale => {
  if (locale.startsWith("ja")) return "ja";
  if (locale.startsWith("vi")) return "vi";
  return "en";
};

const ACCESS_OVERRIDES: Record<
  SupportedLocale,
  Pick<ResolvedAccessCopy, "pageDescriptions"> & {
    tabs: Pick<ResolvedAccessCopy["tabs"], "overview" | "advanced">;
    permissionView: Partial<ResolvedAccessCopy["permissionView"]>;
    roleView: Partial<ResolvedAccessCopy["roleView"]>;
    shared: Pick<ResolvedAccessCopy["shared"], "technicalHint">;
  }
> = {
  en: {
    tabs: {
      overview: "Overview",
      advanced: "Advanced",
    },
    pageDescriptions: {
      roles:
        "Start with the Overview tab for operational admins; switch to Advanced when a dev admin needs detailed role control.",
      permissions:
        "Start with the Overview tab for operational admins; use Advanced when a dev admin needs endpoint and HTTP method control.",
    },
    permissionView: {
      title: "Access overview",
      description:
        "For operational admins: review access by functional area and main actions without reading endpoint details.",
      resourcesLabel: "Functional areas",
    },
    roleView: {
      title: "Role overview",
      description:
        "For operational admins: quickly review what each role manages and what it can do.",
    },
    shared: {
      technicalHint:
        "Use the Advanced tab when a dev admin needs the full endpoint and HTTP method mapping.",
    },
  },
  ja: {
    tabs: {
      overview: "概要",
      advanced: "詳細 / 高度",
    },
    pageDescriptions: {
      roles:
        "運用管理者はまず概要タブから確認し、dev admin が詳細に設定する場合は詳細 / 高度タブを使用します。",
      permissions:
        "運用管理者は概要タブで全体を確認し、endpoint と HTTP method の管理は dev admin 向けの詳細 / 高度タブで行います。",
    },
    permissionView: {
      title: "アクセス概要",
      description:
        "運用管理者向け。機能グループと主な操作から確認でき、endpoint 詳細まで読まなくても判断できます。",
    },
    roleView: {
      title: "役割の概要",
      description:
        "運用管理者向け。各役割が何を管理し、何ができるかを簡単に確認できます。",
    },
    shared: {
      technicalHint:
        "dev admin が endpoint と HTTP method まで正確に管理する場合は、詳細 / 高度タブを使用してください。",
    },
  },
  vi: {
    tabs: {
      overview: "Tổng quan",
      advanced: "Nâng cao",
    },
    pageDescriptions: {
      roles:
        "Bắt đầu ở tab Tổng quan cho admin vận hành; chuyển sang Nâng cao khi dev admin cần quản lý chi tiết.",
      permissions:
        "Bắt đầu ở tab Tổng quan cho admin vận hành; tab Nâng cao dành cho dev admin kiểm soát endpoint và HTTP method.",
    },
    permissionView: {
      title: "Tổng quan quyền truy cập",
      description:
        "Dành cho admin vận hành: xem quyền theo nhóm chức năng và thao tác chính mà không cần đọc endpoint.",
    },
    roleView: {
      title: "Tổng quan vai trò",
      description:
        "Dành cho admin vận hành: xem nhanh mỗi vai trò đang quản lý khu vực nào và được phép làm gì.",
      resourcesLabel: "Khu vực quản lý",
    },
    shared: {
      technicalHint:
        "Tab Nâng cao dành cho dev admin khi cần đối chiếu chính xác endpoint và HTTP method.",
    },
  },
};

export const getAccessCopy = (locale: string): ResolvedAccessCopy => {
  const supportedLocale = toSupportedLocale(locale);
  const base = ACCESS_COPY[supportedLocale];
  const override = ACCESS_OVERRIDES[supportedLocale];

  return {
    ...base,
    tabs: {
      ...base.tabs,
      overview: override.tabs.overview,
      advanced: override.tabs.advanced,
    },
    pageDescriptions: override.pageDescriptions,
    permissionView: {
      ...base.permissionView,
      ...override.permissionView,
    },
    roleView: {
      ...base.roleView,
      ...override.roleView,
    },
    shared: {
      ...base.shared,
      technicalHint: override.shared.technicalHint,
    },
  };
};

const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const formatFallbackResourceLabel = (resource: string) =>
  toTitleCase(resource.replace(/[_-]+/g, " "));

export const getResourceMeta = (resource: string, locale: string): ResourceMeta => {
  const copy = getAccessCopy(locale);
  const knownResourceMeta = copy.resourceLabels[resource as ResourceKey];

  if (knownResourceMeta) {
    return knownResourceMeta;
  }

  if (locale.startsWith("ja")) {
    return {
      label: formatFallbackResourceLabel(resource),
      description: `バックエンドから同期された未分類のリソース (${resource})。`,
    };
  }

  if (locale.startsWith("vi")) {
    return {
      label: formatFallbackResourceLabel(resource),
      description: `Nhóm tài nguyên chưa được FE phân loại sẵn, đồng bộ từ backend (${resource}).`,
    };
  }

  return {
    label: formatFallbackResourceLabel(resource),
    description: `Unmapped resource synchronized from the backend (${resource}).`,
  };
};

export const groupPermissionsByResource = (permissions: PermissionSchemaType[]) =>
  Object.entries(
    permissions.reduce<Record<string, PermissionSchemaType[]>>((acc, permission) => {
      const key = permission.resource;
      acc[key] = acc[key] ?? [];
      acc[key].push(permission);
      return acc;
    }, {})
  )
    .map(([resource, items]) => ({
      resource,
      permissions: [...items].sort(
        (left, right) =>
          METHOD_ORDER.indexOf(left.method) - METHOD_ORDER.indexOf(right.method) ||
          left.name.localeCompare(right.name)
      ),
    }))
    .sort((left, right) => {
      const resourceOrder = Object.keys(ACCESS_COPY.en.resourceLabels);
      const leftIndex = resourceOrder.indexOf(left.resource);
      const rightIndex = resourceOrder.indexOf(right.resource);

      if (leftIndex === -1 && rightIndex === -1) {
        return left.resource.localeCompare(right.resource);
      }

      if (leftIndex === -1) {
        return 1;
      }

      if (rightIndex === -1) {
        return -1;
      }

      return leftIndex - rightIndex;
    });

export const summarizePermissionActions = (
  permissions: PermissionSchemaType[],
  locale: string
) => {
  const copy = getAccessCopy(locale);
  return METHOD_ORDER.filter((method) =>
    permissions.some((permission) => permission.method === method)
  ).map((method) => ({
    method,
    label: copy.methodLabels[method],
  }));
};

export const summarizeRoleCoverage = (
  permissionIds: string[],
  permissions: PermissionSchemaType[],
  locale: string
) => {
  const matchedPermissions = permissions.filter((permission) =>
    permissionIds.includes(permission.id)
  );
  const resources = Array.from(
    new Set(matchedPermissions.map((permission) => permission.resource))
  ).map((resource) => getResourceMeta(resource, locale));

  return {
    permissions: matchedPermissions,
    resources,
    actions: summarizePermissionActions(matchedPermissions, locale),
  };
};
