"use client";

import { CaretSortIcon, DotsHorizontalIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import TableSkeleton from "@/components/Skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  getAccessCopy,
  getResourceMeta,
  groupPermissionsByResource,
  METHOD_BADGE_TONE,
  summarizePermissionActions,
} from "@/lib/access-control";
import { getManageTableColumnClass } from "@/lib/manage-table";
import {
  PermissionSchemaType,
  HTTP_METHODS,
} from "@/schemaValidations/permission.schema";
import { useDeletePermissionMutation, useGetPermissions } from "@/queries/usePermission";

import AddPermission from "./add-permission";
import EditPermission from "./edit-permission";

type PermissionItem = PermissionSchemaType;

const normalizeSearchText = (value: unknown) =>
  String(value ?? "").toLowerCase().trim();

const matchesPermissionSearch = (
  permission: PermissionItem,
  query: string,
  locale: string
) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return true;
  }

  const resourceMeta = getResourceMeta(permission.resource, locale);
  return [
    permission.name,
    permission.description,
    permission.method,
    permission.url,
    permission.resource,
    resourceMeta.label,
    resourceMeta.description,
  ].some((value) => normalizeSearchText(value).includes(normalizedQuery));
};

const PermissionTableContext = createContext<{
  setPermissionIdEdit: (value: string | undefined) => void;
  permissionIdEdit: string | undefined;
  permissionDelete: PermissionItem | null;
  setPermissionDelete: (value: PermissionItem | null) => void;
}>({
  setPermissionIdEdit: () => {},
  permissionIdEdit: undefined,
  permissionDelete: null,
  setPermissionDelete: () => {},
});

