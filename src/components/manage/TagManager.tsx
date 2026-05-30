"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Hash, Loader2, Pencil, Trash2 } from "lucide-react";
import { useGetTags, useCreateTagMutation, useUpdateTagMutation, useDeleteTagMutation } from "@/queries/useCourse";

type Tag = { id: string; name: string };

export default function TagManager({
  open,
  onOpenChange,
  onSelect,
  selectedItems,
  embedded = false,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  onSelect?: (s: Tag) => void;
  selectedItems?: string[];
  embedded?: boolean;
}) {
  const { data: tagsData } = useGetTags();
  const tags = tagsData?.payload?.data ?? [];

  const createTag = useCreateTagMutation();
  const updateTag = useUpdateTagMutation();
  const deleteTag = useDeleteTagMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddOrUpdate = async () => {
    if (!editingValue?.trim()) return;
    try {
      setIsSaving(true);
      if (editingId) {
        await updateTag.mutateAsync({ id: editingId, body: { id: editingId, name: editingValue.trim() } });
      } else {
        await createTag.mutateAsync({ name: editingValue.trim() });
      }
      setEditingId(null);
      setEditingValue("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteTag.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  };

  const body = (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          placeholder="Tên thẻ"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddOrUpdate();
          }}
        />
        <div className="flex gap-2">
          <Button onClick={handleAddOrUpdate} disabled={isSaving || !editingValue.trim()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingId ? "Cập nhật" : "Thêm"}
          </Button>
          {editingId && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setEditingValue("");
              }}
            >
              Hủy
            </Button>
          )}
        </div>
      </div>

      <div className="flex max-h-72 flex-col gap-2 overflow-auto">
        {tags.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            <Hash className="h-6 w-6 opacity-40" />
            Chưa có thẻ nào.
          </div>
        ) : (
          tags.map((s: Tag) => {
            const isSelected = (selectedItems || []).includes(s.name);
            return (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 transition hover:bg-muted/40"
              >
                <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                  <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{s.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(s.id);
                      setEditingValue(s.name);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Sửa</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={deletingId === s.id}
                    onClick={() => handleDelete(s.id)}
                  >
                    {deletingId === s.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  {onSelect && (
                    <Button
                      size="sm"
                      variant={isSelected ? "secondary" : "default"}
                      onClick={() => onSelect(s)}
                      disabled={isSelected}
                    >
                      {isSelected ? "Đã chọn" : "Chọn"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <Dialog open={!!open} onOpenChange={onOpenChange ?? (() => {})}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quản lý thẻ</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
