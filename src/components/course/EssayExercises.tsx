"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Loader2, CheckCircle2, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useSubmitExerciseMutation } from "@/queries/useCourse";

interface EssayExercise {
  id: string;
  question: string;
  lastAnswer?: string | null;
  lastFeedback?: string | null;
  lastSubmissionStatus?: string | null;
  bestScore?: number | null;
  lastSubmittedAt?: string | null;
}

/**
 * Learner-facing UI for OPEN_ENDED (essay) exercises. Unlike the timed
 * multiple-choice ExercisePlayer, essays are free-text and graded manually by
 * an instructor, so each one gets a textarea + submit button and shows the
 * latest submission state (pending review or graded with feedback).
 */
export default function EssayExercises({
  courseId,
  lessonId,
  exercises,
}: {
  courseId: string;
  lessonId: string;
  exercises: EssayExercise[];
}) {
  const t = useTranslations("Submission");

  if (!exercises || exercises.length === 0) return null;

  return (
    <div className="mt-6 space-y-4">
      <h4 className="flex items-center gap-2 font-semibold text-foreground">
        <FileText className="h-5 w-5" />
        {t("essayHeading")}
        <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700">
          {t("count", { count: exercises.length })}
        </span>
      </h4>

      {exercises.map((exercise, index) => (
        <EssayCard
          key={exercise.id}
          courseId={courseId}
          lessonId={lessonId}
          exercise={exercise}
          index={index}
        />
      ))}
    </div>
  );
}

function EssayCard({
  courseId,
  lessonId,
  exercise,
  index,
}: {
  courseId: string;
  lessonId: string;
  exercise: EssayExercise;
  index: number;
}) {
  const t = useTranslations("Submission");
  const { toast } = useToast();
  const submitMutation = useSubmitExerciseMutation();
  const [answer, setAnswer] = useState(exercise.lastAnswer ?? "");

  const status = exercise.lastSubmissionStatus;
  const isGraded = Boolean(status) && status !== "PENDING";
  const isPending = status === "PENDING";
  const hasSubmitted = Boolean(exercise.lastAnswer) || isGraded || isPending;

  const handleSubmit = async () => {
    if (!answer.trim()) {
      toast({
        variant: "destructive",
        title: t("emptyContentTitle"),
        description: t("emptyContentDesc"),
      });
      return;
    }
    try {
      await submitMutation.mutateAsync({
        courseId,
        lessonId,
        body: { exerciseId: exercise.id, answer: answer.trim() },
      });
      toast({ title: t("submitSuccessTitle"), description: t("submitSuccessDesc") });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("submitErrorTitle"),
        description: error?.payload?.message || error?.message || t("genericError"),
      });
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="font-medium text-foreground">
          <span className="mr-2 text-muted-foreground">
            {t("questionLabel", { index: index + 1 })}
          </span>
          {exercise.question}
        </p>
        <StatusBadge status={status} score={exercise.bestScore} />
      </div>

      <Textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder={t("answerPlaceholder")}
        rows={6}
        disabled={submitMutation.isPending}
        className="resize-y"
      />

      {exercise.lastFeedback ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <p className="mb-1 flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-300">
            <Award className="h-4 w-4" /> {t("instructorFeedback")}
          </p>
          <p className="whitespace-pre-wrap text-emerald-900/90 dark:text-emerald-200/90">
            {exercise.lastFeedback}
          </p>
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {isGraded ? t("hintGraded") : isPending ? t("hintPending") : t("hintNew")}
        </span>
        <Button onClick={handleSubmit} disabled={submitMutation.isPending || !answer.trim()}>
          {submitMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          {hasSubmitted ? t("resubmit") : t("submit")}
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status, score }: { status?: string | null; score?: number | null }) {
  const t = useTranslations("Submission");
  if (!status) return null;

  if (status === "PENDING") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
        <Clock className="h-3.5 w-3.5" /> {t("statusPending")}
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" /> {t("statusGraded")}
      {typeof score === "number" ? `: ${Math.round(score)}/100` : ""}
    </span>
  );
}
