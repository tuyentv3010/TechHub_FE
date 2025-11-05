"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PlusCircle,
  Edit,
  Trash2,
  GripVertical,
  Video,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { handleErrorApi } from "@/lib/utils";
import {
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
} from "@/queries/useCourse";
import {
  CreateAssetBodyType,
  CreateAssetBody,
  UpdateAssetBodyType,
  UpdateAssetBody,
  AssetItemType,
} from "@/schemaValidations/course.schema";

interface AssetManagementProps {
  courseId: string;
  chapterId: string;
  lessonId: string;
  assets: AssetItemType[];
  onRefresh?: () => void;
}

const AssetTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "VIDEO":
      return <Video className="h-4 w-4" />;
    case "DOCUMENT":
      return <FileText className="h-4 w-4" />;
    case "LINK":
      return <LinkIcon className="h-4 w-4" />;
    case "IMAGE":
      return <ImageIcon className="h-4 w-4" />;
    case "CODE":
      return <Code className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export default function AssetManagement({
  courseId,
  chapterId,
  lessonId,
  assets,
  onRefresh,
}: AssetManagementProps) {
  const t = useTranslations("ManageCourse");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<AssetItemType | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<AssetItemType | null>(null);

  const createMutation = useCreateAssetMutation();
  const updateMutation = useUpdateAssetMutation();
  const deleteMutation = useDeleteAssetMutation();

  const handleSuccess = () => {
    onRefresh?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{t("Assets")}</h4>
        <Button size="sm" variant="ghost" onClick={() => setAddDialogOpen(true)}>
          <PlusCircle className="h-3.5 w-3.5 mr-1" />
          {t("AddAsset")}
        </Button>
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-xs">
          {t("NoAssets")}
        </div>
      ) : (
        <div className="space-y-1.5">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="flex items-center gap-2 p-2 border rounded hover:bg-accent/20 transition-colors"
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-move" />
              <AssetTypeIcon type={asset.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs truncate">{asset.title}</span>
                  <Badge variant="outline" className="text-[10px] py-0">
                    {t(`AssetType.${asset.type}`)}
                  </Badge>
                </div>
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 hover:underline truncate block"
                >
                  {asset.url}
                </a>
              </div>
              <div className="flex gap-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setEditAsset(asset)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-destructive"
                  onClick={() => setDeleteAsset(asset)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Asset Dialog */}
      <AddAssetDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        courseId={courseId}
        chapterId={chapterId}
        lessonId={lessonId}
        createMutation={createMutation}
        nextOrder={assets.length + 1}
        onSuccess={handleSuccess}
      />

      {/* Edit Asset Dialog */}
      {editAsset && (
        <EditAssetDialog
          open={Boolean(editAsset)}
          onOpenChange={(open) => !open && setEditAsset(null)}
          courseId={courseId}
          chapterId={chapterId}
          lessonId={lessonId}
          asset={editAsset}
          updateMutation={updateMutation}
          onSuccess={handleSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deleteAsset)}
        onOpenChange={(open) => !open && setDeleteAsset(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ConfirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("DeleteAssetWarning", { title: deleteAsset?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteAsset) {
                  try {
                    await deleteMutation.mutateAsync({
                      courseId,
                      chapterId,
                      lessonId,
                      assetId: deleteAsset.id,
                    });
                    toast({
                      title: t("DeleteSuccess"),
                      description: t("AssetDeleted", { title: deleteAsset.title }),
                    });
                    setDeleteAsset(null);
                    handleSuccess();
                  } catch (error) {
                    handleErrorApi({ error });
                  }
                }
              }}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Add Asset Dialog Component
function AddAssetDialog({
  open,
  onOpenChange,
  courseId,
  chapterId,
  lessonId,
  createMutation,
  nextOrder,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  chapterId: string;
  lessonId: string;
  createMutation: any;
  nextOrder: number;
  onSuccess?: () => void;
}) {
  const t = useTranslations("ManageCourse");

  const form = useForm<CreateAssetBodyType>({
    resolver: zodResolver(CreateAssetBody),
    defaultValues: {
      assetType: "DOCUMENT",
      title: "",
      url: "",
      order: nextOrder,
    },
  });

  const onSubmit = async (data: CreateAssetBodyType) => {
    if (createMutation.isPending) return;
    try {
      await createMutation.mutateAsync({
        courseId,
        chapterId,
        lessonId,
        body: data,
      });
      toast({
        title: t("CreateSuccess"),
        description: t("AssetCreated", { title: data.title }),
      });
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("AddAsset")}</DialogTitle>
          <DialogDescription>{t("AddAssetDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">{t("AssetTypeLabel")}</Label>
            <Select
              value={form.watch("assetType")}
              onValueChange={(value: any) => form.setValue("assetType", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIDEO">{t("AssetType.VIDEO")}</SelectItem>
                <SelectItem value="DOCUMENT">{t("AssetType.DOCUMENT")}</SelectItem>
                <SelectItem value="LINK">{t("AssetType.LINK")}</SelectItem>
                <SelectItem value="IMAGE">{t("AssetType.IMAGE")}</SelectItem>
                <SelectItem value="CODE">{t("AssetType.CODE")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">{t("TitleLabel")}</Label>
            <Input
              id="title"
              placeholder={t("AssetTitlePlaceholder")}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">{t("URLLabel")}</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/file.pdf"
              {...form.register("url")}
            />
            {form.formState.errors.url && (
              <p className="text-sm text-destructive">
                {form.formState.errors.url.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">{t("OrderLabel")}</Label>
            <Input
              id="order"
              type="number"
              min={1}
              {...form.register("order", { valueAsNumber: true })}
            />
            {form.formState.errors.order && (
              <p className="text-sm text-destructive">
                {form.formState.errors.order.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t("Creating") : t("Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Asset Dialog Component
function EditAssetDialog({
  open,
  onOpenChange,
  courseId,
  chapterId,
  lessonId,
  asset,
  updateMutation,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  chapterId: string;
  lessonId: string;
  asset: AssetItemType;
  updateMutation: any;
  onSuccess?: () => void;
}) {
  const t = useTranslations("ManageCourse");

  const form = useForm<UpdateAssetBodyType>({
    resolver: zodResolver(UpdateAssetBody),
    defaultValues: {
      assetType: asset.type,
      title: asset.title,
      url: asset.url,
      order: asset.order,
    },
  });

  const onSubmit = async (data: UpdateAssetBodyType) => {
    if (updateMutation.isPending) return;
    try {
      await updateMutation.mutateAsync({
        courseId,
        chapterId,
        lessonId,
        assetId: asset.id,
        body: data,
      });
      toast({
        title: t("UpdateSuccess"),
        description: t("AssetUpdated", { title: data.title || asset.title }),
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("EditAsset")}</DialogTitle>
          <DialogDescription>{t("EditAssetDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">{t("AssetTypeLabel")}</Label>
            <Select
              value={form.watch("assetType")}
              onValueChange={(value: any) => form.setValue("assetType", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIDEO">{t("AssetType.VIDEO")}</SelectItem>
                <SelectItem value="DOCUMENT">{t("AssetType.DOCUMENT")}</SelectItem>
                <SelectItem value="LINK">{t("AssetType.LINK")}</SelectItem>
                <SelectItem value="IMAGE">{t("AssetType.IMAGE")}</SelectItem>
                <SelectItem value="CODE">{t("AssetType.CODE")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">{t("TitleLabel")}</Label>
            <Input
              id="title"
              placeholder={t("AssetTitlePlaceholder")}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">{t("URLLabel")}</Label>
            <Input
              id="url"
              type="url"
              {...form.register("url")}
            />
            {form.formState.errors.url && (
              <p className="text-sm text-destructive">
                {form.formState.errors.url.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">{t("OrderLabel")}</Label>
            <Input
              id="order"
              type="number"
              min={1}
              {...form.register("order", { valueAsNumber: true })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("Updating") : t("Update")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
