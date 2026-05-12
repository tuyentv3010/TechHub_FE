"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Search, ShieldCheck, ShieldX } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
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
  const [pendingPermissionId, setPendingPermissionId] = useState<string | null>(
    null
  );

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

  const permissions: PermissionSchemaType[] = catalogQuery.data?.payload?.data ?? [];
  const pagination = catalogQuery.data?.payload?.pagination;

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

  const applyOverride = async (permissionId: string, allowed: boolean) => {
    setPendingPermissionId(permissionId);
    try {
      await upsertOverrideMutation.mutateAsync({
        userId,
        body: {
          permissionId,
          allowed,
          active: true,
        },
      });
      toast({
        description: allowed ? t("AllowToast") : t("DenyToast"),
      });
    } catch (error) {
      handleErrorApi({ error });
    } finally {
      setPendingPermissionId(null);
    }
  };

  const resetOverride = async (permissionId: string) => {
    setPendingPermissionId(permissionId);
    try {
      await deleteOverrideMutation.mutateAsync({ userId, permissionId });
      toast({ description: t("ResetToast") });
    } catch (error) {
      handleErrorApi({ error });
    } finally {
      setPendingPermissionId(null);
    }
  };

  const isLoading = catalogQuery.isLoading;
  const isFetching = catalogQuery.isFetching;
  const loadError = catalogQuery.error as
    | { status?: number; message?: string; payload?: { message?: string } }
    | null;

  const isMutating =
    upsertOverrideMutation.isPending || deleteOverrideMutation.isPending;

  const loadErrorMessage =
    loadError?.payload?.message ||
    loadError?.message ||
    t("CatalogLoadFallback");

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
                {loadError.status
                  ? `${t("HttpStatus", { status: loadError.status })}: `
                  : ""}
                {loadErrorMessage}
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
              const isPending = pendingPermissionId === permission.id;

              return (
                <div
                  key={permission.id}
                  className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_160px_240px] md:items-center"
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

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        hasOverride && permission.allowed !== false
                          ? "default"
                          : "outline"
                      }
                      disabled={isMutating && !isPending}
                      onClick={() => applyOverride(permission.id, true)}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {t("Allow")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        hasOverride && permission.allowed === false
                          ? "destructive"
                          : "outline"
                      }
                      disabled={isMutating && !isPending}
                      onClick={() => applyOverride(permission.id, false)}
                    >
                      <ShieldX className="h-4 w-4" />
                      {t("Deny")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        (isMutating && !isPending) || !hasOverride
                      }
                      onClick={() => resetOverride(permission.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
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
