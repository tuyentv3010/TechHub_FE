"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
import { useSendChatMessageMutation, useGetUserSessions, useGetSessionMessages, useDeleteSessionMutation } from "@/queries/useAi";
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
  Trash2,
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
  const [sessions, setSessions] = useState<{ id: string; label: string; startedAt: string }[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const chatMutation = useSendChatMessageMutation();
  const deleteSessionMutation = useDeleteSessionMutation();
  
  // Fetch user sessions from DB
  const { data: sessionsData } = useGetUserSessions(userId);
  
  // Fetch messages for current session from DB
  const { data: messagesData } = useGetSessionMessages(sessionId || "");

  // Load userId from localStorage
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

  // Sync sessions from DB
  useEffect(() => {
    if (sessionsData?.payload?.data) {
      const dbSessions = sessionsData.payload.data;
      setSessions(
        dbSessions.map((s: { id: string; userId: string; startedAt: string }, idx: number) => ({
          id: s.id,
          label: `${t("session")} ${dbSessions.length - idx}`,
          startedAt: s.startedAt,
        }))
      );
      
      // Auto-select most recent session if none selected
      if (!sessionId && dbSessions.length > 0) {
        setSessionId(dbSessions[0].id);
      }
    }
  }, [sessionsData, t, sessionId]);

  // Sync messages from DB when session changes
  useEffect(() => {
    if (messagesData?.payload?.data) {
      const dbMessages = messagesData.payload.data;
      setMessages(
        dbMessages.map((m: { id: string; sessionId: string; sender: string; content: string; timestamp: string }) => ({
          id: m.id,
          role: m.sender === "USER" ? ("user" as const) : ("assistant" as const),
          content: m.content,
          timestamp: new Date(m.timestamp),
        }))
      );
    } else if (sessionId && !messagesData) {
      // Clear messages when switching to session with no messages yet
      setMessages([]);
    }
  }, [messagesData, sessionId]);

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

    setMessages((prev) => [...prev, userMessage]);
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
          prev.find((s) => s.id === newId) ? prev : [{ 
            id: newId, 
            label: `${t("session")} ${prev.length + 1}`,
            startedAt: new Date().toISOString()
          }, ...prev]
        );
      }

      // Remove typing indicator and add response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== "typing");
        const payloadData = response.payload?.data;
        
        // Extract clean text response - prioritize message field
        let assistantText = "";
        
        // Try to get from payload.data first (actual AI response)
        if (payloadData?.message && typeof payloadData.message === "string") {
          assistantText = payloadData.message;
        } else if (payloadData?.answer && typeof payloadData.answer === "string") {
          assistantText = payloadData.answer;
        } else if (typeof response.message === "string" && response.message !== "Chat processed") {
          // Fallback to top-level message if it's not the wrapper message
          assistantText = response.message;
        } else {
          // Last resort fallback
          assistantText = t("errorResponse");
        }
        
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: assistantText.trim(),
          timestamp: new Date(),
        };
        return [...filtered, assistantMessage];
      });
    } catch (error: unknown) {
      // Remove typing indicator
      setMessages((prev) => prev.filter((m) => m.id !== "typing"));

      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("errorSend"),
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
  };

  const handleDeleteSession = async (sessionIdToDelete: string) => {
    if (!userId) return;
    
    try {
      await deleteSessionMutation.mutateAsync({ 
        sessionId: sessionIdToDelete, 
        userId 
      });
      
      // If deleting current session, create new one
      if (sessionIdToDelete === sessionId) {
        setSessionId(null);
        setMessages([]);
      }
      
      toast({
        title: t("sessionDeleted") || "Session deleted",
        description: t("sessionDeletedSuccess") || "Session has been deleted successfully",
      });
    } catch (error: unknown) {
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("errorDelete") || "Failed to delete session",
        variant: "destructive",
      });
    }
  };

  // Helper function to render message content with clickable links
  const renderMessageContent = (content: string) => {
    // Parse markdown-style links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Add the link
      const linkText = match[1];
      const linkUrl = match[2];
      parts.push(
        <Link
          key={match.index}
          href={linkUrl}
          className="text-blue-400 hover:text-blue-300 underline font-medium"
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkText}
        </Link>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last link
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <main className="container mx-auto p-4 sm:px-6 sm:py-4 md:p-8 space-y-6">
      {/* Auth Check Banner */}
      {!userId && (
        <Card className="bg-amber-500/10 border-amber-500/50">
          <CardContent className="flex items-center gap-3 p-4">
            <MessageCircle className="h-6 w-6 text-amber-500" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                {t("authRequired") || "Login Required"}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-500">
                {t("authRequiredDesc") || "Please login to use AI chat feature and save your chat history"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
          {/* Session List with Delete */}
          <div className="flex items-center gap-2">
            <Select onValueChange={handleSelectSession} value={sessionId || undefined}>
              <SelectTrigger className="w-[200px]">
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
            {sessionId && (
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-destructive/20 hover:text-destructive"
                onClick={() => handleDeleteSession(sessionId)}
                title={t("deleteSession") || "Delete session"}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={handleNewSession} disabled={!userId}>
            {t("newSession")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Settings */}
        <Card className="lg:col-span-1 h-fit order-2 lg:order-1">
          <CardHeader>
            <CardTitle className="text-base">{t("settings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode Selection */}
            <div className="space-y-2">
              <Label>{t("mode")}</Label>
              <Select value={mode} onValueChange={(v: string) => setMode(v as "GENERAL" | "ADVISOR")}>
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
                    className="w-full text-left justify-start text-xs h-auto py-2 px-3 whitespace-normal"
                    onClick={() => handlePresetPrompt(prompt)}
                    style={{ wordBreak: "break-word", whiteSpace: "normal", lineHeight: "1.4" }}
                  >
                    <span className="block w-full">{prompt}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <Card className="lg:col-span-3 order-1 lg:order-2">
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
              <div className="space-y-4 pb-4">
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
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          message.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-purple-500 text-white"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="h-5 w-5" />
                        ) : (
                          <Bot className="h-5 w-5" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div
                        className={`flex-1 ${
                          message.role === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`p-4 rounded-2xl break-words ${
                            message.role === "user"
                              ? "bg-blue-500 text-white max-w-[85%] ml-auto rounded-br-sm"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 max-w-[90%] rounded-bl-sm"
                          }`}
                          style={{ wordWrap: "break-word", overflowWrap: "break-word" }}
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
                            <div 
                              className="text-sm leading-relaxed whitespace-pre-wrap break-words" 
                              style={{ wordBreak: "break-word" }}
                            >
                              {renderMessageContent(message.content)}
                            </div>
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

