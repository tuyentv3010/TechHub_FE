"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGetTags, useCreateTagMutation, useUpdateTagMutation, useDeleteTagMutation } from "@/queries/useCourse";

type Tag = { id: string; name: string };

export default function TagManager({
  open,
  onOpenChange,
  onSelect,
  selectedItems,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect?: (s: Tag) => void;
  selectedItems?: string[];
}) {
  const { data: tagsData } = useGetTags();
  const tags = tagsData?.payload?.data ?? [];

  const createTag = useCreateTagMutation();
  const updateTag = useUpdateTagMutation();
  const deleteTag = useDeleteTagMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const handleAddOrUpdate = async () => {
    if (!editingValue?.trim()) return;
    if (editingId) {
      await updateTag.mutateAsync({ id: editingId, body: { id: editingId, name: editingValue } });
      setEditingId(null);
      setEditingValue("");
    } else {
      await createTag.mutateAsync({ name: editingValue });
      setEditingValue("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              placeholder="Tag name"
            />
            <Button onClick={handleAddOrUpdate}>{editingId ? "Update" : "Add"}</Button>
            {editingId && (
              <Button variant="outline" onClick={() => { setEditingId(null); setEditingValue(""); }}>
                Cancel
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-64 overflow-auto">
            {tags.map((s: Tag) => (
              <div key={s.id} className="flex items-center justify-between gap-2 border rounded px-2 py-1">
                <div>{s.name}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingId(s.id); setEditingValue(s.name); }}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteTag.mutateAsync(s.id)}>
                    Delete
                  </Button>
                  {onSelect && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onSelect(s)}
                      className={`${(selectedItems || []).includes(s.name) ? 'opacity-60 bg-gray-200 text-gray-700' : ''}`}
                    >
                      {(selectedItems || []).includes(s.name) ? 'Selected' : 'Select'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
