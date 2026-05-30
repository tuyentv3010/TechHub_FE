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
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, Edit, Loader2, MoreHorizontal, Route, Sparkles, Trash } from "lucide-react";

import { formatDateTimeToLocaleString } from "@/lib/utils";
import { getManageTableColumnClass } from "@/lib/manage-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
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
import { useToast } from "@/hooks/use-toast";
import { useDeleteLearningPathMutation, useGetLearningPathList } from "@/queries/useLearningPath";
import { useGetLearningPathDrafts, useRejectDraftMutation } from "@/queries/useAi";
import { normalizeLearningPathListPayload } from "@/lib/learning-paths";
import { DraftItemType } from "@/schemaValidations/ai.schema";
import { LearningPathItemType } from "@/schemaValidations/learning-path.schema";

import AddLearningPath from "./add-learning-path";
import EditLearningPath from "./edit-learning-path";
import GenerateAiLearningPath from "./generate-ai-learning-path";
import {
  LearningPathDraftPublishError,
  publishLearningPathDraft,
} from "./draft-publish";

export default function LearningPathTable() {
  const t = useTranslations("ManageLearningPath");
  const tAiDrafts = useTranslations("AiDrafts");
  const paginationT = useTranslations("Pagination");
  const router = useRouter();
  const { toast } = useToast();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [editingPath, setEditingPath] = useState<LearningPathItemType | null>(null);
  const [publishingDraftId, setPublishingDraftId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useGetLearningPathList({
    page: pagination.pageIndex,
    size: pagination.pageSize,
  });
  const { data: aiDraftsData, refetch: refetchDrafts, isLoading: aiDraftsLoading } = useGetLearningPathDrafts();
  const learningPathList = normalizeLearningPathListPayload(data?.payload);

  const deleteMutation = useDeleteLearningPathMutation();
  const rejectDraftMutation = useRejectDraftMutation();

  const handleDelete = async (id: string) => {
    if (!confirm(t("DeleteConfirm"))) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: t("DeleteSuccess") });
      refetch();
    } catch (error) {
      toast({
        title: t("DeleteError"),
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleApproveDraft = async (taskId: string) => {
    try {
      setPublishingDraftId(taskId);
      const draft = (aiDraftsData?.payload?.data || []).find(
        (item: DraftItemType) => item.taskId === taskId
      );

      await publishLearningPathDraft({ taskId, draft });
      toast({ title: tAiDrafts("approveSuccess") });
      refetch();
      refetchDrafts();
    } catch (error) {
      if (error instanceof LearningPathDraftPublishError && error.pathId) {
        toast({
          title: tAiDrafts("approveSuccess"),
          description: error.message,
        });
        refetch();
        refetchDrafts();
        return;
      }

      toast({
        title: tAiDrafts("approveError"),
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setPublishingDraftId(null);
    }
  };

  const handleRejectDraft = async (taskId: string) => {
    try {
      await rejectDraftMutation.mutateAsync({ taskId });
      toast({ title: tAiDrafts("rejectSuccess") });
      refetchDrafts();
    } catch (error) {
      toast({
        title: tAiDrafts("rejectError"),
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<LearningPathItemType>[] = [
    {
      accessorKey: "title",
      header: t("TableTitle"),
      cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "description",
      header: t("TableDescription"),
      cell: ({ row }) => <div className="max-w-[300px] truncate">{row.getValue("description")}</div>,
    },
    {
      accessorKey: "courses",
      header: t("TableCourses"),
      cell: ({ row }) => {
        const courses = row.original.courses || [];
        return (
          <Badge variant="outline">
            {courses.length} {t("Courses")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "skills",
      header: t("TableSkills"),
      cell: ({ row }) => {
        const skills = row.original.skills || [];
        return (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 3).map((skill, index) => (
              <Badge key={`${skill}-${index}`} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {skills.length > 3 ? (
              <Badge variant="secondary" className="text-xs">
                +{skills.length - 3}
              </Badge>
            ) : null}
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
              <Button variant="ghost" className="app-control app-control-sm">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="app-control-menu">
              <DropdownMenuLabel>{t("Actions")}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/manage/learning-paths/${path.id}/designer`)}>
                <Route className="mr-2 h-4 w-4" />
                {t("DesignPath")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEditingPath(path)}>
                <Edit className="mr-2 h-4 w-4" />
                {t("Edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(path.id)} className="text-destructive">
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
    data: learningPathList.data,
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
    pageCount: learningPathList.pagination?.totalPages ?? -1,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  return (
    <div className="manage-data-table w-full">
      <div className="manage-toolbar py-1">
        <Input
          placeholder={t("SearchPlaceholder")}
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
          className="manage-field max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="manage-secondary-button ml-auto">
              {t("Columns")} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <GenerateAiLearningPath
          onSuccess={() => {
            refetch();
            refetchDrafts();
          }}
          triggerClassName="manage-secondary-button"
        />
        <AddLearningPath
          onSuccess={() => refetch()}
          triggerClassName="manage-primary-button"
        />
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
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("Loading")}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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

      <div className="manage-pagination pt-4">
        <div className="manage-pagination-copy">
          {t("Page")} <strong>{pagination.pageIndex + 1}</strong> {t("Of")}{" "}
          <strong>{Math.max(learningPathList.pagination?.totalPages ?? 1, 1)}</strong>
        </div>
        <div className="manage-pagination-actions">
          <Button
            variant="outline"
            size="sm"
            className="manage-secondary-button manage-pagination-button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("Previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="manage-secondary-button manage-pagination-button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t("Next")}
          </Button>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) =>
              setPagination((current) => ({
                ...current,
                pageIndex: 0,
                pageSize: Number(value),
              }))
            }
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

      {editingPath ? (
        <EditLearningPath
          learningPath={editingPath}
          onClose={() => setEditingPath(null)}
          onSuccess={() => {
            setEditingPath(null);
            refetch();
          }}
        />
      ) : null}

      <Separator className="my-6" />

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-4 w-4" />
          {tAiDrafts("title")}
        </h3>
        <Card className="manage-surface border-border/50">
          <CardHeader>
            <CardTitle className="text-base">{tAiDrafts("pendingPaths")}</CardTitle>
            <CardDescription>{tAiDrafts("pendingPathsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {aiDraftsLoading ? (
              <div className="text-sm text-muted-foreground">{tAiDrafts("loading")}</div>
            ) : (aiDraftsData?.payload?.data || []).length === 0 ? (
              <div className="text-sm text-muted-foreground">{tAiDrafts("noDrafts")}</div>
            ) : (
              <div className="space-y-3">
                {(aiDraftsData?.payload?.data || []).map(
                  (draft: { taskId: string; taskType: string; status: string; createdAt: string }) => (
                    <Card key={draft.taskId} className="manage-subsurface border-border/50">
                      <CardContent className="flex items-center justify-between py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{draft.taskType}</Badge>
                            <Badge variant={draft.status === "DRAFT" ? "secondary" : "default"}>
                              {draft.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(draft.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="manage-primary-button"
                            onClick={() => router.push(`/manage/learning-paths/drafts/${draft.taskId}/designer`)}
                          >
                            <Route className="mr-2 h-4 w-4" />
                            {t("DesignPath")}
                          </Button>
                          <Button
                            size="sm"
                            className="manage-primary-button"
                            disabled={publishingDraftId === draft.taskId}
                            onClick={() => handleApproveDraft(draft.taskId)}
                          >
                            {publishingDraftId === draft.taskId ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {tAiDrafts("approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="manage-secondary-button"
                            disabled={rejectDraftMutation.isPending}
                            onClick={() => handleRejectDraft(draft.taskId)}
                          >
                            {rejectDraftMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {tAiDrafts("reject")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
