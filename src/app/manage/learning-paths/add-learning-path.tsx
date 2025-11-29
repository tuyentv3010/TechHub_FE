"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import SkillManager from "@/components/manage/SkillManager";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCreateLearningPathMutation } from "@/queries/useLearningPath";
import {
  CreateLearningPathBodyType,
  CreateLearningPathBody,
} from "@/schemaValidations/learning-path.schema";
import { useToast } from "@/hooks/use-toast";

interface AddLearningPathProps {
  onSuccess?: () => void;
}

export default function AddLearningPath({ onSuccess }: AddLearningPathProps) {
  const t = useTranslations("ManageLearningPath");
  const [open, setOpen] = useState(false);
  const [showSkillManager, setShowSkillManager] = useState(false);

  const createMutation = useCreateLearningPathMutation();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateLearningPathBodyType>({
    resolver: zodResolver(CreateLearningPathBody),
    defaultValues: {
      title: "",
      description: "",
      skills: [],
    },
  });

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

  const onSubmit = async (data: CreateLearningPathBodyType) => {
    try {
      await createMutation.mutateAsync(data);
      toast({
        title: t("CreateSuccess"),
        variant: "default",
      });
      reset();
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: t("CreateError"),
        description: error?.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("AddNew")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("AddNew")}</DialogTitle>
          <DialogDescription>{t("AddDescription")}</DialogDescription>
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
            {watch('skills')?.length > 0 && (
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
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t("Creating") : t("Create")}
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
