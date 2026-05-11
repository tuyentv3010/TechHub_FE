"use client";

import { CaretSortIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
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
import { useEffect, useMemo, useState, createContext, useContext } from "react";
import { PlusCircle } from "lucide-react";
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
import { getAccessCopy, summarizeRoleCoverage } from "@/lib/access-control";
import { getManageTableColumnClass } from "@/lib/manage-table";
import { useGetPermissions } from "@/queries/usePermission";
import { PermissionSchemaType } from "@/schemaValidations/permission.schema";
import { RoleSchemaType } from "@/schemaValidations/role.schema";
import { useDeleteRoleMutation, useGetRoles } from "@/queries/useRole";

import RoleModal from "./role-modal";

type RoleItem = RoleSchemaType;

const normalizeSearchText = (value: unknown) =>
  String(value ?? "").toLowerCase().trim();

const matchesRoleSearch = (
  role: RoleItem,
  query: string,
  permissionById: Map<string, PermissionSchemaType>
) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return true;
  }

  const assignedPermissions = (role.permissionIds ?? [])
    .map((permissionId) => permissionById.get(permissionId))
    .filter((permission): permission is PermissionSchemaType => Boolean(permission));

  return [
    role.name,
    role.description,
    role.isActive ? "active" : "inactive",
    ...assignedPermissions.flatMap((permission) => [
      permission.name,
      permission.description,
      permission.method,
      permission.resource,
      permission.url,
    ]),
  ].some((value) => normalizeSearchText(value).includes(normalizedQuery));
};

const RoleTableContext = createContext<{
  setRoleIdEdit: (value: string | undefined) => void;
  roleIdEdit: string | undefined;
  roleDelete: RoleItem | null;
  setRoleDelete: (value: RoleItem | null) => void;
}>({
  setRoleIdEdit: () => {},
  roleIdEdit: undefined,
  roleDelete: null,
  setRoleDelete: () => {},
});

