"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
import { useUploadFileMutation } from "@/queries/useFile";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import aiApiRequest from "@/apiRequests/ai";
import AiChatOnboardingTour, { AiChatTourButton } from "@/components/ai/AiChatOnboardingTour";
import {
  MessageCircle,
  Send,
  Loader2,
  Copy,
  CheckCircle,
  MessageSquare,
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
  HelpCircle,
  Sparkles,
  Database,
  BarChart3,
  Workflow,
  Paperclip,
  Activity,
  X,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

interface MessageTraceItem {
  step?: string;
  detail?: string;
}

interface MessageInsightMeta {
  requestId?: string | null;
  requestedMode?: "AUTO" | "GENERAL" | "ADVISOR";
  resolvedMode?: "AUTO" | "GENERAL" | "ADVISOR";
  intent?: string;
  confidence?: number;
  tokensUsed?: number;
  tokenUsage?: Record<string, any>;
  citations?: Array<Record<string, any>>;
  queryResult?: Record<string, any> | null;
  chartSpec?: Record<string, any> | null;
  trace?: MessageTraceItem[];
  nodeTimings?: Record<string, number>;
  hitlClarifyActive?: boolean;
  hitlQuestion?: string | null;
  hitlOptions?: string[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: MessageInsightMeta;
}

interface AttachedFileContext {
  id: string;
  name: string;
  mimeType?: string;
  secureUrl?: string | null;
  publicUrl?: string | null;
  cloudinarySecureUrl?: string | null;
  description?: string | null;
}

export default function AiChatPage() {
  const { toast } = useToast();
  const t = useTranslations("AiChat");
  const tCommon = useTranslations("common");
  const { isAuth } = useAppContext();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [useProgress, setUseProgress] = useState<boolean>(false);
  const [useStreaming, setUseStreaming] = useState<boolean>(true); // Enable streaming by default
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileContext[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<{ id: string; label: string; startedAt: string }[]>([]);
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [streamingAssistantId, setStreamingAssistantId] = useState<string | null>(null);
  const [showTour, setShowTour] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingSessionLabelRef = useRef<string | null>(null);
  const streamingAssistantIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hitlRepliedMessageIds, setHitlRepliedMessageIds] = useState<Set<string>>(new Set());
  const [feedbackState, setFeedbackState] = useState<Record<string, "up" | "down">>({});

  const handleFeedback = (messageId: string, type: "up" | "down") => {
    setFeedbackState((prev) => ({ ...prev, [messageId]: type }));
    toast({
      title: type === "up" ? "Thanks for the feedback!" : "We'll try to improve",
      description: type === "up" ? "Glad this was helpful." : "Your feedback helps us get better.",
    });
  };

  const handleRegenerate = async (messageId: string) => {
    if (!userId || isStreaming) return;
    // Find the user message before this assistant message
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex <= 0) return;
    const userMsg = messages.slice(0, msgIndex).reverse().find((m) => m.role === "user");
    if (!userMsg) return;

    const assistantId = `streaming-${Date.now()}`;
    const streamingPlaceholder: Message = {
      id: assistantId,
      role: "assistant",
      content: "▌",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, streamingPlaceholder]);
    setStreamingAssistantId(assistantId);
    streamingAssistantIdRef.current = assistantId;
    resetStream();

    try {
      await sendStreamingMessage({
        sessionId: sessionId || undefined,
        userId,
        mode: "AUTO",
        message: userMsg.content,
        context: { regenerate: true },
      });
    } catch (error) {
      console.error("Regenerate error:", error);
    }
  };

  const handleHitlQuickReply = async (messageId: string, option: string) => {
    setHitlRepliedMessageIds((prev) => new Set(prev).add(messageId));
    if (!userId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: option,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const assistantId = `streaming-${Date.now()}`;
    const streamingPlaceholder: Message = {
      id: assistantId,
      role: "assistant",
      content: "▌",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, streamingPlaceholder]);
    setStreamingAssistantId(assistantId);
    streamingAssistantIdRef.current = assistantId;
    resetStream();

    try {
      await sendStreamingMessage({
        sessionId: sessionId || undefined,
        userId,
        mode: "AUTO",
        message: option,
        context: { clarificationReply: true },
      });
    } catch (error) {
      console.error("HITL quick reply streaming error:", error);
    }
  };

  // Function to scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  const chatMutation = useSendChatMessageMutation();
  const createSessionMutation = useCreateSessionMutation();
  const deleteSessionMutation = useDeleteSessionMutation();
  const uploadFileMutation = useUploadFileMutation();

  const updateAssistantMessage = (messageId: string, updater: (message: Message) => Message) => {
    setMessages((prev) => prev.map((message) => (message.id === messageId ? updater(message) : message)));
  };

  const mergeStreamingMetadata = (current: MessageInsightMeta | undefined, event: { event: string; data: any }) => {
    const next: MessageInsightMeta = { ...(current || {}) };
    if (event.event === "citation") {
      next.citations = Array.isArray(event.data?.sources) ? event.data.sources : current?.citations;
    }
    if (event.event === "artifact") {
      next.queryResult = event.data?.queryResult ?? next.queryResult ?? null;
      next.chartSpec = event.data?.chartSpec ?? next.chartSpec ?? null;
    }
    if (event.event === "planning_start") {
      next.trace = [{ step: "planning_start", detail: "AI orchestration started." }];
    }
    if (event.event === "planning_step") {
      next.trace = [...(next.trace || []), { step: event.data?.step, detail: event.data?.detail }];
    }
    if (event.event === "done") {
      next.requestId = event.data?.requestId ?? next.requestId ?? null;
      next.requestedMode = event.data?.requestedMode || next.requestedMode;
      next.resolvedMode = event.data?.resolvedMode || next.resolvedMode;
      next.intent = event.data?.intent || next.intent;
      next.tokensUsed = event.data?.tokensUsed ?? next.tokensUsed;
      next.tokenUsage = event.data?.tokenUsage ?? next.tokenUsage;
      next.citations = event.data?.citations || next.citations;
      next.trace = Array.isArray(event.data?.trace) ? event.data.trace : next.trace;
      next.queryResult = event.data?.queryResult ?? next.queryResult ?? null;
      next.chartSpec = event.data?.chartSpec ?? next.chartSpec ?? null;
      next.nodeTimings = event.data?.nodeTimings ?? next.nodeTimings;
    }
    if (event.event === "hitl_question") {
      next.hitlClarifyActive = true;
      next.hitlQuestion = event.data?.question ?? null;
      next.hitlOptions = Array.isArray(event.data?.options) ? event.data.options : [];
    }
    if (event.event === "done") {
      next.hitlClarifyActive = event.data?.hitlClarifyActive ?? next.hitlClarifyActive;
      next.hitlQuestion = event.data?.hitlQuestion ?? next.hitlQuestion;
      next.hitlOptions = event.data?.hitlOptions ?? next.hitlOptions;
    }
    return next;
  };

  // Streaming chat hook
  const { streamingMessage, isStreaming, sendStreamingMessage, resetStream } = useStreamingChat({
    onEvent: (event) => {
      if (event.event === "session" && event.data?.sessionId) {
        setSessionId(event.data.sessionId);
        const pendingLabel = pendingSessionLabelRef.current;
        if (pendingLabel) {
          setSessions((prev) =>
            prev.find((session) => session.id === event.data.sessionId)
              ? prev
              : [{ id: event.data.sessionId, label: pendingLabel, startedAt: new Date().toISOString() }, ...prev]
          );
        }
      }
      const activeStreamingId = streamingAssistantIdRef.current;
      if (!activeStreamingId) {
        return;
      }
      updateAssistantMessage(activeStreamingId, (message) => ({
        ...message,
        metadata: mergeStreamingMetadata(message.metadata, event),
      }));
    },
    onComplete: ({ fullMessage, finalEvent }) => {
      // Replace streaming message with final message
      const activeStreamingId = streamingAssistantIdRef.current;
      if (activeStreamingId) {
        updateAssistantMessage(activeStreamingId, (message) => ({
          ...message,
          content: fullMessage || finalEvent?.data?.message || message.content,
          metadata: finalEvent ? mergeStreamingMetadata(message.metadata, finalEvent) : message.metadata,
        }));
        setStreamingAssistantId(null);
        streamingAssistantIdRef.current = null;
      }
      pendingSessionLabelRef.current = null;
    },
    onError: (error) => {
      toast({
        title: tCommon("error"),
        description: error.message || "Streaming failed",
        variant: "destructive",
      });
      // Remove streaming message on error
      const activeStreamingId = streamingAssistantIdRef.current;
      if (activeStreamingId) {
        setMessages((prev) => prev.filter((m) => m.id !== activeStreamingId));
        setStreamingAssistantId(null);
        streamingAssistantIdRef.current = null;
      }
      pendingSessionLabelRef.current = null;
    },
  });
  
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

  useEffect(() => {
    const accountUserId = accountData?.payload?.data?.id;
    if (accountUserId) {
      setUserId(accountUserId);
    }
  }, [accountData]);

  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt) {
      setInputMessage(prompt);
    }
  }, [searchParams]);

  // Check if user has seen tour before
  useEffect(() => {
    if (userId && typeof window !== "undefined") {
      const tourKey = `ai_chat_tour_${userId}`;
      const hasSeenTour = localStorage.getItem(tourKey);
      if (!hasSeenTour) {
        // Delay tour start to ensure UI is rendered
        setTimeout(() => setShowTour(true), 500);
      }
    }
  }, [userId]);

  const handleTourComplete = () => {
    if (userId) {
      const tourKey = `ai_chat_tour_${userId}`;
      localStorage.setItem(tourKey, "true");
      setShowTour(false);
    }
  };

  const handleTourSkip = () => {
    if (userId) {
      const tourKey = `ai_chat_tour_${userId}`;
      localStorage.setItem(tourKey, "true");
      setShowTour(false);
    }
  };

  const handleStartTour = () => {
    setShowTour(true);
  };

  // Cache for session labels to avoid refetching
  const sessionLabelsCache = useRef<Map<string, string>>(new Map());

  // Sync sessions from DB
  useEffect(() => {
    if (sessionsData?.payload?.data) {
      const dbSessions = sessionsData.payload.data;
      
      // Fetch first message for each session to use as label
      const fetchSessionLabels = async () => {
        const sessionsWithLabels = await Promise.all(
          dbSessions.map(async (s: { id: string; userId: string; startedAt: string }, idx: number) => {
            // Check cache first
            if (sessionLabelsCache.current.has(s.id)) {
              return {
                id: s.id,
                label: sessionLabelsCache.current.get(s.id)!,
                startedAt: s.startedAt,
              };
            }
            
            try {
              const messagesRes = await aiApiRequest.getSessionMessages(s.id);
              const messages = messagesRes.payload?.data || [];
              // Find first USER message
              const firstUserMessage = messages.find((m: { sender: string }) => m.sender === "USER");
              
              let label = `${t("session")} ${dbSessions.length - idx}`;
              if (firstUserMessage?.content) {
                // Get first 5 words
                const words = firstUserMessage.content.split(/\s+/).slice(0, 5).join(" ");
                label = words.length < firstUserMessage.content.length ? `${words}...` : words;
              }
              
              // Store in cache
              sessionLabelsCache.current.set(s.id, label);
              
              return {
                id: s.id,
                label,
                startedAt: s.startedAt,
              };
            } catch {
              const fallbackLabel = `${t("session")} ${dbSessions.length - idx}`;
              sessionLabelsCache.current.set(s.id, fallbackLabel);
              return {
                id: s.id,
                label: fallbackLabel,
                startedAt: s.startedAt,
              };
            }
          })
        );
        
        setSessions(sessionsWithLabels);
      };
      
      fetchSessionLabels();
      
      // Auto-select most recent session if none selected
      if (!sessionId && dbSessions.length > 0) {
        setSessionId(dbSessions[0].id);
      }
    }
  }, [sessionsData, t]); // Removed sessionId from dependencies

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
      // Scroll to bottom after messages are loaded with a small delay
      setTimeout(() => scrollToBottom("instant"), 100);
    } else if (sessionId && !messagesData) {
      // Clear messages when switching to session with no messages yet
      setMessages([]);
    }
  }, [messagesData, sessionId]);

  // Scroll to bottom when new messages are added (streaming or sent)
  useEffect(() => {
    if (isStreaming || streamingMessage) {
      scrollToBottom("smooth");
    }
  }, [streamingMessage, isStreaming]);

  // Update streaming message in real-time
  useEffect(() => {
    if (isStreaming && streamingAssistantId && streamingMessage) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingAssistantId
            ? { ...m, content: streamingMessage }
            : m
        )
      );
    }
  }, [streamingMessage, isStreaming, streamingAssistantId]);

  const presetPrompts = useMemo(
    () => [
      t("promptGeneral1"),
      t("promptGeneral2"),
      t("promptGeneral3"),
      t("promptAdvisor1"),
      t("promptAdvisor2"),
      t("promptAdvisor3"),
    ],
    [t]
  );

  const buildRequestContext = () => {
    const context: Record<string, any> = {};
    if (useProgress) {
      context.includeProgress = true;
    }
    if (attachedFiles.length > 0) {
      context.fileContexts = attachedFiles.map((file) => ({
        id: file.id,
        fileId: file.id,
        name: file.name,
        mimeType: file.mimeType,
        secureUrl: file.secureUrl,
        publicUrl: file.publicUrl,
        cloudinarySecureUrl: file.cloudinarySecureUrl,
        description: file.description,
      }));
    }
    return Object.keys(context).length > 0 ? context : undefined;
  };

  const handleAttachFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) {
      return;
    }
    if (!userId) {
      toast({
        title: tCommon("error"),
        description: "Please login before attaching files to AI chat.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    const uploaded: AttachedFileContext[] = [];
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);
        formData.append("description", "Attached in AI chat");
        const response = await uploadFileMutation.mutateAsync(formData);
        const payload = response?.payload?.data;
        if (payload?.id) {
          uploaded.push({
            id: payload.id,
            name: payload.name || payload.originalName || file.name,
            mimeType: payload.mimeType,
            secureUrl: payload.secureUrl ?? payload.cloudinarySecureUrl ?? null,
            publicUrl: payload.publicUrl ?? payload.cloudinaryUrl ?? null,
            cloudinarySecureUrl: payload.cloudinarySecureUrl ?? null,
            description: payload.description ?? null,
          });
        }
      }
      if (uploaded.length > 0) {
        setAttachedFiles((prev) => {
          const seen = new Set(prev.map((item) => item.id));
          return [...prev, ...uploaded.filter((item) => !seen.has(item.id))];
        });
        toast({
          title: "Files attached",
          description: `${uploaded.length} file(s) are ready for AI analysis.`,
        });
      }
    } catch (error) {
      console.error("Failed to upload AI chat attachments:", error);
      toast({
        title: tCommon("error"),
        description: "Failed to attach one or more files for AI analysis.",
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
    }
  };

  const removeAttachedFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachedFiles.length === 0) return;
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
      content: inputMessage || `Analyse ${attachedFiles.length} attached file(s).`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputMessage;
    const requestContext = buildRequestContext();
    setInputMessage("");
    setAttachedFiles([]);
    pendingSessionLabelRef.current = messageToSend.split(/\s+/).slice(0, 5).join(" ");

    // Use streaming mode
    if (useStreaming) {
      const assistantId = `streaming-${Date.now()}`;
      const streamingPlaceholder: Message = {
        id: assistantId,
        role: "assistant",
        content: "▌", // Cursor indicator
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, streamingPlaceholder]);
      setStreamingAssistantId(assistantId);
      streamingAssistantIdRef.current = assistantId;
      resetStream();

      try {
        await sendStreamingMessage({
          sessionId: sessionId || undefined,
          userId,
          mode: "AUTO",
          message: messageToSend,
          context: requestContext,
        });
      } catch (error) {
        // Error handling is done in the hook's onError callback
        console.error("Streaming error:", error);
      }
    } else {
      // Fallback to blocking mode
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
          mode: "AUTO",
          message: messageToSend,
          context: requestContext,
        });

        // Update session ID if new session
        if (!sessionId && response.payload?.data?.sessionId) {
          const newId = response.payload.data.sessionId;
          setSessionId(newId);
          setSessions((prev) =>
            prev.find((s) => s.id === newId) ? prev : [{ 
              id: newId, 
              label: pendingSessionLabelRef.current || `${t("session")} ${prev.length + 1}`,
              startedAt: new Date().toISOString()
            }, ...prev]
          );
        }

        // Remove typing indicator and add response
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== "typing");
          const payloadData = response.payload?.data;
          
          let assistantText = "";
          if (payloadData?.message && typeof payloadData.message === "string") {
            assistantText = payloadData.message;
          } else if (payloadData?.answer && typeof payloadData.answer === "string") {
            assistantText = payloadData.answer;
          } else if (typeof response.message === "string" && response.message !== "Chat processed") {
            assistantText = response.message;
          } else {
            assistantText = t("errorResponse");
          }
          
          const assistantMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: assistantText.trim(),
            timestamp: new Date(),
            metadata: payloadData?.metadata,
          };
          return [...filtered, assistantMessage];
        });
        pendingSessionLabelRef.current = null;
      } catch (error: unknown) {
        setMessages((prev) => prev.filter((m) => m.id !== "typing"));
        pendingSessionLabelRef.current = null;
        toast({
          title: tCommon("error"),
          description: error instanceof Error ? error.message : t("errorSend"),
          variant: "destructive",
        });
      }
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
      const response = await createSessionMutation.mutateAsync({ userId, mode: "AUTO" });
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

  // Helper function to parse and format AI response (handles JSON and plain text)
  const parseAiResponse = (content: string): string => {
    // If content starts with cursor indicator, return as-is (streaming in progress)
    if (content === "▌" || content.endsWith("▌")) {
      return content;
    }

    // Try to parse as JSON
    try {
      // Clean up the content - remove extra whitespace but preserve structure
      const cleanContent = content.trim();

      // If it looks like JSON, try to parse it
      if (cleanContent.startsWith("{") || cleanContent.startsWith("[")) {
        const parsed = JSON.parse(cleanContent);
        return formatAiJsonResponse(parsed);
      }
    } catch {
      // Not valid JSON, continue to text processing
    }

    // Return as plain text if not JSON
    return content;
  };

  // Format JSON response from AI into readable text
  const formatAiJsonResponse = (data: Record<string, unknown>): string => {
    let result = "";

    // Handle response wrapper
    const response = data.response || data;

    // Handle tips/suggestions array
    if (response && typeof response === 'object' && 'tips' in response) {
      const tipsData = response as { tips: Array<{ tip?: string; title?: string; description?: string }> };
      if (Array.isArray(tipsData.tips)) {
        result += "💡 **Gợi ý:**\n\n";
        tipsData.tips.forEach((item, index) => {
          const title = item.tip || item.title || "";
          const desc = item.description || "";
          result += `${index + 1}. **${title}**\n   ${desc}\n\n`;
        });
      }
    }

    // Handle answer/message field
    if (response && typeof response === 'object') {
      const respObj = response as Record<string, unknown>;
      if (respObj.answer && typeof respObj.answer === 'string') {
        result += respObj.answer + "\n";
      }
      if (respObj.message && typeof respObj.message === 'string') {
        result += respObj.message + "\n";
      }
      if (respObj.content && typeof respObj.content === 'string') {
        result += respObj.content + "\n";
      }
      if (respObj.text && typeof respObj.text === 'string') {
        result += respObj.text + "\n";
      }
    }

    // Handle courses recommendations
    if (response && typeof response === 'object' && 'courses' in response) {
      const coursesData = response as { courses: Array<{ title?: string; name?: string; description?: string; url?: string }> };
      if (Array.isArray(coursesData.courses)) {
        result += "📚 **Khóa học gợi ý:**\n\n";
        coursesData.courses.forEach((course, index) => {
          const title = course.title || course.name || "";
          const desc = course.description || "";
          result += `${index + 1}. **${title}**\n   ${desc}\n`;
          if (course.url) {
            result += `   [Xem khóa học](${course.url})\n`;
          }
          result += "\n";
        });
      }
    }

    // Handle learning path
    if (response && typeof response === 'object' && 'learningPath' in response) {
      const pathData = response as { learningPath: Array<{ step?: number; title?: string; description?: string }> };
      if (Array.isArray(pathData.learningPath)) {
        result += "🎯 **Lộ trình học:**\n\n";
        pathData.learningPath.forEach((step) => {
          const stepNum = step.step || "";
          const title = step.title || "";
          const desc = step.description || "";
          result += `**Bước ${stepNum}: ${title}**\n${desc}\n\n`;
        });
      }
    }

    // If no known fields found, try to stringify nicely
    if (!result.trim()) {
      // Check if it's a simple object with just text-like values
      if (typeof response === 'string') {
        return response;
      }
      if (response && typeof response === 'object') {
        const respObj = response as Record<string, unknown>;
        const keys = Object.keys(respObj);
        keys.forEach(key => {
          const value = respObj[key];
          if (typeof value === 'string') {
            result += `**${key}:** ${value}\n`;
          } else if (Array.isArray(value)) {
            result += `**${key}:**\n`;
            value.forEach((item, i) => {
              if (typeof item === 'string') {
                result += `  ${i + 1}. ${item}\n`;
              } else if (typeof item === 'object' && item !== null) {
                result += `  ${i + 1}. ${JSON.stringify(item)}\n`;
              }
            });
          }
        });
      }
    }

    return result.trim() || JSON.stringify(data, null, 2);
  };

  // Helper function to render message content with clickable links and formatting
  const renderMessageContent = (content: string) => {
    // First, parse the AI response (handles JSON formatting)
    const formattedContent = parseAiResponse(content);
    
    // Then render with markdown-like formatting
    const lines = formattedContent.split('\n');
    
    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          // Handle bold text: **text**
          const boldRegex = /\*\*([^*]+)\*\*/g;
          let formattedLine: React.ReactNode = line;
          
          if (boldRegex.test(line)) {
            const parts: React.ReactNode[] = [];
            let lastIndex = 0;
            let match;
            boldRegex.lastIndex = 0; // Reset regex
            
            while ((match = boldRegex.exec(line)) !== null) {
              if (match.index > lastIndex) {
                parts.push(line.substring(lastIndex, match.index));
              }
              parts.push(
                <strong key={`bold-${index}-${match.index}`} className="font-semibold">
                  {match[1]}
                </strong>
              );
              lastIndex = match.index + match[0].length;
            }
            
            if (lastIndex < line.length) {
              parts.push(line.substring(lastIndex));
            }
            
            formattedLine = <>{parts}</>;
          }

          // Handle links: [text](url)
          const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
          if (typeof formattedLine === 'string' && linkRegex.test(formattedLine)) {
            const parts: React.ReactNode[] = [];
            let lastIndex = 0;
            let match;
            linkRegex.lastIndex = 0;
            
            while ((match = linkRegex.exec(formattedLine)) !== null) {
              if (match.index > lastIndex) {
                parts.push(formattedLine.substring(lastIndex, match.index));
              }
              parts.push(
                <Link
                  key={`link-${index}-${match.index}`}
                  href={match[2]}
                  className="text-blue-500 hover:text-blue-400 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {match[1]}
                </Link>
              );
              lastIndex = match.index + match[0].length;
            }
            
            if (lastIndex < formattedLine.length) {
              parts.push(formattedLine.substring(lastIndex));
            }
            
            formattedLine = <>{parts}</>;
          }

          // Empty line = paragraph break
          if (line.trim() === '') {
            return <div key={index} className="h-2" />;
          }

          return (
            <p key={index} className="leading-relaxed">
              {formattedLine}
            </p>
          );
        })}
      </div>
    );
  };

  const renderQueryPreview = (queryResult?: Record<string, any> | null) => {
    if (!queryResult) {
      return null;
    }
    const rows = Array.isArray(queryResult.rows) ? queryResult.rows : [];
    const columns = Array.isArray(queryResult.columns)
      ? queryResult.columns
      : rows.length > 0
        ? Object.keys(rows[0] || {})
        : [];

    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <Database className="h-3.5 w-3.5" />
          Query Result
        </div>
        {queryResult.summary && (
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{String(queryResult.summary)}</p>
        )}
        {rows.length > 0 && columns.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="px-3 py-2 font-semibold text-slate-600 dark:text-slate-300">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-slate-100 dark:border-slate-800">
                    {columns.map((column) => (
                      <td key={`${rowIndex}-${column}`} className="px-3 py-2 text-slate-600 dark:text-slate-300">
                        {String(row?.[column] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderChartPreview = (chartSpec?: Record<string, any> | null) => {
    if (!chartSpec) {
      return null;
    }
    const labels: string[] = Array.isArray(chartSpec?.data?.labels) ? chartSpec.data.labels : [];
    const datasets: Array<{ label?: string; values?: number[] }> = Array.isArray(chartSpec?.data?.datasets) ? chartSpec.data.datasets : [];
    const chartType = String(chartSpec.type || "bar").toLowerCase();
    const chartTitle = String(chartSpec.title || "Chart");

    // Build Recharts-compatible data
    const chartData = labels.map((label: string, idx: number) => {
      const point: Record<string, any> = { name: label };
      datasets.forEach((ds) => {
        point[ds.label || "value"] = ds.values?.[idx] ?? 0;
      });
      return point;
    });

    const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981"];

    if (!chartData.length || !datasets.length) {
      return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <BarChart3 className="h-3.5 w-3.5" />
            {chartTitle}
          </div>
          <p className="mt-2 text-xs text-gray-500">No data available for chart.</p>
        </div>
      );
    }

    // Dynamic import would be better, but for simplicity render inline
    const { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = require("recharts");

    const renderChart = () => {
      if (chartType === "line") {
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              {datasets.map((ds: any, i: number) => (
                <Line key={ds.label || i} type="monotone" dataKey={ds.label || "value"} stroke={COLORS[i % COLORS.length]} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      }
      if (chartType === "pie" && datasets.length === 1) {
        const pieData = labels.map((label: string, idx: number) => ({
          name: label,
          value: datasets[0].values?.[idx] ?? 0,
        }));
        return (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((_: any, idx: number) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      // Default: bar chart
      return (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            {datasets.map((ds: any, i: number) => (
              <Bar key={ds.label || i} dataKey={ds.label || "value"} fill={COLORS[i % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    };

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
          <BarChart3 className="h-3.5 w-3.5" />
          {chartTitle}
          <Badge variant="secondary" className="text-[10px]">{chartType}</Badge>
        </div>
        {renderChart()}
      </div>
    );
  };

  const renderMessageInsights = (metadata?: MessageInsightMeta) => {
    if (!metadata) {
      return null;
    }
    const citations = Array.isArray(metadata.citations) ? metadata.citations : [];
    const trace = Array.isArray(metadata.trace) ? metadata.trace : [];
    const nodeTimings = metadata && typeof metadata === "object" && "nodeTimings" in metadata && metadata.nodeTimings
      ? Object.entries(metadata.nodeTimings as Record<string, number>)
      : [];
    const hasInsights =
      !!metadata.intent ||
      !!metadata.resolvedMode ||
      !!metadata.requestedMode ||
      citations.length > 0 ||
      !!metadata.queryResult ||
      !!metadata.chartSpec ||
      trace.length > 0 ||
      nodeTimings.length > 0 ||
      !!(metadata as any)?.tokensUsed ||
      !!(metadata as any)?.requestId;

    if (!hasInsights) {
      return null;
    }

    return (
      <div className="mt-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          {metadata.resolvedMode && <Badge variant="secondary">Mode: {metadata.resolvedMode}</Badge>}
          {metadata.intent && <Badge variant="outline">Intent: {metadata.intent}</Badge>}
          {(metadata as any)?.tokensUsed ? (
            <Badge variant="outline">Tokens: {String((metadata as any).tokensUsed)}</Badge>
          ) : null}
          {typeof metadata.confidence === "number" && (
            <Badge variant="outline">Confidence: {(metadata.confidence * 100).toFixed(0)}%</Badge>
          )}
        </div>

        {((metadata as any)?.requestId || nodeTimings.length > 0) && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Activity className="h-3.5 w-3.5" />
              Runtime
            </div>
            {(metadata as any)?.requestId && (
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                Request ID: <span className="font-mono">{String((metadata as any).requestId)}</span>
              </div>
            )}
            {nodeTimings.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {nodeTimings.map(([step, duration]) => (
                  <Badge key={step} variant="outline">
                    {step}: {Number(duration).toFixed(1)} ms
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}


        {trace.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Workflow className="h-3.5 w-3.5" />
              Planning Trace
            </div>
            <div className="mt-2 space-y-2">
              {trace.slice(0, 6).map((item, index) => (
                <div key={`${item.step || "step"}-${index}`} className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">{item.step || "step"}:</span> {item.detail || ""}
                </div>
              ))}
            </div>
          </div>
        )}

        {citations.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <MessageSquare className="h-3.5 w-3.5" />
              Sources
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {citations.map((citation, index) => {
                const courseId = citation.courseId || citation.course_id;
                const label = String(citation.title || citation.kind || `source-${index + 1}`);
                if (courseId) {
                  return (
                    <a
                      key={`${label}-${index}`}
                      href={`/courses/${courseId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900 transition-colors"
                    >
                      {label}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  );
                }
                return (
                  <Badge key={`${label}-${index}`} variant="outline">
                    {label}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {renderQueryPreview(metadata.queryResult)}
        {renderChartPreview(metadata.chartSpec)}
      </div>
    );
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
        w-85 sm:w-85 bg-white dark:bg-gray-950 
        border-r border-gray-200 dark:border-gray-800 
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:transform-none
      `}>
        {/* Settings Section */}
        <div className="p-3 sm:p-4 space-y-3">
          {/* Settings & Guide Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="flex-1 justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-3" />
              {t("settings") || "Settings"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-pink-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
              onClick={handleStartTour}
              title={t("guide") || "Hướng dẫn"}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>

          {/* Settings Panel (collapsible) */}
          {showSettings && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-3" id="ai-mode-selector">
              <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/80 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Auto routing enabled
                  </span>
                </div>
                <p className="mt-2 text-xs text-blue-700/80 dark:text-blue-300/80">
                  AI se tu chon cach xu ly phu hop: hoi dap, goi y khoa hoc, phan tich du lieu hoac phan tich tai lieu.
                </p>
              </div>
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
              {/* Streaming Mode Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-streaming-sidebar"
                  checked={useStreaming}
                  onCheckedChange={(checked) => setUseStreaming(checked as boolean)}
                  className="h-3 w-3"
                />
                <label htmlFor="use-streaming-sidebar" className="text-xs flex items-center gap-1">
                  ⚡ Streaming Mode
                  {isStreaming && <Loader2 className="h-3 w-3 animate-spin" />}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* New Chat Button & Search */}
        <div className="px-3 sm:px-4 pb-4 flex gap-2" id="ai-new-chat-button">
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
        <ScrollArea className="flex-1 px-2" id="ai-session-list">
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

        {/* Bottom Section - User Profile */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4">
          {/* User Profile */}
          <Link href="/profile">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage 
                src={userProfile?.avatar || "/avatars/default.png"} 
                alt={userProfile?.fullName || userProfile?.username || "User"} 
              />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs sm:text-sm font-medium">
                {(userProfile?.fullName || userProfile?.username || "U")
                  .substring(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {userProfile?.fullName || userProfile?.username || t("guest") || "Guest"}
              </p>

              <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-gray-100 truncate">
                {userProfile?.email || t("guest") || "Guest"}
              </p>
            </div>
          </div>
        </Link>
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
          <h1 className="text-lg font-semibold">{t("headerTitle") || "Techhub AI"}</h1>
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
              <div className="flex flex-col items-center justify-center h-[50vh] sm:h-[60vh] text-center px-4" id="ai-chat-welcome">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full">
               <Image
                  src="/ai/TechHub_Logo.png"
                  alt="Student learning"
                  width={80}
                  height={80}
                  className="object-cover rounded-full"
                  priority
                />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t("welcomeTitle") || "How can I help you today?"}
                </h2>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md">
                  {t("startChatting") || "Start a conversation by typing a message below"}
                </p>
                
                {/* Suggested Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-6 sm:mt-8 w-full max-w-2xl" id="ai-preset-prompts">
                  {presetPrompts.slice(0, 6).map((prompt, idx) => (
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
                              src={userProfile?.avatar} 
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
                     <Image
                        src="/ai/TechHub_Logo.png"
                        alt="Student learning"
                        width={80}
                        height={80}
                        className="object-cover rounded-full"
                        priority
                      />
                      </div>
                      <div className="flex-1 max-w-[90%] sm:max-w-[85%]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            Techhub AI
                          </span>
                          <CheckCircle className="h-3 w-3 text-blue-500" />
                          {message.metadata?.resolvedMode && (
                            <Badge variant="outline" className="text-[10px]">
                              {message.metadata.resolvedMode}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          {message.content === "..." ? (
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                            </div>
                          ) : message.id === streamingAssistantId ? (
                            // While streaming: show markdown with cursor
                            <div>
                              <MarkdownRenderer content={message.content} />
                              <span className="animate-pulse text-blue-500">▌</span>
                            </div>
                          ) : (
                            // After streaming complete: show formatted markdown
                            <MarkdownRenderer content={message.content} />
                          )}
                        </div>
                        {renderMessageInsights(message.metadata)}
                        {/* HITL Clarify Quick Reply Buttons */}
                        {message.metadata?.hitlClarifyActive &&
                          message.metadata?.hitlOptions &&
                          message.metadata.hitlOptions.length > 0 &&
                          !hitlRepliedMessageIds.has(message.id) && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {message.metadata.hitlOptions.map((option, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950"
                                onClick={() => handleHitlQuickReply(message.id, option)}
                                disabled={isStreaming}
                              >
                                {option}
                              </Button>
                            ))}
                          </div>
                        )}
                        {message.metadata?.hitlClarifyActive &&
                          hitlRepliedMessageIds.has(message.id) && (
                          <div className="mt-2 text-xs text-gray-400 italic">
                            Da chon phuong an lam ro.
                          </div>
                        )}
                        {message.id !== "typing" && (
                          <div className="flex flex-wrap items-center gap-1 mt-2 sm:mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 w-6 sm:h-7 sm:w-7 p-0 ${feedbackState[message.id] === "up" ? "text-green-500" : "text-gray-400 hover:text-gray-600"}`}
                              onClick={() => handleFeedback(message.id, "up")}
                              disabled={!!feedbackState[message.id]}
                            >
                              <ThumbsUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </Button>
                            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 w-6 sm:h-7 sm:w-7 p-0 ${feedbackState[message.id] === "down" ? "text-red-500" : "text-gray-400 hover:text-gray-600"}`}
                              onClick={() => handleFeedback(message.id, "down")}
                              disabled={!!feedbackState[message.id]}
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
                            <div className="flex-1" />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 sm:h-7 px-1.5 sm:px-2 text-gray-400 hover:text-gray-600 text-xs gap-1"
                              onClick={() => handleRegenerate(message.id)}
                              disabled={isStreaming}
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
            {/* Scroll anchor - always at bottom */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-2 sm:p-4">
          <div className="max-w-4xl mx-auto">
            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((file) => (
                  <Badge key={file.id} variant="outline" className="gap-2 px-3 py-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="max-w-[180px] truncate">{file.name}</span>
                    <button type="button" onClick={() => removeAttachedFile(file.id)}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleAttachFiles}
            />
            <div className="relative flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 sm:px-4 py-1.5 sm:py-2" id="ai-chat-input">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 mb-0.5 sm:mb-1 hidden sm:flex">
                <AvatarImage 
                  src={userProfile?.avatar} 
                />
                <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-xs">
                  {(userProfile?.fullName || userProfile?.username || "U").substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-700"
                onClick={() => fileInputRef.current?.click()}
                disabled={!userId || uploadFileMutation.isPending || isStreaming}
                title="Attach files"
              >
                {uploadFileMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </Button>
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
                disabled={
                  (!inputMessage.trim() && attachedFiles.length === 0) ||
                  chatMutation.isPending ||
                  isStreaming ||
                  !userId ||
                  uploadFileMutation.isPending
                }
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
              >
                {chatMutation.isPending || isStreaming ? (
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

      {/* AI Chat Onboarding Tour */}
      {showTour && userProfile && (
        <AiChatOnboardingTour
          userName={userProfile.fullName || userProfile.username || "bạn"}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
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
