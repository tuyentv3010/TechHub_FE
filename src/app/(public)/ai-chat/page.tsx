"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useSendChatMessageMutation, useGetUserSessions, useGetSessionMessages, useDeleteSessionMutation } from "@/queries/useAi";
import { useAppContext } from "@/components/app-provider";
import { useAccountProfile } from "@/queries/useAccount";
import { useUploadFileMutation } from "@/queries/useFile";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { MarkdownRenderer } from "@/components/markdown-renderer";
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
  AlertTriangle,
  X,
  FileText,
  ExternalLink,
  PanelLeft,
  PanelLeftClose,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Filter,
  CalendarDays,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Globe,
  UserRound,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";

interface MessageTraceItem {
  step?: string;
  detail?: string;
}

type SuggestedActionKind =
  | "prompt"
  | "change_chart_type"
  | "export_csv"
  | "copy_sql"
  | "refine_filter";

interface SuggestedAction {
  id: string;
  label: string;
  description?: string;
  kind: SuggestedActionKind;
  prompt?: string;
  payload?: {
    chartType?: string;
    [key: string]: unknown;
  };
  icon?: string;
  tone?: "primary" | "secondary";
}

interface MessageInsightMeta {
  requestId?: string | null;
  requestedMode?: "AUTO" | "GENERAL" | "ADVISOR";
  resolvedMode?: "AUTO" | "GENERAL" | "ADVISOR";
  intent?: string;
  confidence?: number;
  thinkingText?: string;
  tokensUsed?: number;
  tokenUsage?: Record<string, any>;
  citations?: Array<Record<string, any>>;
  queryResult?: Record<string, any> | null;
  chartSpec?: Record<string, any> | null;
  suggestedActions?: SuggestedAction[];
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
  attachments?: AttachedFileContext[];
}

interface AttachedFileContext {
  id: string;
  name: string;
  mimeType?: string;
  fileType?: string;
  secureUrl?: string | null;
  publicUrl?: string | null;
  cloudinarySecureUrl?: string | null;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  description?: string | null;
  processingStatus?: string | null;
}

interface SavedAnalysis {
  id: string;
  sourceMessageId: string;
  title: string;
  prompt: string;
  savedAt: string;
  scopeLabel?: string;
  message: Message;
}

const SAVED_ANALYSES_STORAGE_KEY = "ai_chat_saved_analyses_v1";
const SAVED_ANALYSES_LIMIT = 30;
const DRAFT_SESSION_ID = "__draft__";