function DeleteRoleDialog({
  roleDelete,
  setRoleDelete,
}: {
  roleDelete: RoleItem | null;
  setRoleDelete: (value: RoleItem | null) => void;
}) {
  const t = useTranslations("ManageRole");
  const { toast } = useToast();
  const deleteRoleMutation = useDeleteRoleMutation();

  const handleDelete = async () => {
    if (!roleDelete) return;

    try {
      await deleteRoleMutation.mutateAsync(roleDelete.id);
      toast({
        title: t("DeleteSuccess"),
        description: t("RoleDeleted", { name: roleDelete.name }),
      });
      setRoleDelete(null);
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
      open={Boolean(roleDelete)}
      onOpenChange={(value) => {
        if (!value) {
          setRoleDelete(null);
        }
      }}
    >
      <AlertDialogContent className="manage-dialog-panel rounded-[1.35rem] border-border/50">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("DeleteDialogTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("DeleteDialogDescription", { name: roleDelete?.name ?? "" })}
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

function BusinessRoleView({
  roles,
  permissions,
  permissionsLoading,
  onEdit,
  onDelete,
}: {
  roles: RoleItem[];
  permissions: PermissionSchemaType[];
  permissionsLoading: boolean;
  onEdit: (roleId: string) => void;
  onDelete: (role: RoleItem) => void;
}) {
  const t = useTranslations("ManageRole");
  const locale = useLocale();
  const accessCopy = getAccessCopy(locale);

  if (permissionsLoading) {
    return <TableSkeleton />;
  }

  if (roles.length === 0) {
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
          <CardTitle>{accessCopy.roleView.title}</CardTitle>
          <CardDescription>
            {accessCopy.roleView.description} {accessCopy.shared.technicalHint}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {roles.map((role) => {
          const coverage = summarizeRoleCoverage(role.permissionIds ?? [], permissions, locale);

          return (
            <Card key={role.id} className="manage-surface border-border/50">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    <CardDescription>
                      {role.description || accessCopy.shared.noPermissions}
                    </CardDescription>
                  </div>
                  <Badge variant={role.isActive ? "default" : "secondary"}>
                    {role.isActive ? t("Active") : t("Inactive")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 rounded-2xl border border-border/50 bg-background/60 p-3">
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {accessCopy.roleView.resourcesLabel}
                    </div>
                    {coverage.resources.length ? (
                      <div className="flex flex-wrap gap-2">
                        {coverage.resources.map((resource) => (
                          <Badge key={`${role.id}-${resource.label}-${resource.description}`} variant="outline">
                            {resource.label}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {accessCopy.shared.emptyResources}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 rounded-2xl border border-border/50 bg-background/60 p-3">
                    <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {accessCopy.roleView.actionsLabel}
                    </div>
                    {coverage.actions.length ? (
                      <div className="flex flex-wrap gap-2">
                        {coverage.actions.map((action) => (
                          <Badge key={`${role.id}-${action.method}`} variant="secondary">
                            {action.label}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {accessCopy.shared.emptyActions}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/60 p-3">
                  <div className="text-sm text-muted-foreground">
                    {accessCopy.roleView.permissionsLabel}
                  </div>
                  <Badge variant="outline">
                    {t("PermissionCount", { count: role.permissionIds?.length || 0 })}
                  </Badge>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="manage-secondary-button"
                    onClick={() => onEdit(role.id)}
                  >
                    {t("Edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="manage-secondary-button"
                    onClick={() => onDelete(role)}
                  >
                    {t("Delete")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function RoleTable() {
  const t = useTranslations("ManageRole");
  const paginationT = useTranslations("Pagination");
  const locale = useLocale();
  const accessCopy = getAccessCopy(locale);
  const [roleIdEdit, setRoleIdEdit] = useState<string | undefined>();
  const [roleDelete, setRoleDelete] = useState<RoleItem | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading, error } = useGetRoles();
  const { data: permissionsData, isLoading: permissionsLoading } = useGetPermissions();
  const roles: RoleItem[] = data?.payload?.data ?? [];
  const permissions: PermissionSchemaType[] = permissionsData?.payload?.data ?? [];
  const permissionById = useMemo(
    () => new Map<string, PermissionSchemaType>(
      permissions.map((permission) => [permission.id, permission])
    ),
    [permissions]
  );
  const filteredRoles = useMemo(
    () => roles.filter((role) => matchesRoleSearch(role, roleSearch, permissionById)),
    [permissionById, roleSearch, roles]
  );

  const columns: ColumnDef<RoleItem>[] = [
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
      accessorKey: "isActive",
      header: t("StatusColumn"),
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? t("Active") : t("Inactive")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "permissionIds",
      header: t("PermissionCountColumn"),
      cell: ({ row }) => {
        const permissionIds = row.getValue("permissionIds") as string[];
        return (
          <Badge variant="outline">
            {t("PermissionCount", { count: permissionIds?.length || 0 })}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: t("ActionsColumn"),
      enableHiding: false,
      cell: function Actions({ row }) {
        const { setRoleIdEdit, setRoleDelete } = useContext(RoleTableContext);

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
              <DropdownMenuItem onClick={() => setRoleIdEdit(row.original.id)}>
                {t("Edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setRoleDelete(row.original)}
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
  }, [roleSearch]);

  const table = useReactTable({
    data: filteredRoles,
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
    <RoleTableContext.Provider
      value={{
        roleIdEdit,
        setRoleIdEdit,
        roleDelete,
        setRoleDelete,
      }}
    >
      <div className="manage-data-table w-full">
        {roleIdEdit && (
          <RoleModal
            open={true}
            setOpen={() => setRoleIdEdit(undefined)}
            roleId={roleIdEdit}
            onSubmitSuccess={() => {
              setRoleIdEdit(undefined);
            }}
          />
        )}

        <DeleteRoleDialog roleDelete={roleDelete} setRoleDelete={setRoleDelete} />

        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="text-red-500">
            {t("ErrorLabel")}: {error.message}
          </div>
        ) : (
          <>
            <Tabs defaultValue="overview" className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <TabsList className="manage-glass h-auto rounded-2xl border border-border/50 p-1">
                    <TabsTrigger value="overview">{accessCopy.tabs.overview}</TabsTrigger>
                    <TabsTrigger value="advanced">{accessCopy.tabs.advanced}</TabsTrigger>
                  </TabsList>
                  <Input
                    placeholder={t("SearchPlaceholder")}
                    value={roleSearch}
                    onChange={(event) => setRoleSearch(event.target.value)}
                    className="manage-field w-full sm:w-[320px]"
                  />
                </div>

                <Button
                  size="sm"
                  className="manage-primary-button w-full sm:w-auto"
                  onClick={() => setAddModalOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t("AddRole")}
                </Button>
              </div>

              <TabsContent value="overview" className="space-y-4">
                <BusinessRoleView
                  roles={filteredRoles}
                  permissions={permissions}
                  permissionsLoading={permissionsLoading}
                  onEdit={setRoleIdEdit}
                  onDelete={setRoleDelete}
                />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <Card className="manage-surface border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">{accessCopy.tabs.advanced}</CardTitle>
                    <CardDescription>{accessCopy.shared.technicalHint}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 md:hidden">
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => {
                          const role = row.original;
                          const permissionCount = role.permissionIds?.length || 0;

                          return (
                            <div
                              key={`mobile-role-${role.id}`}
                              className="manage-subsurface space-y-3 p-4"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                    {role.name}
                                  </div>
                                  <div className="mt-1 text-sm text-muted-foreground">
                                    {role.description || "-"}
                                  </div>
                                </div>
                                <Badge variant={role.isActive ? "default" : "secondary"} className="w-fit">
                                  {role.isActive ? t("Active") : t("Inactive")}
                                </Badge>
                              </div>

                              <div className="grid gap-2 rounded-xl bg-slate-50/70 p-3 text-sm dark:bg-slate-950/40">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-muted-foreground">{t("PermissionCountColumn")}</span>
                                  <Badge variant="outline">
                                    {t("PermissionCount", { count: permissionCount })}
                                  </Badge>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="manage-secondary-button"
                                  onClick={() => setRoleIdEdit(role.id)}
                                >
                                  {t("Edit")}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="manage-secondary-button"
                                  onClick={() => setRoleDelete(role)}
                                >
                                  {t("Delete")}
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="manage-subsurface p-6 text-center text-sm text-muted-foreground">
                          {t("NoResults")}
                        </div>
                      )}
                    </div>

                    <div className="manage-table-shell hidden md:block">
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
                                    : flexRender(header.column.columnDef.header, header.getContext())}
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

            <RoleModal
              open={addModalOpen}
              setOpen={setAddModalOpen}
              onSubmitSuccess={() => {
                setAddModalOpen(false);
              }}
            />
          </>
        )}
      </div>
    </RoleTableContext.Provider>
  );
}
