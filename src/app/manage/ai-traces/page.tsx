"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";
import { useGetLangfuseTraceDetail, useGetLangfuseTraces } from "@/queries/useAi";
import { Activity, ExternalLink, Eye, Settings, Sparkles } from "lucide-react";

export default function AiTracesPage() {
  const t = useTranslations("AiTraces");
  const paginationT = useTranslations("Pagination");
  const locale = useLocale();
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: tracesRes, isLoading, isFetching } = useGetLangfuseTraces(page, pageSize);
  const { data: detailRes } = useGetLangfuseTraceDetail(selectedTraceId || "");

  const traces = tracesRes?.payload?.data?.traces || [];
  const total = tracesRes?.payload?.data?.total || 0;
  const detail = detailRes?.payload?.data;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const emptyValue = t("emptyValue");

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const intentLabels: Record<string, string> = {
    recommendation: t("intent.courseAdvice"),
    knowledge: t("intent.learningQA"),
    data_query: t("intent.dataQuery"),
    visualization: t("intent.chartRequest"),
    file_analysis: t("intent.fileAnalysis"),
    conversation: t("intent.chat"),
    clarify: t("intent.followUp"),
    llm_generate_text: t("intent.aiCall"),
    chat_orchestration: t("intent.fullChat"),
  };

  return (
    <AdminPageFrame
      eyebrow={t("PageEyebrow")}
      title={t("Title")}
      description={t("Description", { count: total })}
      actions={
        <a href="https://langfuse.inova.id.vn" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            {t("openLangfuse")}
          </Button>
        </a>
      }
    >
      <AdminSurface className="space-y-6 p-5 md:p-7">
        <Tabs defaultValue="overview">
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

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("recentConversations")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.time")}</TableHead>
                    <TableHead>{t("columns.userPrompt")}</TableHead>
                    <TableHead>{t("columns.type")}</TableHead>
                    <TableHead className="text-right">{t("columns.responseTime")}</TableHead>
                    <TableHead className="text-right">{t("columns.cost")}</TableHead>
                    <TableHead>{t("columns.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        {t("loading")}
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && traces.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        {t("noConversations")}
                      </TableCell>
                    </TableRow>
                  )}
                  {traces.map((trace: any) => {
                    const meta = trace.metadata || {};
                    const intent = meta.intent || trace.name || emptyValue;
                    const timestamp = trace.timestamp ? new Date(trace.timestamp) : null;
                    return (
                      <TableRow
                        key={trace.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedTraceId(trace.id)}
                      >
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {timestamp
                            ? timestamp.toLocaleString(locale, {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                              })
                            : emptyValue}
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <p className="line-clamp-1 text-sm">{trace.input || trace.name || emptyValue}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {intentLabels[intent] || intent}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {trace.latency ? `${(trace.latency * 1000).toFixed(0)}ms` : emptyValue}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          ${(trace.totalCost || 0).toFixed(4)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("trackedCount", { count: total })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    {paginationT("Previous")}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {paginationT("Page")} {page} {paginationT("Of")} {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || isFetching}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    {paginationT("Next")}
                  </Button>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPage(1);
                      setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder={paginationT("RowsPerPage")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("advancedTraces")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.time")}</TableHead>
                    <TableHead>{t("columns.name")}</TableHead>
                    <TableHead>{t("columns.user")}</TableHead>
                    <TableHead>{t("columns.intent")}</TableHead>
                    <TableHead>{t("columns.model")}</TableHead>
                    <TableHead className="text-right">{t("columns.latency")}</TableHead>
                    <TableHead className="text-right">{t("columns.cost")}</TableHead>
                    <TableHead className="text-right">{t("columns.observations")}</TableHead>
                    <TableHead>{t("columns.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        {t("loading")}
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && traces.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        {t("noConversations")}
                      </TableCell>
                    </TableRow>
                  )}
                  {traces.map((trace: any) => {
                    const meta = trace.metadata || {};
                    const timestamp = trace.timestamp ? new Date(trace.timestamp) : null;
                    return (
                      <TableRow
                        key={trace.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedTraceId(trace.id)}
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {timestamp
                            ? timestamp.toLocaleString(locale, {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                              })
                            : emptyValue}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{trace.name || emptyValue}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {trace.userId ? `${trace.userId.slice(0, 8)}...` : emptyValue}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {meta.intent || trace.name || emptyValue}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {(trace.modelsUsed || []).join(", ") || emptyValue}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {trace.latency ? `${(trace.latency * 1000).toFixed(0)}ms` : emptyValue}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          ${(trace.totalCost || 0).toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right text-xs">{trace.observationsCount || 0}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("trackedCount", { count: total })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    {paginationT("Previous")}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {paginationT("Page")} {page} {paginationT("Of")} {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || isFetching}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    {paginationT("Next")}
                  </Button>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPage(1);
                      setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder={paginationT("RowsPerPage")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </AdminSurface>

      <Dialog open={!!selectedTraceId} onOpenChange={() => setSelectedTraceId(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t("detail.title")}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {detail && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">{t("detail.responseTime")}</div>
                    <p className="font-semibold">
                      {detail.latency ? `${(detail.latency * 1000).toFixed(0)}ms` : emptyValue}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">{t("detail.cost")}</div>
                    <p className="font-semibold">
                      ${(detail.total_cost || detail.totalCost || 0).toFixed(6)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">{t("detail.steps")}</div>
                    <p className="font-semibold">{(detail.observations || []).length}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">{t("detail.user")}</div>
                    <p className="font-mono text-xs">{detail.user_id || detail.userId || emptyValue}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">{t("detail.userAsked")}</h4>
                  <pre className="max-h-24 overflow-y-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">
                    {typeof detail.input === "string" ? detail.input : JSON.stringify(detail.input, null, 2)}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">{t("detail.aiAnswered")}</h4>
                  <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">
                    {typeof detail.output === "string" ? detail.output : JSON.stringify(detail.output, null, 2)}
                  </pre>
                </div>

                {(detail.observations || []).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">
                      {t("detail.processingSteps", { count: detail.observations.length })}
                    </h4>
                    {detail.observations.map((obs: any, index: number) => (
                      <div key={index} className="rounded-lg border p-3">
                        <div className="mb-1 flex items-center gap-2">
                          <Badge
                            variant={obs.type === "GENERATION" ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {obs.type || "SPAN"}
                          </Badge>
                          <span className="text-sm font-medium">{obs.name || `step-${index}`}</span>
                          {obs.model && (
                            <Badge variant="outline" className="text-[10px]">
                              {obs.model}
                            </Badge>
                          )}
                        </div>
                        {obs.usage && (
                          <p className="text-xs text-muted-foreground">
                            {t("detail.tokens", { count: obs.usage.total || 0 })}
                          </p>
                        )}
                        {obs.total_cost != null && (
                          <p className="text-xs text-muted-foreground">
                            {t("detail.stepCost", { cost: Number(obs.total_cost).toFixed(6) })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {detail.html_path && (
                  <a
                    href={`https://langfuse.inova.id.vn${detail.html_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t("detail.viewFullTrace")}
                  </a>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AdminPageFrame>
  );
}