export default function AiChatPage() {
  const { toast } = useToast();
  const t = useTranslations("AiChat");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { isAuth } = useAppContext();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileContext[]>([]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<{ id: string; label: string; startedAt: string }[]>([]);
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [isDraftSession, setIsDraftSession] = useState<boolean>(false);
  const [draftStartedAt, setDraftStartedAt] = useState<string>(new Date().toISOString());
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(300);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [recentsOpen, setRecentsOpen] = useState<boolean>(true);
  const [streamingAssistantId, setStreamingAssistantId] = useState<string | null>(null);
  const [showTour, setShowTour] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingSessionLabelRef = useRef<string | null>(null);
  const streamingAssistantIdRef = useRef<string | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const currentIsDraftSessionRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionMessagesCache = useRef<Map<string, Message[]>>(new Map());
  const draftStateRef = useRef<{
    messages: Message[];
    inputMessage: string;
    attachedFiles: AttachedFileContext[];
    selectedInsightMessageId: string | null;
  }>({
    messages: [],
    inputMessage: "",
    attachedFiles: [],
    selectedInsightMessageId: null,
  });
  const [hitlRepliedMessageIds, setHitlRepliedMessageIds] = useState<Set<string>>(new Set());
  const [feedbackState, setFeedbackState] = useState<Record<string, "up" | "down">>({});
  const [selectedInsightMessageId, setSelectedInsightMessageId] = useState<string | null>(null);
  const [analysisTab, setAnalysisTab] = useState<"data" | "sql" | "chart" | "sources">("chart");
  const [analysisPanelOpen, setAnalysisPanelOpen] = useState<boolean>(true);
  const [analysisPanelWidth, setAnalysisPanelWidth] = useState<number>(520);
  const lastUserWorkspaceSelectionRef = useRef<string | null>(null);
  const [chartTypeOverrides, setChartTypeOverrides] = useState<Record<string, string>>({});
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});
  const [workspaceExpanded, setWorkspaceExpanded] = useState<boolean>(false);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [viewedSavedAnalysisId, setViewedSavedAnalysisId] = useState<string | null>(null);
  const [savedSectionOpen, setSavedSectionOpen] = useState<boolean>(true);
  // Multi-step refinement: tracks which analytics message the next prompt should
  // inherit context from. Null when user explicitly dismissed refinement for the
  // currently-selected insight, or when the current message has no analytics.
  const [dismissedRefineMessageId, setDismissedRefineMessageId] = useState<string | null>(null);
  const useStreaming = true;
  const useProgress = true;
  const assistantPerspective = "learner";
  const responseDepth = "balanced";
  const setAssistantPerspective = (_value: "learner" | "instructor" | "analyst") => undefined;
  const setResponseDepth = (_value: "concise" | "balanced" | "detailed") => undefined;
  const setUseProgress = (_checked: boolean) => undefined;
  const setUseStreaming = (_checked: boolean) => undefined;

  const hasWorkspaceContent = useCallback((metadata?: MessageInsightMeta) => {
    if (!metadata) return false;
    return Boolean(
      metadata.queryResult || metadata.chartSpec
    );
  }, []);

  useEffect(() => {
    currentSessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    currentIsDraftSessionRef.current = isDraftSession;
  }, [isDraftSession]);

  useEffect(() => {
    if (!isDraftSession) return;
    draftStateRef.current = {
      messages,
      inputMessage,
      attachedFiles,
      selectedInsightMessageId,
    };
  }, [attachedFiles, inputMessage, isDraftSession, messages, selectedInsightMessageId]);

  const formatSessionLabel = useCallback(
    (text?: string | null, attachments?: AttachedFileContext[]) => {
      const normalized = String(text || "")
        .replace(/\s+/g, " ")
        .trim();
      if (normalized) {
        const words = normalized.split(" ").filter(Boolean);
        const preview = words.slice(0, 7).join(" ");
        return preview.length < normalized.length ? `${preview}...` : preview;
      }
      if (attachments && attachments.length > 0) {
        if (attachments.length === 1) {
          return `${locale === "vi" ? "Phân tích file" : locale === "ja" ? "ファイル分析" : "File analysis"}: ${attachments[0].name}`;
        }
        return locale === "vi"
          ? `${attachments.length} file đính kèm`
          : locale === "ja"
            ? `${attachments.length} 件の添付ファイル`
            : `${attachments.length} attachments`;
      }
      return locale === "vi" ? "Nháp mới" : locale === "ja" ? "新しい下書き" : "New draft";
    },
    [locale]
  );

  const hydrateAttachmentsFromMetadata = useCallback((metadata: unknown): AttachedFileContext[] => {
    if (!metadata || typeof metadata !== "object") return [];
    const rawAttachments =
      Array.isArray((metadata as Record<string, any>).attachments)
        ? (metadata as Record<string, any>).attachments
        : Array.isArray((metadata as Record<string, any>).fileContexts)
          ? (metadata as Record<string, any>).fileContexts
          : [];
    return rawAttachments
      .map((item: Record<string, any>, index: number) => ({
        id: String(item.id || item.fileId || `attachment-${index}`),
        name: String(item.name || item.fileName || `Attachment ${index + 1}`),
        mimeType: item.mimeType ? String(item.mimeType) : undefined,
        fileType: item.fileType ? String(item.fileType) : undefined,
        secureUrl: item.secureUrl ? String(item.secureUrl) : null,
        publicUrl: item.publicUrl ? String(item.publicUrl) : null,
        cloudinarySecureUrl: item.cloudinarySecureUrl ? String(item.cloudinarySecureUrl) : null,
        thumbnailUrl: item.thumbnailUrl ? String(item.thumbnailUrl) : null,
        previewUrl: item.previewUrl ? String(item.previewUrl) : null,
        description: item.description ? String(item.description) : null,
        processingStatus: item.processingStatus ? String(item.processingStatus) : null,
      }))
      .filter((item: AttachedFileContext) => Boolean(item.id && item.name));
  }, []);

  const getFollowUpActionsForMessage = useCallback(
    (message: Message): SuggestedAction[] => {
      const metadata = message.metadata;
      if (!metadata) return [];
      if (!metadata.queryResult && !metadata.chartSpec) return [];
      const rawRemote: unknown =
        metadata.suggestedActions
        ?? (metadata.queryResult && Array.isArray((metadata.queryResult as any).suggestedActions)
          ? (metadata.queryResult as any).suggestedActions
          : undefined);
      const remoteNormalized = Array.isArray(rawRemote)
        ? (rawRemote as Array<Record<string, any>>)
            .map(normalizeIncomingAction)
            .filter((a): a is SuggestedAction => !!a)
        : [];
      const override = chartTypeOverrides[message.id];
      const local = buildLocalFollowUpActions(message, override);
      return mergeSuggestedActions(remoteNormalized, local);
    },
    [chartTypeOverrides]
  );

  const insightMessages = useMemo(
    () => messages.filter((message) => message.role === "assistant" && hasWorkspaceContent(message.metadata)),
    [messages, hasWorkspaceContent]
  );

  const selectedInsightMessage = useMemo(() => {
    if (insightMessages.length === 0) {
      return null;
    }
    return (
      insightMessages.find((message) => message.id === selectedInsightMessageId) ||
      insightMessages[insightMessages.length - 1]
    );
  }, [insightMessages, selectedInsightMessageId]);

  const selectedInsightPrompt = useMemo(() => {
    if (!selectedInsightMessage) {
      return "";
    }
    const selectedIndex = messages.findIndex((message) => message.id === selectedInsightMessage.id);
    for (let index = selectedIndex - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === "user") {
        return messages[index]?.content || "";
      }
    }
    return "";
  }, [messages, selectedInsightMessage]);

  useEffect(() => {
    if (insightMessages.length === 0) {
      setSelectedInsightMessageId(null);
      return;
    }
    setSelectedInsightMessageId((current) =>
      current && insightMessages.some((message) => message.id === current)
        ? current
        : insightMessages[insightMessages.length - 1].id
    );
  }, [insightMessages]);

  // Note: we deliberately do NOT auto-open the analysis panel when a new
  // insight message is auto-selected. The panel's open/close state is fully
  // owned by explicit user actions (toggle button, click message bubble,
  // follow-up action). This prevents the panel from re-opening every time
  // a new assistant message arrives after the user has hidden it.

  useEffect(() => {
    if (!selectedInsightMessage?.metadata) {
      return;
    }
    const metadata = selectedInsightMessage.metadata;
    setAnalysisTab((current) => {
      if (current === "chart" && metadata.chartSpec) return current;
      if (current === "sql" && metadata.queryResult?.sql) return current;
      if (current === "sources" && Array.isArray(metadata.citations) && metadata.citations.length > 0) return current;
      if (metadata.chartSpec) return "chart";
      if (metadata.queryResult) return "data";
      if (Array.isArray(metadata.citations) && metadata.citations.length > 0) return "sources";
      return "chart";
    });
  }, [selectedInsightMessage]);

  // Persisted sidebar width / collapsed
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedWidth = localStorage.getItem("ai_chat_sidebar_width");
    if (savedWidth) {
      const n = parseInt(savedWidth, 10);
      if (!Number.isNaN(n)) setSidebarWidth(Math.min(Math.max(n, 240), 480));
    }
    if (localStorage.getItem("ai_chat_sidebar_collapsed") === "1") {
      setSidebarCollapsed(true);
    }
    if (localStorage.getItem("ai_chat_recents_open") === "0") {
      setRecentsOpen(false);
    }
    const savedAnalysisWidth = localStorage.getItem("ai_chat_analysis_width");
    if (savedAnalysisWidth) {
      const n = parseInt(savedAnalysisWidth, 10);
      if (!Number.isNaN(n)) setAnalysisPanelWidth(Math.min(Math.max(n, 360), 760));
    }
    if (localStorage.getItem("ai_chat_analysis_open") === "0") {
      setAnalysisPanelOpen(false);
    }
    const savedInstructions = localStorage.getItem("ai_chat_custom_instructions");
    if (savedInstructions) {
      setCustomInstructions(savedInstructions);
    }
  }, []);

  // Viewport tracking so we can clamp sidebar/workspace widths responsively.
  // This prevents the chat area from being squeezed to zero when the window
  // shrinks or when the user has wide stored widths from a larger screen.
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window === "undefined" ? 1920 : window.innerWidth
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setViewportWidth(window.innerWidth));
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Effective widths clamp the stored preferences to what the viewport can
  // actually accommodate. We reserve ~360px for the chat column and keep
  // sidebar + workspace from overlapping it on mid-size laptops.
  const CHAT_MIN_WIDTH = 360;
  const MIN_SIDEBAR = 240;
  const MIN_WORKSPACE = 360;
  const isDesktopViewport = viewportWidth >= 1024;
  const sidebarBaseWidth = sidebarCollapsed ? 64 : sidebarWidth;
  const effectiveSidebarWidth = useMemo(() => {
    if (!isDesktopViewport) return sidebarBaseWidth;
    if (sidebarCollapsed) return 64;
    const maxAllowed = Math.max(MIN_SIDEBAR, Math.floor(viewportWidth * 0.28));
    return Math.min(Math.max(sidebarBaseWidth, MIN_SIDEBAR), maxAllowed);
  }, [sidebarBaseWidth, sidebarCollapsed, viewportWidth, isDesktopViewport]);

  const effectiveAnalysisWidth = useMemo(() => {
    if (!isDesktopViewport) return analysisPanelWidth;
    const headroom = viewportWidth - effectiveSidebarWidth - CHAT_MIN_WIDTH;
    const maxAllowed = Math.max(MIN_WORKSPACE, Math.min(860, headroom));
    if (headroom < MIN_WORKSPACE) {
      return MIN_WORKSPACE;
    }
    return Math.min(Math.max(analysisPanelWidth, MIN_WORKSPACE), maxAllowed);
  }, [analysisPanelWidth, effectiveSidebarWidth, viewportWidth, isDesktopViewport]);

  // If the viewport genuinely cannot fit both side panels + chat column,
  // force-close the workspace so the chat stays usable. Applies only on desktop
  // where the side-by-side layout is active.
  const workspaceCanFit =
    !isDesktopViewport
    || viewportWidth - effectiveSidebarWidth - MIN_WORKSPACE >= CHAT_MIN_WIDTH;
  const workspaceRendered = analysisPanelOpen && workspaceCanFit;

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("ai_chat_recents_open", recentsOpen ? "1" : "0");
  }, [recentsOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("ai_chat_sidebar_width", String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("ai_chat_sidebar_collapsed", sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("ai_chat_analysis_width", String(analysisPanelWidth));
  }, [analysisPanelWidth]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("ai_chat_analysis_open", analysisPanelOpen ? "1" : "0");
  }, [analysisPanelOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("ai_chat_custom_instructions", customInstructions);
  }, [customInstructions]);

  // Load + persist saved analyses. Stored per-browser in localStorage so users
  // can revisit a past analysis even after the chat session is cleared.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(SAVED_ANALYSES_STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const hydrated: SavedAnalysis[] = [];
      for (const entry of parsed) {
        if (!entry || typeof entry !== "object") continue;
        const candidate = entry as Record<string, unknown>;
        const message = candidate.message as Record<string, unknown> | undefined;
        if (!candidate.id || !message || typeof message !== "object") continue;
        hydrated.push({
          id: String(candidate.id),
          sourceMessageId: String(candidate.sourceMessageId || ""),
          title: String(candidate.title || "Saved analysis"),
          prompt: String(candidate.prompt || ""),
          savedAt: String(candidate.savedAt || new Date().toISOString()),
          scopeLabel: candidate.scopeLabel ? String(candidate.scopeLabel) : undefined,
          message: {
            id: String(message.id || candidate.id),
            role: "assistant",
            content: String(message.content || ""),
            timestamp: new Date(String(message.timestamp || candidate.savedAt || Date.now())),
            metadata: (message.metadata as MessageInsightMeta | undefined) || undefined,
          },
        });
      }
      if (hydrated.length > 0) {
        setSavedAnalyses(hydrated);
      }
    } catch (error) {
      console.error("Failed to load saved analyses:", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SAVED_ANALYSES_STORAGE_KEY, JSON.stringify(savedAnalyses));
    } catch (error) {
      console.warn("Failed to persist saved analyses:", error);
    }
  }, [savedAnalyses]);

  // Lock body scroll + bind Escape when any fullscreen analysis overlay is
  // open (live workspace OR saved-analysis viewer) so the chat underneath
  // doesn't scroll and keyboard users can dismiss the view quickly.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isOpen = workspaceExpanded || !!viewedSavedAnalysisId;
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (viewedSavedAnalysisId) {
          setViewedSavedAnalysisId(null);
        } else if (workspaceExpanded) {
          setWorkspaceExpanded(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [workspaceExpanded, viewedSavedAnalysisId]);

  // If no message is selected or no workspace content is available, collapse
  // the expanded overlay automatically so it doesn't stay on top of a chat
  // that no longer has analytics to show (e.g. after deleting sessions).
  useEffect(() => {
    if (!workspaceExpanded) return;
    if (!selectedInsightMessageId) {
      setWorkspaceExpanded(false);
    }
  }, [workspaceExpanded, selectedInsightMessageId]);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      const vw = window.innerWidth;
      const maxSidebar = Math.max(MIN_SIDEBAR, Math.floor(vw * 0.28));
      const w = Math.min(Math.max(ev.clientX, MIN_SIDEBAR), Math.min(480, maxSidebar));
      setSidebarWidth(w);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  const startAnalysisResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      const vw = window.innerWidth;
      const desiredWidth = vw - ev.clientX;
      const sidebarBase = sidebarCollapsed ? 64 : Math.max(sidebarWidth, MIN_SIDEBAR);
      const headroom = vw - sidebarBase - CHAT_MIN_WIDTH;
      const maxWidth = Math.max(MIN_WORKSPACE, Math.min(860, headroom));
      setAnalysisPanelWidth(Math.min(Math.max(desiredWidth, MIN_WORKSPACE), maxWidth));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

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
  const deleteSessionMutation = useDeleteSessionMutation();
  const uploadFileMutation = useUploadFileMutation();

  const updateAssistantMessage = (messageId: string, updater: (message: Message) => Message) => {
    setMessages((prev) => prev.map((message) => (message.id === messageId ? updater(message) : message)));
  };

  const mergeStreamingMetadata = (current: MessageInsightMeta | undefined, event: { event: string; data: any }) => {
    const next: MessageInsightMeta = { ...(current || {}) };
    if (event.event === "thinking") {
      const delta = typeof event.data?.content === "string" ? event.data.content : "";
      if (delta) {
        next.thinkingText = `${next.thinkingText || ""}${delta}`;
      }
    }
    if (event.event === "citation") {
      next.citations = Array.isArray(event.data?.sources) ? event.data.sources : current?.citations;
    }
    if (event.event === "artifact") {
      next.queryResult = event.data?.queryResult ?? next.queryResult ?? null;
      next.chartSpec = event.data?.chartSpec ?? next.chartSpec ?? null;
      const artifactSuggested =
        (Array.isArray(event.data?.suggestedActions) && event.data.suggestedActions) ||
        (Array.isArray(next.queryResult?.suggestedActions) && next.queryResult?.suggestedActions) ||
        null;
      if (artifactSuggested) {
        next.suggestedActions = artifactSuggested as SuggestedAction[];
      }
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
      const doneSuggested =
        (Array.isArray(event.data?.suggestedActions) && event.data.suggestedActions) ||
        (Array.isArray(next.queryResult?.suggestedActions) && next.queryResult?.suggestedActions) ||
        null;
      if (doneSuggested) {
        next.suggestedActions = doneSuggested as SuggestedAction[];
      }
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
        const pendingLabel = pendingSessionLabelRef.current;
        const nextSessionId = String(event.data.sessionId);
        const shouldPromoteActiveDraft = currentIsDraftSessionRef.current && !currentSessionIdRef.current;
        if (shouldPromoteActiveDraft) {
          setSessionId(nextSessionId);
          setIsDraftSession(false);
        }
        if (pendingLabel) {
          setSessions((prev) => {
            const existing = prev.find((session) => session.id === nextSessionId);
            if (existing) return prev;
            return [{ id: nextSessionId, label: pendingLabel, startedAt: draftStartedAt }, ...prev];
          });
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
        const completedSessionId = String(finalEvent?.data?.sessionId || currentSessionIdRef.current || "");
        updateAssistantMessage(activeStreamingId, (message) => ({
          ...message,
          content: fullMessage || finalEvent?.data?.message || message.content,
          metadata: finalEvent ? mergeStreamingMetadata(message.metadata, finalEvent) : message.metadata,
        }));
        if (completedSessionId) {
          const cachedMessages = sessionMessagesCache.current.get(completedSessionId) || [];
          const baseMessages = cachedMessages.some((message) => message.id === activeStreamingId) ? cachedMessages : messages;
          const nextMessages = baseMessages.map((message) =>
            message.id === activeStreamingId
              ? {
                  ...message,
                  content: fullMessage || finalEvent?.data?.message || message.content,
                  metadata: finalEvent ? mergeStreamingMetadata(message.metadata, finalEvent) : message.metadata,
                }
              : message
          );
          if (nextMessages.some((message) => message.id === activeStreamingId)) {
            sessionMessagesCache.current.set(completedSessionId, nextMessages);
          }
        }
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
  const { data: sessionsData, isLoading: isSessionsLoading, isFetching: isSessionsFetching } = useGetUserSessions(userId);
  
  // Fetch messages for current session from DB
  const { data: messagesData, isLoading: isSessionMessagesLoading, isFetching: isSessionMessagesFetching } = useGetSessionMessages(sessionId || "");

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

      const sessionsWithLabels = dbSessions.map((s: { id: string; userId: string; startedAt: string }, idx: number) => ({
        id: s.id,
        label: sessionLabelsCache.current.get(s.id) || `${t("session")} ${dbSessions.length - idx}`,
        startedAt: s.startedAt,
      }));

      setSessions(sessionsWithLabels);

      // Auto-select most recent session if none selected
      if (!sessionId && !isDraftSession && dbSessions.length > 0) {
        setSessionId(dbSessions[0].id);
      }
    }
  }, [isDraftSession, sessionId, sessionsData, t]);

  // Sync messages from DB when session changes
  useEffect(() => {
    if (messagesData?.payload?.data) {
      const dbMessages = messagesData.payload.data;
      const hydratedMessages = dbMessages.map((m: {
        id: string;
        sessionId: string;
        sender: string;
        content: string;
        timestamp: string;
        metadata?: MessageInsightMeta;
      }) => ({
          id: m.id,
          role: m.sender === "USER" ? ("user" as const) : ("assistant" as const),
          content: m.content,
          timestamp: new Date(m.timestamp),
          metadata: m.metadata,
          attachments: m.sender === "USER" ? hydrateAttachmentsFromMetadata(m.metadata) : undefined,
        }));
      setMessages(hydratedMessages);
      if (sessionId) {
        sessionMessagesCache.current.set(sessionId, hydratedMessages);
        const firstUserMessage = hydratedMessages.find((m: Message) => m.role === "user" && (m.content.trim() || (m.attachments?.length ?? 0) > 0));
        if (firstUserMessage) {
          const label = formatSessionLabel(firstUserMessage.content, firstUserMessage.attachments);
          sessionLabelsCache.current.set(sessionId, label);
          setSessions((prev) => prev.map((session) => (
            session.id === sessionId ? { ...session, label } : session
          )));
        }
        setLoadingSessionId((current) => (current === sessionId ? null : current));
      }
      // Scroll to bottom after messages are loaded with a small delay
      setTimeout(() => scrollToBottom("instant"), 100);
    } else if (sessionId && !messagesData && !isSessionMessagesLoading && !isSessionMessagesFetching) {
      // Clear messages when switching to session with no messages yet
      setMessages([]);
      setLoadingSessionId((current) => (current === sessionId ? null : current));
    }
  }, [formatSessionLabel, hydrateAttachmentsFromMetadata, isSessionMessagesFetching, isSessionMessagesLoading, messagesData, sessionId]);

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

  // ----- Multi-step analysis (W8) -----
  //
  // We derive an `activeAnalysis` snapshot from the most recent analytics
  // message. When the user asks a follow-up question, we attach this snapshot
  // to `context.activeAnalysis` so the backend planner can treat the prompt
  // as a refinement ("lọc chỉ còn beginner", "đổi sang biểu đồ đường", …)
  // instead of starting from scratch.
  const activeAnalysisMessage = useMemo(() => {
    // Only treat the *latest* analytics message as active — older ones would
    // confuse the planner. insightMessages is already chronological.
    if (insightMessages.length === 0) return null;
    const latest = insightMessages[insightMessages.length - 1];
    if (!latest.metadata?.queryResult && !latest.metadata?.chartSpec) return null;
    return latest;
  }, [insightMessages]);

  const activeAnalysisSnapshot = useMemo(() => {
    if (!activeAnalysisMessage) return null;
    if (dismissedRefineMessageId === activeAnalysisMessage.id) return null;
    const metadata = activeAnalysisMessage.metadata;
    if (!metadata) return null;
    const queryResult = metadata.queryResult || {};
    const chartSpec = metadata.chartSpec || {};
    const rows = Array.isArray(queryResult.rows) ? queryResult.rows : [];
    const columns = Array.isArray(queryResult.columns)
      ? (queryResult.columns as unknown[]).map((col) => String(col))
      : [];
    const overrideChart = chartTypeOverrides[activeAnalysisMessage.id];
    // Find the user prompt that produced this analytics answer.
    let sourcePrompt = "";
    const idx = messages.findIndex((m) => m.id === activeAnalysisMessage.id);
    for (let i = idx - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "user") {
        sourcePrompt = messages[i]?.content || "";
        break;
      }
    }
    const sqlRaw = String(queryResult.sql || "").trim();
    // Cap SQL length so we don't balloon the request; planner really only
    // needs a hint of the prior query shape.
    const truncatedSql = sqlRaw.length > 1200 ? `${sqlRaw.slice(0, 1200)}...` : sqlRaw;
    return {
      messageId: activeAnalysisMessage.id,
      title: String(queryResult.title || chartSpec.title || "Analysis"),
      prompt: sourcePrompt,
      metric: String(queryResult.metric || ""),
      scope: String(queryResult.scope || ""),
      scopeLabel: String(queryResult.scopeLabel || ""),
      timeRange: String(queryResult.timeRange || ""),
      chartType: String(overrideChart || chartSpec.type || queryResult.chartType || ""),
      summary: String(queryResult.summary || "").slice(0, 500),
      sql: truncatedSql,
      tables: Array.isArray(queryResult.tables)
        ? (queryResult.tables as unknown[]).map((t2) => String(t2)).slice(0, 10)
        : [],
      columns: columns.slice(0, 20),
      rowCount:
        typeof queryResult.rowCount === "number"
          ? queryResult.rowCount
          : rows.length,
      executionMode: String(queryResult.executionMode || ""),
      logicSummary: queryResult.logicSummary && typeof queryResult.logicSummary === "object"
        ? queryResult.logicSummary
        : undefined,
    };
  }, [activeAnalysisMessage, dismissedRefineMessageId, chartTypeOverrides, messages]);

  const handleDismissActiveAnalysis = useCallback(() => {
    if (!activeAnalysisMessage) return;
    setDismissedRefineMessageId(activeAnalysisMessage.id);
  }, [activeAnalysisMessage]);

  const buildRequestContext = useCallback(() => {
    const context: Record<string, any> = {
      includeProgress: true,
    };
    if (customInstructions.trim()) {
      context.instructions = customInstructions.trim();
    }
    if (attachedFiles.length > 0) {
      context.fileContexts = attachedFiles.map((file) => ({
        id: file.id,
        fileId: file.id,
        name: file.name,
        mimeType: file.mimeType,
        fileType: file.fileType,
        secureUrl: file.secureUrl,
        publicUrl: file.publicUrl,
        cloudinarySecureUrl: file.cloudinarySecureUrl,
        thumbnailUrl: file.thumbnailUrl,
        description: file.description,
      }));
    }
    if (activeAnalysisSnapshot) {
      context.activeAnalysis = activeAnalysisSnapshot;
    }
    return Object.keys(context).length > 0 ? context : undefined;
  }, [activeAnalysisSnapshot, attachedFiles, customInstructions]);

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
            fileType: payload.fileType ?? null,
            secureUrl: payload.secureUrl ?? payload.cloudinarySecureUrl ?? null,
            publicUrl: payload.publicUrl ?? payload.cloudinaryUrl ?? null,
            cloudinarySecureUrl: payload.cloudinarySecureUrl ?? null,
            thumbnailUrl: payload.thumbnailUrl ?? null,
            previewUrl:
              payload.thumbnailUrl ??
              payload.secureUrl ??
              payload.publicUrl ??
              payload.cloudinarySecureUrl ??
              payload.cloudinaryUrl ??
              null,
            description: payload.description ?? null,
            processingStatus: payload.processingStatus ?? null,
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

  const dispatchChatMessage = useCallback(
    async (
      messageText: string,
      options?: {
        displayContent?: string;
        contextOverrides?: Record<string, any>;
        skipAttachments?: boolean;
      }
    ) => {
      if (!userId) {
        toast({
          title: tCommon("error"),
          description: "Please login before chatting with AI.",
          variant: "destructive",
        });
        return;
      }
      const trimmed = (messageText || "").trim();
      if (!trimmed && (options?.skipAttachments || attachedFiles.length === 0)) {
        return;
      }

      const displayContent =
        options?.displayContent
        ?? (trimmed || `Analyse ${attachedFiles.length} attached file(s).`);

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: displayContent,
        timestamp: new Date(),
        attachments: options?.skipAttachments ? [] : attachedFiles,
      };

      setMessages((prev) => [...prev, userMessage]);
      const baseContext = options?.skipAttachments ? undefined : buildRequestContext();
      const overrideContext = options?.contextOverrides;
      let requestContext: Record<string, any> | undefined;
      if (baseContext || overrideContext) {
        requestContext = { ...(baseContext || {}), ...(overrideContext || {}) };
        if (Object.keys(requestContext).length === 0) {
          requestContext = undefined;
        }
      }

      if (!options?.skipAttachments) {
        setAttachedFiles([]);
      }
      pendingSessionLabelRef.current = formatSessionLabel(trimmed || displayContent, options?.skipAttachments ? [] : attachedFiles);

      if (useStreaming) {
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
            message: trimmed || displayContent,
            context: requestContext,
          });
        } catch (error) {
          console.error("Streaming error:", error);
        }
        return;
      }

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
          message: trimmed || displayContent,
          context: requestContext,
        });

        if (!sessionId && response.payload?.data?.sessionId) {
          const newId = response.payload.data.sessionId;
          setSessionId(newId);
          setIsDraftSession(false);
          setSessions((prev) =>
            prev.find((s) => s.id === newId) ? prev : [
              {
                id: newId,
                label: pendingSessionLabelRef.current || `${t("session")} ${prev.length + 1}`,
                startedAt: draftStartedAt,
              },
              ...prev,
            ]
          );
        }

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
          const nextMessages = [...filtered, assistantMessage];
          if (sessionId) {
            sessionMessagesCache.current.set(sessionId, nextMessages);
          }
          return nextMessages;
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, attachedFiles, useStreaming, sessionId, t, tCommon]
  );

  const exportQueryResultAsCsv = useCallback(
    (queryResult: Record<string, any> | null | undefined, fallbackTitle: string) => {
      const rows = Array.isArray(queryResult?.rows) ? (queryResult!.rows as Array<Record<string, unknown>>) : [];
      const columns = Array.isArray(queryResult?.columns) && queryResult!.columns.length
        ? (queryResult!.columns as unknown[]).map((col) => String(col))
        : rows.length > 0
          ? Object.keys(rows[0] || {})
          : [];
      if (rows.length === 0 || columns.length === 0) {
        toast({
          title: "Không có dữ liệu để xuất",
          description: "Truy vấn này chưa có bảng dữ liệu để xuất CSV.",
          variant: "destructive",
        });
        return false;
      }
      const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const csv = [
        columns.join(","),
        ...rows.map((row) => columns.map((column) => escape(row?.[column])).join(",")),
      ].join("\n");
      const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = (String(queryResult?.title || fallbackTitle || "analysis"))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "analysis";
      link.href = url;
      link.download = `${safeName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    },
    [toast]
  );

  const closeAnalysisWorkspace = useCallback(() => {
    setWorkspaceExpanded(false);
    setAnalysisPanelOpen(false);
  }, []);

  const toggleAnalysisWorkspace = useCallback(() => {
    if (analysisPanelOpen) {
      closeAnalysisWorkspace();
      return;
    }
    if (!workspaceCanFit) {
      toast({
        title: "Màn hình hơi hẹp",
        description: "Thu nhỏ sidebar hoặc mở rộng cửa sổ trình duyệt để hiển thị analysis workspace.",
      });
      return;
    }
    setAnalysisPanelOpen(true);
  }, [analysisPanelOpen, closeAnalysisWorkspace, toast, workspaceCanFit]);

  const copyQueryResultAsTable = useCallback(
    async (
      queryResult: Record<string, any> | null | undefined,
      format: "tsv" | "markdown" = "tsv"
    ) => {
      const rows = Array.isArray(queryResult?.rows)
        ? (queryResult!.rows as Array<Record<string, unknown>>)
        : [];
      const columns = Array.isArray(queryResult?.columns) && queryResult!.columns.length
        ? (queryResult!.columns as unknown[]).map((col) => String(col))
        : rows.length > 0
          ? Object.keys(rows[0] || {})
          : [];
      if (rows.length === 0 || columns.length === 0) {
        toast({
          title: "Không có bảng để sao chép",
          description: "Truy vấn này chưa có dữ liệu bảng.",
          variant: "destructive",
        });
        return false;
      }
      const asCell = (value: unknown) => {
        if (value === null || value === undefined) return "";
        if (typeof value === "object") {
          try {
            return JSON.stringify(value);
          } catch {
            return String(value);
          }
        }
        return String(value);
      };
      let payload = "";
      if (format === "markdown") {
        const headerRow = `| ${columns.join(" | ")} |`;
        const separator = `| ${columns.map(() => "---").join(" | ")} |`;
        const bodyRows = rows.map(
          (row) => `| ${columns.map((column) => asCell(row?.[column]).replace(/\|/g, "\\|")).join(" | ")} |`
        );
        payload = [headerRow, separator, ...bodyRows].join("\n");
      } else {
        const sanitize = (value: unknown) =>
          asCell(value).replace(/\t/g, " ").replace(/\r?\n/g, " ");
        payload = [
          columns.join("\t"),
          ...rows.map((row) => columns.map((column) => sanitize(row?.[column])).join("\t")),
        ].join("\n");
      }
      try {
        await navigator.clipboard.writeText(payload);
        toast({
          title: "Đã sao chép bảng",
          description:
            format === "markdown"
              ? "Bảng đã được copy dạng Markdown."
              : "Dán vào Excel/Google Sheets để sử dụng.",
        });
        return true;
      } catch {
        toast({
          title: tCommon("error"),
          description: "Không sao chép được bảng, vui lòng thử lại.",
          variant: "destructive",
        });
        return false;
      }
    },
    [toast, tCommon]
  );

  const getLiveSavedEntryForMessage = useCallback(
    (messageId: string) =>
      savedAnalyses.find((entry) => entry.sourceMessageId === messageId) || null,
    [savedAnalyses]
  );

  const getPromptForMessage = useCallback(
    (messageId: string): string => {
      const index = messages.findIndex((message) => message.id === messageId);
      for (let i = index - 1; i >= 0; i -= 1) {
        if (messages[i]?.role === "user") {
          return messages[i]?.content || "";
        }
      }
      return "";
    },
    [messages]
  );

  const handleToggleSaveAnalysis = useCallback(
    (message: Message) => {
      const existing = getLiveSavedEntryForMessage(message.id);
      if (existing) {
        setSavedAnalyses((prev) => prev.filter((entry) => entry.id !== existing.id));
        toast({
          title: "Đã bỏ lưu",
          description: "Analysis đã được gỡ khỏi danh sách saved.",
        });
        return;
      }
      const metadata = message.metadata;
      if (!metadata || (!metadata.queryResult && !metadata.chartSpec)) {
        toast({
          title: "Không có analysis để lưu",
          description: "Câu trả lời này không có bảng/biểu đồ để lưu.",
          variant: "destructive",
        });
        return;
      }
      const queryResult = metadata.queryResult;
      const chartSpec = metadata.chartSpec;
      const title = String(
        chartSpec?.title || queryResult?.title || message.content?.slice(0, 48) || "Saved analysis"
      ).trim() || "Saved analysis";
      const prompt = getPromptForMessage(message.id);
      const snapshot: Message = {
        id: message.id,
        role: "assistant",
        content: String(message.content || "").replace(/▌+$/, "").trim(),
        timestamp: new Date(message.timestamp || new Date()),
        metadata: JSON.parse(JSON.stringify(metadata)) as MessageInsightMeta,
      };
      const newEntry: SavedAnalysis = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sourceMessageId: message.id,
        title,
        prompt,
        savedAt: new Date().toISOString(),
        scopeLabel:
          (queryResult?.scopeLabel as string | undefined)
          || (queryResult?.scope as string | undefined),
        message: snapshot,
      };
      setSavedAnalyses((prev) => [newEntry, ...prev].slice(0, SAVED_ANALYSES_LIMIT));
      toast({
        title: "Đã lưu analysis",
        description:
          "Bạn có thể mở lại từ mục 'Analyses đã lưu' bên sidebar bất cứ lúc nào.",
      });
    },
    [getLiveSavedEntryForMessage, getPromptForMessage, toast]
  );

  const handleDeleteSavedAnalysis = useCallback(
    (savedId: string) => {
      setSavedAnalyses((prev) => prev.filter((entry) => entry.id !== savedId));
      setViewedSavedAnalysisId((current) => (current === savedId ? null : current));
    },
    []
  );

  const handleOpenSavedAnalysis = useCallback((savedId: string) => {
    setViewedSavedAnalysisId(savedId);
  }, []);

  const viewedSavedAnalysis = useMemo(
    () => savedAnalyses.find((entry) => entry.id === viewedSavedAnalysisId) || null,
    [savedAnalyses, viewedSavedAnalysisId]
  );

  const handleFollowUpAction = useCallback(
    async (message: Message, action: SuggestedAction) => {
      const metadata = message.metadata;
      if (!metadata) return;

      switch (action.kind) {
        case "change_chart_type": {
          const nextType = String(action.payload?.chartType || "").toLowerCase();
          if (!nextType) return;
          setChartTypeOverrides((prev) => ({ ...prev, [message.id]: nextType }));
          setSelectedInsightMessageId(message.id);
          setAnalysisTab("chart");
          setAnalysisPanelOpen(true);
          lastUserWorkspaceSelectionRef.current = message.id;
          setActionFeedback((prev) => ({ ...prev, [`${message.id}:${action.id}`]: "done" }));
          setTimeout(() => {
            setActionFeedback((prev) => {
              const next = { ...prev };
              delete next[`${message.id}:${action.id}`];
              return next;
            });
          }, 1800);
          toast({
            title: "Đã đổi kiểu biểu đồ",
            description: `Đang hiển thị dưới dạng ${nextType}.`,
          });
          return;
        }
        case "export_csv": {
          const ok = exportQueryResultAsCsv(metadata.queryResult, action.label || "analysis");
          if (ok) {
            toast({ title: "Đã xuất CSV", description: "File đang được tải xuống." });
          }
          return;
        }
        case "copy_sql": {
          const sql = String(metadata.queryResult?.sql || "").trim();
          if (!sql) {
            toast({
              title: "Không có SQL để sao chép",
              description: "Truy vấn này không kèm câu SQL.",
              variant: "destructive",
            });
            return;
          }
          try {
            await navigator.clipboard.writeText(sql);
            setActionFeedback((prev) => ({ ...prev, [`${message.id}:${action.id}`]: "done" }));
            setTimeout(() => {
              setActionFeedback((prev) => {
                const next = { ...prev };
                delete next[`${message.id}:${action.id}`];
                return next;
              });
            }, 1800);
            toast({ title: "Đã sao chép SQL", description: "SQL đã được copy vào clipboard." });
          } catch {
            toast({
              title: tCommon("error"),
              description: "Không sao chép được SQL, vui lòng thử lại.",
              variant: "destructive",
            });
          }
          return;
        }
        case "prompt":
        case "refine_filter": {
          const promptText = String(action.prompt || action.label || "").trim();
          if (!promptText) return;
          await dispatchChatMessage(promptText, {
            displayContent: action.label || promptText,
            contextOverrides: {
              followUp: {
                actionId: action.id,
                originMessageId: message.id,
                kind: action.kind,
              },
            },
            skipAttachments: true,
          });
          return;
        }
        default:
          return;
      }
    },
    [dispatchChatMessage, exportQueryResultAsCsv, tCommon, toast]
  );

  const sendComposerMessage = useCallback(async () => {
    if (!inputMessage.trim() && attachedFiles.length === 0) return;
    if (!userId) {
      toast({
        title: tCommon("error"),
        description: "Please login before chatting with AI.",
        variant: "destructive",
      });
      return;
    }
    const messageToSend = inputMessage;
    setInputMessage("");
    await dispatchChatMessage(messageToSend);
  }, [attachedFiles.length, dispatchChatMessage, inputMessage, tCommon, toast, userId]);

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
      attachments: attachedFiles,
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
          setIsDraftSession(false);
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

    if (isDraftSession) {
      return;
    }

    setIsDraftSession(true);
    setDraftStartedAt(new Date().toISOString());
    setSessionId(null);
    setMessages([]);
    setAttachedFiles([]);
    setInputMessage("");
    setSelectedInsightMessageId(null);
    setLoadingSessionId(null);
    setDismissedRefineMessageId(null);
    draftStateRef.current = {
      messages: [],
      inputMessage: "",
      attachedFiles: [],
      selectedInsightMessageId: null,
    };
    toast({
      title: t("newSession"),
      description: t("newSessionCreated"),
    });
  };

  const handleSelectSession = (id: string) => {
    if (id === DRAFT_SESSION_ID) {
      setIsDraftSession(true);
      setSessionId(null);
      setLoadingSessionId(null);
      setMessages(draftStateRef.current.messages);
      setInputMessage(draftStateRef.current.inputMessage);
      setAttachedFiles(draftStateRef.current.attachedFiles);
      setSelectedInsightMessageId(draftStateRef.current.selectedInsightMessageId);
      return;
    }
    if (isDraftSession) {
      draftStateRef.current = {
        messages,
        inputMessage,
        attachedFiles,
        selectedInsightMessageId,
      };
    }
    setIsDraftSession(false);
    setSessionId(id);
    setSelectedInsightMessageId(null);
    const cachedMessages = sessionMessagesCache.current.get(id);
    if (cachedMessages) {
      setMessages(cachedMessages);
      setLoadingSessionId(id);
      return;
    }
    setLoadingSessionId(id);
  };

  const handleDeleteSession = async (sessionIdToDelete: string) => {
    if (!userId) return;

    if (sessionIdToDelete === DRAFT_SESSION_ID) {
      setIsDraftSession(true);
      setDraftStartedAt(new Date().toISOString());
      setSessionId(null);
      setMessages([]);
      setInputMessage("");
      setAttachedFiles([]);
      setSelectedInsightMessageId(null);
      setLoadingSessionId(null);
      draftStateRef.current = {
        messages: [],
        inputMessage: "",
        attachedFiles: [],
        selectedInsightMessageId: null,
      };
      return;
    }

    // Optimistic UI: remove from local state immediately so the sidebar
    // updates without waiting on the network round-trip. If the delete call
    // fails we restore the session in the catch block.
    const previousSessions = sessions;
    const wasActive = sessionIdToDelete === sessionId;
    setSessions((prev) => prev.filter((s) => s.id !== sessionIdToDelete));
    sessionLabelsCache.current.delete(sessionIdToDelete);
    sessionMessagesCache.current.delete(sessionIdToDelete);
    if (wasActive) {
      setIsDraftSession(true);
      setDraftStartedAt(new Date().toISOString());
      setSessionId(null);
      setMessages([]);
      setAttachedFiles([]);
      setInputMessage("");
      setSelectedInsightMessageId(null);
      setLoadingSessionId(null);
      draftStateRef.current = {
        messages: [],
        inputMessage: "",
        attachedFiles: [],
        selectedInsightMessageId: null,
      };
    }

    try {
      await deleteSessionMutation.mutateAsync({
        sessionId: sessionIdToDelete,
        userId,
      });
      toast({
        title: t("sessionDeleted") || "Session deleted",
        description: t("sessionDeletedSuccess") || "Session has been deleted successfully",
      });
    } catch (error: unknown) {
      // Rollback optimistic update
      setSessions(previousSessions);
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

  const renderMessageAgentSteps = (
    message: Message,
    options?: { isStreaming?: boolean }
  ) => {
    const metadata = message.metadata;
    if (!metadata) {
      return null;
    }
    const trace = Array.isArray(metadata.trace) ? metadata.trace : [];
    const nodeTimings = metadata && typeof metadata === "object" && "nodeTimings" in metadata && metadata.nodeTimings
      ? Object.entries(metadata.nodeTimings as Record<string, number>)
      : [];
    const hasAgentSteps = !!metadata.thinkingText || trace.length > 0 || nodeTimings.length > 0;
    if (!hasAgentSteps) {
      return null;
    }
    return (
      <div className="mb-4">
        <AgentStepsPanel
          trace={trace}
          nodeTimings={nodeTimings}
          thinkingText={metadata.thinkingText}
          isStreaming={!!options?.isStreaming}
        />
      </div>
    );
  };

  const renderMessageInsights = (
    message: Message,
    options?: { isStreaming?: boolean; isSelected?: boolean }
  ) => {
    const metadata = message.metadata;
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
      !!metadata.thinkingText ||
      trace.length > 0 ||
      nodeTimings.length > 0 ||
      !!(metadata as any)?.tokensUsed ||
      !!(metadata as any)?.requestId;
    const canOpenWorkspace = hasWorkspaceContent(metadata);

    if (!hasInsights) {
      return null;
    }

    return (
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
          {metadata.resolvedMode && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800">
              {metadata.resolvedMode}
            </span>
          )}
          {metadata.intent && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800">
              {metadata.intent}
            </span>
          )}
          {(metadata as any)?.tokensUsed ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800">
              {String((metadata as any).tokensUsed)} tokens
            </span>
          ) : null}
          {typeof metadata.confidence === "number" && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-800">
              {(metadata.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>

        {canOpenWorkspace ? (
          <button
            type="button"
            onClick={() => {
              setSelectedInsightMessageId(message.id);
              setAnalysisPanelOpen(true);
            }}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left transition-all duration-200",
              options?.isSelected
                ? "border-blue-300 bg-blue-50/80 shadow-sm shadow-blue-500/10 dark:border-blue-700 dark:bg-blue-950/30"
                : "border-slate-200 bg-white/90 hover:border-slate-300 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900/70 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                <BarChart3 className="h-3.5 w-3.5" />
                Analysis Workspace
                {options?.isSelected ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Active
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Open table, chart, SQL, and sources in the side workspace.
              </p>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
          </button>
        ) : null}

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

        {(() => {
          const followUps = getFollowUpActionsForMessage(message);
          if (!followUps.length) return null;
          return (
            <FollowUpActions
              message={message}
              actions={followUps}
              compact
              feedback={actionFeedback}
              onDispatch={handleFollowUpAction}
              disabled={isStreaming}
            />
          );
        })()}
      </div>
    );
  };

  // Group sessions by date
  const groupSessionsByDate = (items: Array<{ id: string; label: string; startedAt: string }>) => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const grouped: { today: typeof items; lastWeek: typeof items; older: typeof items } = {
      today: [],
      lastWeek: [],
      older: [],
    };
    
    items.forEach((session) => {
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
    if (!userId) return;
    if (sessions.length === 0) {
      setIsDraftSession(true);
      setDraftStartedAt(new Date().toISOString());
      setSessionId(null);
      setMessages([]);
      setInputMessage("");
      setAttachedFiles([]);
      setSelectedInsightMessageId(null);
      draftStateRef.current = {
        messages: [],
        inputMessage: "",
        attachedFiles: [],
        selectedInsightMessageId: null,
      };
      return;
    }

    // Optimistic UI: clear sidebar immediately so users don't sit on a
    // spinner while we fan out the delete calls in parallel. If any call
    // fails we toast and re-fetch the authoritative list from the server.
    const previousSessions = sessions;
    const toDelete = sessions.map((s) => s.id);
    setSessions([]);
    setIsDraftSession(true);
    setDraftStartedAt(new Date().toISOString());
    setSessionId(null);
    setMessages([]);
    setInputMessage("");
    setAttachedFiles([]);
    setSelectedInsightMessageId(null);
    setLoadingSessionId(null);
    draftStateRef.current = {
      messages: [],
      inputMessage: "",
      attachedFiles: [],
      selectedInsightMessageId: null,
    };
    toDelete.forEach((id) => sessionLabelsCache.current.delete(id));
    toDelete.forEach((id) => sessionMessagesCache.current.delete(id));

    const results = await Promise.allSettled(
      toDelete.map((sessionIdToDelete) =>
        deleteSessionMutation.mutateAsync({ sessionId: sessionIdToDelete, userId })
      )
    );

    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      // Some deletes failed — restore the UI from the cached previous list
      // minus the ones that *did* succeed, then surface the error. The
      // next query invalidation will reconcile with the server.
      const failedIds = new Set<string>(
        results
          .map((r, index) => (r.status === "rejected" ? toDelete[index] : null))
          .filter((id): id is string => !!id)
      );
      setSessions(previousSessions.filter((s) => failedIds.has(s.id)));
      toast({
        title: tCommon("error"),
        description:
          failures.length === toDelete.length
            ? t("errorDelete") || "Không xóa được các phiên, vui lòng thử lại."
            : `${toDelete.length - failures.length}/${toDelete.length} phiên đã được xóa. Còn lại không xóa được.`,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: t("sessionDeleted") || "Session deleted",
      description: `${toDelete.length} phiên đã được xóa.`,
    });
  };

  const sessionsWithDraft = useMemo(() => {
    if (!isDraftSession) {
      return sessions;
    }
    const firstDraftMessage = messages.find((message) => message.role === "user");
    const draftLabel =
      inputMessage.trim()
        || (attachedFiles.length > 0 ? `Nháp mới (${attachedFiles.length} file)` : "")
        || (messages.find((message) => message.role === "user")?.content ?? "")
        || "Nháp mới";
    const draftLabelResolved = formatSessionLabel(
      inputMessage.trim() || firstDraftMessage?.content || "",
      attachedFiles.length > 0 ? attachedFiles : firstDraftMessage?.attachments
    );
    return [
      {
        id: DRAFT_SESSION_ID,
        label: draftLabelResolved || draftLabel,
        startedAt: draftStartedAt,
      },
      ...sessions,
    ];
  }, [attachedFiles, draftStartedAt, formatSessionLabel, inputMessage, isDraftSession, messages, sessions]);

  const groupedSessions = groupSessionsByDate(sessionsWithDraft);
  const isSessionTransitioning = Boolean(sessionId && loadingSessionId === sessionId && (isSessionMessagesLoading || isSessionMessagesFetching));

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-neutral-950 relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        style={{ ['--sidebar-w' as any]: `${effectiveSidebarWidth}px` }}
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-[300px] max-w-[85vw] lg:max-w-none lg:w-[var(--sidebar-w)]
          bg-slate-50/70 dark:bg-neutral-900/60 backdrop-blur-sm
          border-r border-slate-200/80 dark:border-neutral-800
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:transform-none lg:transition-[width] lg:duration-200
        `}>
        {/* Sidebar Header: brand + collapse toggle */}
        <div className="flex items-center justify-between px-3 h-12 border-b border-slate-200/70 dark:border-neutral-800/70">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <Image
                  src="/ai/TechHub_Logo.png"
                  alt="Techhub AI"
                  width={28}
                  height={28}
                  className="object-cover rounded-lg"
                />
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                {t("headerTitle") || "Techhub AI"}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden lg:inline-flex text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="px-2 pt-3">
          <Button
            onClick={() => {
              handleNewSession();
              setSidebarOpen(false);
            }}
            disabled={!userId}
            title={t("newSession") || "New chat"}
            id="ai-new-chat-button"
            className={`w-full h-9 gap-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-slate-100 dark:border-neutral-700 ${sidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm">{t("newSession") || "New chat"}</span>}
          </Button>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Settings & Guide */}
            <div className="px-2 pt-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start h-8 px-2 text-slate-600 dark:text-slate-300 text-xs"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-3.5 w-3.5 mr-2" />
                  {t("settings") || "Settings"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-blue-600"
                  onClick={handleStartTour}
                  title={t("guide") || "Hướng dẫn"}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>

              {showSettings && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white/70 dark:border-neutral-800 dark:bg-neutral-900/60 p-3 space-y-2.5" id="ai-mode-selector">
                  <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/80 p-2.5 dark:border-blue-900/60 dark:bg-blue-950/30">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                        Auto routing
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-blue-700/80 dark:text-blue-300/80">
                      AI sẽ tự chọn cách xử lý phù hợp cho câu hỏi của bạn.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="custom-instructions" className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      Instructions
                    </Label>
                    <Textarea
                      id="custom-instructions"
                      value={customInstructions}
                      onChange={(event) => setCustomInstructions(event.target.value)}
                      placeholder="Ví dụ: Trả lời bằng tiếng Việt, ưu tiên ngắn gọn, nêu rõ giả định khi phân tích dữ liệu."
                      rows={4}
                      className="min-h-[92px] rounded-xl border-slate-200 bg-white/90 text-xs leading-6 dark:border-neutral-800 dark:bg-neutral-950/70"
                    />
                    <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                      Hướng dẫn này sẽ được áp dụng cho các câu trả lời tiếp theo của AI trong cuộc trò chuyện này.
                    </p>
                  </div>
                  <div className="hidden space-y-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="assistant-perspective" className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        Vai trò trả lời
                      </Label>
                      <Select
                        value={assistantPerspective}
                        onValueChange={(value: "learner" | "instructor" | "analyst") => setAssistantPerspective(value)}
                      >
                        <SelectTrigger id="assistant-perspective" className="h-9 rounded-xl border-slate-200 bg-white/90 text-xs dark:border-neutral-800 dark:bg-neutral-950/70">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="learner">Người học</SelectItem>
                          <SelectItem value="instructor">Giảng viên</SelectItem>
                          <SelectItem value="analyst">Phân tích dữ liệu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="response-depth" className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        Mức độ chi tiết
                      </Label>
                      <Select
                        value={responseDepth}
                        onValueChange={(value: "concise" | "balanced" | "detailed") => setResponseDepth(value)}
                      >
                        <SelectTrigger id="response-depth" className="h-9 rounded-xl border-slate-200 bg-white/90 text-xs dark:border-neutral-800 dark:bg-neutral-950/70">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="concise">Ngắn gọn</SelectItem>
                          <SelectItem value="balanced">Cân bằng</SelectItem>
                          <SelectItem value="detailed">Chuyên sâu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <label htmlFor="use-progress-sidebar" className="hidden">
                    <Checkbox
                      id="use-progress-sidebar"
                      checked={useProgress}
                      onCheckedChange={(checked: boolean | "indeterminate") => setUseProgress(checked === true)}
                      className="h-3.5 w-3.5"
                    />
                    <span>{t("useMyProgress")}</span>
                  </label>
                  <label htmlFor="use-streaming-sidebar" className="hidden">
                    <Checkbox
                      id="use-streaming-sidebar"
                      checked={useStreaming}
                      onCheckedChange={(checked: boolean | "indeterminate") => setUseStreaming(checked === true)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="flex items-center gap-1">
                      ⚡ Streaming
                      {isStreaming && <Loader2 className="h-3 w-3 animate-spin" />}
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Conversations Header (collapsible like Claude's Recents) */}
            <div className="px-2 pt-4 pb-1 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRecentsOpen((o) => !o)}
                className="flex-1 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                title={recentsOpen ? "Ẩn cuộc trò chuyện" : "Hiện cuộc trò chuyện"}
              >
                {recentsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <span>{t("yourConversations") || "Your conversations"}</span>
              </button>
              {recentsOpen && sessions.length > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-[11px] text-blue-600 hover:text-blue-700 p-0 h-auto pr-2"
                  onClick={handleClearAll}
                >
                  {t("clearAll") || "Clear All"}
                </Button>
              )}
            </div>

            {/* Session List */}
            {recentsOpen && (
            <ScrollArea className="flex-1 px-2" id="ai-session-list">
              <div className="space-y-0.5 pb-2">
                {groupedSessions.today.length > 0 && (
                  <>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 px-2 py-1.5 font-medium">{t("today") || "Today"}</p>
                    {groupedSessions.today.map((session) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isActive={session.id === DRAFT_SESSION_ID ? isDraftSession : sessionId === session.id}
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
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 px-2 py-1.5 mt-2 font-medium">{t("lastDays") || "Last 7 Days"}</p>
                    {groupedSessions.lastWeek.map((session) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isActive={session.id === DRAFT_SESSION_ID ? isDraftSession : sessionId === session.id}
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
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 px-2 py-1.5 mt-2 font-medium">{t("older") || "Older"}</p>
                    {groupedSessions.older.map((session) => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isActive={session.id === DRAFT_SESSION_ID ? isDraftSession : sessionId === session.id}
                        onSelect={() => {
                          handleSelectSession(session.id);
                          setSidebarOpen(false);
                        }}
                        onDelete={() => handleDeleteSession(session.id)}
                      />
                    ))}
                  </>
                )}

                {(isSessionsLoading || (isSessionsFetching && sessions.length === 0)) && (
                  <div className="space-y-2 px-2 py-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`session-skeleton-${index}`}
                        className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-neutral-800"
                      />
                    ))}
                  </div>
                )}

                {sessions.length === 0 && !isSessionsLoading && !isSessionsFetching && (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    {t("noConversations") || "No conversations yet"}
                  </div>
                )}
              </div>
            </ScrollArea>
            )}
            {/* Spacer so footer stays at bottom when Recents is collapsed */}
            {!recentsOpen && savedAnalyses.length === 0 && <div className="flex-1" />}

            {/* Saved analyses section (persisted locally) */}
            {savedAnalyses.length > 0 && (
              <div className="mt-2 flex flex-col">
                <div className="px-2 pt-1 pb-1 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSavedSectionOpen((o) => !o)}
                    className="flex-1 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                    title={savedSectionOpen ? "Ẩn analyses đã lưu" : "Hiện analyses đã lưu"}
                  >
                    {savedSectionOpen ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <span className="flex-1 text-left">Analyses đã lưu</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {savedAnalyses.length}
                    </Badge>
                  </button>
                </div>
                {savedSectionOpen && (
                  <div className="px-2 pb-3 max-h-[32vh] overflow-y-auto">
                    <div className="space-y-0.5">
                      {savedAnalyses.map((saved) => (
                        <SavedAnalysisItem
                          key={saved.id}
                          saved={saved}
                          isActive={viewedSavedAnalysisId === saved.id}
                          onSelect={() => handleOpenSavedAnalysis(saved.id)}
                          onDelete={() => handleDeleteSavedAnalysis(saved.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* When the sidebar is collapsed we only show the new-chat button and
            the avatar; no repetitive session icon rail. */}
        {sidebarCollapsed && <div className="flex-1" />}

        {/* User Profile (display only, no navigation) */}
        <div className="border-t border-slate-200/70 dark:border-neutral-800/70 p-2">
          <div className={`flex items-center gap-2 p-2 rounded-lg ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage
                src={userProfile?.avatar || "/avatars/default.png"}
                alt={userProfile?.fullName || userProfile?.username || "User"}
              />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                {(userProfile?.fullName || userProfile?.username || "U")
                  .substring(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                  {userProfile?.fullName || userProfile?.username || t("guest") || "Guest"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {userProfile?.email || ""}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Resize handle (desktop only) */}
        {!sidebarCollapsed && (
          <div
            onMouseDown={startResize}
            className="hidden lg:block absolute top-0 right-0 h-full w-1.5 cursor-col-resize group z-10"
            title="Kéo để đổi kích thước"
          >
            <div className="h-full w-px mx-auto bg-transparent group-hover:bg-blue-500/50 group-active:bg-blue-500 transition-colors" />
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-white dark:bg-neutral-950 min-w-0">
        {/* Top Header */}
        <header className="flex items-center justify-between px-3 sm:px-4 h-12 border-b border-slate-200/70 dark:border-neutral-800/70 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile sidebar open */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden text-slate-600"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            {/* Desktop expand when collapsed */}
            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hidden lg:inline-flex text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                onClick={() => setSidebarCollapsed(false)}
                title="Expand sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {t("headerTitle") || "Techhub AI"}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 rounded-full px-2 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-neutral-800 dark:hover:text-slate-100 sm:px-3",
                !workspaceCanFit ? "opacity-50 cursor-not-allowed" : ""
              )}
              onClick={toggleAnalysisWorkspace}
              /*
                    title: "Màn hình hơi hẹp",
                    description: "Thu nhỏ sidebar hoặc mở rộng cửa sổ trình duyệt để hiển thị analysis workspace.",
                  });
                  return;
                }
                setAnalysisPanelOpen((current) => !current);
              }}
              */
              title={
                !workspaceCanFit
                  ? "Workspace ẩn vì màn hình quá hẹp — phóng to cửa sổ hoặc thu nhỏ sidebar"
                  : workspaceRendered
                    ? "Hide analysis workspace"
                    : "Open analysis workspace"
              }
            >
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">{workspaceRendered ? "Hide workspace" : "Open workspace"}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden text-slate-600"
              onClick={handleNewSession}
              disabled={!userId}
              title={t("newSession") || "New chat"}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Auth Check Banner */}
        {!userId && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 sm:px-6 py-2.5">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-amber-800 dark:text-amber-300 text-xs">
                  {t("authRequired") || "Login Required"}
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 hidden sm:block">
                  {t("authRequiredDesc") || "Please login to use AI chat feature and save your chat history"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1 min-h-0">
        <section className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col border-b border-slate-200/70 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_32%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.98))] dark:border-neutral-800/70 dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(180deg,rgba(10,15,27,0.96),rgba(2,6,23,0.98))] lg:min-w-[360px]",
          analysisPanelOpen ? "lg:border-b-0" : "lg:border-b-0"
        )}>
        {/* Chat Messages Area */}
        <ScrollArea className="flex-1 px-4 py-6 sm:px-6" ref={scrollAreaRef}>
          <div className="mx-auto w-full max-w-4xl space-y-8">
            {isSessionTransitioning && messages.length > 0 ? (
              <div className="sticky top-0 z-10 flex items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-slate-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading conversation...
                </div>
              </div>
            ) : null}
            {isSessionTransitioning && messages.length === 0 ? (
              <div className="flex min-h-[55vh] flex-col justify-center px-4">
                <div className="mx-auto w-full max-w-3xl space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`message-skeleton-${index}`}
                      className={cn(
                        "animate-pulse rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70",
                        index % 2 === 0 ? "mr-16" : "ml-16"
                      )}
                    >
                      <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-neutral-800" />
                      <div className="mt-4 space-y-2">
                        <div className="h-3 rounded-full bg-slate-200 dark:bg-neutral-800" />
                        <div className="h-3 w-5/6 rounded-full bg-slate-200 dark:bg-neutral-800" />
                        <div className="h-3 w-2/3 rounded-full bg-slate-200 dark:bg-neutral-800" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center" id="ai-chat-welcome">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700 shadow-sm dark:border-blue-800/60 dark:bg-blue-950/30 dark:text-blue-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Analyst Workspace
                </div>
                <div className="mt-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[22px] bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600 shadow-xl shadow-blue-500/20">
                  <Image
                    src="/ai/TechHub_Logo.png"
                    alt="Techhub AI"
                    width={64}
                    height={64}
                    className="object-cover rounded-2xl"
                    priority
                  />
                </div>
                <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                  {t("welcomeTitle") || "How can I help you today?"}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400 sm:text-base">
                  Ask for answers, charts, tables, SQL-safe analytics, or file analysis. The analysis workspace keeps the structure visible while the conversation stays clean.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isSelectedInsight = selectedInsightMessageId === message.id;
                const canSelectWorkspace = message.role === "assistant" && hasWorkspaceContent(message.metadata);

                return (
                <div key={message.id} className="space-y-3">
                  {/* User Message */}
                  {message.role === "user" && (
                    <div className="flex justify-end">
                      <div className="max-w-[90%] sm:max-w-[78%]">
                        <div className="rounded-[26px] rounded-tr-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm leading-7 text-white shadow-lg shadow-blue-500/20">
                          {message.attachments && message.attachments.length > 0 ? (
                            <div className="mb-3 flex flex-wrap justify-end gap-2">
                              {message.attachments.map((file) => (
                                <div
                                  key={`${message.id}-${file.id}`}
                                  className="inline-flex max-w-[240px] items-center gap-2 rounded-2xl bg-white/14 px-3 py-2 text-left"
                                >
                                  <FileText className="h-3.5 w-3.5 flex-shrink-0 text-white/80" />
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-medium text-white">
                                      {file.name}
                                    </div>
                                    <div className="truncate text-[10px] text-white/70">
                                      {file.mimeType || file.fileType || "File đính kèm"}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          <p className="whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assistant Message */}
                  {message.role === "assistant" && (
                    <div className="group flex items-start gap-4">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-700 to-cyan-500 shadow-lg shadow-blue-500/15 dark:from-blue-400 dark:via-cyan-500 dark:to-slate-100">
                        <Image
                          src="/ai/TechHub_Logo.png"
                          alt="Techhub AI"
                          width={36}
                          height={36}
                          className="rounded-2xl object-cover"
                          priority
                        />
                      </div>
                      <div
                        className={cn(
                          "min-w-0 flex-1 rounded-[30px] border bg-white/92 p-5 shadow-sm transition-all duration-200 dark:bg-slate-950/75",
                          "border-slate-200/80 dark:border-neutral-800",
                          isSelectedInsight
                            ? "border-blue-300 shadow-xl shadow-blue-500/10 ring-1 ring-blue-200 dark:border-blue-700 dark:ring-blue-900/50"
                            : null
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                              {t("headerTitle") || "Techhub AI"}
                            </div>
                            <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                              {canSelectWorkspace ? "Analysis-ready response" : "Assistant response"}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {message.metadata?.queryResult ? (
                              <ScopeBadge queryResult={message.metadata.queryResult} tone="prominent" />
                            ) : null}
                            {canSelectWorkspace ? (
                              <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px]">
                                {isSelectedInsight ? "Workspace active" : "Open in workspace"}
                              </Badge>
                            ) : null}
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          </div>
                        </div>
                        <div className="mt-4 text-sm leading-7 text-slate-800 dark:text-slate-100">
                          {renderMessageAgentSteps(message, {
                            isStreaming: message.id === streamingAssistantId,
                          })}
                          {message.content === "..." ? (
                            <div className="flex gap-1 py-1">
                              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                            </div>
                          ) : message.id === streamingAssistantId ? (
                            message.content === "▌" || message.content === "" ? (
                              message.metadata?.thinkingText ? null : <ThinkingIndicator />
                            ) : (
                              <div>
                                <MarkdownRenderer content={message.content.replace(/▌+$/, "")} />
                                <span className="animate-pulse text-blue-500 ml-0.5">▌</span>
                              </div>
                            )
                          ) : (
                            <MarkdownRenderer content={message.content} />
                          )}
                        </div>
                        {renderMessageInsights(message, {
                          isStreaming: message.id === streamingAssistantId,
                          isSelected: isSelectedInsight,
                        })}
                        {/* HITL Clarify Quick Reply Buttons */}
                        {message.metadata?.hitlClarifyActive &&
                          message.metadata?.hitlOptions &&
                          message.metadata.hitlOptions.length > 0 &&
                          !hitlRepliedMessageIds.has(message.id) && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {message.metadata.hitlOptions.map((option, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="rounded-full border-blue-300 text-xs text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950"
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
                          <div className="mt-3 text-xs text-slate-400 italic">
                            Đã chọn phương án làm rõ.
                          </div>
                        )}
                        {message.id !== "typing" && message.id !== streamingAssistantId && (
                          <div className="mt-4 flex flex-wrap items-center gap-1 opacity-70 transition-opacity duration-200 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 w-8 rounded-full p-0 ${feedbackState[message.id] === "up" ? "text-green-500" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
                              onClick={() => handleFeedback(message.id, "up")}
                              disabled={!!feedbackState[message.id]}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 w-8 rounded-full p-0 ${feedbackState[message.id] === "down" ? "text-red-500" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
                              onClick={() => handleFeedback(message.id, "down")}
                              disabled={!!feedbackState[message.id]}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 rounded-full p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                            >
                              {copiedMessageId === message.id ? (
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-full px-3 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              onClick={() => handleRegenerate(message.id)}
                              disabled={isStreaming}
                            >
                              <RotateCcw className="mr-1.5 h-3 w-3" />
                              <span>{t("regenerate") || "Regenerate"}</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )})
            )}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-slate-200/70 bg-white/70 px-4 pb-4 pt-3 backdrop-blur-xl dark:border-neutral-800/70 dark:bg-slate-950/50 sm:px-6">
          <div className="mx-auto w-full max-w-4xl">
            {attachedFiles.length > 0 && (
              <div className="hidden">
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file) => (
                    <Badge key={file.id} variant="outline" className="gap-2 px-3 py-1 bg-slate-50 dark:bg-neutral-900">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="max-w-[180px] truncate">{file.name}</span>
                      <button type="button" onClick={() => removeAttachedFile(file.id)} className="hover:text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {attachedFiles.map((file) => {
                    const previewUrl = file.previewUrl || file.thumbnailUrl || file.secureUrl || file.publicUrl || file.cloudinarySecureUrl;
                    const isImage = file.mimeType?.startsWith("image/") || file.fileType === "IMAGE";
                    const isVideo = file.mimeType?.startsWith("video/") || file.fileType === "VIDEO";
                    return (
                      <div
                        key={`${file.id}-preview`}
                        className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/80"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                              {file.name}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              {file.mimeType || file.fileType || "Unknown file"}
                            </div>
                            {file.processingStatus && (
                              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                Status: {file.processingStatus}
                              </div>
                            )}
                          </div>
                          {previewUrl && (
                            <a
                              href={previewUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open
                            </a>
                          )}
                        </div>
                        {previewUrl && isImage && (
                          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 dark:border-neutral-800">
                            <img src={previewUrl} alt={file.name} className="h-32 w-full object-cover" />
                          </div>
                        )}
                        {previewUrl && isVideo && (
                          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 dark:border-neutral-800">
                            <video src={previewUrl} controls className="h-32 w-full object-cover" />
                          </div>
                        )}
                        {!isImage && !isVideo && (
                          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-neutral-800 dark:text-slate-400">
                            File đã được gắn vào cuộc trò chuyện. AI sẽ đọc nội dung hoặc metadata của file này khi bạn gửi tin nhắn.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {attachedFiles.length > 0 && (
              <div className="mb-3 overflow-x-auto pb-1">
                <div className="flex min-w-max gap-2 pr-1">
                  {attachedFiles.map((file) => {
                    const previewUrl = file.previewUrl || file.thumbnailUrl || file.secureUrl || file.publicUrl || file.cloudinarySecureUrl;
                    const isImage = file.mimeType?.startsWith("image/") || file.fileType === "IMAGE";
                    const isVideo = file.mimeType?.startsWith("video/") || file.fileType === "VIDEO";
                    return (
                      <div
                        key={`claude-style-${file.id}`}
                        className="group relative flex w-[220px] items-center gap-3 rounded-2xl border border-slate-200 bg-white/92 p-2.5 shadow-sm transition-colors hover:border-slate-300 dark:border-neutral-800 dark:bg-neutral-900/85 dark:hover:border-neutral-700"
                      >
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-neutral-800 dark:bg-neutral-800">
                          {previewUrl && isImage ? (
                            <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />
                          ) : previewUrl && isVideo ? (
                            <video src={previewUrl} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-500 dark:text-slate-300">
                              <FileText className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                            {file.name}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {file.mimeType || file.fileType || "File đính kèm"}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                            <span>{file.processingStatus || "Ready"}</span>
                            {previewUrl ? (
                              <a
                                href={previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Open
                              </a>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachedFile(file.id)}
                          className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm transition-colors hover:text-red-500 dark:bg-neutral-900/90"
                          title="Gỡ file"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleAttachFiles}
            />
            {activeAnalysisSnapshot ? (
              <div className="mb-2 flex flex-wrap items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs dark:border-blue-800/60 dark:bg-blue-950/30">
                <span className="inline-flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Đang tinh chỉnh
                </span>
                <span
                  className="max-w-[240px] truncate text-slate-700 dark:text-slate-200"
                  title={activeAnalysisSnapshot.title}
                >
                  {activeAnalysisSnapshot.title}
                </span>
                {activeAnalysisSnapshot.scopeLabel ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-blue-200 bg-white px-2 py-0 text-[10px] text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/60 dark:text-blue-200"
                  >
                    {activeAnalysisSnapshot.scopeLabel}
                  </Badge>
                ) : null}
                {activeAnalysisSnapshot.chartType ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-slate-200 bg-white px-2 py-0 text-[10px] text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-300"
                  >
                    {activeAnalysisSnapshot.chartType}
                  </Badge>
                ) : null}
                <span className="ml-auto flex items-center gap-1">
                  <span className="hidden text-[11px] text-slate-500 dark:text-slate-400 sm:inline">
                    Câu hỏi tiếp theo sẽ tinh chỉnh analysis này
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full text-slate-500 hover:bg-blue-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-blue-900/40 dark:hover:text-slate-200"
                    onClick={handleDismissActiveAnalysis}
                    title="Hỏi chủ đề mới (bỏ tinh chỉnh)"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </span>
              </div>
            ) : null}
            <div
              className="relative overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950 px-3 py-2 shadow-[0_18px_40px_rgba(2,6,23,0.28)] transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10"
              id="ai-chat-input"
            >
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 flex-shrink-0 rounded-full text-slate-400 hover:bg-white/5 hover:text-white"
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
                <div className="min-w-0 flex-1">
                  {attachedFiles.length > 0 ? (
                    <div className="mb-1.5 text-[11px] text-slate-500">
                      {attachedFiles.length} file đính kèm đã sẵn sàng để AI phân tích
                    </div>
                  ) : null}
                  <Textarea
                    placeholder="Bạn đang nghĩ gì?..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendComposerMessage();
                      }
                    }}
                    rows={1}
                    className="min-h-[48px] max-h-40 resize-none border-none bg-transparent px-0 py-2 text-sm leading-6 text-white shadow-none focus-visible:ring-0 placeholder:text-slate-500 dark:placeholder:text-slate-500"
                  />
                </div>
                <Button
                  onClick={sendComposerMessage}
                  disabled={
                    (!inputMessage.trim() && attachedFiles.length === 0) ||
                    chatMutation.isPending ||
                    isStreaming ||
                    !userId ||
                    uploadFileMutation.isPending
                  }
                  size="icon"
                  className="h-11 w-11 flex-shrink-0 rounded-full bg-white/8 text-slate-300 hover:bg-blue-600 hover:text-white disabled:bg-white/5 disabled:text-slate-600"
                >
                  {chatMutation.isPending || isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2 hidden sm:block">
              {t("enterToSend") || "Press Enter to send, Shift + Enter for new line"}
            </p>
          </div>
        </div>
        </section>
        {workspaceRendered && (
        <>
        <div
          onMouseDown={startAnalysisResize}
          className="relative hidden w-2 cursor-col-resize bg-transparent lg:block"
          title="Drag to resize analysis workspace"
        >
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200/70 transition-colors hover:bg-blue-400 dark:bg-neutral-800" />
        </div>
        <aside
          style={{ ['--analysis-w' as any]: `${effectiveAnalysisWidth}px` }}
          className="flex min-h-[34vh] w-full min-w-0 flex-col border-t border-slate-200/70 bg-white/90 backdrop-blur-xl dark:border-neutral-800/70 dark:bg-slate-950/80 lg:min-h-0 lg:w-[var(--analysis-w)] lg:min-w-[360px] lg:max-w-[860px] lg:border-l lg:border-l-slate-200/70 lg:border-t-0 lg:dark:border-l-neutral-800/70"
        >
          <AnalysisWorkspacePanel
            message={selectedInsightMessage}
            prompt={selectedInsightPrompt}
            activeTab={analysisTab}
            onTabChange={setAnalysisTab}
            onCopySql={handleCopyMessage}
            isStreamingMessage={selectedInsightMessage?.id === streamingAssistantId}
            onClose={closeAnalysisWorkspace}
            chartTypeOverride={
              selectedInsightMessage ? chartTypeOverrides[selectedInsightMessage.id] : undefined
            }
            followUpActions={
              selectedInsightMessage
                ? getFollowUpActionsForMessage(selectedInsightMessage)
                : []
            }
            onFollowUpAction={handleFollowUpAction}
            followUpFeedback={actionFeedback}
            followUpDisabled={isStreaming}
            onExpand={
              selectedInsightMessage ? () => setWorkspaceExpanded(true) : undefined
            }
            onCopyTable={
              selectedInsightMessage
                ? (qr, format) => {
                    void copyQueryResultAsTable(qr, format);
                  }
                : undefined
            }
            onExportCsv={
              selectedInsightMessage
                ? (qr, fallbackTitle) => {
                    exportQueryResultAsCsv(qr, fallbackTitle);
                  }
                : undefined
            }
            onSave={
              selectedInsightMessage
                ? () => handleToggleSaveAnalysis(selectedInsightMessage)
                : undefined
            }
            isSaved={
              selectedInsightMessage
                ? !!getLiveSavedEntryForMessage(selectedInsightMessage.id)
                : false
            }
          />
        </aside>
        </>
        )}
        </div>
      </main>

      {/* Fullscreen analysis workspace overlay (live message) */}
      {workspaceExpanded && selectedInsightMessage ? (
        <FullscreenAnalysisView
          message={selectedInsightMessage}
          prompt={selectedInsightPrompt}
          onClose={() => setWorkspaceExpanded(false)}
          onCopySql={handleCopyMessage}
          isStreamingMessage={selectedInsightMessage.id === streamingAssistantId}
          chartTypeOverride={chartTypeOverrides[selectedInsightMessage.id]}
          followUpActions={getFollowUpActionsForMessage(selectedInsightMessage)}
          onFollowUpAction={handleFollowUpAction}
          followUpFeedback={actionFeedback}
          followUpDisabled={isStreaming}
          onCopyTable={(qr, format) => {
            void copyQueryResultAsTable(qr, format);
          }}
          onExportCsv={(qr, fallbackTitle) => {
            exportQueryResultAsCsv(qr, fallbackTitle);
          }}
          onSave={() => handleToggleSaveAnalysis(selectedInsightMessage)}
          isSaved={!!getLiveSavedEntryForMessage(selectedInsightMessage.id)}
        />
      ) : null}

      {/* Saved analysis viewer (read-only) */}
      {viewedSavedAnalysis ? (
        <FullscreenAnalysisView
          message={viewedSavedAnalysis.message}
          prompt={viewedSavedAnalysis.prompt}
          onClose={() => setViewedSavedAnalysisId(null)}
          onCopySql={handleCopyMessage}
          chartTypeOverride={chartTypeOverrides[viewedSavedAnalysis.message.id]}
          followUpActions={getFollowUpActionsForMessage(viewedSavedAnalysis.message).filter((a) =>
            ["change_chart_type", "export_csv", "copy_sql"].includes(a.kind)
          )}
          onFollowUpAction={handleFollowUpAction}
          followUpFeedback={actionFeedback}
          followUpDisabled={false}
          onCopyTable={(qr, format) => {
            void copyQueryResultAsTable(qr, format);
          }}
          onExportCsv={(qr, fallbackTitle) => {
            exportQueryResultAsCsv(qr, fallbackTitle);
          }}
          onSave={() => handleDeleteSavedAnalysis(viewedSavedAnalysis.id)}
          isSaved
          readOnly
        />
      ) : null}

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

// Claude-style shimmering "thinking" indicator
function ThinkingIndicator() {
  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <span className="relative inline-block overflow-hidden text-transparent bg-clip-text bg-[linear-gradient(110deg,#94a3b8_30%,#1e293b_50%,#94a3b8_70%)] dark:bg-[linear-gradient(110deg,#64748b_30%,#f1f5f9_50%,#64748b_70%)] bg-[length:200%_100%] animate-shimmer font-medium">
        Đang suy nghĩ…
      </span>
      <span className="flex gap-0.5 items-center">
        <span className="w-1 h-1 rounded-full bg-slate-400 animate-pulse" />
        <span className="w-1 h-1 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "0.2s" }} />
        <span className="w-1 h-1 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "0.4s" }} />
      </span>
    </div>
  );
}

// Collapsible runtime + planning-trace details
function DetailsPanel({
  requestId,
  nodeTimings,
  trace,
}: {
  requestId?: string | null;
  nodeTimings: Array<[string, number]>;
  trace: MessageTraceItem[];
}) {
  const [open, setOpen] = useState(false);
  const hasRuntime = !!requestId || nodeTimings.length > 0;
  const hasTrace = trace.length > 0;
  if (!hasRuntime && !hasTrace) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 dark:border-neutral-800 dark:bg-neutral-900/40">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-neutral-800/60 rounded-xl transition-colors"
      >
        <span className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" />
          Chi tiết xử lý
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-0 space-y-3 border-t border-slate-200/70 dark:border-neutral-800/70">
          {hasRuntime && (
            <div className="pt-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                <Activity className="h-3 w-3" /> Runtime
              </div>
              {requestId && (
                <div className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  Request ID: <span className="font-mono">{String(requestId)}</span>
                </div>
              )}
              {nodeTimings.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {nodeTimings.map(([step, duration]) => (
                    <span
                      key={step}
                      className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] bg-white border border-slate-200 text-slate-600 dark:bg-neutral-900 dark:border-neutral-800 dark:text-slate-300"
                    >
                      {step}: {Number(duration).toFixed(1)}ms
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {hasTrace && (
            <div className={hasRuntime ? "pt-1" : "pt-3"}>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                <Workflow className="h-3 w-3" /> Planning Trace
              </div>
              <div className="mt-1.5 space-y-1">
                {trace.slice(0, 6).map((item, index) => (
                  <div key={`${item.step || "step"}-${index}`} className="text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">{item.step || "step"}:</span> {item.detail || ""}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChartPreviewCard({
  chartSpec,
  queryResult,
  isStreaming,
}: {
  chartSpec: Record<string, any>;
  queryResult?: Record<string, any> | null;
  isStreaming?: boolean;
}) {
  const labels: string[] = Array.isArray(chartSpec?.data?.labels) ? chartSpec.data.labels : [];
  const datasets: Array<{ label?: string; values?: number[] }> = Array.isArray(chartSpec?.data?.datasets) ? chartSpec.data.datasets : [];
  const initialType = String(chartSpec.type || "bar").toLowerCase();
  const chartTitle = String(chartSpec.title || "Chart");
  const chartSubtitle = String(chartSpec.subtitle || queryResult?.summary || "").trim();
  const scopeLabel = String(queryResult?.scopeLabel || queryResult?.scope || "").trim();
  // Prefer BE-provided chartOptions (W9 contract) when available; fall back to
  // the legacy heuristic so older payloads still render.
  const beOptions = (chartSpec?.options || queryResult?.chartOptions || null) as
    | { availableChartTypes?: string[]; colorPalette?: string[]; emptyState?: string }
    | null;
  const availableTypes =
    Array.isArray(beOptions?.availableChartTypes) && beOptions!.availableChartTypes!.length > 0
      ? (beOptions!.availableChartTypes!.filter((t) => ["bar", "line", "pie"].includes(t)) as string[])
      : datasets.length === 1
        ? ["bar", "line", "pie"]
        : ["bar", "line"];
  const [selectedType, setSelectedType] = useState<string>(
    availableTypes.includes(initialType) ? initialType : "bar"
  );
  const chartSvgContainerRef = useRef<HTMLDivElement>(null);
  const [chartDownloading, setChartDownloading] = useState<boolean>(false);

  const handleDownloadChartAsPng = useCallback(async () => {
    const container = chartSvgContainerRef.current;
    if (!container) return;
    const svg = container.querySelector("svg");
    if (!svg) return;
    setChartDownloading(true);
    try {
      const cloned = svg.cloneNode(true) as SVGSVGElement;
      const rect = svg.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width || svg.clientWidth || 600));
      const height = Math.max(1, Math.round(rect.height || svg.clientHeight || 320));
      cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      cloned.setAttribute("width", String(width));
      cloned.setAttribute("height", String(height));
      const serialized = new XMLSerializer().serializeToString(cloned);
      const svgBlob = new Blob([
        '<?xml version="1.0" encoding="UTF-8"?>',
        serialized,
      ], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);
      const image = new window.Image();
      image.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("svg-load-failed"));
        image.src = svgUrl;
      });
      const scale = Math.min(3, Math.max(2, window.devicePixelRatio || 2));
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        setChartDownloading(false);
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(svgUrl);
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((result) => resolve(result), "image/png")
      );
      if (!blob) {
        setChartDownloading(false);
        return;
      }
      const downloadUrl = URL.createObjectURL(blob);
      const safeName = chartTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "chart";
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${safeName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Chart PNG download failed:", error);
    } finally {
      setChartDownloading(false);
    }
  }, [chartTitle]);

  useEffect(() => {
    const normalized = availableTypes.includes(initialType) ? initialType : "bar";
    setSelectedType(normalized);
  }, [initialType, availableTypes.join("|")]);

  const chartData = labels.map((label: string, idx: number) => {
    const point: Record<string, any> = { name: label };
    datasets.forEach((ds) => {
      point[ds.label || "value"] = ds.values?.[idx] ?? 0;
    });
    return point;
  });
  const pieData = labels.map((label: string, idx: number) => ({
    name: label,
    value: Number(datasets[0]?.values?.[idx] ?? 0),
  }));
  const numericValues = datasets.flatMap((dataset) =>
    Array.isArray(dataset.values)
      ? dataset.values.map((value) => Number(value ?? 0)).filter((value) => Number.isFinite(value))
      : []
  );
  // Prefer the BE's emptyState hint so SSE and non-stream deliveries stay in
  // sync; fall back to client-side detection for legacy payloads.
  const emptyStateHint = beOptions?.emptyState as string | undefined;
  const allZero =
    emptyStateHint === "all_zero"
    || (!emptyStateHint && numericValues.length > 0 && numericValues.every((value) => value === 0));
  const singleCategory =
    emptyStateHint === "single_category" || (!emptyStateHint && labels.length === 1);
  const totalPoints = numericValues.length;

  const DEFAULT_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981"];
  const COLORS =
    Array.isArray(beOptions?.colorPalette) && beOptions!.colorPalette!.length > 0
      ? beOptions!.colorPalette!
      : DEFAULT_COLORS;
  const formatAxisTick = (value: unknown) => {
    const text = String(value ?? "");
    if (text.length <= 16) {
      return text;
    }
    return `${text.slice(0, 13)}...`;
  };

  if (!chartData.length || !datasets.length) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
              <BarChart3 className="h-3.5 w-3.5" />
              Chart
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
              {chartTitle}
            </div>
            {chartSubtitle ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                {chartSubtitle}
              </p>
            ) : null}
          </div>
          {queryResult ? (
            <ScopeBadge queryResult={queryResult} tone="prominent" />
          ) : null}
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center dark:border-neutral-800 dark:bg-neutral-950/60">
          {isStreaming ? (
            <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for chart payload...
            </div>
          ) : (
            <>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                No data available for chart.
              </div>
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                The current result does not contain enough numeric data to render a chart.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const seriesLabels = datasets.map((dataset, index) => dataset.label || `Series ${index + 1}`);
  const stateMessage = allZero
    ? "All chart values are 0. The panel is still rendered so you can verify the current state."
    : singleCategory
      ? "Only one category is available for this chart, so comparisons will be limited."
      : null;
  const stateTone = allZero ? "warning" : singleCategory ? "info" : null;
  const chartNote = String(chartSpec.note || chartSpec.description || "").trim();
  const tooltipFormatter = (value: unknown, name: string) => [
    formatQueryResultValue(value, String(name || "value")),
    String(name),
  ];

  const renderChart = () => {
    if (selectedType === "line") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={formatAxisTick} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
            {datasets.map((ds: any, i: number) => (
              <Line
                key={ds.label || i}
                type="monotone"
                dataKey={ds.label || "value"}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (selectedType === "pie" && datasets.length === 1) {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={104}
              paddingAngle={4}
              label
            >
              {pieData.map((_: any, idx: number) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={tooltipFormatter} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={formatAxisTick} />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
          <Tooltip formatter={tooltipFormatter} />
          <Legend />
          {datasets.map((ds: any, i: number) => (
            <Bar key={ds.label || i} dataKey={ds.label || "value"} fill={COLORS[i % COLORS.length]} radius={[10, 10, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            <BarChart3 className="h-3.5 w-3.5" />
            Chart
            <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px] normal-case tracking-normal">
              {selectedType}
            </Badge>
            {queryResult ? (
              <ScopeBadge queryResult={queryResult} tone="prominent" />
            ) : null}
          </div>
          <div className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">
            {chartTitle}
          </div>
          {chartSubtitle ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {chartSubtitle}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableTypes.map((type) => (
            <Button
              key={type}
              type="button"
              variant={selectedType === type ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 rounded-full px-3 text-[11px] capitalize",
                selectedType === type
                  ? "bg-slate-950 text-white hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400"
                  : "bg-white dark:bg-neutral-950"
              )}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3 text-[11px]"
            disabled={chartDownloading}
            onClick={handleDownloadChartAsPng}
            title="Tải chart PNG"
          >
            {chartDownloading ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1 h-3.5 w-3.5" />
            )}
            PNG
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/60">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Categories
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {labels.length}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/60">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Series
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {seriesLabels.length}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/60">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Data points
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {totalPoints}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {seriesLabels.map((seriesLabel, index) => (
          <span
            key={`${seriesLabel}-${index}`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-slate-300"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            {seriesLabel}
          </span>
        ))}
      </div>

      {stateMessage ? (
        <div
          className={cn(
            "mt-4 rounded-2xl border px-4 py-3 text-sm leading-6",
            stateTone === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
              : "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200"
          )}
        >
          {stateMessage}
        </div>
      ) : null}

      <div
        ref={chartSvgContainerRef}
        className="mt-4 rounded-[26px] border border-slate-200 bg-white px-3 py-4 shadow-inner dark:border-neutral-800 dark:bg-slate-950/80"
      >
        {renderChart()}
      </div>

      {chartNote ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-slate-300">
          {chartNote}
        </div>
      ) : null}
    </div>
  );
}

interface ColumnFormatHint {
  kind?: string;
  unit?: string | null;
  format?: string | null;
}

function formatQueryResultValue(
  value: unknown,
  column: string,
  hint?: ColumnFormatHint | null
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const kind = String(hint?.kind || "").toLowerCase();

  if (typeof value === "number") {
    const lowerColumn = column.toLowerCase();
    const isPercentage =
      kind === "percentage"
      || (!kind && /(percent|percentage|rate|ratio|completion|progress)/.test(lowerColumn));
    if (isPercentage) {
      const normalized = value >= 0 && value <= 1 ? value * 100 : value;
      return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(normalized)}%`;
    }

    if (kind === "currency") {
      const currency = hint?.unit || "USD";
      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency,
          maximumFractionDigits: 2,
        }).format(value);
      } catch {
        return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)} ${currency}`;
      }
    }

    if (kind === "duration_seconds") {
      const seconds = Math.round(value);
      if (!Number.isFinite(seconds) || seconds < 0) return String(value);
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      if (h > 0) return `${h}h ${m}m ${s}s`;
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
    }

    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (kind === "datetime" && typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString();
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatQueryResultValue(item, column, hint)).join(", ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function QueryResultCard({
  queryResult,
  onCopyTable,
  onExportCsv,
}: {
  queryResult: Record<string, any>;
  onCopyTable?: (format: "tsv" | "markdown") => void;
  onExportCsv?: () => void;
}) {
  const rows = useMemo(
    () => (Array.isArray(queryResult.rows) ? queryResult.rows : []),
    [queryResult.rows]
  );
  const columns = useMemo(() => {
    if (Array.isArray(queryResult.columns) && queryResult.columns.length > 0) {
      return queryResult.columns.map((column: unknown) => String(column));
    }
    if (rows.length > 0) {
      return Object.keys(rows[0] || {});
    }
    return [];
  }, [queryResult.columns, rows]);
  const tableNames = useMemo(
    () =>
      Array.isArray(queryResult.tables)
        ? queryResult.tables.map((tableName: unknown) => String(tableName))
        : [],
    [queryResult.tables]
  );
  // BE-provided column format hints (W9 contract) — falls back to heuristic
  // formatting inside `formatQueryResultValue` when absent.
  const columnMetaMap = useMemo(() => {
    const map: Record<string, ColumnFormatHint> = {};
    const meta = queryResult.columnMeta;
    if (Array.isArray(meta)) {
      for (const entry of meta) {
        if (entry && typeof entry === "object" && typeof entry.name === "string") {
          map[entry.name] = {
            kind: typeof entry.kind === "string" ? entry.kind : undefined,
            unit: entry.unit ?? undefined,
            format: entry.format ?? undefined,
          };
        }
      }
    }
    return map;
  }, [queryResult.columnMeta]);
  const totalRows = typeof queryResult.rowCount === "number" ? queryResult.rowCount : rows.length;
  const querySignature = `${queryResult.title || ""}:${queryResult.summary || ""}:${queryResult.scopeLabel || ""}:${rows.length}:${columns.join("|")}`;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    if (rows.length > 25) return 25;
    if (rows.length > 10) return 10;
    return 5;
  });

  useEffect(() => {
    setPage(1);
    setPageSize(rows.length > 25 ? 25 : rows.length > 10 ? 10 : 5);
  }, [querySignature, rows.length]);

  const totalPages = Math.max(1, Math.ceil(Math.max(rows.length, 1) / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (!queryResult.summary && rows.length === 0) {
    return null;
  }

  const startIndex = rows.length > 0 ? (page - 1) * pageSize : 0;
  const endIndex = rows.length > 0 ? Math.min(startIndex + pageSize, rows.length) : 0;
  const visibleRows = rows.slice(startIndex, endIndex);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
            <Database className="h-3.5 w-3.5" />
            Query Result
            <ScopeBadge queryResult={queryResult} tone="prominent" />
            {queryResult.metric ? (
              <Badge variant="outline" className="text-[10px]">
                {String(queryResult.metric)}
              </Badge>
            ) : null}
          </div>
          {queryResult.summary ? (
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {String(queryResult.summary)}
            </p>
          ) : null}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {onCopyTable && rows.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-full px-2.5 text-[11px]"
              onClick={() => onCopyTable("tsv")}
              title="Sao chép bảng (dán vào Excel / Sheets)"
            >
              <Copy className="mr-1 h-3 w-3" />
              Copy
            </Button>
          ) : null}
          {onExportCsv && rows.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-full px-2.5 text-[11px]"
              onClick={onExportCsv}
              title="Tải CSV"
            >
              <Download className="mr-1 h-3 w-3" />
              CSV
            </Button>
          ) : null}
          <Badge variant="outline" className="text-[10px]">
            {totalRows} row{totalRows === 1 ? "" : "s"}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {columns.length} column{columns.length === 1 ? "" : "s"}
          </Badge>
          {tableNames.length > 0 ? (
            <Badge variant="outline" className="text-[10px]">
              {tableNames.length} source{tableNames.length === 1 ? "" : "s"}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Scope
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {String(queryResult.scopeLabel || queryResult.scope || "Analytics")}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Rows Loaded
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {rows.length} / {totalRows}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Columns
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {columns.join(", ") || "No columns"}
          </div>
        </div>
      </div>

      {rows.length > 0 && columns.length > 0 ? (
        <>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{startIndex + 1}</span>
              {" - "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{endIndex}</span>
              {" of "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{rows.length}</span>
              {" loaded rows"}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Rows / page</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    const nextSize = Number(value);
                    if (!Number.isNaN(nextSize) && nextSize > 0) {
                      setPageSize(nextSize);
                      setPage(1);
                    }
                  }}
                >
                  <SelectTrigger className="h-7 w-[78px] text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 25, 50].map((size) => (
                      <SelectItem key={size} value={String(size)} className="text-[11px]">
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronRight className="mr-1 h-3 w-3 rotate-180" />
                  Prev
                </Button>
                <Badge variant="secondary" className="h-7 rounded-md px-2 text-[10px]">
                  {page} / {totalPages}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  Next
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div className="max-h-[24rem] overflow-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur dark:bg-slate-900/95">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="whitespace-nowrap border-b border-slate-200 px-3 py-2 font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, rowIndex) => (
                    <tr
                      key={`${page}-${rowIndex}`}
                      className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50/80 dark:border-slate-900 dark:hover:bg-slate-900/40"
                    >
                      {columns.map((column) => {
                        const formatted = formatQueryResultValue(
                          row?.[column],
                          column,
                          columnMetaMap[column]
                        );
                        const compact = formatted.length > 120 ? `${formatted.slice(0, 117)}...` : formatted;
                        return (
                          <td
                            key={`${page}-${rowIndex}-${column}`}
                            className="max-w-[280px] px-3 py-2 text-slate-600 dark:text-slate-300"
                            title={formatted}
                          >
                            <div className="break-words leading-relaxed">{compact}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {tableNames.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tableNames.map((tableName) => (
                <Badge key={tableName} variant="outline" className="text-[10px]">
                  {tableName}
                </Badge>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
          Query executed successfully, but no rows matched the current filter.
        </div>
      )}
    </div>
  );
}

type AnalysisTab = "data" | "sql" | "chart" | "sources";

function humanizeAgentStep(step?: string) {
  if (!step) return "Agent step";
  return step
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildAgentSteps({
  trace,
  nodeTimings,
  thinkingText,
}: {
  trace: MessageTraceItem[];
  nodeTimings: Array<[string, number]>;
  thinkingText?: string;
}) {
  if (trace.length > 0) {
    return trace.map((item, index) => {
      const duration = nodeTimings.find(([step]) => step === item.step)?.[1];
      const detail = String(item.detail || "").trim();
      const lowered = detail.toLowerCase();
      const status =
        lowered.includes("warning") || lowered.includes("fallback") || lowered.includes("clarify")
          ? "warning"
          : "done";
      return {
        key: `${item.step || "step"}-${index}`,
        title: humanizeAgentStep(item.step),
        detail,
        duration,
        status,
      };
    });
  }

  if (nodeTimings.length > 0) {
    return nodeTimings.map(([step, duration]) => ({
      key: step,
      title: humanizeAgentStep(step),
      detail: "Completed orchestration step.",
      duration,
      status: "done" as const,
    }));
  }

  const thinkingLines = String(thinkingText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);

  return thinkingLines.map((line, index) => ({
    key: `thinking-${index}`,
    title: index === 0 ? "Reasoning" : `Reasoning ${index + 1}`,
    detail: line,
    duration: undefined,
    status: "done" as const,
  }));
}

function AgentStepsPanel({
  trace,
  nodeTimings,
  thinkingText,
  isStreaming,
}: {
  trace: MessageTraceItem[];
  nodeTimings: Array<[string, number]>;
  thinkingText?: string;
  isStreaming?: boolean;
}) {
  const steps = useMemo(
    () => buildAgentSteps({ trace, nodeTimings, thinkingText }),
    [trace, nodeTimings, thinkingText]
  );
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});
  const areAllStepsOpen = steps.length > 0 && steps.every((step) => openSteps[step.key]);

  useEffect(() => {
    const nextState: Record<string, boolean> = {};
    steps.forEach((step, index) => {
      nextState[step.key] = index < 3;
    });
    setOpenSteps(nextState);
  }, [steps]);

  if (steps.length === 0) {
    return isStreaming ? (
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <Sparkles className="h-3.5 w-3.5" />
          Agent steps
          <Badge variant="secondary" className="text-[10px]">
            running
          </Badge>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Preparing execution trace...
        </div>
      </div>
    ) : null;
  }

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Workflow className="h-4 w-4" />
          Agent Steps ({steps.length})
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            onClick={() =>
              setOpenSteps(
                Object.fromEntries(steps.map((step) => [step.key, !areAllStepsOpen]))
              )
            }
          >
            {areAllStepsOpen ? (
              <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
            )}
            {areAllStepsOpen ? "Hide all" : "Show all"}
          </Button>
          {isStreaming ? (
            <Badge variant="secondary" className="text-[10px]">
              live
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="relative mt-4 space-y-3 pl-8">
        <div className="absolute left-[14px] top-1 bottom-1 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent dark:from-neutral-700 dark:via-neutral-700" />
        {steps.map((step, index) => {
          const isOpen = openSteps[step.key] ?? index < 2;
          const isWarning = step.status === "warning";
          return (
            <div key={step.key} className="relative">
              <div
                className={cn(
                  "absolute -left-8 top-3 flex h-7 w-7 items-center justify-center rounded-full border bg-white shadow-sm dark:bg-neutral-950",
                  isWarning
                    ? "border-amber-300 text-amber-500 dark:border-amber-700 dark:text-amber-400"
                    : "border-emerald-200 text-emerald-500 dark:border-emerald-800 dark:text-emerald-400"
                )}
              >
                {isWarning ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 shadow-sm transition-all duration-200 dark:border-neutral-800 dark:bg-neutral-950/60">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  onClick={() =>
                    setOpenSteps((current) => ({
                      ...current,
                      [step.key]: !isOpen,
                    }))
                  }
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {step.title}
                      </Badge>
                      {typeof step.duration === "number" ? (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {step.duration.toFixed(1)}ms
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                      {step.detail || "Completed."}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  )}
                </button>
                <div
                  className={cn(
                    "overflow-hidden border-t border-transparent px-4 transition-all duration-200",
                    isOpen
                      ? "max-h-40 border-slate-200/70 pb-4 opacity-100 dark:border-neutral-800/70"
                      : "max-h-0 py-0 opacity-0"
                  )}
                >
                  <div className="rounded-xl bg-white/80 px-3 py-2 text-xs leading-6 text-slate-500 dark:bg-neutral-900 dark:text-slate-400">
                    {step.detail || "Completed orchestration step."}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SqlPreviewPanel({
  message,
  queryResult,
  onCopySql,
}: {
  message: Message;
  queryResult?: Record<string, any> | null;
  onCopySql: (messageId: string, content: string) => void;
}) {
  const sql = String(queryResult?.sql || "").trim();
  const explanation = String(queryResult?.explanation || "").trim();
  const executionMode = String(queryResult?.executionMode || "llm_planner").trim();
  const scopeLabel = String(queryResult?.scopeLabel || queryResult?.scope || "Analytics").trim();
  const tables = Array.isArray(queryResult?.tables) ? queryResult.tables.map((tableName: unknown) => String(tableName)) : [];
  const policy = queryResult?.policy && typeof queryResult.policy === "object" ? queryResult.policy : null;
  const logicSummary = queryResult?.logicSummary && typeof queryResult.logicSummary === "object" ? queryResult.logicSummary : null;
  const rowCount =
    typeof queryResult?.rowCount === "number"
      ? queryResult.rowCount
      : Array.isArray(queryResult?.rows)
        ? queryResult.rows.length
        : 0;
  const [sqlOpen, setSqlOpen] = useState(true);

  if (!sql) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm text-slate-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-slate-400">
        No SQL payload was returned for this result.
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/95 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-4 dark:border-neutral-800/70">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            SQL / Logic
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Safe execution preview
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Verify how the assistant queried the data before trusting the result.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {queryResult ? <ScopeBadge queryResult={queryResult} tone="prominent" /> : null}
          <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px]">
            {executionMode === "deterministic_fallback" ? "Deterministic fallback" : "LLM planner"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => onCopySql(message.id, sql)}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy SQL
          </Button>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/60">
            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Scope
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {scopeLabel}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/60">
            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Tables
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {tables.length}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/60">
              <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Rows returned
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {rowCount}
              </div>
            </div>
          </div>

        {explanation ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/60">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Query explanation
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
              {explanation}
            </p>
          </div>
        ) : null}

        {logicSummary ? (
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/70">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Logic summary
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(logicSummary).map(([key, value]) => (
                <Badge key={key} variant="outline" className="rounded-full px-2.5 py-1 text-[10px]">
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {tables.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/70">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Tables referenced
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {tables.map((tableName) => (
                <Badge key={tableName} variant="outline" className="rounded-full px-2.5 py-1 text-[10px]">
                  {tableName}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {policy ? (
          <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/70">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Runtime policy
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50/80 px-3 py-2 text-xs text-slate-600 dark:bg-neutral-900 dark:text-slate-300">
                <div className="font-medium text-slate-400 dark:text-slate-500">User role</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{String(policy.userRole ?? "n/a")}</div>
              </div>
              <div className="rounded-xl bg-slate-50/80 px-3 py-2 text-xs text-slate-600 dark:bg-neutral-900 dark:text-slate-300">
                <div className="font-medium text-slate-400 dark:text-slate-500">SQL max rows</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{String(policy.sqlMaxRows ?? "n/a")}</div>
              </div>
              <div className="rounded-xl bg-slate-50/80 px-3 py-2 text-xs text-slate-600 dark:bg-neutral-900 dark:text-slate-300">
                <div className="font-medium text-slate-400 dark:text-slate-500">PII access</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{String(policy.piiAccess ?? false)}</div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white/90 dark:border-neutral-800 dark:bg-neutral-950/70">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            onClick={() => setSqlOpen((current) => !current)}
          >
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                Raw SQL
              </div>
              <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                Expand to inspect the executed statement
              </div>
            </div>
            {sqlOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          <div
            className={cn(
              "overflow-hidden border-t border-transparent transition-all duration-200",
              sqlOpen ? "max-h-[520px] border-slate-200/70 dark:border-neutral-800/70" : "max-h-0"
            )}
          >
            <div className="overflow-auto px-4 py-4">
              <pre className="min-w-full whitespace-pre-wrap break-words rounded-2xl bg-slate-950 px-4 py-4 text-xs leading-6 text-slate-100">
                {sql}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type ScopeKind = "personal" | "platform" | "unknown";

function resolveScopeKind(queryResult?: Record<string, any> | null): ScopeKind {
  const raw = String(queryResult?.scope || "").toLowerCase();
  if (raw === "personal" || raw === "platform") return raw;
  const label = String(queryResult?.scopeLabel || "").toLowerCase();
  if (label.includes("toi") || label.includes("cua ban") || label.includes("của bạn") || label.includes("của tôi") || /\bmy\b/.test(label)) {
    return "personal";
  }
  if (label.includes("toan he thong") || label.includes("toàn hệ thống") || label.includes("platform") || label.includes("system")) {
    return "platform";
  }
  return "unknown";
}

function ScopeBadge({
  queryResult,
  tone = "inline",
}: {
  queryResult?: Record<string, any> | null;
  tone?: "inline" | "prominent";
}) {
  const kind = resolveScopeKind(queryResult);
  const explicitLabel = String(queryResult?.scopeLabel || "").trim();
  const fallbackLabel =
    kind === "personal"
      ? "Dữ liệu của tôi"
      : kind === "platform"
        ? "Toàn hệ thống"
        : "Phạm vi dữ liệu";
  const label = explicitLabel || fallbackLabel;
  const Icon = kind === "personal" ? UserRound : kind === "platform" ? Globe : Database;
  const toneClass =
    kind === "personal"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-200"
      : kind === "platform"
        ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/80 dark:bg-blue-950/40 dark:text-blue-200"
        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-slate-200";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        tone === "prominent" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]",
        toneClass
      )}
      title={
        kind === "personal"
          ? "Truy vấn trả về dữ liệu cá nhân của bạn"
          : kind === "platform"
            ? "Truy vấn trả về dữ liệu toàn hệ thống"
            : "Phạm vi dữ liệu chưa xác định rõ"
      }
    >
      <Icon className={tone === "prominent" ? "h-3.5 w-3.5" : "h-3 w-3"} />
      {label}
    </span>
  );
}

function followUpIconFor(action: SuggestedAction) {
  const hint = String(action.icon || "").toLowerCase();
  const kind = action.kind;
  if (hint === "chart-line" || /line/.test(hint)) return <LineChartIcon className="h-3.5 w-3.5" />;
  if (hint === "chart-pie" || /pie/.test(hint)) return <PieChartIcon className="h-3.5 w-3.5" />;
  if (hint === "chart-bar" || /bar/.test(hint)) return <BarChart3 className="h-3.5 w-3.5" />;
  if (hint === "download" || kind === "export_csv") return <Download className="h-3.5 w-3.5" />;
  if (hint === "copy" || kind === "copy_sql") return <Copy className="h-3.5 w-3.5" />;
  if (hint === "explain") return <Sparkles className="h-3.5 w-3.5" />;
  if (hint === "filter" || kind === "refine_filter") return <Filter className="h-3.5 w-3.5" />;
  if (hint === "calendar") return <CalendarDays className="h-3.5 w-3.5" />;
  if (hint === "scope") {
    return /platform|system|toan/.test(String(action.id)) ? (
      <Globe className="h-3.5 w-3.5" />
    ) : (
      <UserRound className="h-3.5 w-3.5" />
    );
  }
  if (kind === "change_chart_type") return <BarChart3 className="h-3.5 w-3.5" />;
  return <Sparkles className="h-3.5 w-3.5" />;
}

function normalizeIncomingAction(raw: Record<string, any>): SuggestedAction | null {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id || "").trim();
  const label = String(raw.label || "").trim();
  const kindValue = String(raw.kind || "").trim() as SuggestedActionKind;
  const allowedKinds: SuggestedActionKind[] = [
    "prompt",
    "change_chart_type",
    "export_csv",
    "copy_sql",
    "refine_filter",
  ];
  if (!id || !label || !allowedKinds.includes(kindValue)) return null;
  return {
    id,
    label,
    description: raw.description ? String(raw.description) : undefined,
    kind: kindValue,
    prompt: raw.prompt ? String(raw.prompt) : undefined,
    payload: raw.payload && typeof raw.payload === "object" ? raw.payload : undefined,
    icon: raw.icon ? String(raw.icon) : undefined,
    tone: raw.tone === "primary" ? "primary" : "secondary",
  };
}

function buildLocalFollowUpActions(message: Message, currentChartType?: string): SuggestedAction[] {
  const metadata = message.metadata;
  if (!metadata) return [];
  const queryResult = metadata.queryResult;
  const chartSpec = metadata.chartSpec;
  const hasRows = Array.isArray(queryResult?.rows) && queryResult!.rows.length > 0;
  const hasSql = !!queryResult?.sql;
  const scope = String(queryResult?.scope || "").toLowerCase();
  const metric = String(queryResult?.metric || "analytics");
  const actions: SuggestedAction[] = [];
  const effectiveChartType = (currentChartType || chartSpec?.type || queryResult?.chartType || "bar").toLowerCase();

  if (chartSpec && hasRows) {
    const chartAlternatives: Array<{ id: string; label: string; type: string; icon: string }> = [];
    if (effectiveChartType !== "line") {
      chartAlternatives.push({ id: "chart-line", label: "Đổi sang biểu đồ đường", type: "line", icon: "chart-line" });
    }
    if (effectiveChartType !== "bar") {
      chartAlternatives.push({ id: "chart-bar", label: "Đổi sang biểu đồ cột", type: "bar", icon: "chart-bar" });
    }
    if (effectiveChartType !== "pie") {
      chartAlternatives.push({ id: "chart-pie", label: "Đổi sang biểu đồ tròn", type: "pie", icon: "chart-pie" });
    }
    chartAlternatives.slice(0, 2).forEach((alt) => {
      actions.push({
        id: alt.id,
        label: alt.label,
        description: `Hiển thị lại dữ liệu hiện tại dưới dạng ${alt.type}.`,
        kind: "change_chart_type",
        payload: { chartType: alt.type },
        icon: alt.icon,
        tone: "secondary",
      });
    });
  }

  if (scope === "personal") {
    actions.push({
      id: "scope-platform",
      label: "So sánh với toàn hệ thống",
      description: "Chạy lại truy vấn với dữ liệu toàn hệ thống để đối chiếu.",
      kind: "prompt",
      prompt: `So sánh ${metric} của tôi với toàn hệ thống`,
      icon: "scope",
      tone: "primary",
    });
  } else if (scope === "platform") {
    actions.push({
      id: "scope-personal",
      label: "Chỉ lấy dữ liệu của tôi",
      description: "Thu hẹp lại truy vấn về dữ liệu cá nhân của bạn.",
      kind: "prompt",
      prompt: `Chỉ lấy ${metric} của tôi`,
      icon: "scope",
      tone: "primary",
    });
  }

  if (hasSql) {
    actions.push({
      id: "explain-sql",
      label: "Giải thích câu SQL này",
      description: "Nhờ AI mô tả từng bước của SQL vừa chạy.",
      kind: "prompt",
      prompt: "Giải thích chi tiết câu SQL vừa chạy: từng bước làm gì, tại sao dùng các JOIN và WHERE này.",
      icon: "explain",
      tone: "secondary",
    });
  }

  if (hasRows) {
    actions.push({
      id: "export-csv",
      label: "Xuất CSV",
      description: "Tải xuống toàn bộ kết quả dạng CSV.",
      kind: "export_csv",
      icon: "download",
      tone: "secondary",
    });
  }

  if (hasSql) {
    actions.push({
      id: "copy-sql",
      label: "Sao chép SQL",
      description: "Copy câu SQL đã chạy vào clipboard.",
      kind: "copy_sql",
      icon: "copy",
      tone: "secondary",
    });
  }

  return actions;
}

function mergeSuggestedActions(
  remote: SuggestedAction[] | undefined,
  local: SuggestedAction[]
): SuggestedAction[] {
  const seen = new Set<string>();
  const out: SuggestedAction[] = [];
  const pushIfNew = (action: SuggestedAction | null | undefined) => {
    if (!action) return;
    const key = action.id || `${action.kind}:${action.label}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(action);
  };
  (remote || []).forEach(pushIfNew);
  local.forEach(pushIfNew);
  return out.slice(0, 7);
}

function FollowUpActions({
  message,
  actions,
  compact,
  feedback,
  onDispatch,
  disabled,
}: {
  message: Message;
  actions: SuggestedAction[];
  compact?: boolean;
  feedback: Record<string, string>;
  onDispatch: (message: Message, action: SuggestedAction) => void;
  disabled?: boolean;
}) {
  if (!actions.length) return null;
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white/95 dark:bg-neutral-900/70",
        compact
          ? "border-slate-200/80 px-3 py-2 dark:border-neutral-800"
          : "border-slate-200 px-4 py-3 shadow-sm dark:border-neutral-800"
      )}
      data-follow-up-actions
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Follow-up actions
        </span>
      </div>
      <div className={cn("flex flex-wrap", compact ? "mt-2 gap-1.5" : "mt-3 gap-2")}>
        {actions.map((action) => {
          const key = `${message.id}:${action.id}`;
          const isDone = feedback[key] === "done";
          const isPrimary = action.tone === "primary";
          return (
            <button
              key={action.id}
              type="button"
              disabled={disabled}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDispatch(message, action);
              }}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                isPrimary
                  ? "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-800/80 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-900/40"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-slate-200 dark:hover:bg-neutral-800",
                disabled ? "cursor-not-allowed opacity-60 hover:bg-inherit" : "cursor-pointer",
                isDone ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200" : null
              )}
              title={action.description || action.label}
            >
              <span className={cn("flex h-4 w-4 items-center justify-center", isDone ? "text-emerald-600 dark:text-emerald-300" : "")}>
                {isDone ? <CheckCircle className="h-3.5 w-3.5" /> : followUpIconFor(action)}
              </span>
              <span className="max-w-[220px] truncate">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AnalysisWorkspacePanel({
  message,
  prompt,
  activeTab,
  onTabChange,
  onCopySql,
  isStreamingMessage,
  onClose,
  chartTypeOverride,
  followUpActions,
  onFollowUpAction,
  followUpFeedback,
  followUpDisabled,
  onExpand,
  onCopyTable,
  onExportCsv,
  onSave,
  isSaved,
}: {
  message: Message | null;
  prompt: string;
  activeTab: AnalysisTab;
  onTabChange: (tab: AnalysisTab) => void;
  onCopySql: (messageId: string, content: string) => void;
  isStreamingMessage?: boolean;
  onClose: () => void;
  chartTypeOverride?: string;
  followUpActions: SuggestedAction[];
  onFollowUpAction: (message: Message, action: SuggestedAction) => void;
  followUpFeedback: Record<string, string>;
  followUpDisabled?: boolean;
  onExpand?: () => void;
  onCopyTable?: (queryResult: Record<string, any>, format: "tsv" | "markdown") => void;
  onExportCsv?: (queryResult: Record<string, any>, title: string) => void;
  onSave?: () => void;
  isSaved?: boolean;
}) {
  const metadata = message?.metadata;
  const queryResult = metadata?.queryResult;
  const chartSpec = metadata?.chartSpec;
  const citations = Array.isArray(metadata?.citations) ? metadata!.citations! : [];
  const availableTabs: Array<{ id: AnalysisTab; label: string; visible: boolean }> = [
    { id: "data", label: "Data Preview", visible: !!queryResult },
    { id: "sql", label: "SQL Query", visible: !!queryResult?.sql },
    { id: "chart", label: "Chart", visible: !!chartSpec },
    { id: "sources", label: "Sources", visible: citations.length > 0 },
  ];
  const visibleTabs = availableTabs.filter((tab) => tab.visible);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab) && visibleTabs[0]) {
      onTabChange(visibleTabs[0].id);
    }
  }, [activeTab, onTabChange, visibleTabs]);

  if (!message || !metadata) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-8">
        <div className="max-w-sm rounded-[28px] border border-slate-200 bg-white/95 p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Analysis workspace
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
            Ask for data, charts, or file analysis. When the assistant returns structured output, it will appear here.
          </p>
        </div>
      </div>
    );
  }

  const chartTitle = String(chartSpec?.title || queryResult?.title || "Analysis");

  const exportCsv = () => {
    const rows = Array.isArray(queryResult?.rows) ? queryResult.rows : [];
    const columns = Array.isArray(queryResult?.columns)
      ? queryResult.columns.map((column: unknown) => String(column))
      : rows.length > 0
        ? Object.keys(rows[0] || {})
        : [];
    if (rows.length === 0 || columns.length === 0) {
      return;
    }

    const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [columns.join(","), ...rows.map((row: Record<string, unknown>) => columns.map((column) => escapeCsv(row?.[column])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${chartTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "analysis"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-slate-200/70 px-5 py-4 dark:border-neutral-800/70">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
              Analysis workspace
              {queryResult ? (
                <ScopeBadge queryResult={queryResult} tone="prominent" />
              ) : null}
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">
              {chartTitle}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onSave ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-10 rounded-full px-3 text-xs",
                  isSaved
                    ? "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-neutral-800 dark:hover:text-slate-100"
                )}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onSave();
                }}
                title={isSaved ? "Analysis đã được lưu" : "Lưu analysis để mở lại sau"}
              >
                {isSaved ? (
                  <CheckCircle className="mr-1.5 h-4 w-4" />
                ) : (
                  <Sparkles className="mr-1.5 h-4 w-4" />
                )}
                <span className="hidden sm:inline">{isSaved ? "Đã lưu" : "Lưu"}</span>
              </Button>
            ) : null}
            {onExpand ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-800 dark:hover:text-slate-200"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onExpand();
                }}
                title="Mở rộng thành workspace đầy đủ"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-800 dark:hover:text-slate-200"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onClose();
              }}
              title="Hide workspace"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {prompt ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-600 dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-slate-300">
            {prompt}
          </div>
        ) : null}
      </div>

      <div className="border-b border-slate-200/70 px-4 py-3 dark:border-neutral-800/70">
        <div className="flex flex-wrap items-center gap-2">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm transition-colors",
                activeTab === tab.id
                  ? "bg-slate-950 text-white dark:bg-blue-500"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-neutral-900 dark:text-slate-300 dark:hover:bg-neutral-800"
              )}
            >
              {tab.label}
            </button>
          ))}
          {queryResult?.rows?.length ? (
            <Button variant="outline" size="sm" className="ml-auto rounded-full" onClick={exportCsv}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export CSV
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {activeTab === "data" && queryResult ? (
          <QueryResultCard
            queryResult={queryResult}
            onCopyTable={onCopyTable ? (format) => onCopyTable(queryResult, format) : undefined}
            onExportCsv={onExportCsv ? () => onExportCsv(queryResult, chartTitle) : undefined}
          />
        ) : null}
        {activeTab === "sql" ? <SqlPreviewPanel message={message} queryResult={queryResult} onCopySql={onCopySql} /> : null}
        {activeTab === "chart" && chartSpec ? (
          <ChartPreviewCard
            chartSpec={chartTypeOverride ? { ...chartSpec, type: chartTypeOverride } : chartSpec}
            queryResult={queryResult}
            isStreaming={isStreamingMessage}
          />
        ) : null}
        {activeTab === "sources" ? (
          <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
              Sources
            </div>
            <div className="mt-4 space-y-3">
              {citations.length > 0 ? (
                citations.map((citation, index) => {
                  const courseId = citation.courseId || citation.course_id;
                  const label = String(citation.title || citation.kind || `source-${index + 1}`);
                  return (
                    <div key={`${label}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/70">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</div>
                      {courseId ? (
                        <a
                          href={`/courses/${courseId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          Open source
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-slate-500 dark:text-slate-400">No sources available.</div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {followUpActions.length > 0 && message ? (
        <div className="border-t border-slate-200/70 bg-white/60 px-4 py-3 backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-950/60">
          <FollowUpActions
            message={message}
            actions={followUpActions}
            feedback={followUpFeedback}
            onDispatch={onFollowUpAction}
            disabled={followUpDisabled}
          />
        </div>
      ) : null}
    </div>
  );
}

function FullscreenAnalysisView({
  message,
  prompt,
  onClose,
  onCopySql,
  isStreamingMessage,
  chartTypeOverride,
  followUpActions,
  onFollowUpAction,
  followUpFeedback,
  followUpDisabled,
  onCopyTable,
  onExportCsv,
  onSave,
  isSaved,
  readOnly,
}: {
  message: Message;
  prompt: string;
  onClose: () => void;
  onCopySql: (messageId: string, content: string) => void;
  isStreamingMessage?: boolean;
  chartTypeOverride?: string;
  followUpActions: SuggestedAction[];
  onFollowUpAction: (message: Message, action: SuggestedAction) => void;
  followUpFeedback: Record<string, string>;
  followUpDisabled?: boolean;
  onCopyTable?: (queryResult: Record<string, any>, format: "tsv" | "markdown") => void;
  onExportCsv?: (queryResult: Record<string, any>, title: string) => void;
  onSave?: () => void;
  isSaved?: boolean;
  readOnly?: boolean;
}) {
  const metadata = message.metadata;
  const queryResult = metadata?.queryResult;
  const chartSpec = metadata?.chartSpec;
  const citations = Array.isArray(metadata?.citations) ? metadata!.citations! : [];
  const title = String(chartSpec?.title || queryResult?.title || "Analysis");
  const answerContent = String(message.content || "").replace(/▌+$/, "").trim();
  const effectiveChartSpec = chartSpec
    ? chartTypeOverride
      ? { ...chartSpec, type: chartTypeOverride }
      : chartSpec
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Analysis workspace"
      className="fixed inset-0 z-[60] flex flex-col bg-slate-950/80 backdrop-blur-sm"
    >
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative m-0 flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-neutral-950 sm:m-4 sm:h-[calc(100vh-2rem)] sm:rounded-[28px] sm:border sm:border-slate-200/80 sm:dark:border-neutral-800/80">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 bg-white/95 px-4 py-4 backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-950/80 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
              Analysis workspace
              {readOnly ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
                >
                  Chỉ xem (saved)
                </Badge>
              ) : null}
              {queryResult ? <ScopeBadge queryResult={queryResult} tone="prominent" /> : null}
              {metadata?.intent ? (
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
                  {metadata.intent}
                </Badge>
              ) : null}
              {metadata?.resolvedMode ? (
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
                  {metadata.resolvedMode}
                </Badge>
              ) : null}
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50 sm:text-2xl">
              {title}
            </div>
            {prompt ? (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-600 dark:border-neutral-800 dark:bg-neutral-900/70 dark:text-slate-300">
                <span className="mr-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:bg-blue-950/60 dark:text-blue-200">
                  Prompt
                </span>
                {prompt}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            {onSave ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-10 rounded-full px-3 text-xs",
                  readOnly
                    ? "text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                    : isSaved
                      ? "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-neutral-800 dark:hover:text-slate-100"
                )}
                onClick={onSave}
                title={
                  readOnly
                    ? "Gỡ analysis này khỏi danh sách saved"
                    : isSaved
                      ? "Gỡ khỏi saved"
                      : "Lưu analysis để mở lại sau"
                }
              >
                {readOnly ? (
                  <Trash2 className="mr-1.5 h-4 w-4" />
                ) : isSaved ? (
                  <CheckCircle className="mr-1.5 h-4 w-4" />
                ) : (
                  <Sparkles className="mr-1.5 h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {readOnly ? "Gỡ lưu" : isSaved ? "Đã lưu" : "Lưu"}
                </span>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-800 dark:hover:text-slate-200"
              onClick={onClose}
              title="Thu gọn workspace (Esc)"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-800 dark:hover:text-slate-200"
              onClick={onClose}
              title="Đóng workspace"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-50/60 px-4 py-5 dark:bg-neutral-950/40 sm:px-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
            {answerContent ? (
              <section className="rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI answer
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-800 dark:text-slate-100">
                  <MarkdownRenderer content={answerContent} />
                </div>
              </section>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-2">
              {effectiveChartSpec ? (
                <section className="xl:col-span-2">
                  <ChartPreviewCard
                    chartSpec={effectiveChartSpec}
                    queryResult={queryResult}
                    isStreaming={isStreamingMessage}
                  />
                </section>
              ) : null}
              {queryResult ? (
                <section className="xl:col-span-2">
                  <QueryResultCard
                    queryResult={queryResult}
                    onCopyTable={
                      onCopyTable ? (format) => onCopyTable(queryResult, format) : undefined
                    }
                    onExportCsv={
                      onExportCsv ? () => onExportCsv(queryResult, title) : undefined
                    }
                  />
                </section>
              ) : null}
              {queryResult?.sql ? (
                <section className="xl:col-span-2">
                  <SqlPreviewPanel
                    message={message}
                    queryResult={queryResult}
                    onCopySql={onCopySql}
                  />
                </section>
              ) : null}
            </div>

            {citations.length > 0 ? (
              <section className="rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Sources
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {citations.map((citation, index) => {
                    const courseId = citation.courseId || citation.course_id;
                    const label = String(
                      citation.title || citation.kind || `source-${index + 1}`
                    );
                    return (
                      <div
                        key={`${label}-${index}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-950/60"
                      >
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {label}
                        </div>
                        {courseId ? (
                          <a
                            href={`/courses/${courseId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            Open source
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {followUpActions.length > 0 ? (
              <section>
                <FollowUpActions
                  message={message}
                  actions={followUpActions}
                  feedback={followUpFeedback}
                  onDispatch={onFollowUpAction}
                  disabled={followUpDisabled}
                />
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SavedAnalysisItem({
  saved,
  isActive,
  onSelect,
  onDelete,
}: {
  saved: SavedAnalysis;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const savedWhen = (() => {
    try {
      const when = new Date(saved.savedAt);
      return when.toLocaleString();
    } catch {
      return "";
    }
  })();
  return (
    <div
      className={cn(
        "group flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
        isActive
          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
          : "hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-300"
      )}
      onClick={onSelect}
      title={saved.prompt || saved.title}
    >
      <BarChart3
        className={cn(
          "h-3.5 w-3.5 mt-0.5 flex-shrink-0",
          isActive ? "" : "opacity-70"
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{saved.title}</div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
          {saved.scopeLabel ? (
            <span className="truncate">{saved.scopeLabel}</span>
          ) : null}
          {saved.scopeLabel && savedWhen ? <span>·</span> : null}
          <span className="truncate">{savedWhen}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Xóa khỏi saved"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
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
  return (
    <div
      className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
          : "hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-300"
      }`}
      onClick={onSelect}
    >
      <MessageSquare className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "" : "opacity-70"}`} />
      <span className="flex-1 text-xs truncate">{session.label}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Xóa"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
