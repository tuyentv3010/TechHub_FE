"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { useToast } from "@/components/ui/use-toast";
import {
  useBlogTags,
  useBlogs,
  useCreateBlogMutation,
  useDeleteBlogMutation,
  useUpdateBlogMutation,
} from "@/queries/useBlog";
import BlogEditorDialog from "@/components/blog/BlogEditorDialog";
import type {
  Blog,
  BlogStatus,
  CreateBlogBody,
  UpdateBlogBody,
} from "@/types/blog.types";

const PAGE_SIZE = 10;

const statusLabels: Record<BlogStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const statusBadgeVariant: Record<
  BlogStatus,
  "outline" | "secondary" | "default"
> = {
  DRAFT: "outline",
  PUBLISHED: "default",
  ARCHIVED: "secondary",
};

export default function BlogTable() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [selectedBlog, setSelectedBlog] = useState<Blog | undefined>();
  const [pendingDelete, setPendingDelete] = useState<Blog | undefined>();

  const filters = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      keyword: search.trim() || undefined,
      includeDrafts: true,
    }),
    [page, search]
  );

  const { data: blogPage, isLoading, isFetching } = useBlogs(filters);
  const blogs = blogPage?.data ?? [];
  const pagination = blogPage?.pagination;

  const { data: tagResponse } = useBlogTags();
  const availableTags = tagResponse?.data ?? [];

  const createMutation = useCreateBlogMutation();
  const updateMutation = useUpdateBlogMutation();
  const deleteMutation = useDeleteBlogMutation();

  const openCreateDialog = () => {
    setEditorMode("create");
    setSelectedBlog(undefined);
    setEditorOpen(true);
  };

  const openEditDialog = (blog: Blog) => {
    setEditorMode("edit");
    setSelectedBlog(blog);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }
    setEditorOpen(false);
    setSelectedBlog(undefined);
  };

  const handleCreate = (payload: CreateBlogBody) => {
    createMutation.mutate(payload, {
      onSuccess: () => {
        toast({
          title: "Article created",
          description: "The new blog post has been saved successfully.",
        });
        closeEditor();
      },
      onError: () =>
        toast({
          title: "Could not create the article",
          description: "Please review the information and try again.",
          variant: "destructive",
        }),
    });
  };

  const handleUpdate = (id: string, payload: UpdateBlogBody) => {
    updateMutation.mutate(
      { blogId: id, body: payload },
      {
        onSuccess: () => {
          toast({
            title: "Article updated",
            description: "Your changes have been saved.",
          });
          closeEditor();
        },
        onError: () =>
          toast({
            title: "Could not update the article",
            description: "Please try again later.",
            variant: "destructive",
          }),
      }
    );
  };

  const confirmDelete = (blog: Blog) => {
    setPendingDelete(blog);
  };

  const handleDelete = () => {
    if (!pendingDelete) {
      return;
    }
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast({
          title: "Article deleted",
          description: `${pendingDelete.title} has been removed.`,
        });
        setPendingDelete(undefined);
      },
      onError: () =>
        toast({
          title: "Could not delete the article",
          description: "Please try again later.",
          variant: "destructive",
        }),
    });
  };

  const editorSubmitting =
    editorMode === "create"
      ? createMutation.isPending
      : updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Search by title..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="md:max-w-sm"
        />
        <div className="flex items-center gap-2">
          {isFetching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Refreshing data…</span>
            </div>
          )}
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            New article
          </Button>
        </div>
      </div>

      <Separator />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="h-3 w-48 animate-pulse rounded bg-muted/60" />
                  </TableCell>
                  <TableCell>
                    <div className="h-3 w-16 animate-pulse rounded bg-muted/50" />
                  </TableCell>
                  <TableCell>
                    <div className="h-3 w-20 animate-pulse rounded bg-muted/50" />
                  </TableCell>
                  <TableCell>
                    <div className="h-3 w-28 animate-pulse rounded bg-muted/50" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : blogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No blog posts yet. Create the first article for the team.
                </TableCell>
              </TableRow>
            ) : (
              blogs.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{blog.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Created on {format(new Date(blog.created), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusBadgeVariant[blog.status]}
                      className="capitalize"
                    >
                      {statusLabels[blog.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(blog.updated), "HH:mm dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                      {blog.tags?.length ? blog.tags.map((tag) => `#${tag}`) : "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => openEditDialog(blog)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={() => confirmDelete(blog)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && blogs.length > 0 && (
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page + 1} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPrevious || page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setPage((prev) => (pagination.hasNext ? prev + 1 : prev))
              }
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <BlogEditorDialog
        open={editorOpen}
        mode={editorMode}
        availableTags={availableTags}
        initialBlog={selectedBlog}
        isSubmitting={editorSubmitting}
        onClose={closeEditor}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(value) => !value && setPendingDelete(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{pendingDelete?.title}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
