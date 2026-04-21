"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { AdminPageFrame, AdminSurface } from "@/components/manage/admin-page-frame";
import {
  useGetAiProviderConfig,
  useGetAvailableModels,
  useGetProviderHealth,
  useUpdateAiProviderConfigMutation,
} from "@/queries/useAi";
import { CheckCircle, Cpu, Heart, Loader2, Settings, Sparkles, XCircle } from "lucide-react";

export default function AiProvidersPage() {
  const t = useTranslations("AiProviders");
  const { toast } = useToast();
  const { data: configRes } = useGetAiProviderConfig();
  const { data: modelsRes, isLoading: modelsLoading } = useGetAvailableModels();
  const { data: healthRes } = useGetProviderHealth();
  const updateMutation = useUpdateAiProviderConfigMutation();

  const config = configRes?.payload?.data || {};
  const metadata = config.metadata || {};
  const providersData = modelsRes?.payload?.data?.providers || {};
  const healthData = healthRes?.payload?.data || {};

  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedChatModel, setSelectedChatModel] = useState("");
  const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState("");

  const allProviders = Object.keys(providersData).filter((provider) => providersData[provider]?.available);
  const chatModels = (providersData[selectedProvider]?.models || []).filter((model: any) => model.type === "chat");
  const embeddingModels = (providersData[selectedProvider]?.models || []).filter(
    (model: any) => model.type === "embedding"
  );

  const handleSwitch = async () => {
    if (!selectedProvider || !selectedChatModel) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        provider: selectedProvider as "openai" | "gemini",
        chatModel: selectedChatModel,
        embeddingModel: selectedEmbeddingModel || undefined,
      } as any);
      toast({
        title: t("toast.updatedTitle"),
        description: t("toast.updatedDescription", {
          provider: selectedProvider,
          model: selectedChatModel,
        }),
      });
    } catch {
      toast({
        title: t("toast.failedTitle"),
        description: t("toast.failedDescription"),
        variant: "destructive",
      });
    }
  };

  return (
    <AdminPageFrame
      eyebrow={t("PageEyebrow")}
      title={t("Title")}
      description={t("Description")}
    >
      <AdminSurface className="space-y-6 p-5 md:p-7">
        <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <Cpu className="h-4 w-4" />
            {t("tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Settings className="h-4 w-4" />
            {t("tabs.advanced")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pb-4 pt-5">
                <div className="mb-1 text-sm text-muted-foreground">{t("summary.activeProvider")}</div>
                <p className="text-2xl font-bold capitalize">{config.provider || t("emptyValue")}</p>
                <div className="mt-2 flex gap-2">
                  {metadata.usingMockFallback ? (
                    <Badge variant="destructive">{t("summary.mockMode")}</Badge>
                  ) : (
                    <Badge className="bg-green-600">{t("summary.live")}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pb-4 pt-5">
                <div className="mb-1 text-sm text-muted-foreground">{t("summary.chatModel")}</div>
                <p className="text-xl font-bold">{config.activeChatModel || t("emptyValue")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("summary.embeddingModel", {
                    model: config.activeEmbeddingModel || t("emptyValue"),
                  })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pb-4 pt-5">
                <div className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Heart className="h-3.5 w-3.5" />
                  {t("summary.providerHealth")}
                </div>
                <div className="mt-2 space-y-2">
                  {["gemini", "openai"].map((provider) => {
                    const health = healthData[provider];
                    return (
                      <div key={provider} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{provider}</span>
                        {health?.alive ? (
                          <Badge variant="outline" className="border-green-300 text-green-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {t("health.online")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-red-300 text-red-500">
                            <XCircle className="mr-1 h-3 w-3" />
                            {health?.error === "no_api_key" ? t("health.noKey") : t("health.offline")}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("switcher.title")}</CardTitle>
              <CardDescription>{t("switcher.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("switcher.provider")}</label>
                  <Select
                    value={selectedProvider}
                    onValueChange={(value) => {
                      setSelectedProvider(value);
                      setSelectedChatModel("");
                      setSelectedEmbeddingModel("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("switcher.selectProvider")} />
                    </SelectTrigger>
                    <SelectContent>
                      {allProviders.map((provider) => {
                        const providerModels = providersData[provider]?.models || [];
                        const chatCount = providerModels.filter((model: any) => model.type === "chat").length;
                        return (
                          <SelectItem key={provider} value={provider}>
                            <span className="capitalize">{provider}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {t("switcher.modelCount", { count: chatCount })}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("switcher.chatModel")}</label>
                  <Select
                    value={selectedChatModel}
                    onValueChange={setSelectedChatModel}
                    disabled={!selectedProvider}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={modelsLoading ? t("loading") : t("switcher.selectChatModel")} />
                    </SelectTrigger>
                    <SelectContent>
                      {chatModels.map((model: any) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name || model.id}
                          {model.inputTokenLimit && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({Math.round(model.inputTokenLimit / 1000)}K)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("switcher.embeddingModelLabel")}</label>
                  <Select
                    value={selectedEmbeddingModel}
                    onValueChange={setSelectedEmbeddingModel}
                    disabled={!selectedProvider}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("switcher.keepCurrent")} />
                    </SelectTrigger>
                    <SelectContent>
                      {embeddingModels.map((model: any) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name || model.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSwitch}
                disabled={!selectedProvider || !selectedChatModel || updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("switcher.switching")}
                  </>
                ) : (
                  t("switcher.applyChanges")
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("allModels.title")}</CardTitle>
              <CardDescription>
                {modelsLoading
                  ? t("loading")
                  : t("allModels.modelCount", {
                      count: Object.values(providersData).reduce(
                        (sum: number, provider: any) => sum + (provider.models?.length || 0),
                        0
                      ),
                    })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {modelsLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("loading")}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("allModels.columns.modelId")}</TableHead>
                      <TableHead>{t("allModels.columns.provider")}</TableHead>
                      <TableHead>{t("allModels.columns.type")}</TableHead>
                      <TableHead className="text-right">{t("allModels.columns.context")}</TableHead>
                      <TableHead>{t("allModels.columns.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(providersData).flatMap(([provider, providerData]: [string, any]) =>
                      (providerData.models || []).map((model: any) => {
                        const isActive =
                          model.id === config.activeChatModel || model.id === config.activeEmbeddingModel;
                        return (
                          <TableRow
                            key={`${provider}-${model.id}`}
                            className={isActive ? "bg-blue-50 dark:bg-blue-950/20" : ""}
                          >
                            <TableCell className="text-sm font-medium">{model.name || model.id}</TableCell>
                            <TableCell className="capitalize">{provider}</TableCell>
                            <TableCell>
                              <Badge
                                variant={model.type === "chat" ? "default" : "secondary"}
                                className="text-[10px]"
                              >
                                {model.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {model.inputTokenLimit
                                ? `${Math.round(model.inputTokenLimit / 1000)}K`
                                : t("emptyValue")}
                            </TableCell>
                            <TableCell>
                              {isActive && (
                                <Badge className="bg-green-600 text-[10px]">{t("allModels.active")}</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("healthRaw.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded bg-muted p-3 text-xs">{JSON.stringify(healthData, null, 2)}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("metadataRaw.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-60 overflow-y-auto rounded bg-muted p-3 text-xs">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </AdminSurface>
    </AdminPageFrame>
  );
}
