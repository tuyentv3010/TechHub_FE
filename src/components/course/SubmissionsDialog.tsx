"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import {
  useGetExerciseSubmissions,
  useGradeSubmissionMutation,
} from "@/queries/useCourse";

interface ExerciseLite {
  id: string;
  type: string;
  question: string;
  options?: any;
}

interface SubmissionItem {
  id: string;
  userId: string;
  username?: string | null;
  avatar?: string | null;
  answer?: string | null;
  submissionData?: any;
  grade?: number | null;
  feedback?: string | null;
  status?: string | null;
  submittedAt?: string | null;
  gradedAt?: string | null;
}

/**
 * Instructor dialog: lists the latest submission per learner for one exercise
 * (quiz or essay) and lets the instructor enter a score + written feedback.
 */
export default function SubmissionsDialog({
  open,
  onOpenChange,
  courseId,
  lessonId,
  exercise,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  lessonId: string;
  exercise: ExerciseLite | null;
}) {
  const t = useTranslations("Submission");
  const { data, isLoading } = useGetExerciseSubmissions(
    courseId,
    lessonId,
    exercise?.id ?? "",
    open && Boolean(exercise),
  );
  const submissions: SubmissionItem[] = data?.payload?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {exercise?.question}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("loading")}
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <SubmissionRow
                key={submission.id}
                courseId={courseId}
                lessonId={lessonId}
                exercise={exercise as ExerciseLite}
                submission={submission}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SubmissionRow({
  courseId,
  lessonId,
  exercise,
  submission,
}: {
  courseId: string;
  lessonId: string;
  exercise: ExerciseLite;
  submission: SubmissionItem;
}) {
  const t = useTranslations("Submission");
  const { toast } = useToast();
  const gradeMutation = useGradeSubmissionMutation();
  const [grade, setGrade] = useState<string>(
    submission.grade != null ? String(submission.grade) : "",
  );
  const [feedback, setFeedback] = useState<string>(submission.feedback ?? "");

  const handleSave = async () => {
    const trimmed = grade.trim();
    const parsedGrade = trimmed === "" ? null : Number(trimmed);
    if (
      parsedGrade != null &&
      (Number.isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > 100)
    ) {
      toast({
        variant: "destructive",
        title: t("invalidGradeTitle"),
        description: t("invalidGradeDesc"),
      });
      return;
    }
    try {
      await gradeMutation.mutateAsync({
        courseId,
        lessonId,
        submissionId: submission.id,
        body: { grade: parsedGrade, feedback: feedback.trim() || null },
      });
      toast({ title: t("savedTitle"), description: t("savedDesc") });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("saveErrorTitle"),
        description: error?.payload?.message || error?.message || t("genericError"),
      });
    }
  };

  const displayName =
    submission.username || t("learnerFallback", { id: submission.userId.slice(0, 8) });

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar className="h-8 w-8">
            {submission.avatar ? (
              <AvatarImage src={submission.avatar} alt={displayName} />
            ) : null}
            <AvatarFallback>{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {formatWhen(submission.submittedAt)}
            </p>
          </div>
        </div>
        <SubmissionStatusBadge status={submission.status} grade={submission.grade} />
      </div>

      <AnswerView exercise={exercise} submission={submission} />

      <div className="mt-3 grid gap-2 sm:grid-cols-[120px_1fr] sm:items-start">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("gradeLabel")}
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            value={grade}
            onChange={(event) => setGrade(event.target.value)}
            placeholder="—"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("feedbackLabel")}
          </label>
          <Textarea
            rows={2}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder={t("feedbackPlaceholder")}
          />
        </div>
      </div>

      <div className="mt-2 flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={gradeMutation.isPending}>
          {gradeMutation.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : null}
          {t("saveGrade")}
        </Button>
      </div>
    </div>
  );
}

function AnswerView({
  exercise,
  submission,
}: {
  exercise: ExerciseLite;
  submission: SubmissionItem;
}) {
  const t = useTranslations("Submission");

  if (exercise.type === "MULTIPLE_CHOICE") {
    const choices: any[] = exercise.options?.choices ?? [];
    const selected = parseSelected(submission);
    const selectedTexts = choices
      .filter(
        (choice, idx) =>
          selected.includes(String(choice.id ?? idx)) ||
          selected.includes(String(idx)) ||
          selected.includes(String(choice.text)),
      )
      .map((choice) => choice.text);
    const correctTexts = choices.filter(isCorrectChoice).map((choice) => choice.text);
    return (
      <div className="space-y-1.5 text-sm">
        <div>
          <span className="text-muted-foreground">{t("selected")} </span>
          {selectedTexts.length ? (
            selectedTexts.join(", ")
          ) : (
            <span className="text-muted-foreground">{t("blank")}</span>
          )}
        </div>
        <div>
          <span className="text-muted-foreground">{t("correctAnswer")} </span>
          <span className="text-emerald-700">{correctTexts.join(", ") || "—"}</span>
        </div>
      </div>
    );
  }

  if (exercise.type === "CODING") {
    return (
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
        {submission.answer || t("blank")}
      </pre>
    );
  }

  // OPEN_ENDED (essay)
  return (
    <div className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">
      {submission.answer || <span className="text-muted-foreground">{t("blank")}</span>}
    </div>
  );
}

function SubmissionStatusBadge({
  status,
  grade,
}: {
  status?: string | null;
  grade?: number | null;
}) {
  const t = useTranslations("Submission");

  if (!status || status === "PENDING") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
        <Clock className="h-3.5 w-3.5" /> {t("statusPending")}
      </span>
    );
  }
  const passed = status === "PASSED";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}
    >
      {passed ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      {typeof grade === "number"
        ? `${Math.round(grade)}/100`
        : passed
          ? t("passed")
          : t("notPassed")}
    </span>
  );
}

function isCorrectChoice(choice: any) {
  return choice?.correct === true || choice?.isCorrect === true;
}

function parseSelected(submission: SubmissionItem): string[] {
  const fromData = submission.submissionData?.selectedAnswers;
  if (Array.isArray(fromData)) {
    return fromData.map((value: any) => String(value));
  }
  try {
    const parsed = JSON.parse(submission.answer ?? "");
    if (Array.isArray(parsed)) {
      return parsed.map((value: any) => String(value));
    }
  } catch {
    // answer is not JSON — treat as a single raw value below
  }
  return submission.answer ? [submission.answer] : [];
}

function formatWhen(value?: string | null) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return "";
  }
}
