"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  useGetAiProviderConfig,
  useUpdateAiProviderConfigMutation,
  useGetAvailableModels,
  useGetProviderHealth,
} from "@/queries/useAi";
import { Cpu, CheckCircle, XCircle, Zap, Globe, Loader2, Settings, Heart } from "lucide-react";

export default function AiProvidersPage() {
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

  const allProviders = Object.keys(providersData).filter((p) => providersData[p]?.available);
  const chatModels = (providersData[selectedProvider]?.models || []).filter((m: any) => m.type === "chat");
  const embeddingModels = (providersData[selectedProvider]?.models || []).filter((m: any) => m.type === "embedding");

  const handleSwitch = async () => {
    if (!selectedProvider || !selectedChatModel) return;
    try {
      await updateMutation.mutateAsync({
        provider: selectedProvider as "openai" | "gemini",
        chatModel: selectedChatModel,
        embeddingModel: selectedEmbeddingModel || undefined,
      } as any);
      toast({ title: "Provider updated", description: `${selectedProvider} / ${selectedChatModel}` });
    } catch {
      toast({ title: "Failed to switch", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">AI Providers</h1>
        <p className="text-muted-foreground">Manage LLM providers, switch models at runtime</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2"><Cpu className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2"><Settings className="h-4 w-4" /> Advanced</TabsTrigger>
        </TabsList>

        {/* ══════════ OVERVIEW TAB ══════════ */}
        <TabsContent value="overview" className="space-y-6 mt-4">

          {/* Status cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="text-sm text-muted-foreground mb-1">Active Provider</div>
                <p className="text-2xl font-bold capitalize">{config.provider || "—"}</p>
                <div className="mt-2 flex gap-2">
                  {metadata.usingMockFallback ? (
                    <Badge variant="destructive">Mock mode</Badge>
                  ) : (
                    <Badge className="bg-green-600">Live</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="text-sm text-muted-foreground mb-1">Chat Model</div>
                <p className="text-xl font-bold">{config.activeChatModel || "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">Embedding: {config.activeEmbeddingModel || "—"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> Provider Health</div>
                <div className="space-y-2 mt-2">
                  {["gemini", "openai"].map((p) => {
                    const h = healthData[p];
                    return (
                      <div key={p} className="flex items-center justify-between">
                        <span className="capitalize text-sm">{p}</span>
                        {h?.alive ? (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" /> Online
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-500 border-red-300">
                            <XCircle className="h-3 w-3 mr-1" /> {h?.error === "no_api_key" ? "No key" : "Offline"}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Switch provider */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Switch Provider / Model</CardTitle>
              <CardDescription>Models fetched from API keys. Changes take effect immediately.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Provider */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Provider</label>
                  <Select value={selectedProvider} onValueChange={(v) => { setSelectedProvider(v); setSelectedChatModel(""); setSelectedEmbeddingModel(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select provider..." /></SelectTrigger>
                    <SelectContent>
                      {allProviders.map((p) => (
                        <SelectItem key={p} value={p}>
                          <span className="capitalize">{p}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({chatModels.length || providersData[p]?.models?.filter((m: any) => m.type === "chat").length || 0} models)
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Chat Model */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Chat Model</label>
                  <Select value={selectedChatModel} onValueChange={setSelectedChatModel} disabled={!selectedProvider}>
                    <SelectTrigger><SelectValue placeholder={modelsLoading ? "Loading..." : "Select chat model..."} /></SelectTrigger>
                    <SelectContent>
                      {chatModels.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name || m.id}
                          {m.inputTokenLimit && <span className="text-xs text-muted-foreground ml-1">({Math.round(m.inputTokenLimit / 1000)}K)</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Embedding Model */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Embedding Model</label>
                  <Select value={selectedEmbeddingModel} onValueChange={setSelectedEmbeddingModel} disabled={!selectedProvider}>
                    <SelectTrigger><SelectValue placeholder="Keep current" /></SelectTrigger>
                    <SelectContent>
                      {embeddingModels.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>{m.name || m.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSwitch} disabled={!selectedProvider || !selectedChatModel || updateMutation.isPending}>
                {updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Switching...</> : "Apply Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════ ADVANCED TAB ══════════ */}
        <TabsContent value="advanced" className="space-y-6 mt-4">

          {/* All models table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Available Models (from API keys)</CardTitle>
              <CardDescription>
                {modelsLoading ? "Loading..." : `${Object.values(providersData).reduce((s: number, p: any) => s + (p.models?.length || 0), 0)} models`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {modelsLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model ID</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Context</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(providersData).flatMap(([provider, pData]: [string, any]) =>
                      (pData.models || []).map((m: any) => {
                        const isActive = m.id === config.activeChatModel || m.id === config.activeEmbeddingModel;
                        return (
                          <TableRow key={`${provider}-${m.id}`} className={isActive ? "bg-blue-50 dark:bg-blue-950/20" : ""}>
                            <TableCell className="font-medium text-sm">{m.name || m.id}</TableCell>
                            <TableCell className="capitalize">{provider}</TableCell>
                            <TableCell><Badge variant={m.type === "chat" ? "default" : "secondary"} className="text-[10px]">{m.type}</Badge></TableCell>
                            <TableCell className="text-right text-sm">{m.inputTokenLimit ? `${Math.round(m.inputTokenLimit / 1000)}K` : "—"}</TableCell>
                            <TableCell>{isActive && <Badge className="bg-green-600 text-[10px]">Active</Badge>}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Health check raw */}
          <Card>
            <CardHeader><CardTitle className="text-base">Provider Health Check (raw)</CardTitle></CardHeader>
            <CardContent>
              <pre className="bg-muted p-3 rounded text-xs">{JSON.stringify(healthData, null, 2)}</pre>
            </CardContent>
          </Card>

          {/* Config raw */}
          <Card>
            <CardHeader><CardTitle className="text-base">Provider Metadata (raw)</CardTitle></CardHeader>
            <CardContent>
              <pre className="bg-muted p-3 rounded text-xs max-h-60 overflow-y-auto">{JSON.stringify(metadata, null, 2)}</pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
