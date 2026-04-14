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
import { createContext, useContext, useState } from "react";
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
import {
  PermissionSchemaType,
  HTTP_METHODS,
  RESOURCES,
} from "@/schemaValidations/permission.schema";
import { useDeletePermissionMutation, useGetPermissions } from "@/queries/usePermission";

import AddPermission from "./add-permission";
import EditPermission from "./edit-permission";

type PermissionItem = PermissionSchemaType;

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

const METHOD_BADGE_TONE: Record<string, string> = {
  GET: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  POST: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  PUT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  PATCH: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export default function PermissionTable() {
  const t = useTranslations("ManagePermission");
  const paginationT = useTranslations("Pagination");
  const [permissionIdEdit, setPermissionIdEdit] = useState<string | undefined>();
  const [permissionDelete, setPermissionDelete] = useState<PermissionItem | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading, error } = useGetPermissions();
  const permissions = data?.payload?.data ?? [];

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
        const method = row.getValue("method") as string;
        return (
          <Badge className={METHOD_BADGE_TONE[method] || ""} variant="secondary">
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
      cell: ({ row }) => <Badge variant="outline">{row.getValue("resource")}</Badge>,
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

  const table = useReactTable({
    data: permissions,
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
            <div className="manage-toolbar py-2">
              <Input
                placeholder={t("SearchPlaceholder")}
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="manage-field max-w-sm"
              />

              <Select
                value={(table.getColumn("method")?.getFilterValue() as string) ?? "all"}
                onValueChange={(value) =>
                  table.getColumn("method")?.setFilterValue(value === "all" ? undefined : value)
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
                  table.getColumn("resource")?.setFilterValue(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger className="manage-filter-trigger w-[150px]">
                  <SelectValue placeholder={t("FilterResource")} />
                </SelectTrigger>
                <SelectContent className="manage-popover-panel">
                  <SelectItem value="all">{t("AllOption")}</SelectItem>
                  {RESOURCES.map((resource) => (
                    <SelectItem key={resource} value={resource}>
                      {resource}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="manage-toolbar-spacer">
                <Button
                  size="sm"
                  className="manage-primary-button"
                  onClick={() => setAddModalOpen(true)}
                >
                  <PlusCircledIcon className="mr-2 h-4 w-4" />
                  {t("AddPermission")}
                </Button>
                <AddPermission open={addModalOpen} setOpen={setAddModalOpen} />
              </div>
            </div>

            <div className="manage-table-shell">
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
    </PermissionTableContext.Provider>
  );
}
