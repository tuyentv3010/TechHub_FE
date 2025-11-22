"use client";

import {
  CaretSortIcon,
  DotsHorizontalIcon,
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
import { PlusCircle } from "lucide-react";
import RoleModal from "./role-modal";
import { RoleSchemaType } from "@/schemaValidations/role.schema";
import { useGetRoles, useDeleteRoleMutation } from "@/queries/useRole";
import TableSkeleton from "@/components/Skeleton";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const deleteRoleMutation = useDeleteRoleMutation();

  const handleDelete = async () => {
    if (roleDelete) {
      try {
        await deleteRoleMutation.mutateAsync(roleDelete.id);
        toast({
          title: "Xóa thành công",
          description: `Role ${roleDelete.name} đã được xóa`,
        });
        setRoleDelete(null);
      } catch (error: any) {
        const errorMessage = error?.message || "Có lỗi xảy ra";
        toast({
          title: "Xóa thất bại",
          description: errorMessage,
          variant: "destructive",
        });
      }
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa Role</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa role{" "}
            <span className="bg-foreground text-primary-foreground rounded px-1">
              {roleDelete?.name}
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

export default function RoleTable() {
  const [roleIdEdit, setRoleIdEdit] = useState<string | undefined>();
  const [roleDelete, setRoleDelete] = useState<RoleItem | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { data, isLoading, error } = useGetRoles();
  console.log("dasdasdas data " ,data);

  const roles = data?.payload?.data ?? [];

  const columns: ColumnDef<RoleItem>[] = [
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
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "permissionIds",
      header: "Permissions",
      cell: ({ row }) => {
        const permissionIds = row.getValue("permissionIds") as string[];
        return (
          <Badge variant="outline">
            {permissionIds?.length || 0} permissions
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Hành động",
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
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRoleIdEdit(row.original.id)}>
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setRoleDelete(row.original)}
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
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
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
      <div className="w-full">
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
        <DeleteRoleDialog
          roleDelete={roleDelete}
          setRoleDelete={setRoleDelete}
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
              <div className="ml-auto">
                <Button size="sm" onClick={() => setAddModalOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Thêm Role
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
    </RoleTableContext.Provider>
  );
}
