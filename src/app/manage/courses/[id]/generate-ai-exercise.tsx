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
import { useGenerateExercisesMutation } from "@/queries/useAi";
import { Sparkles, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface GenerateAiExerciseProps {
  courseId: string;
  chapters: unknown[];
  onSuccess?: () => void;
}

export default function GenerateAiExercise({ courseId, chapters, onSuccess }: GenerateAiExerciseProps) {
  const { toast } = useToast();
  const t = useTranslations("AiExercise");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);

  // Form state
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(["BEGINNER"]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["MCQ"]);
  const [variants, setVariants] = useState<number>(1);
  const [count, setCount] = useState<number>(5);
  const [language, setLanguage] = useState<string>("vi");
  const [includeExplanations, setIncludeExplanations] = useState<boolean>(true);
  const [includeTestCases, setIncludeTestCases] = useState<boolean>(true);
  const [customInstruction, setCustomInstruction] = useState<string>("");

  const generateMutation = useGenerateExercisesMutation();

  // Get lessons for selected chapter
  const selectedChapterData = chapters.find((c) => (c as { id: string }).id === selectedChapter) as { lessons?: unknown[] } | undefined;
  const lessons = selectedChapterData?.lessons || [];

  const handleDifficultyToggle = (difficulty: string) => {
    setSelectedDifficulties((prev) =>
      prev.includes(difficulty)
        ? prev.filter((d) => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  const handleFormatToggle = (format: string) => {
    setSelectedFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
  };

  const handleGenerate = async () => {
    if (!selectedLesson) {
      toast({
        title: tCommon("error"),
        description: t("selectLesson"),
        variant: "destructive",
      });
      return;
    }

    if (selectedDifficulties.length === 0) {
      toast({
        title: tCommon("error"),
        description: t("selectDifficulty"),
        variant: "destructive",
      });
      return;
    }

    if (selectedFormats.length === 0) {
      toast({
        title: tCommon("error"),
        description: t("selectFormat"),
        variant: "destructive",
      });
      return;
    }

    try {
      await generateMutation.mutateAsync({
        courseId,
        lessonId: selectedLesson,
        language,
        difficulties: selectedDifficulties,
        formats: selectedFormats,
        variants,
        includeExplanations,
        includeTestCases,
        customInstruction,
        count,
        type: selectedFormats[0],
        difficulty: selectedDifficulties[0],
      } as Parameters<typeof generateMutation.mutateAsync>[0]);

      toast({
        title: tCommon("success"),
        description: t("successGenerated"),
      });

      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t("generationError");
      toast({
        title: tCommon("error"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedChapter("");
    setSelectedLesson("");
    setSelectedDifficulties(["BEGINNER"]);
    setSelectedFormats(["MCQ"]);
    setVariants(1);
    setCount(5);
    setLanguage("vi");
    setIncludeExplanations(true);
    setIncludeTestCases(true);
    setCustomInstruction("");
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
          {t("generateExercises")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {t("generateExercises")}
          </DialogTitle>
          <DialogDescription>
            {t("generateDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Chapter Selection */}
          <div className="space-y-2">
            <Label htmlFor="chapter">
              {t("selectChapter")} <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedChapter} onValueChange={(value) => {
              setSelectedChapter(value);
              setSelectedLesson(""); // Reset lesson when chapter changes
            }}>
              <SelectTrigger id="chapter">
                <SelectValue placeholder={t("selectChapter")} />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((chapter) => {
                  const ch = chapter as { id: string; title: string };
                  return (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.title}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Lesson Selection */}
          <div className="space-y-2">
            <Label htmlFor="lesson">
              {t("selectLesson")} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedLesson}
              onValueChange={setSelectedLesson}
              disabled={!selectedChapter}
            >
              <SelectTrigger id="lesson">
                <SelectValue placeholder={t("selectLesson")} />
              </SelectTrigger>
              <SelectContent>
                {(lessons as Array<{ id: string; title: string }>).map((lesson) => {
                  return (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-2">
            <Label>{t("difficulty")}</Label>
            <div className="flex flex-wrap gap-4">
              {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map((difficulty) => (
                <div key={difficulty} className="flex items-center space-x-2">
                  <Checkbox
                    id={`difficulty-${difficulty}`}
                    checked={selectedDifficulties.includes(difficulty)}
                    onCheckedChange={() => handleDifficultyToggle(difficulty)}
                  />
                  <label
                    htmlFor={`difficulty-${difficulty}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {difficulty === "BEGINNER" && t("beginner")}
                    {difficulty === "INTERMEDIATE" && t("intermediate")}
                    {difficulty === "ADVANCED" && t("advanced")}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>{t("format")}</Label>
            <div className="flex flex-wrap gap-4">
              {["MCQ", "ESSAY", "CODING"].map((format) => (
                <div key={format} className="flex items-center space-x-2">
                  <Checkbox
                    id={`format-${format}`}
                    checked={selectedFormats.includes(format)}
                    onCheckedChange={() => handleFormatToggle(format)}
                  />
                  <label
                    htmlFor={`format-${format}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {format === "MCQ" && t("mcq")}
                    {format === "ESSAY" && t("essay")}
                    {format === "CODING" && t("coding")}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Variants */}
            <div className="space-y-2">
              <Label htmlFor="variants">{t("variants")}</Label>
              <Input
                id="variants"
                type="number"
                min={1}
                max={10}
                value={variants}
                onChange={(e) => setVariants(parseInt(e.target.value) || 1)}
              />
            </div>

            {/* Count */}
            <div className="space-y-2">
              <Label htmlFor="count">{t("exerciseCount")}</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 5)}
              />
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
                  id="includeExplanations"
                  checked={includeExplanations}
                  onCheckedChange={(checked) => setIncludeExplanations(checked as boolean)}
                />
                <label
                  htmlFor="includeExplanations"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("includeExplanations")}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTestCases"
                  checked={includeTestCases}
                  onCheckedChange={(checked) => setIncludeTestCases(checked as boolean)}
                />
                <label
                  htmlFor="includeTestCases"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("includeTestCases")}
                </label>
              </div>
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">{t("customInstruction")}</Label>
            <Textarea
              id="instructions"
              placeholder={t("customInstructionPlaceholder")}
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              rows={3}
            />
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
            disabled={generateMutation.isPending || !selectedLesson}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tCommon("generating")}
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
