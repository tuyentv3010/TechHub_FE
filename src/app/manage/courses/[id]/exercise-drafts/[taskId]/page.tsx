"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslations } from "next-intl";
import {
  useApproveExerciseDraftMutation,
  useGetDraftById,
  useRejectDraftMutation,
} from "@/queries/useAi";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import TableSkeleton from "@/components/Skeleton";
import courseApiRequest from "@/apiRequests/course";

type DraftExerciseType = "MCQ" | "ESSAY" | "CODING";

interface DraftExercise {
  id: string;
  type: DraftExerciseType;
  question: string;
  options?: string[];
  explanation?: string;
  rubric?: string[];
  testCases?: Array<{ input: string; expectedOutput: string }>;
  suggestedCorrectIndices?: number[];
  difficulty?: string;
}

const MCQOption = memo(function MCQOption({
  option,
  optIdx,
  isSelected,
  onToggle,
}: {
  option: string;
  optIdx: number;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`p-3 rounded border cursor-pointer transition-colors ${
        isSelected
          ? "border-primary bg-primary/10 hover:bg-primary/20"
          : "border-border bg-card hover:bg-accent"
      }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 pointer-events-none"
        />
        <span className="font-semibold text-primary min-w-[24px]">
          {String.fromCharCode(65 + optIdx)}.
        </span>
        <span className="flex-1">{option}</span>
        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />}
      </div>
    </div>
  );
});

const MCQOptionsList = memo(function MCQOptionsList({
  exerciseIdx,
  options,
  selectedOptions,
  onToggle,
  selectLabel,
  selectedLabel,
}: {
  exerciseIdx: number;
  options: string[];
  selectedOptions: number[];
  onToggle: (exerciseIdx: number, optionIdx: number) => void;
  selectLabel: string;
  selectedLabel: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{selectLabel}:</p>
        {selectedOptions.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {selectedOptions.length} {selectedLabel}
          </Badge>
        )}
      </div>
      <div className="space-y-2">
        {options.map((option, optIdx) => (
          <MCQOption
            key={optIdx}
            option={option}
            optIdx={optIdx}
            isSelected={selectedOptions.includes(optIdx)}
            onToggle={() => onToggle(exerciseIdx, optIdx)}
          />
        ))}
      </div>
    </div>
  );
});

function normalizeExercises(rawPayload: any): DraftExercise[] {
  const parseLegacyChoices = (payload: any) => {
    if (payload?.choices?.[0]?.message?.content) {
      try {
        return JSON.parse(payload.choices[0].message.content);
      } catch {
        return null;
      }
    }
    return payload;
  };

  const payload = parseLegacyChoices(rawPayload);
  const source = payload?.exercises || payload?.drafts || payload;
  if (!source || typeof source !== "object") {
    return [];
  }

  const normalized: DraftExercise[] = [];

  const pushExercise = (type: DraftExerciseType, item: any, index: number) => {
    if (!item || typeof item !== "object") {
      return;
    }
    if (type === "MCQ") {
      const rawOptions = Array.isArray(item.options) ? item.options : item.options?.choices;
      const options = Array.isArray(rawOptions)
        ? rawOptions.map((option: any) => (typeof option === "string" ? option : String(option?.text || "")))
        : [];
      const suggestedCorrectIndices = Array.isArray(rawOptions)
        ? rawOptions
            .map((option: any, optionIndex: number) =>
              option?.correct === true || option?.isCorrect === true ? optionIndex : -1
            )
            .filter((optionIndex: number) => optionIndex >= 0)
        : [];

      normalized.push({
        id: `mcq-${index}`,
        type,
        question: String(item.question || item.prompt || ""),
        options,
        explanation: item.explanation ? String(item.explanation) : undefined,
        suggestedCorrectIndices,
        difficulty: item.difficulty ? String(item.difficulty) : undefined,
      });
      return;
    }

    if (type === "ESSAY") {
      normalized.push({
        id: `essay-${index}`,
        type,
        question: String(item.question || item.prompt || ""),
        explanation: item.explanation ? String(item.explanation) : undefined,
        rubric: Array.isArray(item.rubric || item.guidelines)
          ? (item.rubric || item.guidelines).map((entry: any) => String(entry))
          : [],
        difficulty: item.difficulty ? String(item.difficulty) : undefined,
      });
      return;
    }

    normalized.push({
      id: `coding-${index}`,
      type,
      question: String(item.question || item.title || item.description || ""),
      explanation: item.explanation ? String(item.explanation) : undefined,
      testCases: Array.isArray(item.testCases)
        ? item.testCases.map((testCase: any) => ({
            input: String(testCase?.input || ""),
            expectedOutput: String(testCase?.expectedOutput || ""),
          }))
        : [],
      difficulty: item.difficulty ? String(item.difficulty) : undefined,
    });
  };

  (Array.isArray(source.mcq) ? source.mcq : []).forEach((item: any, index: number) => pushExercise("MCQ", item, index));
  (Array.isArray(source.essay) ? source.essay : []).forEach((item: any, index: number) =>
    pushExercise("ESSAY", item, index)
  );
  (Array.isArray(source.coding) ? source.coding : []).forEach((item: any, index: number) =>
    pushExercise("CODING", item, index)
  );

  if (normalized.length > 0) {
    return normalized;
  }

  if (Array.isArray(source)) {
    source.forEach((item: any, index: number) => {
      const type = String(item?.type || "MCQ").toUpperCase();
      if (type === "CODING") {
        pushExercise("CODING", item, index);
      } else if (type === "ESSAY" || type === "OPEN_ENDED") {
        pushExercise("ESSAY", item, index);
      } else {
        pushExercise("MCQ", item, index);
      }
    });
  }

  return normalized;
}

export default function ExerciseDraftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const taskId = params.taskId as string;

  const { toast } = useToast();
  const t = useTranslations("AiExercise");
  const tCommon = useTranslations("common");
  const tAiDrafts = useTranslations("AiDrafts");

  const { data: draftData, isLoading, error } = useGetDraftById(taskId);
  const approveDraftMutation = useApproveExerciseDraftMutation();
  const rejectDraftMutation = useRejectDraftMutation();

  const draft = draftData?.payload?.data;
  const exercises = useMemo(() => normalizeExercises(draft?.resultPayload), [draft?.resultPayload]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number[]>>({});
  const [includedExercises, setIncludedExercises] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const nextSelectedAnswers: Record<number, number[]> = {};
    const nextIncludedExercises: Record<number, boolean> = {};
    exercises.forEach((exercise, index) => {
      nextIncludedExercises[index] = true;
      if (exercise.type === "MCQ" && exercise.suggestedCorrectIndices?.length) {
        nextSelectedAnswers[index] = exercise.suggestedCorrectIndices;
      }
    });
    setSelectedAnswers(nextSelectedAnswers);
    setIncludedExercises(nextIncludedExercises);
  }, [exercises]);

  const toggleAnswer = useCallback((exerciseIdx: number, optionIdx: number) => {
    setSelectedAnswers((prev) => {
      const current = prev[exerciseIdx] || [];
      return current.includes(optionIdx)
        ? { ...prev, [exerciseIdx]: current.filter((idx) => idx !== optionIdx) }
        : { ...prev, [exerciseIdx]: [...current, optionIdx] };
    });
  }, []);

  const toggleExerciseInclusion = useCallback((exerciseIdx: number) => {
    setIncludedExercises((prev) => ({ ...prev, [exerciseIdx]: !(prev[exerciseIdx] ?? true) }));
  }, []);

  const handleApprove = async () => {
    try {
      const selectedExercises = exercises.filter((_, index) => includedExercises[index] !== false);

      if (selectedExercises.length === 0) {
        toast({
          title: tCommon("error"),
          description: t("noExercises") || "Vui lòng chọn ít nhất một bài tập để duyệt.",
          variant: "destructive",
        });
        return;
      }

      for (const [index, exercise] of exercises.entries()) {
        if (includedExercises[index] === false) {
          continue;
        }
        if (exercise.type === "MCQ" && (selectedAnswers[index] || []).length === 0) {
          toast({
            title: tCommon("error"),
            description:
              `${t("pleaseSelectCorrectAnswer") || "Vui lòng chọn đáp án đúng cho"} ${t("mcq")} ${index + 1}`,
            variant: "destructive",
          });
          return;
        }
      }

      await approveDraftMutation.mutateAsync(taskId);
      const lessonId = draft?.targetReference;
      if (!lessonId) {
        throw new Error("Lesson ID not found in draft");
      }

      const exercisesData = selectedExercises.map((exercise) => {
        const exerciseIndex = exercises.findIndex((item) => item.id === exercise.id);
        if (exercise.type === "MCQ") {
          return {
            type: "MULTIPLE_CHOICE",
            question: exercise.question,
            options: {
              choices:
                exercise.options?.map((option, optionIndex) => ({
                  id: String.fromCharCode(97 + optionIndex),
                  text: option,
                  isCorrect: (selectedAnswers[exerciseIndex] || []).includes(optionIndex),
                })) || [],
            },
          };
        }

        if (exercise.type === "CODING") {
          return {
            type: "CODING",
            question: exercise.question,
            testCases: exercise.testCases || [],
          };
        }

        return {
          type: "OPEN_ENDED",
          question: exercise.question,
          options: {},
        };
      });

      if (exercisesData.length > 0) {
        await courseApiRequest.createExercises(courseId, lessonId, exercisesData);
      }

      toast({
        title: tCommon("success"),
        description:
          `${tAiDrafts("approveSuccessWithExercise") || "Đã duyệt draft và tạo"} ${exercisesData.length} ${t("exercises") || "bài tập"}`,
      });
      router.push(`/manage/courses/${courseId}/content`);
    } catch (approvalError) {
      console.error("Approval error:", approvalError);
      toast({
        title: tCommon("error"),
        description: tAiDrafts("approveError"),
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    try {
      await rejectDraftMutation.mutateAsync({ taskId });
      toast({
        title: tCommon("success"),
        description: tAiDrafts("rejectSuccess"),
      });
      router.push(`/manage/courses/${courseId}/content`);
    } catch {
      toast({
        title: tCommon("error"),
        description: tAiDrafts("rejectError"),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (!draft) {
    return (
      <div className="manage-page">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{t("noDraftFound") || "Không tìm thấy draft này"}</p>
          {error && (
            <div className="text-xs text-red-500">
              <p>Error: {JSON.stringify(error)}</p>
            </div>
          )}
          <Button onClick={() => router.push(`/manage/courses/${courseId}/content`)} className="mt-4">
            {tCommon("back")}
          </Button>
        </div>
      </div>
    );
  }

  if (!exercises.length) {
    return (
      <div className="manage-page">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Draft found but no exercises generated yet</p>
          <div className="text-xs text-muted-foreground">
            <p>Draft Status: {draft.status}</p>
            <p>Task Type: {draft.taskType}</p>
          </div>
          <Button onClick={() => router.push(`/manage/courses/${courseId}/content`)} className="mt-4">
            {tCommon("back")}
          </Button>
        </div>
      </div>
    );
  }

  const selectedCount = exercises.filter((_, index) => includedExercises[index] !== false).length;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/manage/courses/${courseId}/content`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {tCommon("back")}
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{tAiDrafts("draftDetail")}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{draft.taskType}</Badge>
            <Badge variant={draft.status === "DRAFT" ? "secondary" : "default"}>{draft.status}</Badge>
            <span className="text-sm text-muted-foreground">{new Date(draft.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={rejectDraftMutation.isPending} onClick={handleReject}>
            {rejectDraftMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {tAiDrafts("reject")}
          </Button>
          <Button disabled={approveDraftMutation.isPending} onClick={handleApprove}>
            {approveDraftMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {tAiDrafts("approve")}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("generatedExercises")}</h2>
          <Badge variant="secondary" className="text-xs">
            {selectedCount}/{exercises.length} {t("exercises") || "bài tập"}
          </Badge>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {exercises.map((exercise, idx) => (
            <AccordionItem key={exercise.id} value={exercise.id}>
              <AccordionTrigger>
                <div className="flex items-center gap-3 w-full">
                  <Checkbox
                    checked={includedExercises[idx] !== false}
                    onClick={(event) => event.stopPropagation()}
                    onCheckedChange={() => toggleExerciseInclusion(idx)}
                  />
                  <Badge variant="outline">{exercise.type}</Badge>
                  <span className="text-sm font-medium">
                    {t(exercise.type.toLowerCase())} {idx + 1}
                  </span>
                  {exercise.difficulty && <Badge variant="secondary">{exercise.difficulty}</Badge>}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="space-y-4 pt-4">
                    <p className="font-medium">{exercise.question}</p>

                    {exercise.type === "MCQ" && exercise.options && (
                      <MCQOptionsList
                        exerciseIdx={idx}
                        options={exercise.options}
                        selectedOptions={selectedAnswers[idx] || []}
                        onToggle={toggleAnswer}
                        selectLabel={t("selectCorrectAnswers") || "Chọn đáp án đúng"}
                        selectedLabel={t("selected") || "đã chọn"}
                      />
                    )}

                    {exercise.type === "CODING" && exercise.testCases && exercise.testCases.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{t("testCases")}:</p>
                        {exercise.testCases.map((testCase, tcIdx) => (
                          <div key={tcIdx} className="p-3 bg-muted rounded text-sm space-y-1">
                            <div>
                              <strong className="text-foreground">Input:</strong>{" "}
                              <code className="bg-background px-1 py-0.5 rounded">{testCase.input}</code>
                            </div>
                            <div>
                              <strong className="text-foreground">Expected:</strong>{" "}
                              <code className="bg-background px-1 py-0.5 rounded">{testCase.expectedOutput}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {exercise.type === "ESSAY" && exercise.rubric && exercise.rubric.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Rubric:</p>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground">
                          {exercise.rubric.map((entry, rubricIdx) => (
                            <li key={`${exercise.id}-rubric-${rubricIdx}`}>{entry}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {exercise.explanation && (
                      <div className="p-3 bg-muted rounded">
                        <p className="text-sm">{exercise.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
