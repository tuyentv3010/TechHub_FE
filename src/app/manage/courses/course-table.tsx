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
import { Badge } from "@/components/ui/badge";
import AddCourse from "./add-course";
import EditCourse from "./edit-course";
import { useDeleteCourseMutation, useGetCourseList } from "@/queries/useCourse";
import { CourseListResponseType } from "@/schemaValidations/course.schema";
import { DollarSign } from "lucide-react";

type CourseItem = CourseListResponseType["data"][0];

const CourseTableContext = createContext<{
  setCourseIdEdit: (value: string | undefined) => void;
  courseIdEdit: string | undefined;
  courseDelete: CourseItem | null;
  setCourseDelete: (value: CourseItem | null) => void;
}>({
  setCourseIdEdit: () => {},
  courseIdEdit: undefined,
  courseDelete: null,
  setCourseDelete: () => {},
});

function AlertDialogDeleteCourse({
  courseDelete,
  setCourseDelete,
  onSuccess,
}: {
  courseDelete: CourseItem | null;
  setCourseDelete: (value: CourseItem | null) => void;
  onSuccess?: () => void;
}) {
  const t = useTranslations("ManageCourse");
  const { mutateAsync } = useDeleteCourseMutation();

  const deleteCourse = async () => {
    if (courseDelete) {
      try {
        await mutateAsync(courseDelete.id);
        setCourseDelete(null);
        toast({
          title: t("DeleteSuccess"),
          description: t("CourseDeleted", { title: courseDelete.title }),
        });
        onSuccess?.();
      } catch (error) {
        handleErrorApi({ error });
      }
    }
  };

  return (
    <AlertDialog
      open={Boolean(courseDelete)}
      onOpenChange={(value) => !value && setCourseDelete(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("ConfirmDelete")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("DeleteWarning", {
              title: courseDelete?.title ?? "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={deleteCourse}>
            {t("Delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function CourseTable() {
  const t = useTranslations("ManageCourse");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
  const pageSize = searchParams.get("pageSize")
    ? Number(searchParams.get("pageSize"))
    : 10;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [courseIdEdit, setCourseIdEdit] = useState<string | undefined>();
  const [courseDelete, setCourseDelete] = useState<CourseItem | null>(null);
  const [searchInput, setSearchInput] = useState(search); // Local state for search input

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        const params = new URLSearchParams(searchParams);
        if (searchInput) {
          params.set("search", searchInput);
        } else {
          params.delete("search");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 500); // Delay 500ms before searching

    return () => clearTimeout(timer);
  }, [searchInput, pathname, router, searchParams, search]);

  // Sync searchInput with URL when navigating
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const courseListQuery = useGetCourseList({
    page: page - 1,
    size: pageSize,
    search: search || undefined,
    status: status !== "all" ? status : undefined,
  });

  const data = useMemo(
    () => courseListQuery.data?.payload?.data ?? [],
    [courseListQuery.data?.payload?.data]
  );

  const totalPages = courseListQuery.data?.payload?.pagination.totalPages ?? 0;

  const columns: ColumnDef<CourseItem>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("TitleColumn")}
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="max-w-[300px]">
            <div className="font-medium">{row.getValue("title")}</div>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {row.original.description}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "thumbnail",
        header: t("ThumbnailColumn"),
        cell: ({ row }) => {
          const thumbnail = row.original.thumbnail;
          return (
            <div className="flex items-center justify-center">
              {thumbnail?.url ? (
                <img
                  src={thumbnail.url}
                  alt="Course thumbnail"
                  className="w-16 h-16 object-cover rounded-md border"
                />
              ) : (
                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "introVideo",
        header: t("IntroVideoColumn"),
        cell: ({ row }) => {
          const introVideo = row.original.introVideo;
          return (
            <div className="flex items-center justify-center">
              {introVideo?.url ? (
                <div className="relative w-16 h-16 bg-black rounded-md overflow-hidden">
                  <video
                    src={introVideo.url}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                  No video
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: t("StatusColumn"),
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge
              variant={
                status === "PUBLISHED"
                  ? "default"
                  : status === "DRAFT"
                  ? "secondary"
                  : "outline"
              }
            >
              {t(`Status.${status}`)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "level",
        header: t("LevelColumn"),
        cell: ({ row }) => {
          const level = row.getValue("level") as string;
          return (
            <Badge variant="outline">{t(`Level.${level}`)}</Badge>
          );
        },
      },
      {
        accessorKey: "price",
        header: t("Price"),
        cell: ({ row }) => {
          const price = parseFloat(row.getValue("price"));
          return (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-secondary/50 p-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{price.toFixed(2)} USD</div>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "totalEnrollments",
        header: t("EnrollmentsColumn"),
        cell: ({ row }) => (
          <div className="text-center">{row.getValue("totalEnrollments")}</div>
        ),
      },
      {
        accessorKey: "averageRating",
        header: t("RatingColumn"),
        cell: ({ row }) => {
          const rating = row.getValue("averageRating") as number | null;
          const count = row.original.ratingCount;
          return (
            <div className="text-center">
              {rating ? (
                <>
                  <div className="font-medium">⭐ {rating.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">
                    ({count} {t("Reviews")})
                  </div>
                </>
              ) : (
                <span className="text-muted-foreground">{t("NoRating")}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "created",
        header: t("CreatedColumn"),
        cell: ({ row }) => {
          return new Date(row.getValue("created")).toLocaleDateString("vi-VN");
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const course = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("OpenMenu")}</span>
                  <DotsHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => window.location.href = `/manage/courses/${course.id}/content`}
                >
                  {t("ManageContent")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(course.id)}
                >
                  {t("CopyID")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCourseIdEdit(course.id)}>
                  {t("Edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setCourseDelete(course)}
                  className="text-red-600"
                >
                  {t("Delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [t, setCourseIdEdit, setCourseDelete]
  );

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
    },
  });

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  if (courseListQuery.isLoading) {
    return <TableSkeleton />;
  }

  return (
    <CourseTableContext.Provider
      value={{
        courseIdEdit,
        setCourseIdEdit,
        courseDelete,
        setCourseDelete,
      }}
    >
      <div className="w-full">
        <div className="flex items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Input
              placeholder={t("SearchPlaceholder")}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="max-w-sm"
            />
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("FilterStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("AllStatus")}</SelectItem>
                <SelectItem value="DRAFT">{t("Status.DRAFT")}</SelectItem>
                <SelectItem value="PUBLISHED">{t("Status.PUBLISHED")}</SelectItem>
                <SelectItem value="ARCHIVED">{t("Status.ARCHIVED")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AddCourse onSuccess={() => courseListQuery.refetch()} />
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
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
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
                    {t("NoResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            {t("PageInfo", {
              current: page,
              total: totalPages,
            })}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              {t("Previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              {t("Next")}
            </Button>
          </div>
        </div>
      </div>
      <EditCourse
        id={courseIdEdit}
        setId={setCourseIdEdit}
        onSuccess={() => courseListQuery.refetch()}
      />
      <AlertDialogDeleteCourse
        courseDelete={courseDelete}
        setCourseDelete={setCourseDelete}
        onSuccess={() => courseListQuery.refetch()}
      />
    </CourseTableContext.Provider>
  );
}
