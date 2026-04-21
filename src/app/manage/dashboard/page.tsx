"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  useReindexAllMutation,
  useGetQdrantStats,
  useGetAiRuntimeStats,
  useGetAiProviderConfig,
  useGetLearningPathDrafts,
  useApproveLearningPathDraftMutation,
  useRejectDraftMutation,
  useGetLangfuseAnalytics,
} from "@/queries/useAi";
import {
  Database,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  Sparkles,
  BarChart3,
  MessageCircle,
  DollarSign,
  Zap,
  Settings,
  Activity,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";

type DraftItem = {
  taskId: string;
  taskType?: string;
  prompt?: string;
  created?: string;
  resultPayload?: {
    title?: string;
  };
};

export default function DashboardPage() {
  const t = useTranslations("AiDashboard");
  const locale = useLocale();
  const { toast } = useToast();
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [reindexResults, setReindexResults] = useState<any>(null);

  const reindexAllMutation = useReindexAllMutation();
  const { data: qdrantStatsData } = useGetQdrantStats();
  const { data: runtimeStatsData } = useGetAiRuntimeStats();
  const { data: providerConfigData } = useGetAiProviderConfig();
  const { data: analyticsData } = useGetLangfuseAnalytics(7);
  const { data: pathDraftsData } = useGetLearningPathDrafts();

  const approvePathDraftMutation = useApproveLearningPathDraftMutation();
  const rejectDraftMutation = useRejectDraftMutation();

  const qdrantStats = qdrantStatsData?.payload?.data;
  const runtime = runtimeStatsData?.payload?.data;
  const overview = runtime?.overview || {};
  const config = providerConfigData?.payload?.data || {};
  const metadata = config.metadata || {};
  const analytics = analyticsData?.payload?.data || {};
  const pendingDrafts: DraftItem[] = pathDraftsData?.payload?.data || [];
  const recentRuns = runtime?.chatRuns?.recent || [];

  const totalCourses = qdrantStats?.collections?.courses?.vectorCount || 0;
  const totalLessons = qdrantStats?.collections?.lessons?.vectorCount || 0;
  const systemHealthy = qdrantStats?.healthy !== false && !metadata.usingMockFallback;
  const activeModel = config.activeChatModel || t("emptyValue");
  const activeProvider = config.provider ? String(config.provider).toUpperCase() : t("emptyValue");
  const totalTokens = analytics.totalTokens || overview.totalTokens || 0;

  const formatDate = (value?: string) => {
    if (!value) {
      return t("emptyValue");
    }
    return new Intl.DateTimeFormat(locale).format(new Date(value));
  };

  const handleApproveDraft = async (taskId: string) => {
    try {
      await approvePathDraftMutation.mutateAsync(taskId);
      toast({ title: t("draftApproved") });
    } catch (error: any) {
      toast({ title: t("error"), description: error?.message, variant: "destructive" });
    }
  };

  const handleRejectDraft = async (taskId: string) => {
    try {
      await rejectDraftMutation.mutateAsync({ taskId });
      toast({ title: t("draftRejected") });
    } catch (error: any) {
      toast({ title: t("error"), description: error?.message, variant: "destructive" });
    }
  };

  const handleReindexAll = async () => {
    try {
      const response = await reindexAllMutation.mutateAsync();
      setReindexResults(response.payload?.data);
      setShowResultDialog(true);
      toast({ title: t("toasts.reindexSuccess") });
    } catch (error: any) {
      toast({ title: t("error"), description: error?.message, variant: "destructive" });
    }
  };

  return (
    <AdminPageFrame eyebrow={t("PageEyebrow")} title={t("title")} description={t("description")}>
      <AdminSurface className="space-y-6 p-5 md:p-7">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <Sparkles className="h-4 w-4" />
              {t("tabs.overview")}
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2">
              <Settings className="h-4 w-4" />
              {t("tabs.advanced")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card className="border-border/50">
                <CardContent className="pb-4 pt-5">
                  <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                    {systemHealthy ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {t("overview.systemStatus.label")}
                  </div>
                  <p className="text-2xl font-bold">
                    {systemHealthy ? t("overview.systemStatus.online") : t("overview.systemStatus.issue")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activeProvider} / {activeModel}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pb-4 pt-5">
                  <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    {t("overview.totalConversations.label")}
                  </div>
                  <p className="text-2xl font-bold">{overview.chatTotal || analytics.totalTraces || 0}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("overview.totalConversations.successful", { count: overview.chatSuccess || 0 })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pb-4 pt-5">
                  <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    {t("overview.aiCost.label")}
                  </div>
                  <p className="text-2xl font-bold">${(analytics.totalCost || 0).toFixed(4)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("overview.aiCost.tokensUsed", { count: totalTokens.toLocaleString(locale) })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pb-4 pt-5">
                  <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Database className="h-4 w-4" />
                    {t("overview.knowledgeBase.label")}
                  </div>
                  <p className="text-2xl font-bold">{totalCourses + totalLessons}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("overview.knowledgeBase.indexed", {
                      courses: totalCourses,
                      lessons: totalLessons,
                    })}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t("overview.pendingReview.title")}
                  {pendingDrafts.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {pendingDrafts.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{t("overview.pendingReview.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingDrafts.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <CheckCircle className="mx-auto mb-4 h-12 w-12 opacity-30" />
                    <p>{t("overview.pendingReview.empty")}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("overview.pendingReview.columns.type")}</TableHead>
                        <TableHead>{t("overview.pendingReview.columns.description")}</TableHead>
                        <TableHead>{t("overview.pendingReview.columns.created")}</TableHead>
                        <TableHead className="text-right">{t("overview.pendingReview.columns.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingDrafts.map((draft) => (
                        <TableRow key={draft.taskId}>
                          <TableCell>
                            <Badge variant="outline">
                              {draft.taskType === "LEARNING_PATH_GENERATION"
                                ? t("overview.pendingReview.learningPath")
                                : draft.taskType || t("emptyValue")}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <p className="line-clamp-2 text-sm">
                              {draft.resultPayload?.title ||
                                draft.prompt?.slice(0, 80) ||
                                t("overview.pendingReview.generatedDraft")}
                            </p>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(draft.created)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveDraft(draft.taskId)}
                                disabled={approvePathDraftMutation.isPending}
                              >
                                {t("overview.pendingReview.approve")}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRejectDraft(draft.taskId)}
                                disabled={rejectDraftMutation.isPending}
                              >
                                {t("overview.pendingReview.reject")}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Link href="/manage/ai-analytics">
                <Card className="cursor-pointer border-border/50 transition-colors hover:border-primary/50">
                  <CardContent className="flex items-center gap-3 pb-4 pt-5">
                    <BarChart3 className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-semibold">{t("overview.quickLinks.analytics.title")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("overview.quickLinks.analytics.description")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/manage/ai-traces">
                <Card className="cursor-pointer border-border/50 transition-colors hover:border-primary/50">
                  <CardContent className="flex items-center gap-3 pb-4 pt-5">
                    <Activity className="h-8 w-8 text-purple-500" />
                    <div>
                      <p className="font-semibold">{t("overview.quickLinks.traces.title")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("overview.quickLinks.traces.description")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/manage/ai-providers">
                <Card className="cursor-pointer border-border/50 transition-colors hover:border-primary/50">
                  <CardContent className="flex items-center gap-3 pb-4 pt-5">
                    <Zap className="h-8 w-8 text-amber-500" />
                    <div>
                      <p className="font-semibold">{t("overview.quickLinks.providers.title")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("overview.quickLinks.providers.description")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {t("advanced.vectorDb.title")}
                </CardTitle>
                <CardDescription>
                  {t("advanced.vectorDb.description", { version: qdrantStats?.version || "?" })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={handleReindexAll} disabled={reindexAllMutation.isPending}>
                    {reindexAllMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("advanced.vectorDb.reindexAll")}
                  </Button>
                </div>

                {qdrantStats?.collections && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("advanced.vectorDb.columns.collection")}</TableHead>
                        <TableHead className="text-right">{t("advanced.vectorDb.columns.vectors")}</TableHead>
                        <TableHead>{t("advanced.vectorDb.columns.status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(qdrantStats.collections).map(([name, stats]: [string, any]) => (
                        <TableRow key={name}>
                          <TableCell className="font-medium capitalize">{name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {stats.vectorCount?.toLocaleString(locale) || 0}
                          </TableCell>
                          <TableCell>
                            <Badge variant={stats.status === "green" ? "default" : "secondary"}>
                              {stats.status || t("emptyValue")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card className="border-border/50">
                <CardContent className="pb-3 pt-4">
                  <div className="text-xs text-muted-foreground">{t("advanced.runtime.chatTotal")}</div>
                  <p className="text-xl font-bold">{overview.chatTotal || 0}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t("advanced.runtime.chatTotalDetail", {
                      success: overview.chatSuccess || 0,
                      failed: overview.chatFailed || 0,
                    })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pb-3 pt-4">
                  <div className="text-xs text-muted-foreground">{t("advanced.runtime.avgLatency")}</div>
                  <p className="text-xl font-bold">{runtime?.latency?.chatAverageMs || 0}ms</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t("advanced.runtime.avgLatencyDetail", {
                      p95: runtime?.latency?.chatP95Ms || 0,
                    })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pb-3 pt-4">
                  <div className="text-xs text-muted-foreground">{t("advanced.runtime.legacyFallback")}</div>
                  <p className="text-xl font-bold">{overview.chatLegacyTotal || 0}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t("advanced.runtime.legacyFallbackDetail", {
                      mock: overview.mockChatResponses || 0,
                    })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pb-3 pt-4">
                  <div className="text-xs text-muted-foreground">{t("advanced.runtime.tokensTotal")}</div>
                  <p className="text-xl font-bold">{(overview.totalTokens || 0).toLocaleString(locale)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {t("advanced.runtime.tokensTotalDetail", {
                      avg: runtime?.tokens?.averagePerChat || 0,
                    })}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>{t("advanced.recentRuns.title")}</CardTitle>
                <CardDescription>{t("advanced.recentRuns.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                {recentRuns.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("advanced.recentRuns.columns.pipeline")}</TableHead>
                        <TableHead>{t("advanced.recentRuns.columns.intent")}</TableHead>
                        <TableHead className="text-right">{t("advanced.recentRuns.columns.latency")}</TableHead>
                        <TableHead className="text-right">{t("advanced.recentRuns.columns.tokens")}</TableHead>
                        <TableHead>{t("advanced.recentRuns.columns.status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentRuns.map((run: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">{run.pipeline}</TableCell>
                          <TableCell>{run.intent}</TableCell>
                          <TableCell className="text-right">{Number(run.duration_ms || 0).toFixed(0)}ms</TableCell>
                          <TableCell className="text-right">{run.tokens_used || 0}</TableCell>
                          <TableCell>
                            <Badge variant={run.success ? "secondary" : "destructive"}>
                              {run.success ? t("advanced.recentRuns.ok") : t("advanced.recentRuns.fail")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {t("advanced.recentRuns.empty")}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>{t("advanced.providerConfig.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("advanced.providerConfig.requestedProvider")}</span>
                  <span className="font-mono">{metadata.requestedProvider || t("emptyValue")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("advanced.providerConfig.effectiveProvider")}</span>
                  <span className="font-mono">{metadata.effectiveProvider || t("emptyValue")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("advanced.providerConfig.chatModel")}</span>
                  <span className="font-mono">{config.activeChatModel || t("emptyValue")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("advanced.providerConfig.embeddingModel")}</span>
                  <span className="font-mono">{config.activeEmbeddingModel || t("emptyValue")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("advanced.providerConfig.mockFallback")}</span>
                  <span>{metadata.usingMockFallback ? t("yes") : t("no")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("advanced.providerConfig.status")}</span>
                  <span>{metadata.statusMessage || t("emptyValue")}</span>
                </div>
                <div className="pt-2">
                  <Link href="/manage/ai-providers" className="text-sm text-blue-500 hover:underline">
                    {t("advanced.providerConfig.manageProviders")}
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AdminSurface>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialog.title")}</DialogTitle>
          </DialogHeader>
          {reindexResults && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t("dialog.success")}</span>
                <Badge variant={reindexResults.success ? "default" : "destructive"}>
                  {reindexResults.success ? t("yes") : t("no")}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>{t("dialog.indexed")}</span>
                <span className="font-mono">{reindexResults.stats?.indexed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("dialog.failed")}</span>
                <span className="font-mono">{reindexResults.stats?.failed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("dialog.duration")}</span>
                <span className="font-mono">{reindexResults.stats?.duration || t("emptyValue")}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageFrame>
  );
}
