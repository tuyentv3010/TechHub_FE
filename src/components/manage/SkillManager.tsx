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
import { useGetSkills, useCreateSkillMutation, useUpdateSkillMutation, useDeleteSkillMutation } from "@/queries/useCourse";
import courseApiRequest from "@/apiRequests/course";
import MediaLibraryDialog from "@/components/common/media-library-dialog";
import { useAccountProfile } from "@/queries/useAccount";
import fileApiRequest from "@/apiRequests/file";
import { Badge } from "@/components/ui/badge";

type Skill = { id: string; name: string; thumbnail?: string; category?: string };

export default function SkillManager({
  open,
  onOpenChange,
  onSelect,
  selectedItems,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect?: (s: Skill) => void;
  selectedItems?: string[];
}) {
  const { data: skillsData } = useGetSkills();
  const skills = skillsData?.payload?.data ?? [];
  console.log("[SkillManager] skillsData:", skillsData);

  const createSkill = useCreateSkillMutation();
  const updateSkill = useUpdateSkillMutation();
  const deleteSkill = useDeleteSkillMutation();
  const queryClient = useQueryClient();
  const [isLoadingSkill, setIsLoadingSkill] = useState(false);

  const { data: profileData } = useAccountProfile();
  const userId = profileData?.payload?.data?.id || "";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | undefined>(undefined);
  const [editingThumbnail, setEditingThumbnail] = useState<string | undefined>(undefined);
  const [showMedia, setShowMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const handleAddOrUpdate = async () => {
    if (!editingName?.trim()) return;
    const body: any = { name: editingName.trim(), thumbnail: editingThumbnail, category: editingCategory };
    console.log("[SkillManager] handleAddOrUpdate body:", { editingId, body });
    if (editingId) {
      try {
        setIsSaving(true);
        const res = await updateSkill.mutateAsync({ id: editingId, body: { id: editingId, ...body } });
        console.log("[SkillManager] updateSkill response:", res);
        // ensure fresh data
        await queryClient.invalidateQueries({ queryKey: ["skills"] });
      } finally {
        setIsSaving(false);
        setEditingId(null);
        setEditingName("");
        setEditingCategory(undefined);
        setEditingThumbnail(undefined);
      }
    } else {
      try {
        setIsSaving(true);
        const res = await createSkill.mutateAsync(body);
        console.log("[SkillManager] createSkill response:", res);
        // ensure fresh data
        await queryClient.invalidateQueries({ queryKey: ["skills"] });
      } finally {
        setIsSaving(false);
        setEditingName("");
        setEditingCategory(undefined);
        setEditingThumbnail(undefined);
      }
    }
  };

  const handleSelectFile = (file: any) => {
    if (file?.payload?.data?.cloudinarySecureUrl) {
      setEditingThumbnail(file.payload.data.cloudinarySecureUrl);
    } else if (file?.cloudinarySecureUrl) {
      setEditingThumbnail(file.cloudinarySecureUrl);
    }
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
      if (response.payload?.data?.cloudinarySecureUrl) {
        setEditingThumbnail(response.payload.data.cloudinarySecureUrl);
      }
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Manage skills</DialogTitle>
        </DialogHeader>
          <div className="grid grid-cols-12 gap-6">
            {/* Left: Form */}
            <div className="col-span-5 p-4 border rounded-lg">
              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder="Skill name"
                    className="flex-1"
                  />
                  <div className="w-48">
                    <Select
                      value={editingCategory ?? ""}
                      onValueChange={(v: string) => setEditingCategory(v || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
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
                      <span className="text-xs text-muted-foreground">(optional)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
                      />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Upload</Button>
                      <Button variant="ghost" onClick={() => setShowMedia(true)}>Choose from library</Button>
                    </div>
                  </div>
                  <div className="w-full h-40 border rounded flex items-center justify-center bg-muted">
                    {editingThumbnail ? (
                      <img src={editingThumbnail} alt="thumb" className="max-h-36 object-contain" />
                    ) : (
                      <div className="text-sm text-muted-foreground">No thumbnail selected</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button onClick={handleAddOrUpdate} disabled={isSaving}>{editingId ? "Update" : "Add skill"}</Button>
                  {editingId && (
                    <Button variant="outline" onClick={() => { setEditingId(null); setEditingName(""); setEditingCategory(undefined); setEditingThumbnail(undefined); }}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: List */}
            <div className="col-span-7 p-4 border rounded-lg max-h-[60vh] overflow-auto">
              <div className="space-y-3">
                {skills.map((s: Skill) => (
                  <div key={s.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg hover:shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded overflow-hidden flex items-center justify-center">
                        {s.thumbnail ? (
                          <img src={s.thumbnail} alt={s.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-muted-foreground/20 rounded" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{s.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{s.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            setIsLoadingSkill(true);
                            const res = await courseApiRequest.getSkill(s.id);
                            console.log("[SkillManager] getSkill response:", res);
                            const payload = res.payload?.data ?? res.payload ?? null;
                            if (payload) {
                              setEditingId(payload.id);
                              setEditingName(payload.name ?? "");
                              setEditingCategory(payload.category ?? undefined);
                              setEditingThumbnail(payload.thumbnail ?? undefined);
                            } else {
                              // fallback to local value
                              setEditingId(s.id);
                              setEditingName(s.name);
                              setEditingCategory(s.category);
                              setEditingThumbnail(s.thumbnail);
                            }
                          } catch (err) {
                            console.error("Failed to load skill", err);
                            // fallback
                            setEditingId(s.id);
                            setEditingName(s.name);
                            setEditingCategory(s.category);
                            setEditingThumbnail(s.thumbnail);
                          } finally {
                            setIsLoadingSkill(false);
                          }
                        }}
                      >
                        {isLoadingSkill ? "Loading..." : "Edit"}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={async () => {
                        try {
                          console.log("[SkillManager] deleteSkill id:", s.id);
                          const res = await deleteSkill.mutateAsync(s.id);
                          console.log("[SkillManager] deleteSkill response:", res);
                          await queryClient.invalidateQueries({ queryKey: ["skills"] });
                        } catch (err) {
                          console.error("[SkillManager] deleteSkill error:", err);
                        }
                      }}>
                        Delete
                      </Button>
                            {onSelect && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  console.log("[SkillManager] Select button clicked for skill:", s);
                                  console.log("[SkillManager] Skill name:", s.name);
                                  console.log("[SkillManager] Current selectedItems:", selectedItems);
                                  console.log("[SkillManager] Calling onSelect with skill:", s);
                                  onSelect(s);
                                  console.log("[SkillManager] onSelect called");
                                }}
                                className={`${(selectedItems || []).includes(s.name) ? 'opacity-60 bg-gray-200 text-gray-700' : ''}`}
                              >
                                { (selectedItems || []).includes(s.name) ? 'Selected' : 'Select' }
                              </Button>
                            )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        <MediaLibraryDialog
          open={showMedia}
          onOpenChange={setShowMedia}
          onSelectFile={handleSelectFile}
          userId={String(userId)}
          mediaType="IMAGE"
          title="Select image"
        />
      </DialogContent>
    </Dialog>
  );
}
