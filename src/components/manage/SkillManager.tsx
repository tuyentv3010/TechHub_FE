"use client";

import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Loader2, Pencil, Trash2 } from "lucide-react";
import { useGetSkills, useCreateSkillMutation, useUpdateSkillMutation, useDeleteSkillMutation } from "@/queries/useCourse";
import MediaLibraryDialog from "@/components/common/media-library-dialog";
import { useAccountProfile } from "@/queries/useAccount";
import fileApiRequest from "@/apiRequests/file";
import { resolvePersistentFileUrl, normalizePublicMediaUrl } from "@/lib/file-media";
import { cn } from "@/lib/utils";

type Skill = { id: string; name: string; thumbnail?: string; category?: string; createdBy?: string | null };

const CATEGORY_BADGE: Record<string, string> = {
  LANGUAGE: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  FRAMEWORK: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  TOOL: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  CONCEPT: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  OTHER: "border-border bg-muted text-muted-foreground",
};

export default function SkillManager({
  open,
  onOpenChange,
  onSelect,
  selectedItems,
  embedded = false,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  onSelect?: (s: Skill) => void;
  selectedItems?: string[];
  embedded?: boolean;
}) {
  const { data: skillsData } = useGetSkills();
  const skills = skillsData?.payload?.data ?? [];

  const createSkill = useCreateSkillMutation();
  const updateSkill = useUpdateSkillMutation();
  const deleteSkill = useDeleteSkillMutation();
  const queryClient = useQueryClient();

  const { data: profileData } = useAccountProfile();
  const userId = profileData?.payload?.data?.id || "";
  const roles: string[] = profileData?.payload?.data?.roles ?? [];
  const isAdmin = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | undefined>(undefined);
  const [editingThumbnail, setEditingThumbnail] = useState<string | undefined>(undefined);
  const [showMedia, setShowMedia] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setEditingName("");
    setEditingCategory(undefined);
    setEditingThumbnail(undefined);
  };

  const handleAddOrUpdate = async () => {
    if (!editingName?.trim()) return;
    const body: any = { name: editingName.trim(), thumbnail: editingThumbnail, category: editingCategory };
    try {
      setIsSaving(true);
      if (editingId) {
        await updateSkill.mutateAsync({ id: editingId, body: { id: editingId, ...body } });
      } else {
        await createSkill.mutateAsync(body);
      }
      await queryClient.invalidateQueries({ queryKey: ["skills"] });
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (s: Skill) => {
    setEditingId(s.id);
    setEditingName(s.name);
    setEditingCategory(s.category);
    setEditingThumbnail(s.thumbnail);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteSkill.mutateAsync(id);
      await queryClient.invalidateQueries({ queryKey: ["skills"] });
    } finally {
      setDeletingId(null);
    }
  };

  // Persist the PUBLIC MinIO url (not the internal /api/proxy/... url) so the
  // thumbnail renders for everyone without an auth cookie — matching how course
  // thumbnails are stored (resolvePersistentFileUrl).
  const handleSelectFile = (file: any) => {
    const data = file?.payload?.data ?? file;
    const thumbnailUrl = resolvePersistentFileUrl(data, "thumbnail");
    if (thumbnailUrl) setEditingThumbnail(thumbnailUrl);
    setShowMedia(false);
  };

  const handleUpload = async (f: File | null) => {
    if (!f) return;
    const formData = new FormData();
    formData.append("file", f);
    formData.append("userId", String(userId));
    formData.append("altText", f.name);
    formData.append("caption", "Skill thumbnail");
    try {
      const response = await fileApiRequest.uploadFile(formData);
      const thumbnailUrl = response.payload?.data
        ? resolvePersistentFileUrl(response.payload.data, "thumbnail")
        : null;
      if (thumbnailUrl) setEditingThumbnail(thumbnailUrl);
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const previewThumbnail = normalizePublicMediaUrl(editingThumbnail);

  const body = (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Form */}
        <div className="lg:col-span-5 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Tên kỹ năng"
                className="flex-1"
              />
              <div className="sm:w-44">
                <Select
                  value={editingCategory ?? ""}
                  onValueChange={(v: string) => setEditingCategory(v || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Phân loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LANGUAGE">Language</SelectItem>
                    <SelectItem value="FRAMEWORK">Framework</SelectItem>
                    <SelectItem value="TOOL">Tool</SelectItem>
                    <SelectItem value="CONCEPT">Concept</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">Thumbnail</Label>
                  <span className="text-xs text-muted-foreground">(tùy chọn)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
                  />
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Tải lên
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowMedia(true)}>
                    Thư viện
                  </Button>
                </div>
              </div>
              <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40">
                {previewThumbnail ? (
                  <img src={previewThumbnail} alt="thumbnail" className="max-h-36 object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                    <ImageIcon className="h-6 w-6 opacity-40" />
                    Chưa chọn ảnh
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={handleAddOrUpdate} disabled={isSaving || !editingName.trim()}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Cập nhật" : "Thêm kỹ năng"}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={resetForm}>
                  Hủy
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right: List */}
        <div className="lg:col-span-7 max-h-[60vh] space-y-3 overflow-auto rounded-xl border border-border bg-card p-4 shadow-sm">
          {skills.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
              <ImageIcon className="h-6 w-6 opacity-40" />
              Chưa có kỹ năng nào.
            </div>
          ) : (
            skills.map((s: Skill) => {
              const thumb = normalizePublicMediaUrl(s.thumbnail);
              const isSelected = (selectedItems || []).includes(s.name);
              const canManage = isAdmin || (!!userId && s.createdBy === userId);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-3 transition hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                      {thumb ? (
                        <img src={thumb} alt={s.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{s.name}</div>
                      {s.category && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "mt-1 text-[10px] font-medium uppercase tracking-wide",
                            CATEGORY_BADGE[s.category] || CATEGORY_BADGE.OTHER
                          )}
                        >
                          {s.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className={canManage ? undefined : "hidden"}
                      onClick={() => startEdit(s)}
                    >
                      <Pencil className="h-3.5 w-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Sửa</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(!canManage && "hidden", "text-destructive hover:bg-destructive/10 hover:text-destructive")}
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

      <MediaLibraryDialog
        open={showMedia}
        onOpenChange={setShowMedia}
        onSelectFile={handleSelectFile}
        userId={String(userId)}
        mediaType="IMAGE"
        title="Chọn ảnh"
      />
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{body}</div>;
  }

  return (
    <Dialog open={!!open} onOpenChange={onOpenChange ?? (() => {})}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Quản lý kỹ năng</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
