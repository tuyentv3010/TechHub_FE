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
  DialogTrigger,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useGenerateLearningPathMutation } from "@/queries/useAi";
import { Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { useAiLearningPath } from "@/contexts/AiLearningPathContext";

interface GenerateAiLearningPathProps {
  onSuccess?: () => void;
}

export default function GenerateAiLearningPath({ onSuccess }: GenerateAiLearningPathProps) {
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations("AiLearningPath");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const { setGeneratedPath } = useAiLearningPath();

  // Form state
  const [goal, setGoal] = useState<string>("");
  const [timeframe, setTimeframe] = useState<string>("3-6 months");
  const [language, setLanguage] = useState<string>("vi");
  const [currentLevel, setCurrentLevel] = useState<string>("BEGINNER");
  const [targetLevel, setTargetLevel] = useState<string>("INTERMEDIATE");
  const [includePositions, setIncludePositions] = useState<boolean>(true);
  const [includeProjects, setIncludeProjects] = useState<boolean>(true);

  const generateMutation = useGenerateLearningPathMutation();

  // Get userId from localStorage (or auth context in real app)
  useState(() => {
    if (typeof window !== "undefined") {
      // In a real app, get from auth context
      const mockUserId = "123e4567-e89b-12d3-a456-426614174000";
      setUserId(mockUserId);
    }
  });

  const handleGenerate = async () => {
    if (!goal.trim()) {
      toast({
        title: tCommon("error"),
        description: t("goal"),
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: tCommon("error"),
        description: tCommon("error"),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await generateMutation.mutateAsync({
        goal,
        timeframe,
        language,
        currentLevel,
        targetLevel,
        userId,
        includePositions,
        includeProjects,
        duration: timeframe,
        level: currentLevel,
      });

      const pathData = response.payload?.data?.path;
      const taskId = response.payload?.data?.taskId;

      if (pathData) {
        // Save to context
        setGeneratedPath({
          ...pathData,
          taskId,
        });

        toast({
          title: tCommon("success"),
          description: t("successGenerated"),
        });

        // Close dialog
        setOpen(false);
        if (onSuccess) {
          onSuccess();
        }

        // Navigate to a temporary designer page or create new learning path
        // For now, we'll store it and show a prompt to open designer
        router.push(`/manage/learning-paths/new/designer?fromAi=true`);
      } else {
        toast({
          title: tCommon("success"),
          description: t("success"),
        });
        setOpen(false);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      toast({
        title: tCommon("error"),
        description: error?.message || t("error"),
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setGoal("");
    setTimeframe("3-6 months");
    setLanguage("vi");
    setCurrentLevel("BEGINNER");
    setTargetLevel("INTERMEDIATE");
    setIncludePositions(true);
    setIncludeProjects(true);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          {t("title")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>
            {t("title")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Goal */}
          <div className="space-y-2">
            <Label htmlFor="goal">
              {t("goal")} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="goal"
              placeholder={t("goal")}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
            />
          </div>

          {/* Timeframe */}
          <div className="space-y-2">
            <Label htmlFor="timeframe">{t("timeframe")}</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger id="timeframe">
                <SelectValue placeholder={t("timeframe")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-3 months">1-3 {tCommon("months")}</SelectItem>
                <SelectItem value="3-6 months">3-6 {tCommon("months")}</SelectItem>
                <SelectItem value="6-12 months">6-12 {tCommon("months")}</SelectItem>
                <SelectItem value="1-2 years">1-2 {tCommon("years")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Current Level */}
            <div className="space-y-2">
              <Label htmlFor="currentLevel">{t("currentLevel")}</Label>
              <Select value={currentLevel} onValueChange={setCurrentLevel}>
                <SelectTrigger id="currentLevel">
                  <SelectValue placeholder={t("currentLevel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">{t("beginner")}</SelectItem>
                  <SelectItem value="INTERMEDIATE">{t("intermediate")}</SelectItem>
                  <SelectItem value="ADVANCED">{t("advanced")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Level */}
            <div className="space-y-2">
              <Label htmlFor="targetLevel">{t("targetLevel")}</Label>
              <Select value={targetLevel} onValueChange={setTargetLevel}>
                <SelectTrigger id="targetLevel">
                  <SelectValue placeholder={t("targetLevel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERMEDIATE">{t("intermediate")}</SelectItem>
                  <SelectItem value="ADVANCED">{t("advanced")}</SelectItem>
                  <SelectItem value="EXPERT">{t("expert")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="language">{t("language")}</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue placeholder={t("language")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>{tCommon("options")}</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePositions"
                  checked={includePositions}
                  onCheckedChange={(checked) => setIncludePositions(checked as boolean)}
                />
                <label
                  htmlFor="includePositions"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("includePositions")}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeProjects"
                  checked={includeProjects}
                  onCheckedChange={(checked) => setIncludeProjects(checked as boolean)}
                />
                <label
                  htmlFor="includeProjects"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("includeProjects")}
                </label>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-900">
            <p className="font-medium mb-1">💡 {tCommon("note")}:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>{t("note1")}</li>
              <li>{t("note2")}</li>
              <li>{t("note3")}</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={generateMutation.isPending}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !goal.trim()}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tCommon("loading")}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t("generate")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

