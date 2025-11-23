"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  useGenerateExercisesMutation,
  useGetExerciseDrafts,
  useGetLatestExerciseDraft,
  useApproveExerciseDraftMutation,
  useRejectDraftMutation,
} from "@/queries/useAi";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Loader2, CheckCircle, XCircle, FileText, Code, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import courseApiRequest from "@/apiRequests/course";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface AiExercisePanelProps {
  courseId: string;
  chapters: any[];
}

export default function AiExercisePanel({ courseId, chapters }: AiExercisePanelProps) {
  const { toast } = useToast();
  const t = useTranslations("AiExercise");
  const tCommon = useTranslations("common");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(["BEGINNER"]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["MCQ"]);
  const [variants, setVariants] = useState<number>(1);
  const [includeExplanations, setIncludeExplanations] = useState<boolean>(true);
  const [includeTestCases, setIncludeTestCases] = useState<boolean>(true);
  const [customInstruction, setCustomInstruction] = useState<string>("");
  const [count, setCount] = useState<number>(5);
  const [showResultDialog, setShowResultDialog] = useState<boolean>(false);
  const [showDraftsDialog, setShowDraftsDialog] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);

  const queryClient = useQueryClient();
  const generateMutation = useGenerateExercisesMutation();
  const approveDraftMutation = useApproveExerciseDraftMutation();
  const rejectDraftMutation = useRejectDraftMutation();
  const latestDraftQuery = useGetLatestExerciseDraft(selectedLesson);
  const draftsQuery = useGetExerciseDrafts(selectedLesson);

  // Mutation to save exercises to course-service
  const saveExercisesMutation = useMutation({
    mutationFn: async (exercises: { mcq?: unknown[]; essay?: unknown[]; coding?: unknown[] }) => {
      const allExercises = [
        ...(exercises.mcq || []),
        ...(exercises.essay || []),
        ...(exercises.coding || []),
      ];
      return courseApiRequest.bulkCreateExercises(courseId, selectedLesson, {
        exercises: allExercises,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises", selectedLesson] });
      toast({
        title: tCommon("success"),
        description: t("exercisesSaved"),
      });
    },
  });

  // Get lessons for selected chapter
  const selectedChapterData = chapters.find((c) => c.id === selectedChapter);
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
        description: t("difficulty"),
        variant: "destructive",
      });
      return;
    }

    if (selectedFormats.length === 0) {
      toast({
        title: tCommon("error"),
        description: t("format"),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await generateMutation.mutateAsync({
        courseId,
        lessonId: selectedLesson,
        language: "vi",
        difficulties: selectedDifficulties as any,
        formats: selectedFormats as any,
        variants,
        includeExplanations,
        includeTestCases,
        customInstruction,
        count,
        type: selectedFormats[0],
        difficulty: selectedDifficulties[0],
      });

      setGeneratedResult(response.payload?.data);
      setShowResultDialog(true);

      toast({
        title: tCommon("success"),
        description: t("success"),
      });
    } catch (error: any) {
      toast({
        title: tCommon("error"),
        description: error?.message || t("error"),
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER":
        return "bg-green-500";
      case "INTERMEDIATE":
        return "bg-yellow-500";
      case "ADVANCED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "MCQ":
        return <CheckCircle className="h-4 w-4" />;
      case "ESSAY":
        return <MessageSquare className="h-4 w-4" />;
      case "CODING":
        return <Code className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const activeResult = generatedResult || latestDraftQuery.data?.payload?.data?.resultPayload;

  const handleApprove = async (taskId: string) => {
    try {
      await approveDraftMutation.mutateAsync(taskId);
      toast({ title: t("success") });
      draftsQuery.refetch();
      latestDraftQuery.refetch();
    } catch (error: any) {
      toast({
        title: tCommon("error"),
        description: error?.message || t("error"),
        variant: "destructive",
      });
    }
  };

  const handleReject = async (taskId: string) => {
    try {
      await rejectDraftMutation.mutateAsync({ taskId });
      toast({ title: t("success") });
      draftsQuery.refetch();
      latestDraftQuery.refetch();
    } catch (error: any) {
      toast({
        title: tCommon("error"),
        description: error?.message || t("error"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {t("title")}
          </CardTitle>
          <CardDescription>
            {t("title")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chapter Selection */}
          <div className="space-y-2">
            <Label>{t("selectLesson")}</Label>
            <Select value={selectedChapter} onValueChange={setSelectedChapter}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectLesson")} />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((chapter: any) => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lesson Selection */}
          <div className="space-y-2">
            <Label>{t("selectLesson")}</Label>
            <Select
              value={selectedLesson}
              onValueChange={setSelectedLesson}
              disabled={!selectedChapter}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectLesson")} />
              </SelectTrigger>
              <SelectContent>
                {lessons.map((lesson: any) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-2">
            <Label>{t("difficulty")}</Label>
            <div className="flex flex-wrap gap-2">
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
            <div className="flex flex-wrap gap-2">
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
            <Label htmlFor="count">{t("variants")}</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 5)}
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="explanations"
                checked={includeExplanations}
                onCheckedChange={(checked) => setIncludeExplanations(checked as boolean)}
              />
              <label
                htmlFor="explanations"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("includeExplanations")}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="testcases"
                checked={includeTestCases}
                onCheckedChange={(checked) => setIncludeTestCases(checked as boolean)}
              />
              <label
                htmlFor="testcases"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t("includeTestCases")}
              </label>
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">{t("customInstruction")}</Label>
            <Textarea
              id="instructions"
              placeholder={t("customInstruction")}
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !selectedLesson}
              className="flex-1"
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
          </div>
        </CardContent>
      </Card>

      {/* Right Column - Preview/Results */}
      <Card>
        <CardHeader>
          <CardTitle>Kết quả</CardTitle>
          <CardDescription>Xem trước bài tập được tạo bởi AI</CardDescription>
        </CardHeader>
        <CardContent>
          {!activeResult ? (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("noRecommendations")}</p>
              <p className="text-sm mt-2">{t("selectLesson")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  {activeResult.status === "COMPLETED" ? tCommon("success") : activeResult.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {activeResult.metadata?.totalCount || 0} {t("variants")}
                </span>
              </div>

              {activeResult.exercises && (
                <Tabs defaultValue="mcq" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="mcq" disabled={!activeResult.exercises.mcq}>
                      {t("mcq")}
                    </TabsTrigger>
                    <TabsTrigger value="essay" disabled={!activeResult.exercises.essay}>
                      {t("essay")}
                    </TabsTrigger>
                    <TabsTrigger value="coding" disabled={!activeResult.exercises.coding}>
                      {t("coding")}
                    </TabsTrigger>
                  </TabsList>

                  {/* MCQ Tab */}
                  <TabsContent value="mcq" className="space-y-4">
                    {activeResult.exercises.mcq?.map((exercise: any, idx: number) => (
                      <Card key={idx}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{t("mcq")} {idx + 1}</CardTitle>
                            <Badge className={getDifficultyColor(exercise.difficulty)}>
                              {exercise.difficulty}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="font-medium">{exercise.question}</p>
                          <div className="space-y-2">
                            {exercise.options?.map((option: any, optIdx: number) => (
                              <div
                                key={optIdx}
                                className={`p-2 rounded border ${
                                  option.correct
                                    ? "bg-green-50 border-green-300"
                                    : "bg-gray-50 border-gray-200"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {option.correct && <CheckCircle className="h-4 w-4 text-green-600" />}
                                  <span>{option.text}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {exercise.explanation && (
                            <div className="mt-3 p-3 bg-blue-50 rounded">
                              <p className="text-sm text-blue-900">
                                <strong>{t("includeExplanations")}:</strong> {exercise.explanation}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  {/* Essay Tab */}
                  <TabsContent value="essay" className="space-y-4">
                    {activeResult.exercises.essay?.map((exercise: any, idx: number) => (
                      <Card key={idx}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{t("essay")} {idx + 1}</CardTitle>
                            <Badge className={getDifficultyColor(exercise.difficulty)}>
                              {exercise.difficulty}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="font-medium">{exercise.prompt}</p>
                          {exercise.guidelines && exercise.guidelines.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-2">{t("customInstruction")}:</p>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {exercise.guidelines.map((guideline: string, gIdx: number) => (
                                  <li key={gIdx}>{guideline}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {exercise.suggestedLength && (
                            <p className="text-sm text-muted-foreground">
                              Độ dài đề xuất: {exercise.suggestedLength}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  {/* Coding Tab */}
                  <TabsContent value="coding" className="space-y-4">
                    {activeResult.exercises.coding?.map((exercise: any, idx: number) => (
                      <Card key={idx}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{exercise.title}</CardTitle>
                            <Badge className={getDifficultyColor(exercise.difficulty)}>
                              {exercise.difficulty}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p>{exercise.description}</p>
                          {exercise.starterCode && (
                            <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
                              <pre>{exercise.starterCode}</pre>
                            </div>
                          )}
                          {exercise.testCases && exercise.testCases.length > 0 && (
                            <Accordion type="single" collapsible>
                              <AccordionItem value="testcases">
                                <AccordionTrigger>
                                  Test Cases ({exercise.testCases.length})
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-2">
                                    {exercise.testCases.map((tc: any, tcIdx: number) => (
                                      <div key={tcIdx} className="border rounded p-3 text-sm">
                                        <div>
                                          <strong>Input:</strong> <code>{tc.input}</code>
                                        </div>
                                        <div>
                                          <strong>Expected:</strong> <code>{tc.expectedOutput}</code>
                                        </div>
                                        {tc.explanation && (
                                          <div className="text-muted-foreground mt-1">
                                            {tc.explanation}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}
                          {exercise.hints && exercise.hints.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-2">{t("customInstruction")}:</p>
                              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                {exercise.hints.map((hint: string, hIdx: number) => (
                                  <li key={hIdx}>{hint}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowDraftsDialog(true)}>
                  {t("viewDrafts")}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={saveExercisesMutation.isPending || !activeResult?.exercises}
                  onClick={() => {
                    if (activeResult?.exercises) {
                      saveExercisesMutation.mutate(activeResult.exercises);
                    }
                  }}
                >
                  {saveExercisesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tCommon("saving")}
                    </>
                  ) : (
                    t("saveToLesson")
                  )}
                </Button>
                <Button
                  className="flex-1"
                  disabled={approveDraftMutation.isPending || !latestDraftQuery.data?.payload?.data?.taskId}
                  onClick={() => {
                    const taskId = latestDraftQuery.data?.payload?.data?.taskId;
                    if (taskId) handleApprove(taskId);
                  }}
                >
                  {approveDraftMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tCommon("loading")}
                    </>
                  ) : (
                    t("approveDraft")
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Dialog (optional larger view) */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("success")}</DialogTitle>
            <DialogDescription>
              {t("success")}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              {t("success")}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Draft list dialog */}
      <Dialog open={showDraftsDialog} onOpenChange={setShowDraftsDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("viewDrafts")}</DialogTitle>
            <DialogDescription>
              {t("viewDrafts")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {draftsQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">{tCommon("loading")}</div>
            ) : (draftsQuery.data?.payload?.data || []).length === 0 ? (
              <div className="text-sm text-muted-foreground">{t("noRecommendations")}</div>
            ) : (
              <ScrollArea className="max-h-[60vh] pr-2">
                <div className="space-y-3">
                  {draftsQuery.data?.payload?.data?.map((draft: any) => (
                    <div key={draft.taskId} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{draft.taskType}</Badge>
                          <Badge
                            variant={
                              draft.status === "DRAFT"
                                ? "secondary"
                                : draft.status === "APPROVED"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {draft.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(draft.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <Separator />
                      <div className="text-sm text-muted-foreground">
                        {draft.resultPayload ? t("success") : t("error")}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={approveDraftMutation.isPending}
                          onClick={() => handleApprove(draft.taskId)}
                        >
                          {approveDraftMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {tCommon("save")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={rejectDraftMutation.isPending}
                          onClick={() => handleReject(draft.taskId)}
                        >
                          {rejectDraftMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {tCommon("cancel")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

