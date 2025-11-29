"use client";

import {
  CaretSortIcon,
  DotsHorizontalIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, createContext, useContext } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import AddPermission from "./add-permission";
import EditPermission from "./edit-permission";
import { PermissionSchemaType, HTTP_METHODS, RESOURCES } from "@/schemaValidations/permission.schema";
import {
  useGetPermissions,
  useDeletePermissionMutation,
} from "@/queries/usePermission";
import TableSkeleton from "@/components/Skeleton";
import { useToast } from "@/hooks/use-toast";

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
    if (permissionDelete) {
      try {
        await deletePermissionMutation.mutateAsync(permissionDelete.id);
        toast({
          title: t("DeleteSuccess"),
          description: `Permission ${permissionDelete.name} đã được xóa`,
        });
        setPermissionDelete(null);
      } catch (error: any) {
        const errorMessage = error?.message || "Có lỗi xảy ra";
        toast({
          title: t("DeleteFailed"),
          description: errorMessage,
          variant: "destructive",
        });
      }
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa Permission</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa permission{" "}
            <span className="bg-foreground text-primary-foreground rounded px-1">
              {permissionDelete?.name}
            </span>
            ? Hành động này không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            Tiếp tục
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function PermissionTable() {
  const t = useTranslations("ManagePermission");
  const [permissionIdEdit, setPermissionIdEdit] = useState<string | undefined>();
  const [permissionDelete, setPermissionDelete] = useState<PermissionItem | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { data, isLoading, error } = useGetPermissions();
  console.log("dasdasd data " , data)
  const permissions = data?.payload?.data ?? [];

  const columns: ColumnDef<PermissionItem>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tên
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "description",
      header: "Mô tả",
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.getValue("description") || "-"}</div>
      ),
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => {
        const method = row.getValue("method") as string;
        const colorMap: Record<string, string> = {
          GET: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          POST: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
          PUT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
          DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
          PATCH: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        };
        return (
          <Badge className={colorMap[method] || ""} variant="secondary">
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
      header: "URL",
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {row.getValue("url")}
        </code>
      ),
    },
    {
      accessorKey: "resource",
      header: "Resource",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("resource")}</Badge>
      ),
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue === "all") return true;
        return row.getValue(columnId) === filterValue;
      },
    },
    {
      id: "actions",
      header: "Hành động",
      enableHiding: false,
      cell: function Actions({ row }) {
        const { setPermissionIdEdit, setPermissionDelete } = useContext(
          PermissionTableContext
        );
        return (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setPermissionIdEdit(row.original.id)}
              >
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setPermissionDelete(row.original)}
                className="text-destructive"
              >
                Xóa
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
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
      <div className="w-full">
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
          <div className="text-red-500">Lỗi: {error.message}</div>
        ) : (
          <>
            <div className="flex items-center py-4 gap-4">
              <Input
                placeholder="Tìm theo tên..."
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <Select
                value={(table.getColumn("method")?.getFilterValue() as string) ?? "all"}
                onValueChange={(value) =>
                  table.getColumn("method")?.setFilterValue(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Lọc Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
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
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Lọc Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {RESOURCES.map((resource) => (
                    <SelectItem key={resource} value={resource}>
                      {resource}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="ml-auto">
                <Button size="sm" onClick={() => setAddModalOpen(true)}>
                  <PlusCircledIcon className="mr-2 h-4 w-4" />
                  Thêm Permission
                </Button>
                <AddPermission open={addModalOpen} setOpen={setAddModalOpen} />
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
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
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        Không có kết quả
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Sau
              </Button>
            </div>
          </>
        )}
      </div>
    </PermissionTableContext.Provider>
  );
}
