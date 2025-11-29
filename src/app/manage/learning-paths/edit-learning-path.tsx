"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import SkillManager from "@/components/manage/SkillManager";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useUpdateLearningPathMutation } from "@/queries/useLearningPath";
import {
  UpdateLearningPathBodyType,
  UpdateLearningPathBody,
  LearningPathItemType,
} from "@/schemaValidations/learning-path.schema";
import { useToast } from "@/hooks/use-toast";

interface EditLearningPathProps {
  learningPath: LearningPathItemType;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditLearningPath({
  learningPath,
  onClose,
  onSuccess,
}: EditLearningPathProps) {
  const t = useTranslations("ManageLearningPath");
  const [showSkillManager, setShowSkillManager] = useState(false);

  const updateMutation = useUpdateLearningPathMutation();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UpdateLearningPathBodyType>({
    resolver: zodResolver(UpdateLearningPathBody),
    defaultValues: {
      title: learningPath.title,
      description: learningPath.description || "",
      skills: learningPath.skills || [],
    },
  });

  useEffect(() => {
    setValue("skills", learningPath.skills || []);
  }, [learningPath, setValue]);

  const toggleSkill = (skillName: string) => {
    const current = watch('skills') || [];
    if (current.includes(skillName)) {
      setValue('skills', current.filter((s: string) => s !== skillName), { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    } else {
      setValue('skills', [...current, skillName], { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const current = watch('skills') || [];
    const newSkills = current.filter((s) => s !== skillToRemove);
    setValue('skills', newSkills, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  };

  const onSubmit = async (data: UpdateLearningPathBodyType) => {
    try {
      await updateMutation.mutateAsync({
        id: learningPath.id,
        body: data,
      });
      toast({
        title: t("UpdateSuccess"),
        variant: "default",
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: t("UpdateError"),
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Edit")}</DialogTitle>
          <DialogDescription>{t("EditDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("FormTitle")}</Label>
            <Input
              id="title"
              placeholder={t("FormTitlePlaceholder")}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("FormDescription")}</Label>
            <Textarea
              id="description"
              placeholder={t("FormDescriptionPlaceholder")}
              rows={4}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">{t("FormSkills")}</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowSkillManager(true)}
                className="ml-2 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {t("ManageSkills") || "Manage Skills"}
              </Button>
            </div>
            {(watch('skills')?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {watch('skills')?.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {errors.skills && (
              <p className="text-sm text-red-500">{errors.skills.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t("Updating") : t("Update")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <SkillManager
        open={showSkillManager}
        onOpenChange={setShowSkillManager}
        onSelect={(s: any) => toggleSkill(s.name)}
        selectedItems={watch('skills') || []}
      />
    </Dialog>
  );
}
