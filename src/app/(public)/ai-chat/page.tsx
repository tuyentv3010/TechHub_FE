"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { useSendChatMessageMutation, useGetUserSessions, useGetSessionMessages, useDeleteSessionMutation, useCreateSessionMutation } from "@/queries/useAi";
import { useAppContext } from "@/components/app-provider";
import { useAccountProfile } from "@/queries/useAccount";
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
  Plus,
  Search,
  Settings,
  Pencil,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  MoreHorizontal,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const chatMutation = useSendChatMessageMutation();
  const createSessionMutation = useCreateSessionMutation();
  const deleteSessionMutation = useDeleteSessionMutation();
  
  // Fetch user account profile
  const { data: accountData } = useAccountProfile();
  const userProfile = accountData?.payload?.data;
  
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

  const handleNewSession = async () => {
    if (!userId) {
      toast({
        title: tCommon("error"),
        description: "Please login before creating a session.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await createSessionMutation.mutateAsync({ userId, mode });
      const newSessionId = response.payload?.data?.id;
      
      if (newSessionId) {
        setSessionId(newSessionId);
        setMessages([]);
        toast({
          title: t("newSession"),
          description: t("newSessionCreated"),
        });
      }
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : "Failed to create session",
        variant: "destructive",
      });
    }
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

  // Group sessions by date
  const groupSessionsByDate = () => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const grouped: { today: typeof sessions; lastWeek: typeof sessions; older: typeof sessions } = {
      today: [],
      lastWeek: [],
      older: [],
    };
    
    sessions.forEach((session) => {
      const sessionDate = new Date(session.startedAt);
      if (sessionDate.toDateString() === today.toDateString()) {
        grouped.today.push(session);
      } else if (sessionDate >= lastWeek) {
        grouped.lastWeek.push(session);
      } else {
        grouped.older.push(session);
      }
    });
    
    return grouped;
  };

  const handleClearAll = async () => {
    // Delete all sessions
    for (const session of sessions) {
      try {
        await deleteSessionMutation.mutateAsync({ 
          sessionId: session.id, 
          userId 
        });
      } catch (error) {
        console.error("Failed to delete session:", error);
      }
    }
    setSessionId(null);
    setMessages([]);
    setSessions([]);
  };

  const groupedSessions = groupSessionsByDate();

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-72 sm:w-80 bg-white dark:bg-gray-950 
        border-r border-gray-200 dark:border-gray-800 
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:transform-none
      `}>
        {/* Header */}
        <div className="p-4 sm:p-6 pb-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("headerTitle") || "CHAT A.I+"}</h1>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* New Chat Button & Search */}
        <div className="px-3 sm:px-4 pb-4 flex gap-2">
          <Button
            onClick={() => {
              handleNewSession();
              setSidebarOpen(false);
            }}
            disabled={!userId}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("newSession") || "New chat"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-gray-300 dark:border-gray-700 flex-shrink-0"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Conversations Header */}
        <div className="px-3 sm:px-4 py-2 flex items-center justify-between">
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {t("yourConversations") || "Your conversations"}
          </span>
          <Button
            variant="link"
            size="sm"
            className="text-blue-600 hover:text-blue-700 p-0 h-auto text-xs sm:text-sm"
            onClick={handleClearAll}
          >
            {t("clearAll") || "Clear All"}
          </Button>
        </div>

        {/* Session List */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1">
            {groupedSessions.today.length > 0 && (
              <>
                <p className="text-xs text-gray-400 px-2 py-2">{t("today") || "Today"}</p>
                {groupedSessions.today.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={sessionId === session.id}
                    onSelect={() => {
                      handleSelectSession(session.id);
                      setSidebarOpen(false);
                    }}
                    onDelete={() => handleDeleteSession(session.id)}
                  />
                ))}
              </>
            )}
            
            {groupedSessions.lastWeek.length > 0 && (
              <>
                <p className="text-xs text-gray-400 px-2 py-2 mt-4">{t("lastDays") || "Last 7 Days"}</p>
                {groupedSessions.lastWeek.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={sessionId === session.id}
                    onSelect={() => {
                      handleSelectSession(session.id);
                      setSidebarOpen(false);
                    }}
                    onDelete={() => handleDeleteSession(session.id)}
                  />
                ))}
              </>
            )}
            
            {groupedSessions.older.length > 0 && (
              <>
                <p className="text-xs text-gray-400 px-2 py-2 mt-4">{t("older") || "Older"}</p>
                {groupedSessions.older.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={sessionId === session.id}
                    onSelect={() => {
                      handleSelectSession(session.id);
                      setSidebarOpen(false);
                    }}
                    onDelete={() => handleDeleteSession(session.id)}
                  />
                ))}
              </>
            )}

            {sessions.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                {t("noConversations") || "No conversations yet"}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom Section - Settings & User Profile */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4 space-y-3">
          {/* Settings Button */}
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-3" />
            {t("settings") || "Settings"}
          </Button>

          {/* Settings Panel (collapsible) */}
          {showSettings && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">{t("mode")}</Label>
                <Select value={mode} onValueChange={(v: string) => setMode(v as "GENERAL" | "ADVISOR")}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" />
                        {t("modeGeneral")}
                      </div>
                    </SelectItem>
                    <SelectItem value="ADVISOR">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3 w-3" />
                        {t("modeAdvisor")}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {mode === "ADVISOR" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-progress-sidebar"
                    checked={useProgress}
                    onCheckedChange={(checked) => setUseProgress(checked as boolean)}
                    className="h-3 w-3"
                  />
                  <label htmlFor="use-progress-sidebar" className="text-xs">
                    {t("useMyProgress")}
                  </label>
                </div>
              )}
            </div>
          )}

          {/* User Profile */}
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage 
                src={userProfile?.avatar?.secureUrl || userProfile?.avatar?.url || "/avatars/default.png"} 
                alt={userProfile?.fullName || userProfile?.username || "User"} 
              />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs sm:text-sm font-medium">
                {(userProfile?.fullName || userProfile?.username || "U").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {userProfile?.fullName || userProfile?.username || t("guest") || "Guest"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 w-full">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t("headerTitle") || "CHAT A.I+"}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewSession}
            disabled={!userId}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Auth Check Banner */}
        {!userId && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
                  {t("authRequired") || "Login Required"}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 hidden sm:block">
                  {t("authRequiredDesc") || "Please login to use AI chat feature and save your chat history"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages Area */}
        <ScrollArea className="flex-1 px-3 sm:px-6 py-4" ref={scrollAreaRef}>
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] sm:h-[60vh] text-center px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 sm:mb-6">
                  <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t("welcomeTitle") || "How can I help you today?"}
                </h2>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md">
                  {t("startChatting") || "Start a conversation by typing a message below"}
                </p>
                
                {/* Suggested Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-6 sm:mt-8 w-full max-w-2xl">
                  {presetPrompts[mode].slice(0, 4).map((prompt, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="h-auto py-2.5 sm:py-3 px-3 sm:px-4 text-left justify-start text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 whitespace-normal"
                      onClick={() => handlePresetPrompt(prompt)}
                    >
                      <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                      <span className="line-clamp-2">{prompt}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="space-y-3 sm:space-y-4">
                  {/* User Message */}
                  {message.role === "user" && (
                    <div className="flex items-start gap-2 sm:gap-3 justify-end">
                      <div className="flex flex-col items-end max-w-[85%] sm:max-w-[80%]">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                            <AvatarImage 
                              src={userProfile?.avatar?.secureUrl || userProfile?.avatar?.url} 
                            />
                            <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-xs">
                              {(userProfile?.fullName || userProfile?.username || "U").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tr-sm px-3 sm:px-4 py-2 sm:py-3">
                          <p className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 sm:h-6 sm:w-6 p-0 mt-1 text-gray-400 hover:text-gray-600"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Assistant Message */}
                  {message.role === "assistant" && (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="flex-1 max-w-[90%] sm:max-w-[85%]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            CHAT A.I+
                          </span>
                          <CheckCircle className="h-3 w-3 text-blue-500" />
                        </div>
                        <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          {message.content === "..." ? (
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                            </div>
                          ) : (
                            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                              {renderMessageContent(message.content)}
                            </div>
                          )}
                        </div>
                        {message.id !== "typing" && (
                          <div className="flex flex-wrap items-center gap-1 mt-2 sm:mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-gray-400 hover:text-gray-600"
                            >
                              <ThumbsUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-gray-400 hover:text-gray-600"
                            >
                              <ThumbsDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-gray-400 hover:text-gray-600"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                            >
                              {copiedMessageId === message.id ? (
                                <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-gray-400 hover:text-gray-600 hidden sm:flex"
                            >
                              <MoreHorizontal className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                            <div className="flex-1" />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 sm:h-7 px-1.5 sm:px-2 text-gray-400 hover:text-gray-600 text-xs gap-1"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span className="hidden sm:inline">{t("regenerate") || "Regenerate"}</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-2 sm:p-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 mb-0.5 sm:mb-1 hidden sm:flex">
                <AvatarImage 
                  src={userProfile?.avatar?.secureUrl || userProfile?.avatar?.url} 
                />
                <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-xs">
                  {(userProfile?.fullName || userProfile?.username || "U").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <input
                type="text"
                placeholder={t("enterMessage") || "What's in your mind?..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 py-2"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || chatMutation.isPending || !userId}
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
              >
                {chatMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade to Pro Banner - Hidden on mobile */}
      <div className="fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 hidden md:block">
        <Button
          variant="ghost"
          className="bg-gradient-to-b from-purple-500 to-blue-600 text-white px-1.5 sm:px-2 py-6 sm:py-8 rounded-full writing-mode-vertical text-xs font-medium"
          style={{ writingMode: "vertical-rl" }}
        >
          {t("upgradeToPro") || "Upgrade to Pro"}
        </Button>
      </div>
    </div>
  );
}

// Session Item Component
function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: { id: string; label: string; startedAt: string };
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
      }`}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <MessageSquare className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 text-sm truncate">{session.label}</span>
      {showActions && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
      {isActive && !showActions && (
        <div className="w-2 h-2 rounded-full bg-blue-500" />
      )}
    </div>
  );
}

