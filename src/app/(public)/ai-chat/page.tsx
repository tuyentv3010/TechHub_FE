"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useSendChatMessageMutation } from "@/queries/useAi";
import { useAppContext } from "@/components/app-provider";
import {
  MessageCircle,
  Send,
  Loader2,
  Bot,
  User,
  Copy,
  CheckCircle,
  MessageSquare,
  GraduationCap,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTranslations } from "next-intl";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AiChatPage() {
  const { toast } = useToast();
  const t = useTranslations("AiChat");
  const tCommon = useTranslations("common");
  const { isAuth } = useAppContext();
  const [userId, setUserId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mode, setMode] = useState<"GENERAL" | "ADVISOR">("GENERAL");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [useProgress, setUseProgress] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<{ id: string; label: string }[]>([]);
  const [sessionMessages, setSessionMessages] = useState<Record<string, Message[]>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const chatMutation = useSendChatMessageMutation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserInfo = localStorage.getItem("userInfo");
      if (!storedUserInfo) {
        setUserId("");
        return;
      }
      try {
        const parsed = JSON.parse(storedUserInfo);
        setUserId(parsed?.id || "");
      } catch (error) {
        console.error("Failed to parse user info for AI chat:", error);
        setUserId("");
      }
    }
  }, [isAuth]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const presetPrompts = {
    GENERAL: [
      t("promptGeneral1"),
      t("promptGeneral2"),
      t("promptGeneral3"),
      t("promptGeneral4"),
    ],
    ADVISOR: [
      t("promptAdvisor1"),
      t("promptAdvisor2"),
      t("promptAdvisor3"),
      t("promptAdvisor4"),
    ],
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    if (!userId) {
      toast({
        title: tCommon("error"),
        description: "Please login before chatting with AI.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const next = [...prev, userMessage];
      if (sessionId) {
        setSessionMessages((map) => ({ ...map, [sessionId]: next }));
      }
      return next;
    });
    setInputMessage("");

    // Show typing indicator
    const typingMessage: Message = {
      id: "typing",
      role: "assistant",
      content: "...",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      const response = await chatMutation.mutateAsync({
        sessionId: sessionId || undefined,
        userId,
        mode,
        message: inputMessage,
        context: useProgress ? { includeProgress: true } : undefined,
      });

      // Update session ID if new session
      if (!sessionId && response.payload?.data?.sessionId) {
        const newId = response.payload.data.sessionId;
        setSessionId(newId);
        setSessions((prev) =>
          prev.find((s) => s.id === newId) ? prev : [{ id: newId, label: `${t("session")} ${prev.length + 1}` }, ...prev]
        );
      }

      // Remove typing indicator and add response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== "typing");
        const payloadData: any = response.payload?.data;
        const assistantText =
          payloadData?.answer ||
          payloadData?.message ||
          (response.payload as any)?.message ||
          (response.payload as any)?.data ||
          t("errorResponse");
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: typeof assistantText === "string" ? assistantText : JSON.stringify(assistantText),
          timestamp: new Date(),
        };
        const nextMessages = [...filtered, assistantMessage];
        if (sessionId || response.payload?.data?.sessionId) {
          const sid = sessionId || response.payload?.data?.sessionId;
          setSessionMessages((map) => ({ ...map, [sid!]: nextMessages }));
        }
        return nextMessages;
      });
    } catch (error: any) {
      // Remove typing indicator
      setMessages((prev) => prev.filter((m) => m.id !== "typing"));

      toast({
        title: tCommon("error"),
        description: error?.message || t("errorSend"),
        variant: "destructive",
      });
    }
  };

  const handlePresetPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  const handleCopyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleNewSession = () => {
    setSessionId(null);
    setMessages([]);
    toast({
      title: t("newSession"),
      description: t("newSessionCreated"),
    });
  };

  const handleSelectSession = (id: string) => {
    setSessionId(id);
    setMessages(sessionMessages[id] || []);
  };

  return (
    <main className="container mx-auto p-4 sm:px-6 sm:py-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-purple-500" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("description")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select onValueChange={handleSelectSession} value={sessionId || undefined}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("selectSession")} />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleNewSession}>
            {t("newSession")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Settings */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-base">{t("settings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode Selection */}
            <div className="space-y-2">
              <Label>{t("mode")}</Label>
              <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectMode")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t("modeGeneral")}
                    </div>
                  </SelectItem>
                  <SelectItem value="ADVISOR">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      {t("modeAdvisor")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {mode === "GENERAL"
                  ? t("descGeneral")
                  : t("descAdvisor")}
              </p>
            </div>

            {/* Progress Context */}
            {mode === "ADVISOR" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-progress"
                  checked={useProgress}
                  onCheckedChange={(checked) => setUseProgress(checked as boolean)}
                />
                <label
                  htmlFor="use-progress"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("useMyProgress")}
                </label>
              </div>
            )}

            <Separator />

            {/* Session Info */}
            <div className="space-y-2">
              <Label>{t("currentSession")}</Label>
              <div className="text-xs text-muted-foreground">
                {sessionId ? (
                  <div className="space-y-1">
                    <p>ID: {sessionId.substring(0, 8)}...</p>
                    <p>{messages.length} {t("messages")}</p>
                  </div>
                ) : (
                  <p>{t("newSession")}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Preset Prompts */}
            <div className="space-y-2">
              <Label>{t("suggestedQuestions")}</Label>
              <div className="space-y-2">
                {presetPrompts[mode].map((prompt, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start text-xs h-auto py-2"
                    onClick={() => handlePresetPrompt(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("chat")}</CardTitle>
                <CardDescription>
                  {t("modeLabel")}{" "}
                  <Badge variant={mode === "GENERAL" ? "default" : "secondary"}>
                    {mode === "GENERAL" ? t("general") : t("advisor")}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages */}
            <ScrollArea className="h-[500px] pr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">{t("noMessages")}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("startChatting")}
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-purple-500 text-white"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div
                        className={`flex-1 max-w-[80%] ${
                          message.role === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-lg ${
                            message.role === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {message.content === "..." ? (
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.4s" }}
                              ></div>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-1">
                          <span className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          {message.role === "assistant" && message.id !== "typing" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto py-0 px-1"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                            >
                              {copiedMessageId === message.id ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <Separator />

            {/* Input Area */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Textarea
                  placeholder={t("enterMessage")}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={3}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || chatMutation.isPending || !userId}
                  className="self-end"
                >
                  {chatMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("enterToSend")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

