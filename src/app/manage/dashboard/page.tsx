"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  useReindexCoursesMutation,
  useReindexLessonsMutation,
  useReindexAllMutation,
  useGetQdrantStats,
  useGetAiRuntimeStats,
  useGetAiProviderConfig,
  useGetLearningPathDrafts,
  useApproveLearningPathDraftMutation,
  useRejectDraftMutation,
  useGetLangfuseAnalytics,
} from "@/queries/useAi";
import { useAccountProfile } from "@/queries/useAccount";
import {
  Database,
  Loader2,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  Clock,
  Sparkles,
  BarChart3,
  MessageCircle,
  DollarSign,
  Zap,
  Settings,
  Activity,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "next-intl";
import { AdminPageFrame } from "@/components/manage/admin-page-frame";
import Link from "next/link";

export default function DashboardPage() {
  const t = useTranslations("AiDashboard");
  const { toast } = useToast();
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [reindexResults, setReindexResults] = useState<any>(null);

  const reindexAllMutation = useReindexAllMutation();
  const { data: qdrantStatsData, isLoading: qdrantLoading } = useGetQdrantStats();
  const { data: runtimeStatsData } = useGetAiRuntimeStats();
  const { data: providerConfigData } = useGetAiProviderConfig();
  const { data: analyticsData } = useGetLangfuseAnalytics(7);
  const { data: pathDraftsData } = useGetLearningPathDrafts();
  const { data: accountData } = useAccountProfile();

  const qdrantStats = qdrantStatsData?.payload?.data;
  const runtime = runtimeStatsData?.payload?.data;
  const overview = runtime?.overview || {};
  const config = providerConfigData?.payload?.data || {};
  const metadata = config.metadata || {};
  const analytics = analyticsData?.payload?.data || {};
  const pendingDrafts = pathDraftsData?.payload?.data || [];
  const reviewerId = accountData?.payload?.data?.id;

  const approvePathDraftMutation = useApproveLearningPathDraftMutation();
  const rejectDraftMutation = useRejectDraftMutation();

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
      toast({ title: t("reindexSuccess") });
    } catch (error: any) {
      toast({ title: t("error"), description: error?.message, variant: "destructive" });
    }
  };

  // Computed values for admin-friendly display
  const totalCourses = qdrantStats?.collections?.courses?.vectorCount || 0;
  const totalLessons = qdrantStats?.collections?.lessons?.vectorCount || 0;
  const systemHealthy = qdrantStats?.healthy !== false && !metadata.usingMockFallback;
  const activeModel = config.activeChatModel || "Not configured";
  const activeProvider = (config.provider || "").toUpperCase();

  return (
    <AdminPageFrame
      eyebrow={t("eyebrow")}
      title="AI Dashboard"
      description="Overview of AI system health, usage, and content management"
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2"><Sparkles className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2"><Settings className="h-4 w-4" /> Advanced</TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 1: OVERVIEW — Admin-friendly, human-readable       */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-6">

          {/* Status KPIs — simple numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  {systemHealthy ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  System Status
                </div>
                <p className="text-2xl font-bold">{systemHealthy ? "Online" : "Issue"}</p>
                <p className="text-xs text-muted-foreground mt-1">{activeProvider} / {activeModel}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <MessageCircle className="h-4 w-4" />
                  Total Conversations
                </div>
                <p className="text-2xl font-bold">{overview.chatTotal || analytics.totalTraces || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.chatSuccess || 0} successful
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  AI Cost (7 days)
                </div>
                <p className="text-2xl font-bold">${(analytics.totalCost || 0).toFixed(4)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(analytics.totalTokens || overview.totalTokens || 0).toLocaleString()} tokens used
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Database className="h-4 w-4" />
                  Knowledge Base
                </div>
                <p className="text-2xl font-bold">{totalCourses + totalLessons}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalCourses} courses, {totalLessons} lessons indexed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Drafts — admin action needed */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Awaiting Review
                {pendingDrafts.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{pendingDrafts.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                AI-generated learning paths and exercises that need your approval before publishing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingDrafts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>All clear — no pending content to review</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDrafts.map((draft: any) => (
                      <TableRow key={draft.taskId}>
                        <TableCell>
                          <Badge variant="outline">
                            {draft.taskType === "LEARNING_PATH_GENERATION" ? "Learning Path" : draft.taskType}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <p className="text-sm line-clamp-2">
                            {draft.resultPayload?.title || draft.prompt?.slice(0, 80) || "AI-generated draft"}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {draft.created ? new Date(draft.created).toLocaleDateString("vi-VN") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleApproveDraft(draft.taskId)}
                              disabled={approvePathDraftMutation.isPending}>
                              Approve
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleRejectDraft(draft.taskId)}
                              disabled={rejectDraftMutation.isPending}>
                              Reject
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

          {/* Quick links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/manage/ai-analytics">
              <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-semibold">AI Analytics</p>
                    <p className="text-xs text-muted-foreground">Cost breakdown, usage trends</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/manage/ai-traces">
              <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <Activity className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="font-semibold">AI Traces</p>
                    <p className="text-xs text-muted-foreground">View individual conversations</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/manage/ai-providers">
              <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <Zap className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="font-semibold">AI Providers</p>
                    <p className="text-xs text-muted-foreground">Switch models, manage API keys</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 2: ADVANCED — Dev/ops technical details             */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="advanced" className="space-y-6">

          {/* Reindex controls */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" /> Vector Database Management
              </CardTitle>
              <CardDescription>
                Reindex course/lesson data from PostgreSQL to Qdrant vector search. Qdrant v{qdrantStats?.version || "?"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={handleReindexAll} disabled={reindexAllMutation.isPending}>
                  {reindexAllMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reindex All
                </Button>
              </div>

              {/* Collections table */}
              {qdrantStats?.collections && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collection</TableHead>
                      <TableHead className="text-right">Vectors</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(qdrantStats.collections).map(([name, stats]: [string, any]) => (
                      <TableRow key={name}>
                        <TableCell className="font-medium capitalize">{name}</TableCell>
                        <TableCell className="text-right font-mono">{stats.vectorCount?.toLocaleString() || 0}</TableCell>
                        <TableCell>
                          <Badge variant={stats.status === "green" ? "default" : "secondary"}>
                            {stats.status || "unknown"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Runtime stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-muted-foreground">Chat Total</div>
                <p className="text-xl font-bold">{overview.chatTotal || 0}</p>
                <p className="text-[10px] text-muted-foreground">Success: {overview.chatSuccess || 0} | Failed: {overview.chatFailed || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-muted-foreground">Avg Latency</div>
                <p className="text-xl font-bold">{runtime?.latency?.chatAverageMs || 0}ms</p>
                <p className="text-[10px] text-muted-foreground">P95: {runtime?.latency?.chatP95Ms || 0}ms</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-muted-foreground">Legacy Fallback</div>
                <p className="text-xl font-bold">{overview.chatLegacyTotal || 0}</p>
                <p className="text-[10px] text-muted-foreground">Mock: {overview.mockChatResponses || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-muted-foreground">Tokens Total</div>
                <p className="text-xl font-bold">{(overview.totalTokens || 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Avg/chat: {runtime?.tokens?.averagePerChat || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent chat runs table */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Recent Chat Runs</CardTitle>
              <CardDescription>Pipeline, intent, latency, tokens</CardDescription>
            </CardHeader>
            <CardContent>
              {(runtime?.chatRuns?.recent || []).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pipeline</TableHead>
                      <TableHead>Intent</TableHead>
                      <TableHead className="text-right">Latency</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(runtime.chatRuns.recent || []).map((run: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{run.pipeline}</TableCell>
                        <TableCell>{run.intent}</TableCell>
                        <TableCell className="text-right">{Number(run.duration_ms || 0).toFixed(0)}ms</TableCell>
                        <TableCell className="text-right">{run.tokens_used || 0}</TableCell>
                        <TableCell>
                          <Badge variant={run.success ? "secondary" : "destructive"}>
                            {run.success ? "OK" : "FAIL"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No chat runs yet</p>
              )}
            </CardContent>
          </Card>

          {/* Provider details */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Provider Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Requested provider</span><span className="font-mono">{metadata.requestedProvider}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Effective provider</span><span className="font-mono">{metadata.effectiveProvider}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Chat model</span><span className="font-mono">{config.activeChatModel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Embedding model</span><span className="font-mono">{config.activeEmbeddingModel}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mock fallback</span><span>{metadata.usingMockFallback ? "Yes" : "No"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{metadata.statusMessage}</span></div>
              <div className="pt-2">
                <Link href="/manage/ai-providers" className="text-sm text-blue-500 hover:underline">
                  Manage providers →
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reindex result dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reindex Complete</DialogTitle>
          </DialogHeader>
          {reindexResults && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Success</span><Badge variant={reindexResults.success ? "default" : "destructive"}>{reindexResults.success ? "Yes" : "No"}</Badge></div>
              <div className="flex justify-between"><span>Indexed</span><span className="font-mono">{reindexResults.stats?.indexed || 0}</span></div>
              <div className="flex justify-between"><span>Failed</span><span className="font-mono">{reindexResults.stats?.failed || 0}</span></div>
              <div className="flex justify-between"><span>Duration</span><span className="font-mono">{reindexResults.stats?.duration}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageFrame>
  );
}
