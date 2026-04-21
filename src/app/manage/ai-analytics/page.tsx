"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";
import { useGetAiRuntimeStats, useGetLangfuseAnalytics } from "@/queries/useAi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Clock, DollarSign, Settings, Sparkles, TrendingUp, Users } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#f97316", "#ec4899"];

export default function AiAnalyticsPage() {
  const t = useTranslations("AiAnalytics");
  const [days, setDays] = useState(7);
  const { data: analyticsRes } = useGetLangfuseAnalytics(days);
  const { data: runtimeRes } = useGetAiRuntimeStats();

  const analytics = analyticsRes?.payload?.data || {};
  const runtime = runtimeRes?.payload?.data || {};

  return (
    <AdminPageFrame
      eyebrow={t("PageEyebrow")}
      title={t("Title")}
      description={t("Description")}
      actions={
        <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">{t("range.last24h")}</SelectItem>
            <SelectItem value="7">{t("range.last7Days")}</SelectItem>
            <SelectItem value="14">{t("range.last14Days")}</SelectItem>
            <SelectItem value="30">{t("range.last30Days")}</SelectItem>
          </SelectContent>
        </Select>
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

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pb-3 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  {t("kpis.conversations")}
                </div>
                <p className="mt-1 text-2xl font-bold">{analytics.totalTraces || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-3 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  {t("kpis.totalCost")}
                </div>
                <p className="mt-1 text-2xl font-bold">${(analytics.totalCost || 0).toFixed(4)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-3 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {t("kpis.avgResponse")}
                </div>
                <p className="mt-1 text-2xl font-bold">{((analytics.avgLatency || 0) * 1000).toFixed(0)}ms</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-3 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  {t("kpis.successRate")}
                </div>
                <p className="mt-1 text-2xl font-bold">{(100 - (analytics.errorRate || 0) * 100).toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("charts.usagePerDay")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics.costByDay || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="traces"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name={t("series.conversations")}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("charts.whatUsersAskAbout")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.intentDistribution || []}
                      dataKey="count"
                      nameKey="intent"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ intent, count }: any) => `${intent}: ${count}`}
                    >
                      {(analytics.intentDistribution || []).map((_: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="mt-4 space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <Card>
              <CardContent className="pb-3 pt-4">
                <div className="text-xs text-muted-foreground">{t("advanced.totalTokens")}</div>
                <p className="text-xl font-bold">{(analytics.totalTokens || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-3 pt-4">
                <div className="text-xs text-muted-foreground">{t("advanced.errorRate")}</div>
                <p className="text-xl font-bold">{((analytics.errorRate || 0) * 100).toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-3 pt-4">
                <div className="text-xs text-muted-foreground">{t("advanced.promptTokens")}</div>
                <p className="text-xl font-bold">{runtime?.tokens?.promptTotal || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-3 pt-4">
                <div className="text-xs text-muted-foreground">{t("advanced.completionTokens")}</div>
                <p className="text-xl font-bold">{runtime?.tokens?.completionTotal || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pb-3 pt-4">
                <div className="text-xs text-muted-foreground">{t("advanced.embeddingTokens")}</div>
                <p className="text-xl font-bold">{runtime?.tokens?.embeddingTotal || 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("charts.costPerDay")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.costByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cost" fill="#f59e0b" name={t("series.cost")} />
                  <Bar dataKey="tokens" fill="#3b82f6" name={t("series.tokens")} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("charts.modelUsage")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.modelUsage || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name={t("series.calls")} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                {t("topUsers.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("topUsers.columns.userId")}</TableHead>
                    <TableHead className="text-right">{t("topUsers.columns.traces")}</TableHead>
                    <TableHead className="text-right">{t("topUsers.columns.tokens")}</TableHead>
                    <TableHead className="text-right">{t("topUsers.columns.cost")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(analytics.topUsers || []).slice(0, 10).map((user: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">{user.userId}</TableCell>
                      <TableCell className="text-right">{user.traces}</TableCell>
                      <TableCell className="text-right">{user.tokens?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${(user.cost || 0).toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                  {!(analytics.topUsers || []).length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        {t("topUsers.noData")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </AdminSurface>
    </AdminPageFrame>
  );
}
