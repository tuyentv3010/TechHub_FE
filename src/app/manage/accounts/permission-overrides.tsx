"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Search, ShieldCheck, ShieldX } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useDeleteUserPermissionOverrideMutation,
  useGetUserPermissionCatalog,
  useUpsertUserPermissionMutation,
} from "@/queries/useRole";
import { PermissionSchemaType } from "@/schemaValidations/permission.schema";
import { handleErrorApi } from "@/lib/utils";

type PermissionOverridesProps = {
  userId: string;
  enabled?: boolean;
};

type PermissionState = {
  label: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
};

type LocalPermissionState = Pick<PermissionSchemaType, "source" | "allowed">;

const PAGE_SIZE = 20;

const isUserOverride = (permission: PermissionSchemaType) =>
  permission.source === "USER_OVERRIDE" || permission.source === "OVERRIDE";

export default function PermissionOverrides({
  userId,
  enabled = true,
}: PermissionOverridesProps) {
  const t = useTranslations("ManageAccount.PermissionOverrides");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pendingPermissionIds, setPendingPermissionIds] = useState<Set<string>>(
    () => new Set()
  );
  const [localPermissionState, setLocalPermissionState] = useState<
    Record<string, LocalPermissionState>
  >({});
  const [rolePermissionState, setRolePermissionState] = useState<
    Record<string, LocalPermissionState>
  >({});

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(0);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const catalogParams = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      search: debouncedSearch || undefined,
    }),
    [debouncedSearch, page]
  );

  const catalogQuery = useGetUserPermissionCatalog(
    userId,
    catalogParams,
    enabled
  );
  const upsertOverrideMutation = useUpsertUserPermissionMutation();
  const deleteOverrideMutation = useDeleteUserPermissionOverrideMutation();

  const serverPermissions: PermissionSchemaType[] =
    catalogQuery.data?.payload?.data ?? [];
  const permissions: PermissionSchemaType[] = useMemo(
    () =>
      serverPermissions.map((permission) => ({
        ...permission,
        ...(localPermissionState[permission.id] ?? {}),
      })),
    [localPermissionState, serverPermissions]
  );
  const pagination = catalogQuery.data?.payload?.pagination;

  useEffect(() => {
    if (serverPermissions.length === 0) {
      return;
    }

    setRolePermissionState((current) => {
      let changed = false;
      const next = { ...current };

      serverPermissions.forEach((permission) => {
        if (isUserOverride(permission)) {
          return;
        }

        const roleState = {
          source: "ROLE" as const,
          allowed: permission.allowed !== false,
        };
        const currentState = next[permission.id];
        if (
          currentState?.source !== roleState.source ||
          currentState?.allowed !== roleState.allowed
        ) {
          next[permission.id] = roleState;
          changed = true;
        }
      });

      return changed ? next : current;
    });

    setLocalPermissionState((current) => {
      let changed = false;
      const next = { ...current };

      serverPermissions.forEach((permission) => {
        const localState = next[permission.id];
        if (
          localState &&
          localState.source === permission.source &&
          localState.allowed === permission.allowed
        ) {
          delete next[permission.id];
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [serverPermissions]);

  const getPermissionState = (permission: PermissionSchemaType): PermissionState => {
    if (isUserOverride(permission) && permission.allowed !== false) {
      return { label: t("AllowedOverride"), badgeVariant: "default" };
    }

    if (isUserOverride(permission) && permission.allowed === false) {
      return { label: t("DeniedOverride"), badgeVariant: "destructive" };
    }

    if (permission.allowed !== false) {
      return { label: t("AllowedByRole"), badgeVariant: "secondary" };
    }

    return { label: t("DeniedByRole"), badgeVariant: "outline" };
  };

  const setPermissionPending = (permissionId: string, pending: boolean) => {
    setPendingPermissionIds((current) => {
      const next = new Set(current);
      if (pending) {
        next.add(permissionId);
      } else {
        next.delete(permissionId);
      }
      return next;
    });
  };

  const setLocalState = (
    permissionId: string,
    state: LocalPermissionState | undefined
  ) => {
    setLocalPermissionState((current) => {
      const next = { ...current };
      if (state) {
        next[permissionId] = state;
      } else {
        delete next[permissionId];
      }
      return next;
    });
  };

  const applyOverride = async (permissionId: string, allowed: boolean) => {
    const previousState = permissions.find(
      (permission) => permission.id === permissionId
    );
    setPermissionPending(permissionId, true);
    setLocalState(permissionId, {
      source: "USER_OVERRIDE",
      allowed,
    });

    try {
      await upsertOverrideMutation.mutateAsync({
        userId,
        body: {
          permissionId,
          allowed,
          active: true,
        },
      });
    } catch (error) {
      setLocalState(
        permissionId,
        previousState
          ? {
              source: previousState.source,
              allowed: previousState.allowed,
            }
          : undefined
      );
      handleErrorApi({ error });
    } finally {
      setPermissionPending(permissionId, false);
    }
  };

  const resetOverride = async (permissionId: string) => {
    const previousState = permissions.find(
      (permission) => permission.id === permissionId
    );
    const roleState = rolePermissionState[permissionId];
    setPermissionPending(permissionId, true);
    if (roleState) {
      setLocalState(permissionId, roleState);
    }

    try {
      await deleteOverrideMutation.mutateAsync({ userId, permissionId });
    } catch (error) {
      setLocalState(
        permissionId,
        previousState
          ? {
              source: previousState.source,
              allowed: previousState.allowed,
            }
          : undefined
      );
      handleErrorApi({ error });
    } finally {
      setPermissionPending(permissionId, false);
    }
  };

  const isLoading = catalogQuery.isLoading;
  const isFetching = catalogQuery.isFetching;
  const loadError = catalogQuery.error as
    | { status?: number; message?: string; payload?: { message?: string } }
    | null;

  useEffect(() => {
    if (!loadError) {
      return;
    }

    console.error("[PermissionOverrides] Failed to load permission catalog", {
      status: loadError.status,
      message: loadError.message,
      payload: loadError.payload,
    });
  }, [loadError]);

  return (
    <section className="space-y-3 rounded-md border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold">{t("Title")}</h3>
        <Badge variant="outline">
          {t("PermissionCount", { count: pagination?.totalElements ?? 0 })}
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t("SearchPlaceholder")}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          {isFetching && !isLoading
            ? t("Refreshing")
            : t("PageLoadNote")}
        </span>
        <div className="relative">
          {t("PageStatus", {
            page: (pagination?.page ?? page) + 1,
            totalPages: Math.max(pagination?.totalPages ?? 1, 1),
          })}
        </div>
      </div>

      <ScrollArea className="h-[360px] rounded-md border">
        <div className="divide-y">
          {isLoading && (
            <div className="p-4 text-sm text-muted-foreground">
              {t("Loading")}
            </div>
          )}

          {!isLoading && loadError && (
            <div className="space-y-2 p-4 text-sm">
              <div className="font-medium text-destructive">
                {t("CatalogLoadTitle")}
              </div>
              <div className="text-muted-foreground">
                {t("CatalogLoadFallback")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("CatalogLoadHint")}
              </div>
            </div>
          )}

          {!isLoading && !loadError && permissions.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">
              {t("NoPermissions")}
            </div>
          )}

          {!isLoading &&
            !loadError &&
            permissions.map((permission) => {
              const state = getPermissionState(permission);
              const hasOverride = isUserOverride(permission);
              const isPending = pendingPermissionIds.has(permission.id);

              return (
                <div
                  key={permission.id}
                  className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_150px_310px] md:items-center"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {permission.name}
                      </span>
                      <Badge variant="outline">{permission.resource}</Badge>
                    </div>
                    <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                      <span className="shrink-0 rounded border px-1.5 py-0.5 font-mono">
                        {permission.method}
                      </span>
                      <span className="truncate font-mono">{permission.url}</span>
                    </div>
                  </div>

                  <Badge className="w-fit" variant={state.badgeVariant}>
                    {state.label}
                  </Badge>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:min-w-[310px]">
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 justify-center gap-1.5 whitespace-nowrap px-3 text-xs font-medium"
                      variant={
                        hasOverride && permission.allowed !== false
                          ? "default"
                          : "outline"
                      }
                      disabled={isPending}
                      onClick={() => applyOverride(permission.id, true)}
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      {t("Allow")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 justify-center gap-1.5 whitespace-nowrap px-3 text-xs font-medium"
                      variant={
                        hasOverride && permission.allowed === false
                          ? "destructive"
                          : "outline"
                      }
                      disabled={isPending}
                      onClick={() => applyOverride(permission.id, false)}
                    >
                      <ShieldX className="h-4 w-4 shrink-0" />
                      {t("Deny")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 justify-center gap-1.5 whitespace-nowrap px-3 text-xs font-medium"
                      disabled={isPending || !hasOverride}
                      onClick={() => resetOverride(permission.id)}
                    >
                      <RotateCcw className="h-4 w-4 shrink-0" />
                      {t("Reset")}
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isFetching || !pagination?.hasPrevious}
          onClick={() => setPage((current) => Math.max(current - 1, 0))}
        >
          {t("Previous")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isFetching || !pagination?.hasNext}
          onClick={() => setPage((current) => current + 1)}
        >
          {t("Next")}
        </Button>
      </div>
    </section>
  );
}
