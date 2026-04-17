"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetLangfuseAnalytics, useGetAiRuntimeStats } from "@/queries/useAi";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, DollarSign, Clock, Zap, Users, TrendingUp, BarChart3, Settings, Sparkles } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#f97316", "#ec4899"];

export default function AiAnalyticsPage() {
  const [days, setDays] = useState(7);
  const { data: analyticsRes } = useGetLangfuseAnalytics(days);
  const { data: runtimeRes } = useGetAiRuntimeStats();

  const analytics = analyticsRes?.payload?.data || {};
  const runtime = runtimeRes?.payload?.data || {};

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Analytics</h1>
          <p className="text-muted-foreground">Usage, cost, and performance overview</p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24h</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2"><Sparkles className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2"><Settings className="h-4 w-4" /> Advanced</TabsTrigger>
        </TabsList>

        {/* ══════════ OVERVIEW ══════════ */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* KPIs — simple */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Activity className="h-4 w-4" /> Conversations</div>
                <p className="text-2xl font-bold mt-1">{analytics.totalTraces || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><DollarSign className="h-4 w-4" /> Total Cost</div>
                <p className="text-2xl font-bold mt-1">${(analytics.totalCost || 0).toFixed(4)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> Avg Response</div>
                <p className="text-2xl font-bold mt-1">{((analytics.avgLatency || 0) * 1000).toFixed(0)}ms</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> Success Rate</div>
                <p className="text-2xl font-bold mt-1">{(100 - (analytics.errorRate || 0) * 100).toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Usage per Day</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics.costByDay || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="traces" stroke="#3b82f6" strokeWidth={2} name="Conversations" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">What Users Ask About</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={analytics.intentDistribution || []} dataKey="count" nameKey="intent" cx="50%" cy="50%" outerRadius={90}
                      label={({ intent, count }: any) => `${intent}: ${count}`}>
                      {(analytics.intentDistribution || []).map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══════════ ADVANCED ══════════ */}
        <TabsContent value="advanced" className="space-y-6 mt-4">
          {/* Technical KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card><CardContent className="pt-4 pb-3"><div className="text-xs text-muted-foreground">Total Tokens</div><p className="text-xl font-bold">{(analytics.totalTokens || 0).toLocaleString()}</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3"><div className="text-xs text-muted-foreground">Error Rate</div><p className="text-xl font-bold">{((analytics.errorRate || 0) * 100).toFixed(1)}%</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3"><div className="text-xs text-muted-foreground">Prompt Tokens</div><p className="text-xl font-bold">{runtime?.tokens?.promptTotal || 0}</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3"><div className="text-xs text-muted-foreground">Completion Tokens</div><p className="text-xl font-bold">{runtime?.tokens?.completionTotal || 0}</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3"><div className="text-xs text-muted-foreground">Embedding Tokens</div><p className="text-xl font-bold">{runtime?.tokens?.embeddingTotal || 0}</p></CardContent></Card>
          </div>

          {/* Cost + Model charts */}
          <Card>
            <CardHeader><CardTitle className="text-base">Cost per Day</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.costByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="cost" fill="#f59e0b" name="Cost ($)" />
                  <Bar dataKey="tokens" fill="#3b82f6" name="Tokens" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Model Usage</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.modelUsage || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Calls" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top users */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Top Users</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead className="text-right">Traces</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(analytics.topUsers || []).slice(0, 10).map((u: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{u.userId}</TableCell>
                      <TableCell className="text-right">{u.traces}</TableCell>
                      <TableCell className="text-right">{u.tokens?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${(u.cost || 0).toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                  {!(analytics.topUsers || []).length && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
