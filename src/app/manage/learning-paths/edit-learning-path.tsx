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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useUpdateLearningPathMutation } from "@/queries/useLearningPath";
import {
  UpdateLearningPathBodyType,
  UpdateLearningPathBody,
  LearningPathLevelEnum,
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
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(learningPath.skills || []);

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
      level: learningPath.level,
      estimatedDuration: learningPath.estimatedDuration,
      skills: learningPath.skills || [],
    },
  });

  const selectedLevel = watch("level");

  useEffect(() => {
    setSkills(learningPath.skills || []);
    setValue("skills", learningPath.skills || []);
  }, [learningPath, setValue]);

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      const newSkills = [...skills, skillInput.trim()];
      setSkills(newSkills);
      setValue("skills", newSkills);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const newSkills = skills.filter((s) => s !== skillToRemove);
    setSkills(newSkills);
    setValue("skills", newSkills);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">{t("FormLevel")}</Label>
              <Select
                value={selectedLevel}
                onValueChange={(value) =>
                  setValue("level", value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("FormLevelPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
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
              {errors.level && (
                <p className="text-sm text-red-500">{errors.level.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">{t("FormDuration")}</Label>
              <Input
                id="estimatedDuration"
                type="number"
                placeholder="0"
                {...register("estimatedDuration", { valueAsNumber: true })}
              />
              {errors.estimatedDuration && (
                <p className="text-sm text-red-500">{errors.estimatedDuration.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">{t("FormSkills")}</Label>
            <div className="flex gap-2">
              <Input
                id="skills"
                placeholder={t("FormSkillsPlaceholder")}
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSkill}
              >
                <X className="h-4 w-4 rotate-45" />
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((skill, index) => (
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
    </Dialog>
  );
}
