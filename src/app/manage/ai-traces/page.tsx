"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGetLangfuseTraces, useGetLangfuseTraceDetail } from "@/queries/useAi";
import { Activity, ExternalLink, Clock, DollarSign, Eye, Zap, Sparkles, Settings } from "lucide-react";

export default function AiTracesPage() {
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const { data: tracesRes, isLoading } = useGetLangfuseTraces(100);
  const { data: detailRes } = useGetLangfuseTraceDetail(selectedTraceId || "");

  const traces = tracesRes?.payload?.data?.traces || [];
  const total = tracesRes?.payload?.data?.total || 0;
  const detail = detailRes?.payload?.data;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Traces</h1>
          <p className="text-muted-foreground">{total} conversations tracked</p>
        </div>
        <a href="https://langfuse.inova.id.vn" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" /> Open Langfuse
          </Button>
        </a>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2"><Sparkles className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2"><Settings className="h-4 w-4" /> Advanced</TabsTrigger>
        </TabsList>

        {/* ══════════ OVERVIEW — readable table ══════════ */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>What user asked</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Response time</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  )}
                  {!isLoading && traces.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No conversations yet</TableCell></TableRow>
                  )}
                  {traces.map((t: any) => {
                    const meta = t.metadata || {};
                    const intent = meta.intent || t.name || "—";
                    const ts = t.timestamp ? new Date(t.timestamp) : null;
                    const intentLabel: Record<string, string> = {
                      recommendation: "Course advice",
                      knowledge: "Learning Q&A",
                      data_query: "Data query",
                      visualization: "Chart request",
                      file_analysis: "File analysis",
                      conversation: "Chat",
                      clarify: "Follow-up",
                      llm_generate_text: "AI call",
                      chat_orchestration: "Full chat",
                    };
                    return (
                      <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedTraceId(t.id)}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {ts ? ts.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—"}
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <p className="text-sm line-clamp-1">{t.input || t.name || "—"}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{intentLabel[intent] || intent}</Badge></TableCell>
                        <TableCell className="text-right text-sm">{t.latency ? `${(t.latency * 1000).toFixed(0)}ms` : "—"}</TableCell>
                        <TableCell className="text-right text-sm">${(t.totalCost || 0).toFixed(4)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════ ADVANCED — technical detail ══════════ */}
        <TabsContent value="advanced" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Intent</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Latency</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Obs</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {traces.map((t: any) => {
                    const meta = t.metadata || {};
                    const ts = t.timestamp ? new Date(t.timestamp) : null;
                    return (
                      <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedTraceId(t.id)}>
                        <TableCell className="text-xs text-muted-foreground">{ts ? ts.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—"}</TableCell>
                        <TableCell className="font-medium text-sm">{t.name || "—"}</TableCell>
                        <TableCell className="text-xs font-mono">{t.userId ? t.userId.slice(0, 8) + "..." : "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{meta.intent || t.name}</Badge></TableCell>
                        <TableCell className="text-xs">{(t.modelsUsed || []).join(", ") || "—"}</TableCell>
                        <TableCell className="text-right text-xs">{t.latency ? `${(t.latency * 1000).toFixed(0)}ms` : "—"}</TableCell>
                        <TableCell className="text-right text-xs">${(t.totalCost || 0).toFixed(4)}</TableCell>
                        <TableCell className="text-right text-xs">{t.observationsCount || 0}</TableCell>
                        <TableCell><Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedTraceId} onOpenChange={() => setSelectedTraceId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Conversation Detail
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {detail && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Response time</div>
                    <p className="font-semibold">{detail.latency ? `${(detail.latency * 1000).toFixed(0)}ms` : "—"}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Cost</div>
                    <p className="font-semibold">${(detail.total_cost || detail.totalCost || 0).toFixed(6)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">Steps</div>
                    <p className="font-semibold">{(detail.observations || []).length}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">User</div>
                    <p className="font-mono text-xs">{detail.user_id || detail.userId || "—"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">User asked</h4>
                  <pre className="bg-muted p-3 rounded text-xs whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {typeof detail.input === "string" ? detail.input : JSON.stringify(detail.input, null, 2)}
                  </pre>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">AI answered</h4>
                  <pre className="bg-muted p-3 rounded text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {typeof detail.output === "string" ? detail.output : JSON.stringify(detail.output, null, 2)}
                  </pre>
                </div>

                {(detail.observations || []).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Processing steps ({detail.observations.length})</h4>
                    {detail.observations.map((obs: any, i: number) => (
                      <div key={i} className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={obs.type === "GENERATION" ? "default" : "secondary"} className="text-[10px]">{obs.type || "SPAN"}</Badge>
                          <span className="font-medium text-sm">{obs.name || `step-${i}`}</span>
                          {obs.model && <Badge variant="outline" className="text-[10px]">{obs.model}</Badge>}
                        </div>
                        {obs.usage && <p className="text-xs text-muted-foreground">Tokens: {obs.usage.total || 0}</p>}
                        {obs.total_cost != null && <p className="text-xs text-muted-foreground">Cost: ${Number(obs.total_cost).toFixed(6)}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {detail.html_path && (
                  <a href={`https://langfuse.inova.id.vn${detail.html_path}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> View full trace on Langfuse
                  </a>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
