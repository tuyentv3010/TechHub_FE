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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import TableSkeleton from "@/components/Skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BlogListResponseType, BlogType } from "@/schemaValidations/blog.schema";
import { useDeleteBlogMutation, useGetBlogList } from "@/queries/useBlog";
import AddBlog from "./add-blog";
import EditBlog from "./edit-blog";

type BlogItem = BlogListResponseType["data"][0];

const BlogTableContext = createContext<{
  setBlogIdEdit: (value: string | undefined) => void;
  blogIdEdit: string | undefined;
  blogDelete: BlogItem | null;
  setBlogDelete: (value: BlogItem | null) => void;
}>({
  setBlogIdEdit: () => {},
  blogIdEdit: undefined,
  blogDelete: null,
  setBlogDelete: () => {},
});

function AlertDialogDeleteBlog({
  blogDelete,
  setBlogDelete,
  onSuccess,
}: {
  blogDelete: BlogItem | null;
  setBlogDelete: (value: BlogItem | null) => void;
  onSuccess?: () => void;
}) {
  const t = useTranslations("ManageBlog");
  const { mutateAsync } = useDeleteBlogMutation();

  const deleteBlog = async () => {
    if (blogDelete) {
      try {
        await mutateAsync(blogDelete.id);
        setBlogDelete(null);
        toast({
          title: t("DeleteSuccess"),
          description: t("BlogDeleted", { blogId: blogDelete.id }),
        });
        onSuccess?.();
      } catch (error) {
        handleErrorApi({ error });
      }
    }
  };

  return (
    <AlertDialog
      open={Boolean(blogDelete)}
      onOpenChange={(value) => {
        if (!value) setBlogDelete(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Del")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("Deldes")} {" "}
            <span className="bg-foreground text-primary-foreground rounded px-1">
              {blogDelete?.title}
            </span>{" "}
            {t("DelDes2")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={deleteBlog}>
            {t("Continue")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const PAGE_SIZE = 10;

export default function BlogTable() {
  const t = useTranslations("ManageBlog");
  const paginationT = useTranslations("Pagination");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
  const pageIndex = page - 1;
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [blogIdEdit, setBlogIdEdit] = useState<string | undefined>();
  const [blogDelete, setBlogDelete] = useState<BlogItem | null>(null);

  const blogListQuery = useGetBlogList(page, pageSize);
  const data = blogListQuery.data?.payload.data ?? [];
  const totalItems = blogListQuery.data?.payload.pagination?.totalElements ?? 0;
  const totalPages = blogListQuery.data?.payload.pagination?.totalPages ?? 1;

  const columns: ColumnDef<BlogType>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("ID")}
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="truncate max-w-[100px]">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "thumbnail",
      header: t("Thumbnail"),
      cell: ({ row }) => {
        const thumbnail = row.getValue("thumbnail") as string | null;
        return thumbnail ? (
          <div className="w-16 h-16 relative rounded overflow-hidden">
            <img 
              src={thumbnail} 
              alt="Blog thumbnail" 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("TitleLabel")}
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("Status")}
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "tags",
      header: t("Tags"),
      cell: ({ row }) => {
        const tags = (row.getValue("tags") as string[]) || [];
        return <div className="text-xs text-muted-foreground">{tags.join(", ") || "-"}</div>;
      },
    },
    {
      accessorKey: "created",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t("Created")}
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue("created") as string;
        const date = value ? new Date(value) : null;
        return <div>{date ? date.toLocaleString() : "-"}</div>;
      },
    },
    {
      id: "actions",
      header: t("Action"),
      enableHiding: false,
      cell: function Actions({ row }) {
        const { setBlogIdEdit, setBlogDelete } = useContext(BlogTableContext);
        const openEdit = () => setBlogIdEdit(row.original.id);
        const openDelete = () => setBlogDelete(row.original as BlogItem);
        return (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("Action")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openEdit}>{t("Edit")}</DropdownMenuItem>
              <DropdownMenuItem onClick={openDelete}>{t("Delete")}</DropdownMenuItem>
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
    data,
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
      pagination: { pageIndex, pageSize },
    },
    pageCount: totalPages,
    manualPagination: true,
  });

  useEffect(() => {
    table.setPageIndex(pageIndex);
  }, [table, pageIndex]);

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <BlogTableContext.Provider
      value={{ blogIdEdit, setBlogIdEdit, blogDelete, setBlogDelete }}
    >
      <div className="w-full">
        {blogIdEdit !== undefined && (
          <EditBlog
            id={blogIdEdit}
            setId={setBlogIdEdit}
            onSubmitSuccess={() => {
              setBlogIdEdit(undefined);
              blogListQuery.refetch();
            }}
          />
        )}
        <AlertDialogDeleteBlog
          blogDelete={blogDelete}
          setBlogDelete={setBlogDelete}
          onSuccess={blogListQuery.refetch}
        />

        {blogListQuery.isLoading ? (
          <TableSkeleton />
        ) : blogListQuery.error ? (
          <div className="text-red-500">
            {t("Error")}: {(blogListQuery.error as any).message}
          </div>
        ) : (
          <>
            <div className="flex items-center py-4 gap-5">
              <Input
                placeholder={t("FilterTitle")}
                value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                onChange={(e) => table.getColumn("title")?.setFilterValue(e.target.value)}
                className="max-w-sm w-[200px]"
              />
              <Input
                placeholder={t("FilterStatus")}
                value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
                onChange={(e) => table.getColumn("status")?.setFilterValue(e.target.value)}
                className="max-w-sm w-[160px]"
              />
              <div className="ml-auto flex items-center gap-2">
                <AddBlog />
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
                      <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
            <div className="flex items-center justify-between py-4">
              <div className="text-xs text-muted-foreground">
                {paginationT("Pagi1")} <strong>{table.getRowModel().rows.length}</strong>{" "}
                {paginationT("Pagi2")} <strong>{totalItems}</strong>{" "}
                {paginationT("Pagi3")}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                >
                  {paginationT("Previous")}
                </Button>
                <span>
                  {paginationT("Page")} {page} {paginationT("Of")} {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                >
                  {paginationT("Next")}
                </Button>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    goToPage(1);
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder={paginationT("RowsPerPage")} />
                  </SelectTrigger>
                  <SelectContent>
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
    </BlogTableContext.Provider>
  );
}