function DeletePermissionDialog({
  permissionDelete,
  setPermissionDelete,
}: {
  permissionDelete: PermissionItem | null;
  setPermissionDelete: (value: PermissionItem | null) => void;
}) {
  const t = useTranslations("ManagePermission");
  const { toast } = useToast();
  const deletePermissionMutation = useDeletePermissionMutation();

  const handleDelete = async () => {
    if (!permissionDelete) return;

    try {
      await deletePermissionMutation.mutateAsync(permissionDelete.id);
      toast({
        title: t("DeleteSuccess"),
        description: t("PermissionDeleted", { name: permissionDelete.name }),
      });
      setPermissionDelete(null);
    } catch (error) {
      toast({
        title: t("DeleteFailed"),
        description: error instanceof Error ? error.message : t("UnknownError"),
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog
      open={Boolean(permissionDelete)}
      onOpenChange={(value) => {
        if (!value) {
          setPermissionDelete(null);
        }
      }}
    >
      <AlertDialogContent className="manage-dialog-panel rounded-[1.35rem] border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("DeleteDialogTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("DeleteDialogDescription", { name: permissionDelete?.name ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>{t("Continue")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function BusinessPermissionView({
  permissions,
  searchQuery,
  onEdit,
  onDelete,
}: {
  permissions: PermissionItem[];
  searchQuery: string;
  onEdit: (permissionId: string) => void;
  onDelete: (permission: PermissionItem) => void;
}) {
  const t = useTranslations("ManagePermission");
  const locale = useLocale();
  const accessCopy = getAccessCopy(locale);
  const permissionGroups = useMemo(
    () => groupPermissionsByResource(permissions),
    [permissions]
  );
  const permissionGroupKey = permissionGroups.map((group) => group.resource).join("|");
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedResources(new Set(permissionGroups.map((group) => group.resource)));
      return;
    }
    setExpandedResources(new Set());
  }, [permissionGroupKey, permissionGroups, searchQuery]);

  const toggleResource = (resource: string) => {
    setExpandedResources((current) => {
      const next = new Set(current);
      if (next.has(resource)) {
        next.delete(resource);
      } else {
        next.add(resource);
      }
      return next;
    });
  };

  if (permissionGroups.length === 0) {
    return (
      <div className="manage-subsurface rounded-xl p-6 text-center text-sm text-muted-foreground">
        {t("NoResults")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="manage-surface border-border/50">
        <CardHeader>
          <CardTitle>{accessCopy.permissionView.title}</CardTitle>
          <CardDescription>
            {accessCopy.permissionView.description} {accessCopy.shared.technicalHint}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {permissionGroups.map((group) => {
          const resourceMeta = getResourceMeta(group.resource, locale);
          const actionBadges = summarizePermissionActions(group.permissions, locale);
          const isExpanded = expandedResources.has(group.resource);

          return (
            <Card key={group.resource} className="manage-surface border-border/50">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base">{resourceMeta.label}</CardTitle>
                    <CardDescription>{resourceMeta.description}</CardDescription>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline">
                      {group.permissions.length} {accessCopy.permissionView.permissionsLabel}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-sm"
                      aria-expanded={isExpanded}
                      title={isExpanded ? t("CollapseGroup") : t("ExpandGroup")}
                      onClick={() => toggleResource(group.resource)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {accessCopy.permissionView.actionsLabel}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {actionBadges.map((action) => (
                      <Badge
                        key={`${group.resource}-${action.method}`}
                        variant="secondary"
                        className={METHOD_BADGE_TONE[action.method]}
                      >
                        {action.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              {isExpanded ? (
                <CardContent className="space-y-3">
                  {group.permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="rounded-2xl border border-border/50 bg-background/60 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{permission.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {permission.description || resourceMeta.description}
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={METHOD_BADGE_TONE[permission.method]}
                        >
                          {accessCopy.methodLabels[permission.method]}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                          {permission.url}
                        </code>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="manage-secondary-button"
                            onClick={() => onEdit(permission.id)}
                          >
                            {t("Edit")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="manage-secondary-button"
                            onClick={() => onDelete(permission)}
                          >
                            {t("Delete")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function PermissionTable() {
  const t = useTranslations("ManagePermission");
  const paginationT = useTranslations("Pagination");
  const locale = useLocale();
  const accessCopy = getAccessCopy(locale);
  const [permissionIdEdit, setPermissionIdEdit] = useState<string | undefined>();
  const [permissionDelete, setPermissionDelete] = useState<PermissionItem | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading, error } = useGetPermissions();
  const permissions: PermissionItem[] = data?.payload?.data ?? [];
  const filteredPermissions = useMemo(
    () =>
      permissions.filter((permission) =>
        matchesPermissionSearch(permission, permissionSearch, locale)
      ),
    [locale, permissionSearch, permissions]
  );
  const resourceOptions = groupPermissionsByResource(permissions).map((group) => group.resource);

  const columns: ColumnDef<PermissionItem>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("NameColumn")}
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "description",
      header: t("DescriptionColumn"),
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.getValue("description") || "-"}</div>
      ),
    },
    {
      accessorKey: "method",
      header: t("MethodColumn"),
      cell: ({ row }) => {
        const method = row.getValue("method") as PermissionItem["method"];
        return (
          <Badge className={METHOD_BADGE_TONE[method]} variant="secondary">
            {method}
          </Badge>
        );
      },
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue === "all") return true;
        return row.getValue(columnId) === filterValue;
      },
    },
    {
      accessorKey: "url",
      header: t("UrlColumn"),
      cell: ({ row }) => (
        <code className="rounded bg-muted px-2 py-1 text-xs">{row.getValue("url")}</code>
      ),
    },
    {
      accessorKey: "resource",
      header: t("ResourceColumn"),
      cell: ({ row }) => {
        const resource = row.getValue("resource") as PermissionItem["resource"];
        return <Badge variant="outline">{getResourceMeta(resource, locale).label}</Badge>;
      },
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue === "all") return true;
        return row.getValue(columnId) === filterValue;
      },
    },
    {
      id: "actions",
      header: t("ActionsColumn"),
      enableHiding: false,
      cell: function Actions({ row }) {
        const { setPermissionIdEdit, setPermissionDelete } = useContext(PermissionTableContext);

        return (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("ActionsColumn")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPermissionIdEdit(row.original.id)}>
                {t("Edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setPermissionDelete(row.original)}
                className="text-destructive"
              >
                {t("Delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    setPagination((current) =>
      current.pageIndex === 0 ? current : { ...current, pageIndex: 0 }
    );
  }, [columnFilters, permissionSearch]);

  const table = useReactTable({
    data: filteredPermissions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  return (
    <PermissionTableContext.Provider
      value={{
        permissionIdEdit,
        setPermissionIdEdit,
        permissionDelete,
        setPermissionDelete,
      }}
    >
      <div className="manage-data-table w-full">
        {permissionIdEdit && (
          <EditPermission
            id={permissionIdEdit}
            setId={setPermissionIdEdit}
            onSubmitSuccess={() => {
              setPermissionIdEdit(undefined);
            }}
          />
        )}

        <DeletePermissionDialog
          permissionDelete={permissionDelete}
          setPermissionDelete={setPermissionDelete}
        />

        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="text-red-500">
            {t("ErrorLabel")}: {error.message}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Tabs defaultValue="overview" className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <TabsList className="manage-glass h-auto rounded-2xl border border-border/50 p-1">
                      <TabsTrigger value="overview">{accessCopy.tabs.overview}</TabsTrigger>
                      <TabsTrigger value="advanced">{accessCopy.tabs.advanced}</TabsTrigger>
                    </TabsList>
                    <Input
                      placeholder={t("SearchPlaceholder")}
                      value={permissionSearch}
                      onChange={(event) => setPermissionSearch(event.target.value)}
                      className="manage-field w-full sm:w-[320px]"
                    />
                  </div>

                  <Button
                    size="sm"
                    className="manage-primary-button"
                    onClick={() => setAddModalOpen(true)}
                  >
                    <PlusCircledIcon className="mr-2 h-4 w-4" />
                    {t("AddPermission")}
                  </Button>
                </div>

                <TabsContent value="overview" className="space-y-4">
                  <BusinessPermissionView
                    permissions={filteredPermissions}
                    searchQuery={permissionSearch}
                    onEdit={setPermissionIdEdit}
                    onDelete={setPermissionDelete}
                  />
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <Card className="manage-surface border-border/50">
                    <CardHeader>
                      <CardTitle className="text-base">{accessCopy.tabs.advanced}</CardTitle>
                      <CardDescription>{accessCopy.shared.technicalHint}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="manage-toolbar py-2">
                        <Select
                          value={(table.getColumn("method")?.getFilterValue() as string) ?? "all"}
                          onValueChange={(value) =>
                            table
                              .getColumn("method")
                              ?.setFilterValue(value === "all" ? undefined : value)
                          }
                        >
                          <SelectTrigger className="manage-filter-trigger w-[150px]">
                            <SelectValue placeholder={t("FilterMethod")} />
                          </SelectTrigger>
                          <SelectContent className="manage-popover-panel">
                            <SelectItem value="all">{t("AllOption")}</SelectItem>
                            {HTTP_METHODS.map((method) => (
                              <SelectItem key={method} value={method}>
                                {method}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={(table.getColumn("resource")?.getFilterValue() as string) ?? "all"}
                          onValueChange={(value) =>
                            table
                              .getColumn("resource")
                              ?.setFilterValue(value === "all" ? undefined : value)
                          }
                        >
                          <SelectTrigger className="manage-filter-trigger w-[180px]">
                            <SelectValue placeholder={t("FilterResource")} />
                          </SelectTrigger>
                          <SelectContent className="manage-popover-panel">
                            <SelectItem value="all">{t("AllOption")}</SelectItem>
                            {resourceOptions.map((resource) => (
                              <SelectItem key={resource} value={resource}>
                                {getResourceMeta(resource, locale).label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="manage-table-shell">
                        <Table>
                          <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                              <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                  <TableHead
                                    key={header.id}
                                    className={getManageTableColumnClass(header.column.id)}
                                  >
                                    {header.isPlaceholder
                                      ? null
                                      : flexRender(
                                          header.column.columnDef.header,
                                          header.getContext()
                                        )}
                                  </TableHead>
                                ))}
                              </TableRow>
                            ))}
                          </TableHeader>
                          <TableBody>
                            {table.getRowModel().rows?.length ? (
                              table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                  {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                      key={cell.id}
                                      className={getManageTableColumnClass(cell.column.id)}
                                    >
                                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                  {t("NoResults")}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="manage-pagination py-2">
                        <div className="manage-pagination-copy">
                          {paginationT("Page")}{" "}
                          <strong>{table.getState().pagination.pageIndex + 1}</strong>{" "}
                          {paginationT("Of")} <strong>{Math.max(table.getPageCount(), 1)}</strong>
                        </div>
                        <div className="manage-pagination-actions">
                          <Button
                            variant="outline"
                            size="sm"
                            className="manage-secondary-button manage-pagination-button"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                          >
                            {paginationT("Previous")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="manage-secondary-button manage-pagination-button"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                          >
                            {paginationT("Next")}
                          </Button>
                          <Select
                            value={String(table.getState().pagination.pageSize)}
                            onValueChange={(value) => table.setPageSize(Number(value))}
                          >
                            <SelectTrigger className="manage-filter-trigger w-[120px]">
                              <SelectValue placeholder={paginationT("RowsPerPage")} />
                            </SelectTrigger>
                            <SelectContent className="manage-popover-panel">
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <AddPermission open={addModalOpen} setOpen={setAddModalOpen} />
          </>
        )}
      </div>
    </PermissionTableContext.Provider>
  );
}
