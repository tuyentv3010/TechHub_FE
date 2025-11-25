"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useApproveExerciseDraftMutation,
  useRejectDraftMutation,
} from "@/queries/useAi";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import GenerateAiExercise from "./generate-ai-exercise";
import { useToast } from "@/components/ui/use-toast";

interface AiExercisePanelProps {
  courseId: string;
  chapters: unknown[];
  exerciseDrafts: unknown[];
  refetchDrafts: () => void;
}

export default function AiExercisePanel({ 
  courseId, 
  chapters, 
  exerciseDrafts,
  refetchDrafts 
}: AiExercisePanelProps) {
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations("AiExercise");
  const tCommon = useTranslations("common");
  const tAiDrafts = useTranslations("AiDrafts");

  const approveDraftMutation = useApproveExerciseDraftMutation();
  const rejectDraftMutation = useRejectDraftMutation();

  const handleApproveDraft = async (taskId: string) => {
    try {
      await approveDraftMutation.mutateAsync(taskId);
      toast({
        title: tCommon("success"),
        description: tAiDrafts("approveSuccess"),
      });
      refetchDrafts();
    } catch {
      toast({
        title: tCommon("error"),
        description: tAiDrafts("approveError"),
        variant: "destructive",
      });
    }
  };

  const handleRejectDraft = async (taskId: string) => {
    try {
      await rejectDraftMutation.mutateAsync({ taskId });
      toast({
        title: tCommon("success"),
        description: tAiDrafts("rejectSuccess"),
      });
      refetchDrafts();
    } catch {
      toast({
        title: tCommon("error"),
        description: tAiDrafts("rejectError"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate AI Exercise Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {t("title")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("description")}
          </p>
        </div>
        <GenerateAiExercise 
          courseId={courseId} 
          chapters={chapters} 
          onSuccess={refetchDrafts} 
        />
      </div>

      <Separator />

      {/* Exercise Drafts Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          {tAiDrafts("title")}
        </h3>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tAiDrafts("pendingExercises")}</CardTitle>
            <CardDescription>
              {tAiDrafts("pendingExercisesDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exerciseDrafts.length === 0 ? (
              <div className="text-sm text-muted-foreground">{tAiDrafts("noDrafts")}</div>
            ) : (
              <div className="space-y-3">
                {(exerciseDrafts as Array<{
                  taskId: string;
                  taskType: string;
                  status: string;
                  createdAt: string;
                  metadata?: { lessonTitle?: string };
                }>).map((draft) => (
                  <Card key={draft.taskId}>
                    <CardContent className="py-3 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{draft.taskType}</Badge>
                          <Badge variant={draft.status === "DRAFT" ? "secondary" : "default"}>
                            {draft.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(draft.createdAt).toLocaleString()}
                        </div>
                        {draft.metadata?.lessonTitle && (
                          <div className="text-sm font-medium">
                            {t("lesson")}: {draft.metadata.lessonTitle}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => router.push(`/manage/courses/${courseId}/exercise-drafts/${draft.taskId}`)}
                        >
                          {tAiDrafts("view")}
                        </Button>
                        <Button
                          size="sm"
                          disabled={approveDraftMutation.isPending}
                          onClick={() => handleApproveDraft(draft.taskId)}
                        >
                          {approveDraftMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {tAiDrafts("approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={rejectDraftMutation.isPending}
                          onClick={() => handleRejectDraft(draft.taskId)}
                        >
                          {rejectDraftMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {tAiDrafts("reject")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

