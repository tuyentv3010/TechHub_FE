"use client";

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
import { useGetDraftById, useApproveExerciseDraftMutation, useRejectDraftMutation } from "@/queries/useAi";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import TableSkeleton from "@/components/Skeleton";
import courseApiRequest from "@/apiRequests/course";
import { useState, useCallback, useMemo, memo } from "react";

// Memoized MCQ Option component to prevent re-renders
const MCQOption = memo(function MCQOption({ 
  option, 
  optIdx, 
  isSelected, 
  onToggle 
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
        {isSelected && (
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
        )}
      </div>
    </div>
  );
});

// Memoized MCQ Options list component
const MCQOptionsList = memo(function MCQOptionsList({
  exerciseIdx,
  options,
  selectedOptions,
  onToggle,
  selectLabel,
  selectedLabel
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

  // Parse draft and exercises - memoized to prevent re-parsing on each render
  const draft = draftData?.payload?.data;
  
  const exercises = useMemo(() => {
    try {
      if (draft?.resultPayload?.choices?.[0]?.message?.content) {
        const contentStr = draft.resultPayload.choices[0].message.content;
        const parsedContent = JSON.parse(contentStr);
        return parsedContent.exercises || null;
      }
    } catch (e) {
      console.error("Failed to parse exercise content:", e);
    }
    return null;
  }, [draft?.resultPayload]);

  // State to track selected correct answers for each exercise
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number[]>>({});

  const toggleAnswer = useCallback((exerciseIdx: number, optionIdx: number) => {
    setSelectedAnswers(prev => {
      const current = prev[exerciseIdx] || [];
      if (current.includes(optionIdx)) {
        return {
          ...prev,
          [exerciseIdx]: current.filter(idx => idx !== optionIdx)
        };
      } else {
        return {
          ...prev,
          [exerciseIdx]: [...current, optionIdx]
        };
      }
    });
  }, []);

  const handleApprove = async () => {
    try {
      console.log("🚀 handleApprove started");
      console.log("📋 Exercises:", exercises);
      console.log("📋 Selected answers:", selectedAnswers);
      
      // Validate that all MCQ exercises have correct answers selected
      if (exercises && exercises.length > 0) {
        for (let i = 0; i < exercises.length; i++) {
          const exercise = exercises[i];
          console.log(`📝 Exercise ${i}: type=${exercise.type}`);
          if (exercise.type === "MCQ") {
            const selected = selectedAnswers[i] || [];
            console.log(`📝 MCQ ${i}: selected answers = ${JSON.stringify(selected)}`);
            if (selected.length === 0) {
              console.log(`❌ MCQ ${i} has no selected answers - showing error toast`);
              toast({
                title: tCommon("error"),
                description: `${t("pleaseSelectCorrectAnswer") || "Vui lòng chọn đáp án đúng cho"} ${t("mcq")} ${i + 1}`,
                variant: "destructive",
              });
              return;
            }
          }
        }
      }

      // 1. Approve draft in AI service
      await approveDraftMutation.mutateAsync(taskId);
      
      // 2. Get lessonId from draft
      const lessonId = draft?.targetReference;
      
      console.log("🔍 Draft lessonId:", lessonId);
      console.log("🔍 CourseId:", courseId);
      console.log("🔍 Total exercises:", exercises?.length);
      
      if (!lessonId) {
        throw new Error("Lesson ID not found in draft");
      }

      // 3. Prepare ALL exercises to be created
      const exercisesData = [];
      if (exercises && exercises.length > 0) {
        for (let idx = 0; idx < exercises.length; idx++) {
          const exercise = exercises[idx];
          
          if (exercise.type === "MCQ") {
            const correctAnswerIndices = selectedAnswers[idx] || [];
            exercisesData.push({
              type: "MULTIPLE_CHOICE",
              question: exercise.question,
              options: {
                choices: exercise.options?.map((optText: string, optIdx: number) => ({
                  id: String.fromCharCode(97 + optIdx), // a, b, c, d
                  text: optText,
                  isCorrect: correctAnswerIndices.includes(optIdx)
                })) || []
              }
            });
          } else if (exercise.type === "CODING") {
            exercisesData.push({
              type: "CODING",
              question: exercise.question,
              testCases: exercise.testCases || []
            });
          } else if (exercise.type === "ESSAY") {
            exercisesData.push({
              type: "OPEN_ENDED",
              question: exercise.question,
              options: {}
            });
          }
        }
      }

      console.log("🔍 Total exercises to create:", exercisesData.length);
      console.log("🔍 Exercises data:", JSON.stringify(exercisesData, null, 2));

      if (exercisesData.length > 0) {
        // 4. Call proxy API to create all exercises at once
        const result = await courseApiRequest.createExercises(courseId, lessonId, exercisesData);
        console.log("✅ Exercises created:", result);
        
        toast({
          title: tCommon("success"),
          description: `${tAiDrafts("approveSuccessWithExercise") || "Đã duyệt draft và tạo"} ${exercisesData.length} ${t("exercises") || "bài tập"}`,
        });
      } else {
        toast({
          title: tCommon("success"),
          description: tAiDrafts("approveSuccess"),
        });
      }
      
      router.push(`/manage/courses/${courseId}/content`);
    } catch (error) {
      console.error("Approval error:", error);
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
      <div className="container mx-auto py-8">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{t("noDraftFound") || "Không tìm thấy draft này"}</p>
          {error && (
            <div className="text-xs text-red-500">
              <p>Error: {JSON.stringify(error)}</p>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            <p>Task ID: {taskId}</p>
            <p>Course ID: {courseId}</p>
          </div>
          <Button onClick={() => router.push(`/manage/courses/${courseId}/content`)} className="mt-4">
            {tCommon("back")}
          </Button>
        </div>
      </div>
    );
  }

  if (!exercises) {
    return (
      <div className="container mx-auto py-8">
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

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
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
            <Badge variant={draft.status === "DRAFT" ? "secondary" : "default"}>
              {draft.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(draft.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={rejectDraftMutation.isPending}
            onClick={handleReject}
          >
            {rejectDraftMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {tAiDrafts("reject")}
          </Button>
          <Button
            disabled={approveDraftMutation.isPending}
            onClick={handleApprove}
          >
            {approveDraftMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {tAiDrafts("approve")}
          </Button>
        </div>
      </div>

      {/* Exercise Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("generatedExercises")}</h2>
          <Badge variant="secondary" className="text-xs">
            {exercises?.length || 0} {t("exercises") || "bài tập"}
          </Badge>
        </div>
        {exercises && exercises.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {exercises.map((exercise: {
              type: string;
              question: string;
              options?: string[];
              explanation?: string;
              testCases?: Array<{ input: string; expectedOutput: string }>;
            }, idx: number) => (
              <AccordionItem key={idx} value={`exercise-${idx}`}>
                <AccordionTrigger>
                  <div className="flex items-center gap-3 w-full">
                    <Badge variant="outline">
                      {exercise.type}
                    </Badge>
                    <span className="text-sm font-medium">
                      {t(exercise.type.toLowerCase())} {idx + 1}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="space-y-3 pt-4">
                      <p className="font-medium">{exercise.question}</p>
                      
                      {/* MCQ Options - Using memoized component */}
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

                      {/* Test Cases for Coding */}
                      {exercise.type === "CODING" && exercise.testCases && (
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
                      
                      {/* Explanation */}
                      {exercise.explanation && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="explanation" className="border-none">
                            <AccordionTrigger className="text-sm font-medium hover:no-underline">
                              {t("explanation") || "Giải thích"}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="p-3 bg-muted rounded">
                                <p className="text-sm">{exercise.explanation}</p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-muted-foreground">{t("noExercises")}</p>
        )}
      </div>
    </div>
  );
}
