"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  useReindexCoursesMutation,
  useReindexLessonsMutation,
  useReindexAllMutation,
  useGetQdrantStats,
  useGetLearningPathDrafts,
  useApproveLearningPathDraftMutation,
  useRejectDraftMutation,
} from "@/queries/useAi";
import {
  Database,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  Clock,
  Sparkles,
  BarChart3,
  PieChart,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Pie, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid } from "recharts";

export default function DashboardPage() {
  const t = useTranslations("AiDashboard");
  const { toast } = useToast();
  const [qdrantStats, setQdrantStats] = useState<any>(null);
  const [reindexResults, setReindexResults] = useState<any>(null);
  const [showStatsDialog, setShowStatsDialog] = useState<boolean>(false);
  const [showResultDialog, setShowResultDialog] = useState<boolean>(false);

  const reindexCoursesMutation = useReindexCoursesMutation();
  const reindexLessonsMutation = useReindexLessonsMutation();
  const reindexAllMutation = useReindexAllMutation();
  const { data: qdrantStatsData, refetch: refetchQdrantStats, isLoading: qdrantStatsLoading } = useGetQdrantStats();

  // Update qdrant stats from query data
  useEffect(() => {
    if (qdrantStatsData?.payload?.data) {
      setQdrantStats(qdrantStatsData.payload.data);
    }
  }, [qdrantStatsData]);

  // Get pending drafts
  const { data: pathDraftsData } = useGetLearningPathDrafts();
  const pendingDrafts = pathDraftsData?.payload?.data || [];
  const approvePathDraftMutation = useApproveLearningPathDraftMutation();
  const rejectDraftMutation = useRejectDraftMutation();

  const handleApproveDraft = async (taskId: string) => {
    try {
      await approvePathDraftMutation.mutateAsync(taskId);
      toast({ title: t("draftApproved") });
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.message || t("draftApproveError"),
        variant: "destructive",
      });
    }
  };

  const handleRejectDraft = async (taskId: string) => {
    try {
      await rejectDraftMutation.mutateAsync({ taskId });
      toast({ title: t("draftRejected") });
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.message || t("draftRejectError"),
        variant: "destructive",
      });
    }
  };

  const handleReindexCourses = async () => {
    try {
      const response = await reindexCoursesMutation.mutateAsync();
      setReindexResults(response.payload?.data);
      setShowResultDialog(true);
      toast({
        title: t("success"),
        description: t("reindexCoursesSuccess"),
      });
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.message || t("reindexCoursesError"),
        variant: "destructive",
      });
    }
  };

  const handleReindexLessons = async () => {
    try {
      const response = await reindexLessonsMutation.mutateAsync();
      setReindexResults(response.payload?.data);
      setShowResultDialog(true);
      toast({
        title: t("success"),
        description: t("reindexLessonsSuccess"),
      });
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.message || t("reindexLessonsError"),
        variant: "destructive",
      });
    }
  };

  const handleReindexAll = async () => {
    try {
      const response = await reindexAllMutation.mutateAsync();
      setReindexResults(response.payload?.data);
      setShowResultDialog(true);
      toast({
        title: t("success"),
        description: t("reindexAllSuccess"),
      });
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.message || t("reindexError"),
        variant: "destructive",
      });
    }
  };

  const handleGetQdrantStats = async () => {
    try {
      const response = await refetchQdrantStats();
      if (response.data) {
        setQdrantStats(response.data.payload?.data);
        setShowStatsDialog(true);
      }
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.message || t("qdrantStatsError"),
        variant: "destructive",
      });
    }
  };

  // Prepare chart data
  const vectorChartData = useMemo(() => {
    if (!qdrantStats?.collections) return [];
    return [
      {
        name: "Courses",
        value: qdrantStats.collections.courses?.vectorCount || 0,
        fill: "hsl(var(--chart-1))",
      },
      {
        name: "Lessons",
        value: qdrantStats.collections.lessons?.vectorCount || 0,
        fill: "hsl(var(--chart-2))",
      },
    ];
  }, [qdrantStats]);

  const pieChartData = useMemo(() => {
    if (!qdrantStats?.collections) return [];
    const courses = qdrantStats.collections.courses?.vectorCount || 0;
    const lessons = qdrantStats.collections.lessons?.vectorCount || 0;
    const total = courses + lessons;
    if (total === 0) return [];
    return [
      {
        name: "Courses",
        value: courses,
        percentage: ((courses / total) * 100).toFixed(1),
      },
      {
        name: "Lessons",
        value: lessons,
        percentage: ((lessons / total) * 100).toFixed(1),
      },
    ];
  }, [qdrantStats]);

  const chartConfig = {
    value: {
      label: "Vectors",
    },
  };

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))"];

  return (
    <main className="p-4 sm:px-6 sm:py-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-500" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t("description")}
        </p>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("pendingDrafts")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingDrafts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("aiContent")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("coursesIndexed")}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {qdrantStats?.collections?.courses?.vectorCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("vectorsInQdrant")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("lessonsIndexed")}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {qdrantStats?.collections?.lessons?.vectorCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("vectorsInQdrant")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("qdrantStatus")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {qdrantStats?.healthy ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-lg font-bold">{t("healthy")}</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-lg font-bold">{t("unknown")}</span>
                </>
              )}
            </div>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-xs"
              onClick={handleGetQdrantStats}
              disabled={qdrantStatsLoading}
            >
              {qdrantStatsLoading ? t("loading") : t("refresh")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vector Count Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Thống kê Vectors theo Collection
            </CardTitle>
            <CardDescription>
              Số lượng vectors được lưu trữ trong Qdrant
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vectorChartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={vectorChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="hsl(var(--chart-1))" />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Không có dữ liệu để hiển thị</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Phân bố Vectors
            </CardTitle>
            <CardDescription>
              Tỷ lệ phân bố giữa Courses và Lessons
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <div className="space-y-4">
                <ChartContainer config={chartConfig} className="h-[250px]">
                  <RechartsPieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ChartContainer>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {pieChartData.map((item, index) => (
                    <div key={item.name} className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold">{item.value}</div>
                      <div className="text-sm text-muted-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{item.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>Không có dữ liệu để hiển thị</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Thống kê chi tiết Qdrant Collections
          </CardTitle>
          <CardDescription>
            Thông tin chi tiết về các collections và trạng thái của chúng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {qdrantStats?.collections ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Collection</TableHead>
                    <TableHead className="text-right">Vector Count</TableHead>
                    <TableHead className="text-right">Points Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Health</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(qdrantStats.collections).map(([collectionName, stats]: [string, any]) => (
                    <TableRow key={collectionName}>
                      <TableCell className="font-medium capitalize">{collectionName}</TableCell>
                      <TableCell className="text-right font-mono">
                        {stats.vectorCount?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {stats.pointsCount?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            stats.status === "green" || stats.status === "ok"
                              ? "default"
                              : stats.status === "error"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {stats.status || "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {stats.status === "green" || stats.status === "ok" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {qdrantStats.version && (
                    <TableRow>
                      <TableCell colSpan={2} className="font-medium">
                        Qdrant Version
                      </TableCell>
                      <TableCell colSpan={3} className="font-mono">
                        {qdrantStats.version}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không có dữ liệu thống kê</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vector Database Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {t("vectorDbManagement")}
            </CardTitle>
            <CardDescription>
              {t("reindexDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={handleReindexCourses}
                disabled={reindexCoursesMutation.isPending}
                variant="outline"
                className="justify-start"
              >
                {reindexCoursesMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("reindexingCourses")}
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    {t("reindexCourses")}
                  </>
                )}
              </Button>

              <Button
                onClick={handleReindexLessons}
                disabled={reindexLessonsMutation.isPending}
                variant="outline"
                className="justify-start"
              >
                {reindexLessonsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("reindexingLessons")}
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    {t("reindexLessons")}
                  </>
                )}
              </Button>

              <Button
                onClick={handleReindexAll}
                disabled={reindexAllMutation.isPending}
                variant="default"
                className="justify-start"
              >
                {reindexAllMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("reindexingAll")}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("reindexAll")}
                  </>
                )}
              </Button>

              <Button
                onClick={handleGetQdrantStats}
                disabled={qdrantStatsLoading}
                variant="secondary"
                className="justify-start"
              >
                {qdrantStatsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    {t("qdrantStats")}
                  </>
                )}
              </Button>
            </div>

            {reindexResults && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-blue-900">{t("latestReindexResults")}</p>
                    <p className="text-blue-700 mt-1">{reindexResults.message}</p>
                    {reindexResults.stats && (
                      <div className="mt-2 text-xs space-y-1">
                        <p>✓ {t("indexed")}: {reindexResults.stats.indexed}</p>
                        <p>✗ {t("failed")}: {reindexResults.stats.failed}</p>
                        {reindexResults.stats.duration && (
                          <p>⏱ {t("duration")}: {reindexResults.stats.duration}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Drafts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("pendingDrafts")}
            </CardTitle>
            <CardDescription>
              {t("reviewAndApprove")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingDrafts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("noPendingDrafts")}</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("type")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("createdAt")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDrafts.map((draft: any) => (
                      <TableRow key={draft.taskId}>
                        <TableCell>
                          <Badge variant="outline">
                            {draft.taskType === "LEARNING_PATH_GENERATION" ? "Lộ trình" : draft.taskType}
                          </Badge>
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(draft.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            disabled={approvePathDraftMutation.isPending}
                            onClick={() => handleApproveDraft(draft.taskId)}
                          >
                            {approvePathDraftMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {t("approve")}
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
                            {t("reject")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Qdrant Stats Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("qdrantStats")}</DialogTitle>
            <DialogDescription>
              {t("qdrantStatsDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qdrantStats ? (
              <>
                <div className="flex items-center gap-2">
                  <strong>{t("statusLabel")}:</strong>
                  {qdrantStats.healthy ? (
                    <Badge className="bg-green-500">{t("healthy")}</Badge>
                  ) : (
                    <Badge variant="destructive">Unhealthy</Badge>
                  )}
                </div>
                {qdrantStats.version && (
                  <div>
                    <strong>{t("version")}:</strong> {qdrantStats.version}
                  </div>
                )}
                <Separator />
                <div>
                  <strong className="text-lg">{t("collection")}s:</strong>
                  <div className="mt-3 space-y-3">
                    {Object.entries(qdrantStats.collections || {}).map(
                      ([collectionName, stats]: [string, any]) => (
                        <Card key={collectionName}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">{collectionName}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>{t("vectorCount")}:</span>
                              <span className="font-medium">{stats.vectorCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t("pointsCount")}:</span>
                              <span className="font-medium">{stats.pointsCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t("statusLabel")}:</span>
                              <Badge variant="outline">{stats.status}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {t("noDataQdrant")}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reindex Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("reindexResults")}</DialogTitle>
            <DialogDescription>
              {t("reindexDetails")}
            </DialogDescription>
          </DialogHeader>
          {reindexResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {reindexResults.success ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
                <span className="font-medium">{reindexResults.message}</span>
              </div>
              {reindexResults.stats && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t("indexed")}:</span>
                    <span className="font-medium text-green-600">
                      {reindexResults.stats.indexed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("failed")}:</span>
                    <span className="font-medium text-red-600">
                      {reindexResults.stats.failed}
                    </span>
                  </div>
                  {reindexResults.stats.duration && (
                    <div className="flex justify-between">
                      <span>{t("duration")}:</span>
                      <span className="font-medium">{reindexResults.stats.duration}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

