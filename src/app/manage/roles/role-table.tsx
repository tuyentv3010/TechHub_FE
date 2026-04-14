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
import { useState, createContext, useContext } from "react";
import { PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import TableSkeleton from "@/components/Skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { RoleSchemaType } from "@/schemaValidations/role.schema";
import { useDeleteRoleMutation, useGetRoles } from "@/queries/useRole";

import RoleModal from "./role-modal";

type RoleItem = RoleSchemaType;

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
    } catch (error: any) {
      toast({
        title: t("DeleteFailed"),
        description: error?.message || t("UnknownError"),
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

export default function RoleTable() {
  const t = useTranslations("ManageRole");
  const paginationT = useTranslations("Pagination");
  const [roleIdEdit, setRoleIdEdit] = useState<string | undefined>();
  const [roleDelete, setRoleDelete] = useState<RoleItem | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading, error } = useGetRoles();
  const roles = data?.payload?.data ?? [];

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
        return <Badge variant={isActive ? "default" : "secondary"}>{isActive ? t("Active") : t("Inactive")}</Badge>;
      },
    },
    {
      accessorKey: "permissionIds",
      header: t("PermissionCountColumn"),
      cell: ({ row }) => {
        const permissionIds = row.getValue("permissionIds") as string[];
        return <Badge variant="outline">{t("PermissionCount", { count: permissionIds?.length || 0 })}</Badge>;
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

  const table = useReactTable({
    data: roles,
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
            <div className="manage-toolbar py-2">
              <Input
                placeholder={t("SearchPlaceholder")}
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="manage-field w-full max-w-sm"
              />
              <div className="manage-toolbar-spacer w-full sm:w-auto">
                <Button
                  size="sm"
                  className="manage-primary-button w-full sm:w-auto"
                  onClick={() => setAddModalOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t("AddRole")}
                </Button>
                <RoleModal
                  open={addModalOpen}
                  setOpen={setAddModalOpen}
                  onSubmitSuccess={() => {
                    setAddModalOpen(false);
                  }}
                />
              </div>
            </div>

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
                          <Badge variant="outline">{t("PermissionCount", { count: permissionCount })}</Badge>
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
                        <TableHead key={header.id}>
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
                          <TableCell key={cell.id}>
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
                {paginationT("Page")} <strong>{table.getState().pagination.pageIndex + 1}</strong>{" "}
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
          </>
        )}
      </div>
    </RoleTableContext.Provider>
  );
}
