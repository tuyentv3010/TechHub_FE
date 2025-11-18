"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

import {
  ChevronDown,
  Edit,
  MoreHorizontal,
  Plus,
  Trash,
  Route,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useGetLearningPathList, useDeleteLearningPathMutation } from "@/queries/useLearningPath";
import { LearningPathItemType, LearningPathLevelEnum } from "@/schemaValidations/learning-path.schema";
import { useToast } from "@/hooks/use-toast";
import AddLearningPath from "./add-learning-path";
import EditLearningPath from "./edit-learning-path";
import { formatDateTimeToLocaleString } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function LearningPathTable() {
  const t = useTranslations("ManageLearningPath");
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Filters
  const [searchKeyword, setSearchKeyword] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");

  // Query
  const { data, isLoading, refetch } = useGetLearningPathList({
    page: pagination.pageIndex,
    size: pagination.pageSize,
  });

  const deleteMutation = useDeleteLearningPathMutation();
  const { toast } = useToast();

  // Edit state
  const [editingPath, setEditingPath] = useState<LearningPathItemType | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm(t("DeleteConfirm"))) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: t("DeleteSuccess"),
        variant: "default",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: t("DeleteError"),
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case LearningPathLevelEnum.BEGINNER:
        return "default";
      case LearningPathLevelEnum.INTERMEDIATE:
        return "secondary";
      case LearningPathLevelEnum.ADVANCED:
        return "destructive";
      default:
        return "outline";
    }
  };

  const columns: ColumnDef<LearningPathItemType>[] = [
    {
      accessorKey: "title",
      header: t("TableTitle"),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("title")}</div>
      ),
    },
    {
      accessorKey: "description",
      header: t("TableDescription"),
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate">
          {row.getValue("description")}
        </div>
      ),
    },
    {
      accessorKey: "level",
      header: t("TableLevel"),
      cell: ({ row }) => {
        const level = row.getValue("level") as string;
        if (!level) return <Badge variant="outline">N/A</Badge>;
        return (
          <Badge variant={getLevelBadgeVariant(level)}>
            {t(`Level.${level}`)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "estimatedDuration",
      header: t("TableDuration"),
      cell: ({ row }) => {
        const duration = row.getValue("estimatedDuration") as number;
        return <div>{duration} {t("Hours")}</div>;
      },
    },
    {
      accessorKey: "courses",
      header: t("TableCourses"),
      cell: ({ row }) => {
        const courses = row.original.courses || [];
        return <Badge variant="outline">{courses.length} {t("Courses")}</Badge>;
      },
    },
    {
      accessorKey: "skills",
      header: t("TableSkills"),
      cell: ({ row }) => {
        const skills = row.original.skills || [];
        return (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 3).map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {skills.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{skills.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "created",
      header: t("TableCreatedAt"),
      cell: ({ row }) => {
        const date = row.getValue("created") as string;
        return <div className="text-sm text-muted-foreground">{formatDateTimeToLocaleString(date)}</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const path = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/manage/learning-paths/${path.id}/designer`)}
              >
                <Route className="mr-2 h-4 w-4" />
                {t("DesignPath")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditingPath(path)}>
                <Edit className="mr-2 h-4 w-4" />
                {t("Edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(path.id)}
                className="text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                {t("Delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data?.payload?.data || [],
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
    manualPagination: true,
    pageCount: data?.payload?.pagination?.totalPages ?? -1,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 py-4">
        <Input
          placeholder={t("SearchPlaceholder")}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="max-w-sm"
        />
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("FilterLevel")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("AllLevels")}</SelectItem>
            <SelectItem value={LearningPathLevelEnum.BEGINNER}>
              {t(`Level.${LearningPathLevelEnum.BEGINNER}`)}
            </SelectItem>
            <SelectItem value={LearningPathLevelEnum.INTERMEDIATE}>
              {t(`Level.${LearningPathLevelEnum.INTERMEDIATE}`)}
            </SelectItem>
            <SelectItem value={LearningPathLevelEnum.ADVANCED}>
              {t(`Level.${LearningPathLevelEnum.ADVANCED}`)}
            </SelectItem>
            <SelectItem value={LearningPathLevelEnum.ALL_LEVELS}>
              {t(`Level.${LearningPathLevelEnum.ALL_LEVELS}`)}
            </SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              {t("Columns")} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        <AddLearningPath onSuccess={() => refetch()} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("Loading")}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {t("Page")} {pagination.pageIndex + 1} {t("Of")}{" "}
          {data?.payload?.pagination?.totalPages ?? 1}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("Previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t("Next")}
          </Button>
        </div>
      </div>

      {editingPath && (
        <EditLearningPath
          learningPath={editingPath}
          onClose={() => setEditingPath(null)}
          onSuccess={() => {
            setEditingPath(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
