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
import { useQueryClient } from "@tanstack/react-query";
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
import {
  cn,
  getAccessTokenFromLocalStorage,
  getUserInfoFromStorage,
} from "@/lib/utils";
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

import { useTranslations } from "next-intl";
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
  fileType?: string | null;
  size?: number;
  secureUrl?: string | null;
  publicUrl?: string | null;
  cloudinaryUrl?: string | null;
  cloudinarySecureUrl?: string | null;
  objectKey?: string | null;
  thumbnailObjectKey?: string | null;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  content?: string | null;
  excerpt?: string | null;
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
const CUSTOM_INSTRUCTIONS_STORAGE_KEY = "ai_chat_custom_instructions";
const CUSTOM_INSTRUCTIONS_SAVED_AT_KEY = "ai_chat_custom_instructions_saved_at";
const MAX_AI_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const MAX_INLINE_ATTACHMENT_BYTES = 1_000_000;
const MAX_INLINE_ATTACHMENT_CHARS = 20_000;
const ATTACHMENT_PREVIEW_CHARS = 120_000;
const TEXT_ATTACHMENT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "csv",
  "json",
  "xml",
  "yaml",
  "yml",
  "html",
  "htm",
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "java",
  "kt",
  "go",
  "rs",
  "c",
  "cc",
  "cpp",
  "h",
  "hpp",
  "cs",
  "php",
  "rb",
  "swift",
  "sql",
  "css",
  "scss",
  "sh",
  "bat",
  "ps1",
  "properties",
  "gradle",
  "pom",
]);
const DOCUMENT_ATTACHMENT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
]);
const IMAGE_ATTACHMENT_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "tiff",
  "tif",
  "bmp",
  "gif",
]);
const TEXT_ATTACHMENT_MIME_TYPES = new Set([
  "application/json",
  "application/xml",
  "application/javascript",
  "application/x-javascript",
  "application/sql",
  "text/csv",
  "text/markdown",
]);
const DOCUMENT_ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const IMAGE_ATTACHMENT_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/tiff",
  "image/bmp",
  "image/gif",
]);
const AI_ATTACHMENT_ACCEPT = [
  ...TEXT_ATTACHMENT_EXTENSIONS,
  ...DOCUMENT_ATTACHMENT_EXTENSIONS,
  ...IMAGE_ATTACHMENT_EXTENSIONS,
].map((extension) => `.${extension}`).join(",");

const getAttachmentExtension = (name: string) => {
  const normalized = name.toLowerCase();
  const index = normalized.lastIndexOf(".");
  return index >= 0 ? normalized.slice(index + 1) : "";
};

const isSupportedAiAttachmentFile = (file: File) => {
  const mimeType = file.type.toLowerCase();
  const extension = getAttachmentExtension(file.name);
  return (
    mimeType.startsWith("text/") ||
    TEXT_ATTACHMENT_MIME_TYPES.has(mimeType) ||
    DOCUMENT_ATTACHMENT_MIME_TYPES.has(mimeType) ||
    IMAGE_ATTACHMENT_MIME_TYPES.has(mimeType) ||
    TEXT_ATTACHMENT_EXTENSIONS.has(extension) ||
    DOCUMENT_ATTACHMENT_EXTENSIONS.has(extension) ||
    IMAGE_ATTACHMENT_EXTENSIONS.has(extension)
  );
};

const getAiAttachmentValidationError = (
  file: File,
  t: (key: any, values?: any) => string
) => {
  if (file.size > MAX_AI_ATTACHMENT_BYTES) {
    return t("attachmentRejectedTooLarge", {
      name: file.name,
      size: formatAttachmentSize(file.size),
      limit: formatAttachmentSize(MAX_AI_ATTACHMENT_BYTES),
    });
  }
  if (!isSupportedAiAttachmentFile(file)) {
    return t("attachmentRejectedUnsupported", { name: file.name });
  }
  return null;
};

const formatAttachmentSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const isTextAttachmentFile = (file: File) => {
  const mimeType = file.type.toLowerCase();
  return (
    mimeType.startsWith("text/") ||
    TEXT_ATTACHMENT_MIME_TYPES.has(mimeType) ||
    TEXT_ATTACHMENT_EXTENSIONS.has(getAttachmentExtension(file.name))
  );
};

const readInlineAttachmentText = async (file: File): Promise<string | null> => {
  if (!isTextAttachmentFile(file)) {
    return null;
  }

  try {
    const text = await file.slice(0, MAX_INLINE_ATTACHMENT_BYTES).text();
    const normalized = text.replace(/\r\n?/g, "\n").replace(/\u0000/g, "").trim();
    return normalized ? normalized.slice(0, MAX_INLINE_ATTACHMENT_CHARS) : null;
  } catch {
    return null;
  }
};

const extractErrorMessage = (error: unknown): string | null => {
  if (!error || typeof error !== "object") {
    return null;
  }

  const payload = (error as { payload?: unknown }).payload;
  const candidates: unknown[] = [];
  if (payload && typeof payload === "object") {
    const payloadObject = payload as {
      message?: unknown;
      error?: unknown;
      data?: { message?: unknown; error?: unknown };
    };
    candidates.push(
      payloadObject.message,
      payloadObject.error,
      payloadObject.data?.message,
      payloadObject.data?.error
    );
  } else if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload) as {
        message?: unknown;
        error?: unknown;
      };
      candidates.push(parsed.message, parsed.error);
    } catch {
      candidates.push(payload);
    }
  }

  if (error instanceof Error) {
    candidates.push(error.message);
  }

  const message = candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate.trim().length > 0
  );

  return message?.trim() ?? null;
};

const getAttachmentUploadErrorDescription = (
  error: unknown,
  t: (key: any, values?: any) => string
) => {
  const status =
    error && typeof error === "object" && "status" in error
      ? Number((error as { status?: unknown }).status)
      : null;
  const rawMessage = extractErrorMessage(error);
  const normalized = rawMessage?.toLowerCase() ?? "";

  if (
    status === 401 ||
    normalized.includes("jwt token") ||
    normalized.includes("unauthorized") ||
    normalized.includes("invalid or expired")
  ) {
    return t("attachFailedAuth");
  }

  if (
    status === 403 ||
    normalized.includes("access denied") ||
    normalized.includes("permission")
  ) {
    return t("attachFailedPermission");
  }

  if (
    status === 413 ||
    normalized.includes("too large") ||
    normalized.includes("maximum upload size")
  ) {
    return t("attachFailedTooLarge");
  }

  if (
    status === 503 ||
    normalized.includes("upstream service is unavailable") ||
    normalized.includes("service_unavailable")
  ) {
    return t("attachFailedFileServiceUnavailable");
  }

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("load failed")
  ) {
    return t("attachFailedNetwork");
  }

  if (rawMessage) {
    return t("attachFailedWithReason", { reason: rawMessage });
  }

  return t("attachFailed");
};

const getAttachmentPreviewUrl = (file: AttachedFileContext) =>
  file.previewUrl ||
  file.thumbnailUrl ||
  file.secureUrl ||
  file.publicUrl ||
  file.cloudinarySecureUrl ||
  file.cloudinaryUrl ||
  null;

const getAttachmentSourceUrl = (file: AttachedFileContext) =>
  file.secureUrl ||
  file.publicUrl ||
  file.cloudinarySecureUrl ||
  file.cloudinaryUrl ||
  file.previewUrl ||
  file.thumbnailUrl ||
  null;

const normalizeDirectAttachmentUrl = (url: string | null) => {
  if (!url?.trim()) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:" && parsed.protocol !== "blob:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

const isCurrentPageAttachmentUrl = (url: string) => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const parsed = new URL(url);
    return (
      parsed.origin === window.location.origin &&
      parsed.pathname === window.location.pathname
    );
  } catch {
    return false;
  }
};

const getSafeDirectAttachmentUrl = (url: string | null) => {
  const normalized = normalizeDirectAttachmentUrl(url);
  if (!normalized || isCurrentPageAttachmentUrl(normalized)) {
    return null;
  }
  return normalized;
};

const isImageAttachment = (file: AttachedFileContext) =>
  file.mimeType?.startsWith("image/") || file.fileType === "IMAGE";

const isVideoAttachment = (file: AttachedFileContext) =>
  file.mimeType?.startsWith("video/") || file.fileType === "VIDEO";

const isAudioAttachment = (file: AttachedFileContext) =>
  file.mimeType?.startsWith("audio/") || file.fileType === "AUDIO";

const isPdfAttachment = (file: AttachedFileContext) =>
  file.mimeType?.toLowerCase() === "application/pdf" ||
  getAttachmentExtension(file.name) === "pdf";

const getAccessToken = () =>
  typeof window === "undefined" ? null : getAccessTokenFromLocalStorage();

const buildAttachmentMediaUrl = (
  fileId: string,
  userId: string,
  variant: "content" | "thumbnail"
) =>
  `/api/proxy/files/${fileId}/${variant}?userId=${encodeURIComponent(userId)}`;

const fetchAttachmentBlob = async (
  file: AttachedFileContext,
  userId: string,
  variant: "content" | "thumbnail"
) => {
  if (!file.id || !userId) {
    throw new Error("Missing attachment id or user id");
  }
  const headers = new Headers();
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  const response = await fetch(buildAttachmentMediaUrl(file.id, userId, variant), {
    headers,
    credentials: "include",
  });
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || contentType.toLowerCase().includes("text/html")) {
    throw new Error(`Attachment media request failed: ${response.status}`);
  }

  const blob = await response.blob();
  const expectedType = file.mimeType?.trim();
  if (
    expectedType &&
    (!blob.type || blob.type === "application/octet-stream")
  ) {
    return blob.slice(0, blob.size, expectedType);
  }
  return blob;
};

const openPendingAttachmentTab = (fileName: string) => {
  const openedWindow = window.open("", "_blank");

  if (openedWindow) {
    openedWindow.document.title = fileName;
    openedWindow.document.body.innerHTML =
      '<div style="font-family: system-ui, sans-serif; padding: 24px; color: #334155;">Loading file...</div>';
  }

  return openedWindow;
};

const openBlobUrlInNewTab = (blob: Blob, targetWindow?: Window | null) => {
  const objectUrl = window.URL.createObjectURL(blob);

  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = objectUrl;
    targetWindow.opener = null;
  } else {
    const openedWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");

    if (openedWindow) {
      openedWindow.opener = null;
    } else {
      const link = document.createElement("a");
      link.href = objectUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 120_000);
};

const openExternalUrlInNewTab = (url: string, targetWindow?: Window | null) => {
  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = url;
    targetWindow.opener = null;
    return;
  }

  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (openedWindow) {
    openedWindow.opener = null;
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const closePendingAttachmentTab = (targetWindow?: Window | null) => {
  try {
    if (targetWindow && !targetWindow.closed) {
      targetWindow.close();
    }
  } catch {
    // Ignore browser restrictions around closing a tab after failed navigation.
  }
};

export default function AiChatPage() {
  const { toast } = useToast();
  const t = useTranslations("AiChat");
  const tCommon = useTranslations("common");
  const { isAuth } = useAppContext();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileContext[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<AttachedFileContext | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<{ id: string; label: string; startedAt: string }[]>([]);
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [customInstructionsDraft, setCustomInstructionsDraft] = useState<string>("");
  const [instructionsSavedAt, setInstructionsSavedAt] = useState<string | null>(null);
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
  const [analysisPanelWidth, setAnalysisPanelWidth] = useState<number>(640);
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
          return `${t("fileAnalysisSession")}: ${attachments[0].name}`;
        }
        return t("attachmentsCount", { count: attachments.length });
      }
      return t("newDraft");
    },
    [t]
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
        size: typeof item.size === "number" ? item.size : undefined,
        secureUrl: item.secureUrl ? String(item.secureUrl) : null,
        publicUrl: item.publicUrl ? String(item.publicUrl) : null,
        cloudinaryUrl: item.cloudinaryUrl ? String(item.cloudinaryUrl) : null,
        cloudinarySecureUrl: item.cloudinarySecureUrl ? String(item.cloudinarySecureUrl) : null,
        objectKey: item.objectKey ? String(item.objectKey) : null,
        thumbnailObjectKey: item.thumbnailObjectKey ? String(item.thumbnailObjectKey) : null,
        thumbnailUrl: item.thumbnailUrl ? String(item.thumbnailUrl) : null,
        previewUrl: item.previewUrl ? String(item.previewUrl) : null,
        content: item.content ? String(item.content) : null,
        excerpt: item.excerpt ? String(item.excerpt) : null,
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
      const local = buildLocalFollowUpActions(message, override, t);
      return mergeSuggestedActions(remoteNormalized, local, t);
    },
    [chartTypeOverrides, t]
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
    const savedInstructions = localStorage.getItem(CUSTOM_INSTRUCTIONS_STORAGE_KEY) || "";
    setCustomInstructions(savedInstructions);
    setCustomInstructionsDraft(savedInstructions);
    setInstructionsSavedAt(localStorage.getItem(CUSTOM_INSTRUCTIONS_SAVED_AT_KEY));
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
  const MIN_WORKSPACE = 420;
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
    const maxAllowed = Math.max(MIN_WORKSPACE, Math.min(960, headroom));
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
  const mobileWorkspaceOpen =
    workspaceRendered && !isDesktopViewport && !workspaceExpanded;

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
          title: String(candidate.title || t("savedAnalysisFallback")),
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
  }, [t]);

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
    const isOpen = workspaceExpanded || !!viewedSavedAnalysisId || mobileWorkspaceOpen;
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
        } else if (mobileWorkspaceOpen) {
          setAnalysisPanelOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [workspaceExpanded, viewedSavedAnalysisId, mobileWorkspaceOpen]);

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
      title: type === "up" ? t("feedbackThanksTitle") : t("feedbackImproveTitle"),
      description: type === "up" ? t("feedbackThanksDesc") : t("feedbackImproveDesc"),
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
            if (existing) {
              return prev.map((session) => (
                session.id === nextSessionId ? { ...session, label: pendingLabel } : session
              ));
            }
            return [{ id: nextSessionId, label: pendingLabel, startedAt: draftStartedAt }, ...prev];
          });
          sessionLabelsCache.current.set(nextSessionId, pendingLabel);
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
        if (completedSessionId) {
          queryClient.invalidateQueries({ queryKey: ["session-messages", completedSessionId] });
          queryClient.invalidateQueries({ queryKey: ["chat-sessions", userId] });
        }
      }
      pendingSessionLabelRef.current = null;
    },
    onError: (error) => {
      toast({
        title: tCommon("error"),
        description: error.message || t("streamingFailed"),
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
  const dbSessions = useMemo(() => sessionsData?.payload?.data ?? [], [sessionsData]);
  const currentSessionBelongsToUser = Boolean(
    sessionId && dbSessions.some((session: { id: string }) => session.id === sessionId)
  );
  
  // Fetch messages for current session from DB
  const { data: messagesData, isLoading: isSessionMessagesLoading, isFetching: isSessionMessagesFetching } = useGetSessionMessages(
    sessionId || "",
    currentSessionBelongsToUser
  );

  // Load userId from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserInfo = getUserInfoFromStorage();
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
        setTimeout(() => {
          setSidebarCollapsed(false);
          setRecentsOpen(true);
          setShowTour(true);
        }, 500);
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
    setSidebarCollapsed(false);
    setRecentsOpen(true);
    setShowTour(false);
    window.setTimeout(() => setShowTour(true), 120);
  };

  // Cache for session labels to avoid refetching
  const sessionLabelsCache = useRef<Map<string, string>>(new Map());

  // Sync sessions from DB
  useEffect(() => {
    if (dbSessions.length > 0 || sessionsData?.payload?.data) {
      const sessionsWithLabels = dbSessions.map((s: { id: string; userId: string; startedAt: string; title?: string | null }, idx: number) => {
        const serverLabel = typeof s.title === "string" && s.title.trim() ? s.title.trim() : null;
        const cachedLabel = sessionLabelsCache.current.get(s.id);
        const label = cachedLabel || serverLabel || `${t("session")} ${dbSessions.length - idx}`;
        if (serverLabel && !cachedLabel) {
          sessionLabelsCache.current.set(s.id, serverLabel);
        }
        return {
          id: s.id,
          label,
          startedAt: s.startedAt,
        };
      });

      setSessions(sessionsWithLabels);

      if (sessionId && !dbSessions.some((s: { id: string }) => s.id === sessionId)) {
        setSessionId(null);
        setMessages([]);
        setSelectedInsightMessageId(null);
        setLoadingSessionId(null);
        return;
      }

      // Auto-select most recent session if none selected
      if (!sessionId && !isDraftSession && dbSessions.length > 0) {
        setSessionId(dbSessions[0].id);
      }
    }
  }, [dbSessions, isDraftSession, sessionId, sessionsData?.payload?.data, t]);

  // Sync messages from DB when session changes
  useEffect(() => {
    // Don't clobber local state (user message + streaming placeholder) while a
    // stream is in progress — DB won't have the assistant reply yet.
    if (isStreaming || streamingAssistantIdRef.current) {
      return;
    }
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
      if (sessionId) {
        const isSelectedSessionLoad = loadingSessionId === sessionId;
        // When switching sessions, replace the old conversation even if the
        // newly loaded session has fewer messages. The length guard only
        // protects the currently active streaming session from stale DB data.
        setMessages((prev) => (
          isSelectedSessionLoad || hydratedMessages.length >= prev.length
            ? hydratedMessages
            : prev
        ));
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
      // Only clear if local is also empty — otherwise a stale empty
      // response would wipe the freshly streamed conversation.
      setMessages((prev) => (prev.length === 0 ? [] : prev));
      setLoadingSessionId((current) => (current === sessionId ? null : current));
    }
  }, [formatSessionLabel, hydrateAttachmentsFromMetadata, isSessionMessagesFetching, isSessionMessagesLoading, isStreaming, loadingSessionId, messagesData, sessionId]);

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
      title: String(queryResult.title || chartSpec.title || t("analysisWorkspace.fallbackTitle")),
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
  }, [activeAnalysisMessage, dismissedRefineMessageId, chartTypeOverrides, messages, t]);

  const handleDismissActiveAnalysis = useCallback(() => {
    if (!activeAnalysisMessage) return;
    setDismissedRefineMessageId(activeAnalysisMessage.id);
  }, [activeAnalysisMessage]);

  const buildRequestContext = useCallback((options?: { includeAttachments?: boolean }) => {
    const includeAttachments = options?.includeAttachments !== false;
    const context: Record<string, any> = {
      includeProgress: true,
    };
    if (customInstructions.trim()) {
      context.instructions = customInstructions.trim();
    }
    if (includeAttachments && attachedFiles.length > 0) {
      context.fileContexts = attachedFiles.map((file) => ({
        id: file.id,
        fileId: file.id,
        name: file.name,
        mimeType: file.mimeType,
        fileType: file.fileType,
        size: file.size,
        secureUrl: file.secureUrl,
        publicUrl: file.publicUrl,
        cloudinaryUrl: file.cloudinaryUrl,
        cloudinarySecureUrl: file.cloudinarySecureUrl,
        objectKey: file.objectKey,
        thumbnailObjectKey: file.thumbnailObjectKey,
        thumbnailUrl: file.thumbnailUrl,
        previewUrl: file.previewUrl,
        content: file.content,
        excerpt: file.excerpt,
        description: file.description,
      }));
    }
    if (activeAnalysisSnapshot) {
      context.activeAnalysis = activeAnalysisSnapshot;
    }
    return Object.keys(context).length > 0 ? context : undefined;
  }, [activeAnalysisSnapshot, attachedFiles, customInstructions]);

  const instructionsDirty = customInstructionsDraft !== customInstructions;

  const handleSaveCustomInstructions = useCallback(() => {
    const nextInstructions = customInstructionsDraft.trim();
    setCustomInstructions(nextInstructions);

    if (typeof window !== "undefined") {
      if (nextInstructions) {
        localStorage.setItem(CUSTOM_INSTRUCTIONS_STORAGE_KEY, nextInstructions);
      } else {
        localStorage.removeItem(CUSTOM_INSTRUCTIONS_STORAGE_KEY);
      }
      const savedAt = new Date().toISOString();
      localStorage.setItem(CUSTOM_INSTRUCTIONS_SAVED_AT_KEY, savedAt);
      setInstructionsSavedAt(savedAt);
    }

    toast({
      title: t("instructionsSavedTitle"),
      description: t("instructionsSavedDesc"),
    });
  }, [customInstructionsDraft, toast, t]);

  const handleResetCustomInstructions = useCallback(() => {
    setCustomInstructionsDraft(customInstructions);
  }, [customInstructions]);

  const handleAttachFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) {
      return;
    }
    if (!userId) {
      toast({
        title: tCommon("error"),
        description: t("loginBeforeAttach"),
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    const validation = selectedFiles.map((file) => ({
      file,
      error: getAiAttachmentValidationError(file, t),
    }));
    const rejected = validation.filter((item) => item.error);
    const acceptedFiles = validation.filter((item) => !item.error).map((item) => item.file);

    if (rejected.length > 0) {
      toast({
        title: t("unsupportedFilesTitle"),
        description: `${rejected
          .slice(0, 3)
          .map((item) => item.error)
          .join(" ")} ${t("supportedFilesHint")}`,
        variant: "destructive",
      });
    }

    if (acceptedFiles.length === 0) {
      event.target.value = "";
      return;
    }

    const uploaded: AttachedFileContext[] = [];
    try {
      for (const file of acceptedFiles) {
        const inlineText = await readInlineAttachmentText(file);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", userId);
        formData.append("description", t("attachedInAiChat"));
        formData.append("uploadSource", "AI_CHAT");
        const response = await uploadFileMutation.mutateAsync(formData);
        const payload = response?.payload?.data;
        if (payload?.id) {
          const fileType = payload.fileType ?? (
            file.type.startsWith("image/")
              ? "IMAGE"
              : file.type.startsWith("video/")
                ? "VIDEO"
                : file.type.startsWith("audio/")
                  ? "AUDIO"
                  : inlineText
                    ? "DOCUMENT"
                    : null
          );
          uploaded.push({
            id: payload.id,
            name: payload.name || payload.originalName || file.name,
            mimeType: payload.mimeType || file.type || undefined,
            fileType,
            size: payload.fileSize ?? file.size,
            secureUrl: payload.secureUrl ?? payload.cloudinarySecureUrl ?? null,
            publicUrl: payload.publicUrl ?? payload.cloudinaryUrl ?? null,
            cloudinaryUrl: payload.cloudinaryUrl ?? null,
            cloudinarySecureUrl: payload.cloudinarySecureUrl ?? null,
            objectKey: payload.objectKey ?? null,
            thumbnailObjectKey: payload.thumbnailObjectKey ?? null,
            thumbnailUrl: payload.thumbnailUrl ?? null,
            previewUrl:
              payload.thumbnailUrl ??
              payload.secureUrl ??
              payload.publicUrl ??
              payload.cloudinarySecureUrl ??
              payload.cloudinaryUrl ??
              null,
            content: inlineText,
            excerpt: inlineText ? inlineText.slice(0, 2500) : null,
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
          title: t("filesAttachedTitle"),
          description: t("filesAttachedDesc", { count: uploaded.length }),
        });
      }
    } catch (error) {
      console.error("Failed to upload AI chat attachments:", error);
      toast({
        title: tCommon("error"),
        description: getAttachmentUploadErrorDescription(error, t),
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
    }
  };

  const removeAttachedFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const handleOpenAttachment = useCallback(
    async (file: AttachedFileContext) => {
      const pendingWindow = openPendingAttachmentTab(file.name);

      if (!userId) {
        closePendingAttachmentTab(pendingWindow);
        toast({
          title: tCommon("error"),
          description: t("loginBeforeAttach"),
          variant: "destructive",
        });
        return;
      }

      try {
        const blob = await fetchAttachmentBlob(file, userId, "content");
        openBlobUrlInNewTab(blob, pendingWindow);
      } catch (error) {
        console.error("Failed to open attachment via authenticated proxy:", error);
        const fallbackUrl = getSafeDirectAttachmentUrl(getAttachmentSourceUrl(file));
        if (fallbackUrl) {
          openExternalUrlInNewTab(fallbackUrl, pendingWindow);
          return;
        }
        closePendingAttachmentTab(pendingWindow);
        toast({
          title: tCommon("error"),
          description: t("attachmentOpenFailed"),
          variant: "destructive",
        });
      }
    },
    [t, tCommon, toast, userId]
  );

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
          description: t("loginBeforeChat"),
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
        ?? (trimmed || t("attachedFileAnalysisPrompt", { count: attachedFiles.length }));

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: displayContent,
        timestamp: new Date(),
        attachments: options?.skipAttachments ? [] : attachedFiles,
      };

      setMessages((prev) => [...prev, userMessage]);
      const baseContext = buildRequestContext({
        includeAttachments: !options?.skipAttachments,
      });
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
    [
      attachedFiles,
      buildRequestContext,
      chatMutation,
      draftStartedAt,
      formatSessionLabel,
      resetStream,
      sendStreamingMessage,
      sessionId,
      t,
      tCommon,
      toast,
      useStreaming,
      userId,
    ]
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
          title: t("noCsvDataTitle"),
          description: t("noCsvDataDesc"),
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
      const safeName = (String(queryResult?.title || fallbackTitle || t("analysisWorkspace.fallbackTitle")))
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
    [toast, t]
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
        title: t("narrowScreenTitle"),
        description: t("narrowScreenDesc"),
      });
      return;
    }
    setAnalysisPanelOpen(true);
  }, [analysisPanelOpen, closeAnalysisWorkspace, toast, workspaceCanFit, t]);

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
          title: t("noTableCopyTitle"),
          description: t("noTableCopyDesc"),
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
          title: t("tableCopiedTitle"),
          description:
            format === "markdown"
              ? t("tableCopiedMarkdownDesc")
              : t("tableCopiedSheetDesc"),
        });
        return true;
      } catch {
        toast({
          title: tCommon("error"),
          description: t("tableCopyFailed"),
          variant: "destructive",
        });
        return false;
      }
    },
    [toast, tCommon, t]
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
          title: t("removedFromSavedTitle"),
          description: t("removedFromSavedDesc"),
        });
        return;
      }
      const metadata = message.metadata;
      if (!metadata || (!metadata.queryResult && !metadata.chartSpec)) {
        toast({
          title: t("nothingToSaveTitle"),
          description: t("nothingToSaveDesc"),
          variant: "destructive",
        });
        return;
      }
      const queryResult = metadata.queryResult;
      const chartSpec = metadata.chartSpec;
      const title = String(
        chartSpec?.title || queryResult?.title || message.content?.slice(0, 48) || t("savedAnalysisFallback")
      ).trim() || t("savedAnalysisFallback");
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
        title: t("analysisSavedTitle"),
        description: t("analysisSavedDesc"),
      });
    },
    [getLiveSavedEntryForMessage, getPromptForMessage, toast, t]
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
            title: t("chartTypeChangedTitle"),
            description: t("chartTypeChangedDesc", { type: nextType }),
          });
          return;
        }
        case "export_csv": {
          const ok = exportQueryResultAsCsv(metadata.queryResult, action.label || t("analysisWorkspace.fallbackTitle"));
          if (ok) {
            toast({ title: t("csvExportedTitle"), description: t("csvExportedDesc") });
          }
          return;
        }
        case "copy_sql": {
          const sql = String(metadata.queryResult?.sql || "").trim();
          if (!sql) {
            toast({
              title: t("noSqlCopyTitle"),
              description: t("noSqlCopyDesc"),
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
            toast({ title: t("sqlCopiedTitle"), description: t("sqlCopiedDesc") });
          } catch {
            toast({
              title: tCommon("error"),
              description: t("sqlCopyFailed"),
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
    [dispatchChatMessage, exportQueryResultAsCsv, tCommon, toast, t]
  );

  const sendComposerMessage = useCallback(async () => {
    if (!inputMessage.trim() && attachedFiles.length === 0) return;
    if (!userId) {
      toast({
        title: tCommon("error"),
        description: t("loginBeforeChat"),
        variant: "destructive",
      });
      return;
    }
    const messageToSend = inputMessage;
    setInputMessage("");
    await dispatchChatMessage(messageToSend);
  }, [attachedFiles.length, dispatchChatMessage, inputMessage, tCommon, toast, userId, t]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachedFiles.length === 0) return;
    if (!userId) {
      toast({
        title: tCommon("error"),
        description: t("loginBeforeChat"),
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage || t("attachedFileAnalysisPrompt", { count: attachedFiles.length }),
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
        description: t("loginBeforeSession"),
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
    setMessages([]);
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
                  className="text-foreground underline decoration-border decoration-1 underline-offset-2 hover:decoration-primary hover:text-primary transition-colors"
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
    const trace = Array.isArray(metadata?.trace) ? metadata.trace : [];
    const nodeTimings = metadata && typeof metadata === "object" && "nodeTimings" in metadata && metadata.nodeTimings
      ? Object.entries(metadata.nodeTimings as Record<string, number>)
      : [];
    const hasAgentSteps = !!metadata?.thinkingText || trace.length > 0 || nodeTimings.length > 0;
    if (!hasAgentSteps && !options?.isStreaming) {
      return null;
    }
    return (
      <div className="mb-4">
        <AgentStepsPanel
          trace={trace}
          nodeTimings={nodeTimings}
          thinkingText={metadata?.thinkingText}
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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
          {metadata.resolvedMode && (
            <span title={t("messageLabels.routeTitle")}>
              <span className="text-muted-foreground">{t("messageLabels.route")}</span>{" "}
              <span className="text-muted-foreground">{humanizeMode(metadata.resolvedMode, t)}</span>
            </span>
          )}
          {metadata.intent && (
            <span title={t("messageLabels.intentTitle")}>
              <span className="text-muted-foreground">{t("messageLabels.intent")}</span>{" "}
              <span className="text-muted-foreground">{humanizeIntent(metadata.intent, t)}</span>
            </span>
          )}
          {(metadata as any)?.tokensUsed ? (
            <span className="tabular-nums font-mono text-[10px]" title={t("messageLabels.tokensTitle")}>
              {String((metadata as any).tokensUsed)} tok
            </span>
          ) : null}
          {typeof metadata.confidence === "number" && (
            <span className="tabular-nums font-mono text-[10px]" title={t("messageLabels.confidenceTitle")}>
              {(metadata.confidence * 100).toFixed(0)}% confident
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
              "flex w-full items-center justify-between rounded-sm border-l-2 pl-4 pr-3 py-2.5 text-left transition-colors duration-150",
              options?.isSelected
                ? "border-primary bg-card"
                : "border-border bg-background hover:border-primary/40 hover:bg-muted"
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-ed-xs font-medium text-foreground">
                {t("analysisWorkspace.title")}
                {options?.isSelected ? (
                  <span className="inline-flex items-center rounded-sm border border-border bg-background px-1.5 py-0 text-[10px] font-normal text-primary tabular-nums">
                    {t("messageLabels.workspaceActive")}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {t("messageLabels.analysisWorkspaceDesc")}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          </button>
        ) : null}

        {citations.length > 0 && (
          <div className="border-l border-border pl-3 py-1">
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {t("analysisWorkspace.sources")}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
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
                      className="inline-flex items-baseline gap-1 text-[11px] text-muted-foreground underline decoration-border decoration-1 underline-offset-[5px] hover:text-primary hover:decoration-primary transition-colors"
                    >
                      {label}
                      <ExternalLink className="h-2.5 w-2.5 self-center" />
                    </a>
                  );
                }
                return (
                  <span key={`${label}-${index}`} className="inline-flex items-center text-[11px] text-muted-foreground font-mono">
                    {label}
                  </span>
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
            ? t("errorDelete")
            : t("clearAllPartialDeleted", {
                deleted: toDelete.length - failures.length,
                total: toDelete.length,
              }),
        variant: "destructive",
      });
      return;
    }
    toast({
      title: t("sessionDeleted"),
      description: t("clearAllDeleted", { count: toDelete.length }),
    });
  };

  const sessionsWithDraft = useMemo(() => {
    if (!isDraftSession) {
      return sessions;
    }
    const firstDraftMessage = messages.find((message) => message.role === "user");
    const draftLabel =
      inputMessage.trim()
        || (attachedFiles.length > 0 ? t("newDraftWithFiles", { count: attachedFiles.length }) : "")
        || (messages.find((message) => message.role === "user")?.content ?? "")
        || t("newDraft");
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
  }, [attachedFiles, draftStartedAt, formatSessionLabel, inputMessage, isDraftSession, messages, sessions, t]);

  const groupedSessions = groupSessionsByDate(sessionsWithDraft);
  const isSessionTransitioning = Boolean(sessionId && loadingSessionId === sessionId && (isSessionMessagesLoading || isSessionMessagesFetching));

  return (
    <div className="ai-chat-theme font-ui flex h-[calc(100vh-64px)] bg-background text-foreground relative">
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
          bg-background
          border-r border-border
          flex flex-col
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:transform-none lg:transition-[width] lg:duration-150
        `}>
        {/* Sidebar Header: brand + collapse toggle */}
        <div className="flex items-center justify-between px-3 h-12 border-b border-border">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-sm bg-primary flex items-center justify-center flex-shrink-0 font-sans text-[14px] leading-none text-primary-foreground">
                T
              </div>
              <span className="text-ed-sm font-medium text-foreground truncate tracking-tight">
                {t("headerTitle") || "Techhub AI"}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hidden lg:inline-flex text-muted-foreground hover:text-foreground hover:bg-transparent"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
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
            className={`w-full h-9 gap-2 rounded-sm bg-card hover:bg-muted/90 text-foreground border border-border shadow-none hover:border-primary/40 transition-colors ${sidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
          >
            <Plus className="h-3.5 w-3.5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-ed-sm">{t("newSession") || "New chat"}</span>}
          </Button>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Settings & Guide */}
            <div className="px-2 pt-2" id="ai-mode-selector">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 justify-start h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-transparent text-ed-xs"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-3.5 w-3.5 mr-2" />
                  {t("settings") || "Settings"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent"
                  onClick={handleStartTour}
                  title={t("guide")}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>

              {showSettings && (
                <div className="mt-2 rounded-sm border border-border bg-card p-3 space-y-3">
                  <div className="border-l-2 border-primary bg-background p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-sans italic text-ed-sm leading-none text-foreground">{t("sidebar.autoRoutingTitle")}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                      {t("sidebar.autoRoutingDesc")}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="custom-instructions" className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.12em]">
                      {t("sidebar.instructionsLabel")}
                    </Label>
                    <Textarea
                      id="custom-instructions"
                      value={customInstructionsDraft}
                      onChange={(event) => setCustomInstructionsDraft(event.target.value)}
                      placeholder={t("sidebar.instructionsPlaceholder")}
                      rows={4}
                      className="min-h-[92px] rounded-sm border-border bg-background text-ed-xs leading-6 focus-visible:border-primary/40 focus-visible:ring-0"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 rounded-sm bg-primary px-2.5 text-[11px] text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                        onClick={handleSaveCustomInstructions}
                        disabled={!instructionsDirty}
                      >
                        <CheckCircle className="mr-1.5 h-3 w-3" />
                        {t("sidebar.saveInstructions")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-sm px-2.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={handleResetCustomInstructions}
                        disabled={!instructionsDirty}
                      >
                        {t("sidebar.resetInstructions")}
                      </Button>
                      <span className={cn("text-[11px]", instructionsDirty ? "text-primary" : "text-muted-foreground")}>
                        {instructionsDirty
                          ? t("sidebar.instructionsUnsaved")
                          : instructionsSavedAt
                            ? t("sidebar.instructionsSaved")
                            : t("sidebar.instructionsNotSaved")}
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      {t("sidebar.instructionsHelp")}
                    </p>
                  </div>
                  <div className="hidden space-y-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="assistant-perspective" className="text-[11px] font-medium text-muted-foreground">
                        {t("sidebar.answerRole")}
                      </Label>
                      <Select
                        value={assistantPerspective}
                        onValueChange={(value: "learner" | "instructor" | "analyst") => setAssistantPerspective(value)}
                      >
                        <SelectTrigger id="assistant-perspective" className="h-9 rounded-xl border-border bg-card text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="learner">{t("sidebar.learner")}</SelectItem>
                          <SelectItem value="instructor">{t("sidebar.instructor")}</SelectItem>
                          <SelectItem value="analyst">{t("sidebar.analyst")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="response-depth" className="text-[11px] font-medium text-muted-foreground">
                        {t("sidebar.responseDepth")}
                      </Label>
                      <Select
                        value={responseDepth}
                        onValueChange={(value: "concise" | "balanced" | "detailed") => setResponseDepth(value)}
                      >
                        <SelectTrigger id="response-depth" className="h-9 rounded-xl border-border bg-card text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="concise">{t("sidebar.concise")}</SelectItem>
                          <SelectItem value="balanced">{t("sidebar.balanced")}</SelectItem>
                          <SelectItem value="detailed">{t("sidebar.detailed")}</SelectItem>
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

            {/* Conversations Header (collapsible) */}
            <div className="px-2 pt-5 pb-1 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRecentsOpen((o) => !o)}
                className="flex-1 flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground font-medium transition-colors"
                title={recentsOpen ? t("sidebar.hideConversations") : t("sidebar.showConversations")}
              >
                {recentsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <span>{t("yourConversations") || "Conversations"}</span>
              </button>
              {recentsOpen && sessions.length > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-[11px] text-muted-foreground hover:text-primary p-0 h-auto pr-2 underline decoration-border underline-offset-4 hover:decoration-primary"
                  onClick={handleClearAll}
                >
                  {t("clearAll") || "Clear all"}
                </Button>
              )}
            </div>

            {/* Session List */}
            {recentsOpen && (
            <ScrollArea className="flex-1 px-2" id="ai-session-list">
              <div className="space-y-0.5 pb-2">
                {groupedSessions.today.length > 0 && (
                  <>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-3 py-1.5 font-medium">{t("today") || "Today"}</p>
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
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-3 py-1.5 mt-3 font-medium">{t("lastDays") || "Last 7 Days"}</p>
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
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-3 py-1.5 mt-3 font-medium">{t("older") || "Older"}</p>
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
                        className="h-12 animate-pulse rounded-xl bg-muted"
                      />
                    ))}
                  </div>
                )}

                {sessions.length === 0 && !isSessionsLoading && !isSessionsFetching && (
                  <div className="text-center py-10 text-muted-foreground text-xs">
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
                    className="flex-1 flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground font-medium transition-colors"
                    title={savedSectionOpen ? t("sidebar.hideSavedAnalyses") : t("sidebar.showSavedAnalyses")}
                  >
                    {savedSectionOpen ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <span className="flex-1 text-left">{t("sidebar.savedAnalyses")}</span>
                    <span className="text-[10px] px-1.5 py-0 tabular-nums text-muted-foreground border border-border rounded-sm normal-case tracking-normal">
                      {savedAnalyses.length}
                    </span>
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
        <div className="border-t border-border p-2">
          <div className={`flex items-center gap-2 p-2 rounded-sm ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <Avatar className="h-7 w-7 flex-shrink-0 rounded-sm">
              <AvatarImage
                src={userProfile?.avatar || "/avatars/default-avatar.svg"}
                alt={userProfile?.fullName || userProfile?.username || "User"}
              />
              <AvatarFallback className="rounded-sm bg-primary text-primary-foreground text-[11px] font-medium tabular-nums">
                {(userProfile?.fullName || userProfile?.username || "U")
                  .substring(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-ed-xs font-medium text-foreground truncate">
                  {userProfile?.fullName || userProfile?.username || t("guest") || "Guest"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
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
            title={t("sidebar.dragResize")}
          >
            <div className="h-full w-px mx-auto bg-transparent group-hover:bg-primary transition-colors" />
          </div>
        )}
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-background min-w-0">
        {/* Top Header */}
        <header className="flex items-center justify-between px-3 sm:px-4 h-12 border-b border-border bg-background">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile sidebar open */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden text-muted-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            {/* Desktop expand when collapsed */}
            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hidden lg:inline-flex text-muted-foreground hover:text-foreground"
                onClick={() => setSidebarCollapsed(false)}
                title={t("sidebar.expand")}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-ed-sm font-medium text-foreground truncate tracking-tight">
              {t("headerTitle") || "Techhub AI"}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 rounded-sm px-2 text-ed-xs text-muted-foreground hover:bg-muted hover:text-foreground sm:px-3 border border-transparent hover:border-border transition-colors",
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
                  ? t("analysisWorkspace.workspaceTooNarrow")
                  : workspaceRendered
                    ? t("analysisWorkspace.hide")
                    : t("analysisWorkspace.open")
              }
            >
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">{workspaceRendered ? t("analysisWorkspace.hide") : t("analysisWorkspace.open")}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden text-muted-foreground hover:text-foreground"
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
          <div className="border-b border-border bg-card px-4 sm:px-6 py-2.5">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-foreground text-ed-xs">
                  {t("authRequired") || "Login required"}
                </p>
                <p className="text-[11px] text-muted-foreground hidden sm:block">
                  {t("authRequiredDesc") || "Please log in to use the AI workspace and save your history."}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1 min-h-0">
        <section className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col border-b border-border bg-background lg:min-w-[360px] lg:border-b-0",
        )}>
        {/* Chat Messages Area */}
        <ScrollArea className="flex-1 px-4 py-6 sm:px-6" ref={scrollAreaRef}>
          <div className="mx-auto w-full max-w-4xl space-y-8">
            {isSessionTransitioning && messages.length > 0 ? (
              <div className="sticky top-0 z-10 flex items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("messageLabels.loadingConversation")}
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
                        "animate-pulse rounded-[28px] border border-border bg-card p-5 shadow-sm",
                        index % 2 === 0 ? "mr-16" : "ml-16"
                      )}
                    >
                      <div className="h-3 w-24 rounded-full bg-muted" />
                      <div className="mt-4 space-y-2">
                        <div className="h-3 rounded-full bg-muted" />
                        <div className="h-3 w-5/6 rounded-full bg-muted" />
                        <div className="h-3 w-2/3 rounded-full bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-[60vh] flex-col items-start justify-center px-4 sm:px-8" id="ai-chat-welcome">
                <div className="mx-auto w-full max-w-2xl">
                  <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    {t("welcomePanel.eyebrow", { brand: t("headerTitle") })}
                  </div>
                  <h2 className="font-sans mt-6 text-[clamp(2.25rem,4.5vw,3.25rem)] font-normal leading-[1.05] text-foreground">
                    {t("welcomeTitle") || "Ask your data a question."}
                  </h2>
                  <p className="mt-5 max-w-xl text-ed-base text-muted-foreground">
                    {t("welcomePanel.description")}
                  </p>

                  <div className="mt-10 border-t border-border pt-6">
                    <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                      {t("welcomePanel.tryStartingPoint")}
                    </div>
                    <ul className="mt-4 space-y-3">
                      {[
                        t("welcomePanel.suggestion1"),
                        t("welcomePanel.suggestion2"),
                        t("welcomePanel.suggestion3"),
                        t("welcomePanel.suggestion4"),
                      ].map((suggestion) => (
                        <li key={suggestion}>
                          <button
                            type="button"
                            onClick={() => handlePresetPrompt(suggestion)}
                            className="group inline-flex items-baseline gap-3 text-left text-ed-base text-foreground underline decoration-border decoration-1 underline-offset-[6px] transition-colors hover:decoration-primary hover:text-primary"
                          >
                            <span aria-hidden className="text-muted-foreground font-mono text-ed-xs tabular-nums">
                              →
                            </span>
                            <span>{suggestion}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
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
                      <div className="max-w-[88%] sm:max-w-[72%]">
                        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground text-right mb-1.5">
                          {t("messageLabels.you")}
                        </div>
                        <div className="rounded-md border-l-2 border-primary bg-card px-4 py-3 text-ed-base leading-relaxed text-foreground shadow-card">
                          {message.attachments && message.attachments.length > 0 ? (
                            <div className="mb-3 flex flex-wrap justify-end gap-2">
                              {message.attachments.map((file) => (
                                <button
                                  type="button"
                                  key={`${message.id}-${file.id}`}
                                  onClick={() => setPreviewAttachment(file)}
                                  className="inline-flex max-w-[240px] items-center gap-2 rounded-sm border border-border bg-background px-2.5 py-1.5 text-left transition-colors hover:border-primary/40 hover:bg-muted"
                                  title={t("composer.previewAttachment")}
                                >
                                  <FileText className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                                  <div className="min-w-0">
                                    <div className="truncate text-ed-xs font-medium text-foreground">
                                      {file.name}
                                    </div>
                                    <div className="truncate text-[10px] text-muted-foreground">
                                      {file.mimeType || file.fileType || t("attachedFile")}
                                    </div>
                                  </div>
                                  <Maximize2 className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                                </button>
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
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm bg-primary font-sans text-[15px] leading-none text-primary-foreground">
                        T
                      </div>
                      <div
                        className={cn(
                          "min-w-0 flex-1 border-l transition-colors duration-150",
                          isSelectedInsight
                            ? "border-primary pl-5"
                            : "border-transparent pl-5"
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-baseline gap-3 text-ed-xs">
                            <span className="font-medium text-foreground">
                              {t("headerTitle") || "Techhub AI"}
                            </span>
                            <span className="text-muted-foreground">
                              {canSelectWorkspace ? t("messageLabels.analysis") : t("messageLabels.response")}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {message.metadata?.queryResult ? (
                              <ScopeBadge queryResult={message.metadata.queryResult} tone="prominent" />
                            ) : null}
                            {canSelectWorkspace ? (
                              <button
                                type="button"
                                onClick={() => setSelectedInsightMessageId(message.id)}
                                className="text-ed-xs text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
                              >
                                {isSelectedInsight ? t("messageLabels.workspaceActive") : t("messageLabels.openInWorkspace")}
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-3 text-ed-base leading-[1.75] text-foreground max-w-[68ch]">
                          {renderMessageAgentSteps(message, {
                            isStreaming: message.id === streamingAssistantId,
                          })}
                          {message.content === "..." ? (
                            <div className="flex gap-1 py-1">
                              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
                              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                            </div>
                          ) : message.id === streamingAssistantId ? (
                            message.content === "▌" || message.content === "" ? (
                              message.metadata?.thinkingText ? null : <ThinkingIndicator />
                            ) : (
                              <div>
                                <MarkdownRenderer content={message.content.replace(/▌+$/, "")} />
                                <span className="animate-pulse text-primary ml-0.5">▌</span>
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
                                variant="ghost"
                                size="sm"
                                className="rounded-sm border border-border bg-background px-3 h-8 text-ed-xs text-foreground hover:border-primary hover:text-primary hover:bg-muted transition-colors"
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
                          <div className="mt-3 text-ed-xs text-muted-foreground italic font-sans">
                            {t("messageLabels.clarificationSelected")}
                          </div>
                        )}
                        {message.id !== "typing" && message.id !== streamingAssistantId && (
                          <div className="mt-4 flex flex-wrap items-center gap-1 opacity-70 transition-opacity duration-200 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 w-7 rounded-sm p-0 ${feedbackState[message.id] === "up" ? "text-data-pos" : "text-muted-foreground hover:text-foreground hover:bg-transparent"}`}
                              onClick={() => handleFeedback(message.id, "up")}
                              disabled={!!feedbackState[message.id]}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 w-7 rounded-sm p-0 ${feedbackState[message.id] === "down" ? "text-[hsl(var(--data-neg))]" : "text-muted-foreground hover:text-foreground hover:bg-transparent"}`}
                              onClick={() => handleFeedback(message.id, "down")}
                              disabled={!!feedbackState[message.id]}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 rounded-sm p-0 text-muted-foreground hover:text-foreground hover:bg-transparent"
                              onClick={() => handleCopyMessage(message.id, message.content)}
                            >
                              {copiedMessageId === message.id ? (
                                <CheckCircle className="h-3.5 w-3.5 text-data-pos" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 rounded-sm px-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-transparent"
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
        <div className="border-t border-border bg-background px-4 pb-4 pt-3 sm:px-6">
          <div className="mx-auto w-full max-w-4xl">
            {attachedFiles.length > 0 && (
              <div className="mb-3 overflow-x-auto pb-1">
                <div className="flex min-w-max gap-2 pr-1">
                  {attachedFiles.map((file) => {
                    const isImage = isImageAttachment(file);
                    const isVideo = isVideoAttachment(file);
                    return (
                      <div
                        key={`claude-style-${file.id}`}
                        className="group relative flex w-[220px] items-center gap-3 rounded-2xl border border-border bg-card p-2.5 shadow-sm transition-colors hover:border-border"
                      >
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment(file)}
                          className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-border bg-muted text-left"
                          title={t("composer.previewAttachment")}
                        >
                          {isImage ? (
                            <AttachmentMediaPreview
                              file={file}
                              userId={userId}
                              variant="content"
                              renderAs="image"
                              className="h-full w-full object-cover"
                            />
                          ) : isVideo ? (
                            <AttachmentMediaPreview
                              file={file}
                              userId={userId}
                              variant="thumbnail"
                              renderAs="image"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <FileText className="h-4 w-4" />
                            </div>
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => setPreviewAttachment(file)}
                            className="block w-full truncate text-left text-sm font-medium text-foreground hover:text-primary"
                            title={t("composer.previewAttachment")}
                          >
                            {file.name}
                          </button>
                          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {file.mimeType || file.fileType || t("attachedFile")}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>{file.processingStatus || t("ready")}</span>
                            <button
                              type="button"
                              onClick={() => setPreviewAttachment(file)}
                              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground underline decoration-border decoration-1 underline-offset-4 hover:text-primary hover:decoration-primary"
                            >
                              <Maximize2 className="h-3 w-3" />
                              {t("composer.previewAttachment")}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAttachment(file)}
                              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground underline decoration-border decoration-1 underline-offset-4 hover:text-primary hover:decoration-primary"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {t("attachmentPreview.open")}
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachedFile(file.id)}
                          className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground transition-colors hover:text-[hsl(var(--data-neg))] hover:border-[hsl(var(--data-neg))]"
                          title={t("composer.removeFile")}
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
              accept={AI_ATTACHMENT_ACCEPT}
              className="hidden"
              onChange={handleAttachFiles}
            />
            {activeAnalysisSnapshot ? (
              <div className="mb-2 flex flex-wrap items-center gap-2 border-l-2 border-primary bg-card px-3 py-2 text-ed-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <span className="font-sans italic text-ed-sm leading-none">{t("composer.refining")}</span>
                </span>
                <span
                  className="max-w-[260px] truncate text-muted-foreground"
                  title={activeAnalysisSnapshot.title}
                >
                  {activeAnalysisSnapshot.title}
                </span>
                {activeAnalysisSnapshot.scopeLabel ? (
                  <span className="inline-flex items-center rounded-sm border border-border bg-background px-1.5 py-0 text-[10px] text-muted-foreground tabular-nums">
                    {activeAnalysisSnapshot.scopeLabel}
                  </span>
                ) : null}
                {activeAnalysisSnapshot.chartType ? (
                  <span className="inline-flex items-center rounded-sm border border-border bg-background px-1.5 py-0 text-[10px] text-muted-foreground tabular-nums">
                    {activeAnalysisSnapshot.chartType}
                  </span>
                ) : null}
                <span className="ml-auto flex items-center gap-2">
                  <span className="hidden text-[11px] text-muted-foreground sm:inline">
                    {t("composer.refineHelp")}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={handleDismissActiveAnalysis}
                    title={t("composer.startNewTopic")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </span>
              </div>
            ) : null}
            <div
              className="relative overflow-hidden rounded-sm border border-border bg-card px-3 py-2 transition-colors duration-150 focus-within:border-primary/40"
              id="ai-chat-input"
            >
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 flex-shrink-0 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!userId || uploadFileMutation.isPending || isStreaming}
                  title={t("composer.attachFiles")}
                >
                  {uploadFileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </Button>
                <div className="min-w-0 flex-1">
                  {attachedFiles.length > 0 ? (
                    <div className="mb-1.5 text-[11px] text-muted-foreground">
                      {attachedFiles.length === 1
                        ? t("composer.fileReady", { count: attachedFiles.length })
                        : t("composer.filesReady", { count: attachedFiles.length })}
                    </div>
                  ) : null}
                  <Textarea
                    placeholder={t("composer.placeholder")}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendComposerMessage();
                      }
                    }}
                    rows={1}
                    className="min-h-[44px] max-h-40 resize-none border-none bg-transparent px-0 py-2 text-ed-base leading-6 text-foreground shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
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
                  className="h-10 w-10 flex-shrink-0 rounded-sm bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground disabled:bg-muted disabled:text-muted-foreground transition-colors"
                >
                  {chatMutation.isPending || isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-2 hidden sm:block">
              {t("enterToSend") || "Press Enter to send, Shift + Enter for new line"}
            </p>
          </div>
        </div>
        </section>
        {workspaceRendered && isDesktopViewport && (
        <>
        <div
          onMouseDown={startAnalysisResize}
          className="relative hidden w-2 cursor-col-resize bg-transparent lg:block"
          title={t("sidebar.dragResize")}
        >
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors hover:bg-primary" />
        </div>
        <aside
          style={{ ['--analysis-w' as any]: `${effectiveAnalysisWidth}px` }}
          className="flex min-h-[34vh] w-full min-w-0 flex-col border-t border-border bg-card lg:min-h-0 lg:w-[var(--analysis-w)] lg:min-w-[420px] lg:max-w-[960px] lg:border-l lg:border-l-border lg:border-t-0"
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

      {/* Mobile analysis workspace overlay */}
      {mobileWorkspaceOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("analysisWorkspace.aria")}
          className="ai-chat-theme font-ui fixed inset-0 z-[60] flex flex-col bg-background lg:hidden"
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
        </div>
      ) : null}

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

      {previewAttachment ? (
        <AttachmentPreviewOverlay
          file={previewAttachment}
          userId={userId}
          onOpen={handleOpenAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      ) : null}

      {/* AI Chat Onboarding Tour */}
      {showTour && userProfile && (
        <AiChatOnboardingTour
          userName={userProfile.fullName || userProfile.username || t("defaultUserName")}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </div>
  );
}

function AttachmentMediaPreview({
  file,
  userId,
  variant,
  renderAs,
  className,
  fallbackClassName,
  controls,
}: {
  file: AttachedFileContext;
  userId: string;
  variant: "content" | "thumbnail";
  renderAs: "image" | "video" | "audio" | "pdf";
  className?: string;
  fallbackClassName?: string;
  controls?: boolean;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failedProxy, setFailedProxy] = useState(false);
  const [directFailed, setDirectFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let nextObjectUrl: string | null = null;

    setObjectUrl(null);
    setFailedProxy(false);
    setDirectFailed(false);

    if (!userId || !file.id) {
      setFailedProxy(true);
      return;
    }

    fetchAttachmentBlob(file, userId, variant)
      .then((blob) => {
        if (cancelled) return;
        nextObjectUrl = window.URL.createObjectURL(blob);
        setObjectUrl(nextObjectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setFailedProxy(true);
        }
      });

    return () => {
      cancelled = true;
      if (nextObjectUrl) {
        window.URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [file, userId, variant]);

  const directUrl =
    failedProxy && !directFailed
      ? getSafeDirectAttachmentUrl(
        renderAs === "image"
          ? getAttachmentPreviewUrl(file)
          : getAttachmentSourceUrl(file)
      )
      : null;
  const src = objectUrl || directUrl;
  const handleRenderError = () => {
    if (objectUrl) {
      setObjectUrl(null);
      setFailedProxy(true);
      return;
    }
    setDirectFailed(true);
  };

  if (src && renderAs === "image") {
    return (
      <img
        src={src}
        alt={file.name}
        className={className}
        onError={handleRenderError}
      />
    );
  }

  if (src && renderAs === "video") {
    return (
      <video
        src={src}
        controls={controls}
        className={className}
        onError={handleRenderError}
      />
    );
  }

  if (src && renderAs === "audio") {
    return (
      <audio
        src={src}
        controls={controls}
        className={className}
        onError={handleRenderError}
      />
    );
  }

  if (src && renderAs === "pdf") {
    return (
      <iframe
        src={src}
        title={file.name}
        className={className}
        onError={handleRenderError}
      />
    );
  }

  return (
    <div className={cn("flex h-full w-full items-center justify-center text-muted-foreground", fallbackClassName)}>
      {failedProxy ? <FileText className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  );
}

function AttachmentPreviewOverlay({
  file,
  userId,
  onOpen,
  onClose,
}: {
  file: AttachedFileContext;
  userId: string;
  onOpen: (file: AttachedFileContext) => void;
  onClose: () => void;
}) {
  const t = useTranslations("AiChat");
  const sourceUrl = getAttachmentSourceUrl(file);
  const textContent = (file.content || file.excerpt || "").trim();
  const displayText = textContent.slice(0, ATTACHMENT_PREVIEW_CHARS);
  const isTextTruncated = textContent.length > displayText.length;
  const isImage = isImageAttachment(file);
  const isVideo = isVideoAttachment(file);
  const isAudio = isAudioAttachment(file);
  const isPdf = isPdfAttachment(file);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("attachmentPreview.aria")}
      className="ai-chat-theme font-ui fixed inset-0 z-[70] flex flex-col bg-primary/60"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label={t("attachmentPreview.closeAria")}
      />
      <div className="relative m-0 flex h-full w-full flex-col overflow-hidden bg-background sm:m-6 sm:h-[calc(100vh-3rem)] sm:rounded-sm sm:border sm:border-border">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-background px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {t("attachmentPreview.title")}
            </div>
            <div className="mt-2 truncate text-ed-lg font-medium text-foreground">
              {file.name}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span>{file.mimeType || file.fileType || t("attachmentPreview.file")}</span>
              {typeof file.size === "number" ? <span>{t("attachmentPreview.bytes", { count: file.size })}</span> : null}
              {file.processingStatus ? <span>{file.processingStatus}</span> : null}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {sourceUrl || file.id ? (
              <button
                type="button"
                onClick={() => onOpen(file)}
                className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border px-2.5 text-ed-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t("attachmentPreview.open")}
              </button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onClose}
              title={t("attachmentPreview.closeTitle")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-card p-4 sm:p-6">
          {displayText ? (
            <div className="mx-auto h-full max-w-6xl overflow-hidden rounded-sm border border-border bg-background">
              <pre className="h-full overflow-auto p-4 text-[12px] leading-5 text-foreground">
                <code>{displayText}</code>
              </pre>
              {isTextTruncated ? (
                <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
                  {t("attachmentPreview.truncated")}
                </div>
              ) : null}
            </div>
          ) : isImage ? (
            <div className="flex h-full items-center justify-center">
              <AttachmentMediaPreview
                file={file}
                userId={userId}
                variant="content"
                renderAs="image"
                className="max-h-full max-w-full rounded-sm border border-border object-contain"
              />
            </div>
          ) : isVideo ? (
            <div className="flex h-full items-center justify-center">
              <AttachmentMediaPreview
                file={file}
                userId={userId}
                variant="content"
                renderAs="video"
                controls
                className="max-h-full max-w-full rounded-sm border border-border bg-black"
              />
            </div>
          ) : isAudio ? (
            <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-sm border border-border bg-background p-6">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <AttachmentMediaPreview
                file={file}
                userId={userId}
                variant="content"
                renderAs="audio"
                controls
                className="w-full"
              />
            </div>
          ) : isPdf ? (
            <div className="mx-auto h-full max-w-6xl overflow-hidden rounded-sm border border-border bg-background">
              <AttachmentMediaPreview
                file={file}
                userId={userId}
                variant="content"
                renderAs="pdf"
                className="h-full w-full bg-background"
              />
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-3 rounded-sm border border-border bg-background px-6 py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <div className="text-ed-base font-medium text-foreground">{t("attachmentPreview.unavailableTitle")}</div>
              <div className="max-w-md text-ed-sm text-muted-foreground">
                {t("attachmentPreview.unavailableDesc")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Claude-style shimmering "thinking" indicator
function ThinkingIndicator() {
  const t = useTranslations("AiChat");
  return (
    <div className="inline-flex items-baseline gap-2 text-ed-sm">
      <span className="font-sans italic text-muted-foreground">
        {t("runtime.thinking")}
      </span>
      <span className="flex gap-0.5 items-center">
        <span className="w-1 h-1 rounded-full bg-muted-foreground animate-pulse" />
        <span className="w-1 h-1 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0.2s" }} />
        <span className="w-1 h-1 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: "0.4s" }} />
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
  const t = useTranslations("AiChat");
  const [open, setOpen] = useState(false);
  const hasRuntime = !!requestId || nodeTimings.length > 0;
  const hasTrace = trace.length > 0;
  if (!hasRuntime && !hasTrace) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          {t("runtime.howBuilt")}
        </span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="pb-2 space-y-3 border-t border-border pt-2.5">
          {hasRuntime && (
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {t("runtime.howBuilt")}
              </div>
              {requestId && (
                <div className="mt-1 text-[11px] text-muted-foreground">
                  <span>{t("runtime.traceId")} </span>
                  <span className="text-muted-foreground font-mono tabular-nums break-all" title={t("runtime.traceIdTitle")}>{String(requestId)}</span>
                </div>
              )}
              {nodeTimings.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                  {nodeTimings.map(([step, duration]) => (
                    <span
                      key={step}
                      className="inline-flex items-baseline gap-1 text-[11px] text-muted-foreground"
                    >
                      <span className="text-muted-foreground">{humanizeAgentStep(step, t)}</span>
                      <span className="font-mono tabular-nums">{Number(duration).toFixed(0)}ms</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {hasTrace && (
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {t("runtime.reasoningSteps")}
              </div>
              <ol className="mt-1.5 space-y-0.5 list-none">
                {trace.slice(0, 6).map((item, index) => (
                  <li key={`${item.step || "step"}-${index}`} className="flex items-baseline gap-2 text-[11px] text-muted-foreground">
                    <span className="font-mono text-muted-foreground tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                    <span><span className="text-foreground font-medium">{humanizeAgentStep(item.step, t)}</span>{item.detail ? ` — ${item.detail}` : ""}</span>
                  </li>
                ))}
              </ol>
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
  const t = useTranslations("AiChat");
  const labels: string[] = Array.isArray(chartSpec?.data?.labels) ? chartSpec.data.labels : [];
  const datasets: Array<{ label?: string; values?: number[] }> = Array.isArray(chartSpec?.data?.datasets) ? chartSpec.data.datasets : [];
  const initialType = String(chartSpec.type || "bar").toLowerCase();
  const chartTitle = String(chartSpec.title || t("chart.title"));
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

  // Business workspace palette: primary blue, teal, neutral slate, warning amber.
  const DEFAULT_COLORS = ["#B4531A", "#3D5A80", "#2F6F3E", "#A23535", "#A68A64", "#6B5B95"];
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
      <div className="border-l border-border pl-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {t("chart.title")}
            </div>
            <div className="font-sans mt-1.5 text-[22px] leading-[1.15] text-foreground">
              {chartTitle}
            </div>
            {chartSubtitle ? (
              <p className="mt-2 max-w-[52ch] text-ed-sm leading-relaxed text-muted-foreground">
                {chartSubtitle}
              </p>
            ) : null}
          </div>
          {queryResult ? (
            <ScopeBadge queryResult={queryResult} tone="prominent" />
          ) : null}
        </div>
        <div className="mt-5 border-t border-dashed border-border py-10 text-center">
          {isStreaming ? (
            <div className="inline-flex items-center gap-2 text-ed-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("chart.waiting")}
            </div>
          ) : (
            <>
              <div className="font-sans text-ed-md italic text-muted-foreground">
                {t("chart.noData")}
              </div>
              <p className="mt-2 text-ed-xs leading-relaxed text-muted-foreground max-w-[46ch] mx-auto">
                {t("chart.noDataDesc")}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const seriesLabels = datasets.map((dataset, index) => dataset.label || t("chart.series", { index: index + 1 }));
  const stateMessage = allZero
    ? t("chart.allZero")
    : singleCategory
      ? t("chart.singleCategory")
      : null;
  const stateTone = allZero ? "warning" : singleCategory ? "info" : null;
  const chartNote = String(chartSpec.note || chartSpec.description || "").trim();
  const tooltipFormatter = (value: unknown, name: string) => [
    formatQueryResultValue(value, String(name || "value"), null, t),
    String(name),
  ];

  const GRID_COLOR = "#E8E6DF";
  const AXIS_COLOR = "#8A8A90";
  const axisTick = { fontSize: 11, fill: AXIS_COLOR, fontFamily: "var(--font-mono)" };
  const legendStyle = { fontSize: 11, fontFamily: "var(--font-ui)", color: "#54545A" };

  const renderChart = () => {
    if (selectedType === "line") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid stroke={GRID_COLOR} strokeWidth={1} vertical={false} />
            <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={{ stroke: GRID_COLOR }} tickFormatter={formatAxisTick} />
            <YAxis tick={axisTick} tickLine={false} axisLine={{ stroke: GRID_COLOR }} />
            <Tooltip formatter={tooltipFormatter} contentStyle={{ fontFamily: "var(--font-mono)", fontSize: 12, borderRadius: 2, border: "1px solid #E8E6DF", background: "#FFFFFF", color: "#0F0F10" }} />
            <Legend wrapperStyle={legendStyle} iconType="plainline" />
            {datasets.map((ds: any, i: number) => (
              <Line
                key={ds.label || i}
                type="monotone"
                dataKey={ds.label || "value"}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={1.75}
                dot={{ r: 2.5, strokeWidth: 0, fill: COLORS[i % COLORS.length] }}
                activeDot={{ r: 4, strokeWidth: 0, fill: COLORS[i % COLORS.length] }}
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
              paddingAngle={2}
              stroke="#FAFAF7"
              strokeWidth={2}
              label
            >
              {pieData.map((_: any, idx: number) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={tooltipFormatter} contentStyle={{ fontFamily: "var(--font-mono)", fontSize: 12, borderRadius: 2, border: "1px solid #E8E6DF", background: "#FFFFFF", color: "#0F0F10" }} />
            <Legend wrapperStyle={legendStyle} iconType="square" />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid stroke={GRID_COLOR} strokeWidth={1} vertical={false} />
          <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={{ stroke: GRID_COLOR }} tickFormatter={formatAxisTick} />
          <YAxis tick={axisTick} tickLine={false} axisLine={{ stroke: GRID_COLOR }} />
          <Tooltip formatter={tooltipFormatter} cursor={{ fill: "rgba(15,15,16,0.04)" }} contentStyle={{ fontFamily: "var(--font-mono)", fontSize: 12, borderRadius: 2, border: "1px solid #E8E6DF", background: "#FFFFFF", color: "#0F0F10" }} />
          <Legend wrapperStyle={legendStyle} iconType="square" />
          {datasets.map((ds: any, i: number) => (
            <Bar key={ds.label || i} dataKey={ds.label || "value"} fill={COLORS[i % COLORS.length]} radius={[2, 2, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="border-l border-border pl-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Chart
            <span className="inline-flex items-center rounded-sm border border-border bg-background px-1.5 py-0 text-[10px] tabular-nums normal-case tracking-normal text-muted-foreground">
              {selectedType}
            </span>
            {queryResult ? (
              <ScopeBadge queryResult={queryResult} tone="prominent" />
            ) : null}
          </div>
          <div className="font-sans mt-1.5 text-[22px] leading-[1.15] text-foreground">
            {chartTitle}
          </div>
          {chartSubtitle ? (
            <p className="mt-2 max-w-[52ch] text-ed-sm leading-relaxed text-muted-foreground">
              {chartSubtitle}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={cn(
                "h-7 px-2.5 text-[11px] capitalize rounded-sm border transition-colors",
                selectedType === type
                  ? "border-primary text-foreground bg-card"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40 bg-background"
              )}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 rounded-sm px-2 text-[11px] text-muted-foreground border border-border hover:border-primary/40 hover:bg-transparent hover:text-foreground"
            disabled={chartDownloading}
            onClick={handleDownloadChartAsPng}
            title={t("chart.downloadPng")}
          >
            {chartDownloading ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Download className="mr-1 h-3 w-3" />
            )}
            PNG
          </Button>
        </div>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-1 sm:grid-cols-3 border-t border-border pt-4">
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("chart.categories")}</dt>
          <dd className="mt-1 text-ed-sm font-medium text-foreground tabular-nums">{labels.length}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("chart.seriesLabel")}</dt>
          <dd className="mt-1 text-ed-sm font-medium text-foreground tabular-nums">{seriesLabels.length}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("chart.dataPoints")}</dt>
          <dd className="mt-1 text-ed-sm font-medium text-foreground tabular-nums">{totalPoints}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {seriesLabels.map((seriesLabel, index) => (
          <span
            key={`${seriesLabel}-${index}`}
            className="inline-flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums"
          >
            <span
              className="inline-block h-2 w-2 rounded-sm"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            {seriesLabel}
          </span>
        ))}
      </div>

      {stateMessage ? (
        <div
          className={cn(
            "mt-4 border-l-2 px-4 py-2.5 text-ed-xs leading-relaxed italic font-sans",
            stateTone === "warning"
              ? "border-primary text-muted-foreground bg-card"
              : "border-[hsl(var(--data-info))] text-muted-foreground bg-card"
          )}
        >
          {stateMessage}
        </div>
      ) : null}

      <div
        ref={chartSvgContainerRef}
        className="mt-5 border border-border bg-card px-2 py-3"
      >
        {renderChart()}
      </div>

      {chartNote ? (
        <div className="mt-4 text-ed-sm leading-relaxed text-muted-foreground italic font-sans max-w-[68ch] border-l-2 border-border pl-3">
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
  hint?: ColumnFormatHint | null,
  t?: (key: any, values?: any) => string
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
    return value ? (t ? t("yes") : "Yes") : (t ? t("no") : "No");
  }

  if (kind === "datetime" && typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString();
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatQueryResultValue(item, column, hint, t)).join(", ");
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
  const t = useTranslations("AiChat");
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
    <div className="border-l border-border pl-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {t("queryResultPanel.title")}
            <ScopeBadge queryResult={queryResult} tone="inline" />
            {queryResult.metric ? (
              <span className="inline-flex items-center rounded-sm border border-border bg-background px-1.5 py-0 text-[10px] tabular-nums normal-case tracking-normal text-muted-foreground">
                {String(queryResult.metric)}
              </span>
            ) : null}
          </div>
          {queryResult.summary ? (
            <p className="mt-2 text-ed-sm leading-relaxed text-foreground max-w-[68ch] font-sans italic">
              {String(queryResult.summary)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 xl:max-w-[45%] xl:justify-end">
          {onCopyTable && rows.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 rounded-sm px-2.5 text-[11px] text-muted-foreground border border-border hover:border-primary/40 hover:bg-transparent hover:text-foreground"
              onClick={() => onCopyTable("tsv")}
              title={t("queryResultPanel.copyTableTitle")}
            >
              <Copy className="mr-1 h-3 w-3" />
              {t("queryResultPanel.copy")}
            </Button>
          ) : null}
          {onExportCsv && rows.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 rounded-sm px-2.5 text-[11px] text-muted-foreground border border-border hover:border-primary/40 hover:bg-transparent hover:text-foreground"
              onClick={onExportCsv}
              title={t("queryResultPanel.downloadCsvTitle")}
            >
              <Download className="mr-1 h-3 w-3" />
              {t("queryResultPanel.csv")}
            </Button>
          ) : null}
        </div>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-1 sm:grid-cols-3 border-t border-border pt-4">
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("queryResultPanel.scope")}</dt>
          <dd className="mt-1 text-ed-sm font-medium text-foreground">{humanizeScope(queryResult.scopeLabel || queryResult.scope, t)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("queryResultPanel.rowsLoaded")}</dt>
          <dd className="mt-1 text-ed-sm font-medium text-foreground tabular-nums">{rows.length} / {totalRows}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("queryResultPanel.columns")}</dt>
          <dd className="mt-1 break-words text-ed-sm font-medium text-foreground font-mono">{columns.join(", ") || t("queryResultPanel.none")}</dd>
        </div>
      </dl>

      {rows.length > 0 && columns.length > 0 ? (
        <>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[11px] text-muted-foreground tabular-nums">
              {t("queryResultPanel.showingRows", {
                start: startIndex + 1,
                end: endIndex,
                total: rows.length,
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{t("queryResultPanel.rowsPerPage")}</span>
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
                  <SelectTrigger className="h-7 w-[72px] text-[11px] rounded-sm border-border bg-background focus:ring-0 focus:border-primary/40 tabular-nums">
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
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] rounded-sm text-muted-foreground border border-border hover:border-primary/40 hover:bg-transparent hover:text-foreground disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronRight className="mr-1 h-3 w-3 rotate-180" />
                  {t("queryResultPanel.prev")}
                </Button>
                <span className="h-7 rounded-sm px-2 text-[10px] border border-border bg-background inline-flex items-center text-muted-foreground tabular-nums font-mono">
                  {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] rounded-sm text-muted-foreground border border-border hover:border-primary/40 hover:bg-transparent hover:text-foreground disabled:opacity-40"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  {t("queryResultPanel.next")}
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-3 border border-border bg-card">
            <div className="max-h-[24rem] overflow-auto">
              <table className="min-w-full text-left text-[12.5px]">
                <thead className="sticky top-0 z-10 bg-background">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="whitespace-nowrap border-b border-border px-3 py-2 font-medium uppercase tracking-[0.1em] text-[10px] text-muted-foreground"
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
                      className="border-b border-border align-top last:border-0 hover:bg-muted/60"
                    >
                      {columns.map((column) => {
                        const formatted = formatQueryResultValue(
                          row?.[column],
                          column,
                          columnMetaMap[column],
                          t
                        );
                        const compact = formatted.length > 120 ? `${formatted.slice(0, 117)}…` : formatted;
                        const isNumeric = typeof row?.[column] === "number";
                        return (
                          <td
                            key={`${page}-${rowIndex}-${column}`}
                            className={cn(
                              "max-w-[280px] px-3 py-2 text-foreground",
                              isNumeric && "font-mono tabular-nums"
                            )}
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
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="uppercase tracking-[0.18em] text-[10px]">{t("queryResultPanel.sources")}</span>
              {tableNames.map((tableName) => (
                <span key={tableName} className="font-mono text-muted-foreground">{tableName}</span>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-3 border-l-2 border-border bg-card px-3 py-3 text-ed-sm text-muted-foreground italic font-sans">
          {t("queryResultPanel.noRows")}
        </div>
      )}
    </div>
  );
}

type AnalysisTab = "data" | "sql" | "chart" | "sources";

function humanizeIntent(intent?: string, t?: (key: any, values?: any) => string): string {
  if (!intent) return "";
  const key = intent.trim().toLowerCase();
  const map: Record<string, string> = {
    data_query: t ? t("humanized.dataQuestion") : "Data question",
    analytics: t ? t("humanized.dataQuestion") : "Data question",
    sql: t ? t("humanized.dataQuestion") : "Data question",
    visualization: t ? t("humanized.chartRequest") : "Chart request",
    chart: t ? t("humanized.chartRequest") : "Chart request",
    advisor: t ? t("humanized.advice") : "Advice",
    recommendation: t ? t("humanized.advice") : "Advice",
    general: t ? t("humanized.conversation") : "Conversation",
    chat: t ? t("humanized.conversation") : "Conversation",
    clarification: t ? t("humanized.clarifyingQuestion") : "Clarifying question",
    hitl: t ? t("humanized.clarifyingQuestion") : "Clarifying question",
  };
  if (map[key]) return map[key];
  return intent
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function humanizeMode(mode?: string, t?: (key: any, values?: any) => string): string {
  if (!mode) return "";
  const key = mode.trim().toUpperCase();
  const map: Record<string, string> = {
    AUTO: t ? t("humanized.autoRouted") : "Auto-routed",
    GENERAL: t ? t("humanized.conversation") : "Conversation",
    ADVISOR: t ? t("humanized.advisor") : "Advisor",
  };
  return map[key] || mode.charAt(0) + mode.slice(1).toLowerCase();
}

function humanizeScope(scope?: string | null, t?: (key: any, values?: any) => string): string {
  if (!scope) return t ? t("humanized.analytics") : "Analytics";
  const key = String(scope).trim().toLowerCase();
  if (!key) return t ? t("humanized.analytics") : "Analytics";
  const map: Record<string, string> = {
    personal: t ? t("humanized.myData") : "My data",
    user: t ? t("humanized.myData") : "My data",
    platform: t ? t("humanized.platformWide") : "Platform-wide",
    system: t ? t("humanized.platformWide") : "Platform-wide",
    global: t ? t("humanized.platformWide") : "Platform-wide",
    unknown: t ? t("humanized.analytics") : "Analytics",
  };
  if (map[key]) return map[key];
  return String(scope)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function humanizeExecutionMode(mode?: string, t?: (key: any, values?: any) => string): string {
  if (!mode) return "";
  const key = mode.trim().toLowerCase();
  if (key === "deterministic_fallback") return t ? t("humanized.directQuery") : "Direct query";
  if (key === "llm_planner") return t ? t("humanized.llmPlanner") : "LLM planner";
  return mode
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function humanizeAgentStep(step?: string, t?: (key: any, values?: any) => string) {
  if (!step) return t ? t("runtime.agentStep") : "Agent step";
  return step
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildAgentSteps({
  trace,
  nodeTimings,
  thinkingText,
  t,
}: {
  trace: MessageTraceItem[];
  nodeTimings: Array<[string, number]>;
  thinkingText?: string;
  t?: (key: any, values?: any) => string;
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
        title: humanizeAgentStep(item.step, t),
        detail,
        duration,
        status,
      };
    });
  }

  if (nodeTimings.length > 0) {
    return nodeTimings.map(([step, duration]) => ({
      key: step,
      title: humanizeAgentStep(step, t),
      detail: t ? t("runtime.completedStep") : "Completed orchestration step.",
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
    title: index === 0 ? (t ? t("runtime.reasoning") : "Reasoning") : `${t ? t("runtime.reasoning") : "Reasoning"} ${index + 1}`,
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
  const t = useTranslations("AiChat");
  const steps = useMemo(
    () => buildAgentSteps({ trace, nodeTimings, thinkingText, t }),
    [trace, nodeTimings, thinkingText, t]
  );
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded) return;
    setOpenSteps((current) => {
      const next = { ...current };
      let changed = false;
      steps.forEach((step) => {
        if (next[step.key] === undefined) {
          next[step.key] = true;
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [isExpanded, steps]);

  if (steps.length === 0) {
    return isStreaming ? (
      <div className="border-l border-border pl-4 py-2">
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          {t("runtime.agentTrace")}
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-[10px] text-primary normal-case tracking-normal italic font-sans">{t("runtime.live")}</span>
        </div>
      </div>
    ) : null;
  }

  return (
    <div className="border-l border-border pl-4 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          {t("runtime.agentTrace")}
          <span className="tabular-nums">({steps.length})</span>
          {isStreaming ? (
            <span className="text-[10px] text-primary normal-case tracking-normal italic font-sans">{t("runtime.live")}</span>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 rounded-sm px-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-transparent"
          onClick={() => {
            const next = !isExpanded;
            setIsExpanded(next);
            setOpenSteps(
              next
                ? Object.fromEntries(steps.map((step) => [step.key, true]))
                : {}
            );
          }}
        >
          {isExpanded ? t("runtime.hide") : t("runtime.show")}
        </Button>
      </div>

      {isExpanded ? (
      <ol className="mt-2 space-y-1 list-none">
        {steps.map((step, idx) => {
          const isOpen = openSteps[step.key] ?? false;
          const isWarning = step.status === "warning";
          return (
            <li key={step.key} className="text-ed-xs">
              <button
                type="button"
                className="flex w-full items-baseline justify-between gap-2 text-left py-1 hover:text-foreground transition-colors group"
                onClick={() =>
                  setOpenSteps((current) => ({
                    ...current,
                    [step.key]: !isOpen,
                  }))
                }
              >
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="font-mono text-muted-foreground tabular-nums">{String(idx + 1).padStart(2, "0")}</span>
                  <span className={cn("flex-shrink-0 self-center", isWarning ? "text-primary" : "text-data-pos")}>
                    {isWarning ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                  </span>
                  <span className="text-muted-foreground group-hover:text-foreground truncate">{step.title}</span>
                </div>
                {typeof step.duration === "number" ? (
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
                    {step.duration.toFixed(1)}ms
                  </span>
                ) : null}
              </button>
              <div
                className={cn(
                  "overflow-hidden pl-8 transition-all duration-150",
                  isOpen ? "max-h-40 pb-1.5 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="text-[11px] leading-relaxed text-muted-foreground italic font-sans">
                  {step.detail || t("runtime.completedStep")}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      ) : null}
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
  const t = useTranslations("AiChat");
  const sql = String(queryResult?.sql || "").trim();
  const explanation = String(queryResult?.explanation || "").trim();
  const executionMode = String(queryResult?.executionMode || "llm_planner").trim();
  const scopeLabel = humanizeScope(queryResult?.scopeLabel || queryResult?.scope, t);
  const tables = Array.isArray(queryResult?.tables) ? queryResult.tables.map((tableName: unknown) => String(tableName)) : [];
  const policy = queryResult?.policy && typeof queryResult.policy === "object" ? queryResult.policy : null;
  const logicSummary = queryResult?.logicSummary && typeof queryResult.logicSummary === "object" ? queryResult.logicSummary : null;
  const rowCount =
    typeof queryResult?.rowCount === "number"
      ? queryResult.rowCount
      : Array.isArray(queryResult?.rows)
        ? queryResult.rows.length
        : 0;
  const [sqlOpen, setSqlOpen] = useState(false);

  if (!sql) {
    return (
      <div className="border-l border-border pl-4 py-6 text-ed-sm text-muted-foreground italic font-sans">
        {t("sqlPanel.noSql")}
      </div>
    );
  }

  return (
    <div className="border-l border-border pl-4">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-border">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {t("sqlPanel.eyebrow")}
          </div>
          <div className="font-sans mt-1.5 text-[22px] leading-[1.15] text-foreground">
            {t("sqlPanel.title")}
          </div>
          <p className="mt-2 text-ed-sm leading-relaxed text-muted-foreground max-w-[52ch]">
            {t("sqlPanel.description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {queryResult ? <ScopeBadge queryResult={queryResult} tone="prominent" /> : null}
          <span className="inline-flex items-center rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
            {humanizeExecutionMode(executionMode, t)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-sm px-2.5 text-ed-xs text-muted-foreground border border-border hover:border-primary/40 hover:bg-transparent hover:text-foreground"
            onClick={() => onCopySql(message.id, sql)}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            {t("sqlPanel.copySql")}
          </Button>
        </div>
      </div>

      <div className="space-y-5 py-5">
        <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-3">
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("queryResultPanel.scope")}</dt>
            <dd className="mt-1 text-ed-sm font-medium text-foreground">{scopeLabel}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("sqlPanel.tables")}</dt>
            <dd className="mt-1 text-ed-sm font-medium text-foreground tabular-nums">{tables.length}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("sqlPanel.rowsReturned")}</dt>
            <dd className="mt-1 text-ed-sm font-medium text-foreground tabular-nums">{rowCount}</dd>
          </div>
        </dl>

        {explanation ? (
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {t("sqlPanel.queryExplanation")}
            </div>
            <p className="mt-2 text-ed-sm leading-[1.75] text-foreground max-w-[68ch]">
              {explanation}
            </p>
          </div>
        ) : null}

        {logicSummary ? (
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {t("sqlPanel.logicSummary")}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(logicSummary).map(([key, value]) => (
                <span key={key} className="inline-flex items-center rounded-sm border border-border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground font-mono tabular-nums">
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {tables.length > 0 ? (
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {t("sqlPanel.tablesReferenced")}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tables.map((tableName) => (
                <span key={tableName} className="inline-flex items-center rounded-sm border border-border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground font-mono">
                  {tableName}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {policy ? (
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {t("sqlPanel.runtimePolicy")}
            </div>
            <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-3">
              <div>
                <dt className="text-[11px] text-muted-foreground">{t("sqlPanel.yourRole")}</dt>
                <dd className="mt-0.5 text-ed-sm font-medium text-foreground capitalize">{policy.userRole ? String(policy.userRole).toLowerCase() : "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">{t("sqlPanel.maxRows")}</dt>
                <dd className="mt-0.5 text-ed-sm font-medium text-foreground tabular-nums">{policy.sqlMaxRows != null ? String(policy.sqlMaxRows) : "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">{t("sqlPanel.personalData")}</dt>
                <dd className="mt-0.5 text-ed-sm font-medium text-foreground">{policy.piiAccess ? t("sqlPanel.included") : t("sqlPanel.excluded")}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        <div className="border-t border-border pt-4">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left"
            onClick={() => setSqlOpen((current) => !current)}
          >
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {t("sqlPanel.rawSql")}
              </div>
              <div className="mt-0.5 text-ed-sm font-medium text-foreground">
                {sqlOpen ? t("sqlPanel.collapseStatement") : t("sqlPanel.expandStatement")}
              </div>
            </div>
            {sqlOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          <div
            className={cn(
              "overflow-hidden transition-all duration-200",
              sqlOpen ? "max-h-[520px] mt-3" : "max-h-0"
            )}
          >
            <pre className="font-mono min-w-full whitespace-pre-wrap break-words border border-border bg-card px-4 py-3.5 text-[12.5px] leading-[1.65] text-foreground">
              {sql}
            </pre>
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
  const t = useTranslations("AiChat");
  const kind = resolveScopeKind(queryResult);
  const explicitLabel = String(queryResult?.scopeLabel || "").trim();
  const fallbackLabel =
    kind === "personal"
      ? t("humanized.myData")
      : kind === "platform"
        ? t("humanized.platformWide")
        : t("humanized.dataScope");
  const label = explicitLabel || fallbackLabel;
  const Icon = kind === "personal" ? UserRound : kind === "platform" ? Globe : Database;
  const toneClass =
    kind === "personal"
      ? "border-primary/40 text-primary"
      : kind === "platform"
        ? "border-[hsl(var(--data-info))]/40 text-data-info"
        : "border-border text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border bg-background font-medium normal-case tracking-normal",
        tone === "prominent" ? "px-2 py-0.5 text-[11px]" : "px-1.5 py-0 text-[10px]",
        toneClass
      )}
      title={
        kind === "personal"
          ? t("scopeBadge.personalTitle")
          : kind === "platform"
            ? t("scopeBadge.platformTitle")
            : t("scopeBadge.unknownTitle")
      }
    >
      <Icon className={tone === "prominent" ? "h-3 w-3" : "h-2.5 w-2.5"} />
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

function buildLocalFollowUpActions(
  message: Message,
  currentChartType?: string,
  t?: (key: any, values?: any) => string
): SuggestedAction[] {
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
      chartAlternatives.push({ id: "chart-line", label: t ? t("followUps.chartLine") : "Chuyển sang biểu đồ đường", type: "line", icon: "chart-line" });
    }
    if (effectiveChartType !== "bar") {
      chartAlternatives.push({ id: "chart-bar", label: t ? t("followUps.chartBar") : "Chuyển sang biểu đồ cột", type: "bar", icon: "chart-bar" });
    }
    if (effectiveChartType !== "pie") {
      chartAlternatives.push({ id: "chart-pie", label: t ? t("followUps.chartPie") : "Chuyển sang biểu đồ tròn", type: "pie", icon: "chart-pie" });
    }
    chartAlternatives.slice(0, 2).forEach((alt) => {
      actions.push({
        id: alt.id,
        label: alt.label,
        description: t ? t("followUps.chartChangeDesc", { type: alt.type }) : `Hiển thị lại dữ liệu hiện tại dưới dạng biểu đồ ${alt.type}.`,
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
      label: t ? t("followUps.scopePlatform") : "So sánh với toàn hệ thống",
      description: t ? t("followUps.scopePlatformDesc") : "Chạy lại truy vấn trên dữ liệu toàn hệ thống để đối chiếu.",
      kind: "prompt",
      prompt: t ? t("followUps.scopePlatformPrompt", { metric }) : `So sánh ${metric} của tôi với toàn hệ thống`,
      icon: "scope",
      tone: "primary",
    });
  } else if (scope === "platform") {
    actions.push({
      id: "scope-personal",
      label: t ? t("followUps.scopePersonal") : "Chỉ lấy dữ liệu của tôi",
      description: t ? t("followUps.scopePersonalDesc") : "Thu hẹp lại truy vấn về dữ liệu cá nhân của bạn.",
      kind: "prompt",
      prompt: t ? t("followUps.scopePersonalPrompt", { metric }) : `Chỉ lấy ${metric} của tôi`,
      icon: "scope",
      tone: "primary",
    });
  }

  if (hasSql) {
    actions.push({
      id: "explain-sql",
      label: t ? t("followUps.explainSql") : "Giải thích câu SQL này",
      description: t ? t("followUps.explainSqlDesc") : "Nhờ trợ lý mô tả từng bước của câu SQL vừa chạy.",
      kind: "prompt",
      prompt: t ? t("followUps.explainSqlPrompt") : "Giải thích chi tiết câu SQL vừa chạy: từng bước làm gì, tại sao dùng các mệnh đề JOIN và WHERE như vậy.",
      icon: "explain",
      tone: "secondary",
    });
  }

  if (hasRows) {
    actions.push({
      id: "export-csv",
      label: t ? t("followUps.exportCsv") : "Xuất CSV",
      description: t ? t("followUps.exportCsvDesc") : "Tải xuống toàn bộ kết quả dạng CSV.",
      kind: "export_csv",
      icon: "download",
      tone: "secondary",
    });
  }

  if (hasSql) {
    actions.push({
      id: "copy-sql",
      label: t ? t("followUps.copySql") : "Sao chép SQL",
      description: t ? t("followUps.copySqlDesc") : "Sao chép câu SQL đã chạy vào clipboard.",
      kind: "copy_sql",
      icon: "copy",
      tone: "secondary",
    });
  }

  return actions;
}

function mergeSuggestedActions(
  remote: SuggestedAction[] | undefined,
  local: SuggestedAction[],
  t?: (key: any, values?: any) => string
): SuggestedAction[] {
  // Build a lookup of local overrides by id and by (kind,label) so we can replace
  // backend-provided labels/descriptions that come back without Vietnamese
  // diacritics. We keep the remote prompt/payload so backend semantics win.
  const localById = new Map<string, SuggestedAction>();
  const localByKindLabel = new Map<string, SuggestedAction>();
  const stripDiacritics = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/\s+/g, " ")
      .trim();

  // Fallback dictionary for BE-generated Vietnamese labels that arrive without
  // diacritics. Keys are already stripped-lowercased; values are the canonical
  // Vietnamese phrasing we want displayed.
  const VI_RESTORE: Record<string, { label: string; description?: string }> = {
    "chuyen sang bieu do duong": { label: t ? t("followUps.chartLine") : "Chuyển sang biểu đồ đường" },
    "chuyen sang bieu do cot": { label: t ? t("followUps.chartBar") : "Chuyển sang biểu đồ cột" },
    "chuyen sang bieu do tron": { label: t ? t("followUps.chartPie") : "Chuyển sang biểu đồ tròn" },
    "so sanh voi toan he thong": { label: t ? t("followUps.scopePlatform") : "So sánh với toàn hệ thống" },
    "chi lay du lieu cua toi": { label: t ? t("followUps.scopePersonal") : "Chỉ lấy dữ liệu của tôi" },
    "giai thich cau sql nay": { label: t ? t("followUps.explainSql") : "Giải thích câu SQL này" },
    "giai thich sql": { label: t ? t("followUps.explainSql") : "Giải thích SQL" },
    "xuat csv": { label: t ? t("followUps.exportCsv") : "Xuất CSV" },
    "sao chep sql": { label: t ? t("followUps.copySql") : "Sao chép SQL" },
    "sao chep bang": { label: t ? t("queryResultPanel.copy") : "Sao chép bảng" },
    "mo rong workspace": { label: t ? t("analysisWorkspace.expandFull") : "Mở rộng workspace" },
    "tai xuong": { label: t ? t("attachmentPreview.open") : "Tải xuống" },
  };

  local.forEach((action) => {
    if (action.id) localById.set(action.id, action);
    localByKindLabel.set(`${action.kind}:${stripDiacritics(action.label || "")}`, action);
  });

  const applyLocalOverride = (action: SuggestedAction): SuggestedAction => {
    const byId = action.id ? localById.get(action.id) : undefined;
    if (byId) {
      return { ...action, label: byId.label, description: byId.description ?? action.description, icon: action.icon ?? byId.icon };
    }
    const strippedLabel = stripDiacritics(action.label || "");
    const byLabel = localByKindLabel.get(`${action.kind}:${strippedLabel}`);
    if (byLabel) {
      return { ...action, label: byLabel.label, description: byLabel.description ?? action.description, icon: action.icon ?? byLabel.icon };
    }
    const fromDict = VI_RESTORE[strippedLabel];
    if (fromDict) {
      return { ...action, label: fromDict.label, description: fromDict.description ?? action.description };
    }
    return action;
  };

  const seen = new Set<string>();
  const out: SuggestedAction[] = [];
  const pushIfNew = (action: SuggestedAction | null | undefined) => {
    if (!action) return;
    const key = action.id || `${action.kind}:${action.label}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(action);
  };
  (remote || []).map(applyLocalOverride).forEach(pushIfNew);
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
  variant = "stacked",
}: {
  message: Message;
  actions: SuggestedAction[];
  compact?: boolean;
  feedback: Record<string, string>;
  onDispatch: (message: Message, action: SuggestedAction) => void;
  disabled?: boolean;
  variant?: "stacked" | "inline";
}) {
  const t = useTranslations("AiChat");
  if (!actions.length) return null;

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-3 overflow-hidden" data-follow-up-actions>
        <span className="flex-shrink-0 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {t("followUps.next")}
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
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
                  "group inline-flex flex-shrink-0 items-center gap-1.5 rounded-sm border px-2 py-1 text-[11px] transition-colors",
                  isPrimary
                    ? "border-border bg-background text-foreground font-medium hover:border-primary hover:text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  disabled && "cursor-not-allowed opacity-50 hover:border-border",
                  isDone && "border-[hsl(var(--data-pos))]/40 text-data-pos"
                )}
                title={action.description || action.label}
              >
                <span className={cn("flex h-3 w-3 flex-shrink-0 items-center justify-center", isDone ? "text-data-pos" : "text-muted-foreground")}>
                  {isDone ? <CheckCircle className="h-3 w-3" /> : followUpIconFor(action)}
                </span>
                <span className="max-w-[180px] truncate">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-l border-border pl-4",
        compact ? "py-2" : "py-3"
      )}
      data-follow-up-actions
    >
      <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {t("followUps.nextSteps")}
      </div>
      <ul className={cn("flex flex-col", compact ? "mt-1.5 gap-0.5" : "mt-2 gap-1")}>
        {actions.map((action) => {
          const key = `${message.id}:${action.id}`;
          const isDone = feedback[key] === "done";
          const isPrimary = action.tone === "primary";
          return (
            <li key={action.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDispatch(message, action);
                }}
                className={cn(
                  "group inline-flex items-baseline gap-2.5 text-left text-ed-sm transition-colors py-0.5",
                  isPrimary ? "text-foreground font-medium" : "text-muted-foreground",
                  "underline decoration-border decoration-1 underline-offset-[5px]",
                  !disabled && "hover:text-primary hover:decoration-primary",
                  disabled && "cursor-not-allowed opacity-50",
                  isDone && "text-data-pos no-underline"
                )}
                title={action.description || action.label}
              >
                <span className={cn("flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center self-center", isDone ? "text-data-pos" : "text-muted-foreground")}>
                  {isDone ? <CheckCircle className="h-3 w-3" /> : followUpIconFor(action)}
                </span>
                <span className="max-w-[280px] truncate">{action.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
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
  const t = useTranslations("AiChat");
  const metadata = message?.metadata;
  const queryResult = metadata?.queryResult;
  const chartSpec = metadata?.chartSpec;
  const citations = Array.isArray(metadata?.citations) ? metadata!.citations! : [];
  const availableTabs: Array<{ id: AnalysisTab; label: string; visible: boolean }> = [
    { id: "data", label: t("analysisWorkspace.dataPreview"), visible: !!queryResult },
    { id: "chart", label: t("analysisWorkspace.chart"), visible: !!chartSpec },
    { id: "sources", label: t("analysisWorkspace.sources"), visible: citations.length > 0 },
    { id: "sql", label: t("analysisWorkspace.advanced"), visible: !!queryResult?.sql },
  ];
  const visibleTabs = availableTabs.filter((tab) => tab.visible);
  const hasFollowUpActions = followUpActions.length > 0;

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab) && visibleTabs[0]) {
      onTabChange(visibleTabs[0].id);
    }
  }, [activeTab, onTabChange, visibleTabs]);

  if (!message || !metadata) {
    return (
      <div className="relative flex h-full items-center justify-center px-6 py-8">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 h-8 w-8 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onClose}
          title={t("analysisWorkspace.hide")}
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="max-w-sm text-left">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
            {t("analysisWorkspace.title")}
          </div>
          <h3 className="font-sans mt-4 text-[28px] leading-[1.1] text-foreground">
            {t("analysisWorkspace.emptyTitle")}
          </h3>
          <p className="mt-4 text-ed-sm leading-[1.7] text-muted-foreground">
            {t("analysisWorkspace.emptyDesc")}
          </p>
        </div>
      </div>
    );
  }

  const chartTitle = String(chartSpec?.title || queryResult?.title || t("analysisWorkspace.fallbackTitle"));

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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-4 pt-3 pb-3 bg-background sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {t("analysisWorkspace.title")}
              {queryResult ? (
                <ScopeBadge queryResult={queryResult} tone="prominent" />
              ) : null}
            </div>
            <div className="font-sans mt-1.5 text-[20px] leading-[1.2] text-foreground">
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
                  "h-8 rounded-sm px-2.5 text-ed-xs border border-transparent transition-colors",
                  isSaved
                    ? "text-data-pos border-border"
                    : "text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted"
                )}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onSave();
                }}
                title={isSaved ? t("analysisWorkspace.saved") : t("analysisWorkspace.saveThis")}
              >
                {isSaved ? (
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                ) : null}
                <span className="hidden sm:inline">{isSaved ? t("analysisWorkspace.saved") : t("analysisWorkspace.save")}</span>
              </Button>
            ) : null}
            {onExpand ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onExpand();
                }}
                title={t("analysisWorkspace.expandFull")}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onClose();
              }}
              title={t("analysisWorkspace.hide")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {prompt ? (
          <div className="mt-3 border-l-2 border-border bg-card px-3 py-2 text-ed-sm italic text-muted-foreground font-sans leading-relaxed">
            &ldquo;{prompt}&rdquo;
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-b border-border bg-background px-4 py-0 sm:px-5">
        <div className="flex flex-wrap items-center gap-0">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "px-3 py-2.5 text-ed-xs font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            {onExpand ? (
              <Button
                variant="ghost"
                size="sm"
                className="my-1.5 h-7 rounded-sm px-2.5 text-ed-xs text-muted-foreground border border-border hover:border-primary/40 hover:bg-transparent hover:text-foreground"
                onClick={onExpand}
                title={t("analysisWorkspace.fullScreenTitle")}
              >
                <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                {t("analysisWorkspace.fullScreen")}
              </Button>
            ) : null}
            {queryResult?.rows?.length ? (
              <Button
                variant="ghost"
                size="sm"
                className="my-1.5 h-7 rounded-sm px-2.5 text-ed-xs text-muted-foreground border border-border hover:border-primary/40 hover:bg-transparent hover:text-foreground"
                onClick={exportCsv}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" />
                {t("analysisWorkspace.exportCsv")}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-background">
        <div className="h-full overflow-y-auto px-2 py-4 sm:px-3">
          <div className="space-y-4">
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
              <div className="border-l border-border pl-4">
                <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  {t("analysisWorkspace.sources")}
                </div>
                <ol className="mt-4 space-y-4 list-none">
                  {citations.length > 0 ? (
                    citations.map((citation, index) => {
                      const courseId = citation.courseId || citation.course_id;
                      const label = String(citation.title || citation.kind || `source-${index + 1}`);
                      return (
                        <li key={`${label}-${index}`} className="flex items-baseline gap-3 text-ed-sm leading-relaxed">
                          <span className="font-mono text-ed-xs text-muted-foreground tabular-nums min-w-[1.5em]">{String(index + 1).padStart(2, "0")}</span>
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{label}</div>
                            {courseId ? (
                              <a
                                href={`/courses/${courseId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-ed-xs text-muted-foreground underline decoration-border decoration-1 underline-offset-4 hover:text-primary hover:decoration-primary"
                              >
                                {t("analysisWorkspace.openSource")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : null}
                          </div>
                        </li>
                      );
                    })
                  ) : (
                    <div className="text-ed-sm text-muted-foreground italic font-sans">{t("analysisWorkspace.noSources")}</div>
                  )}
                </ol>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {hasFollowUpActions && message ? (
        <div className="shrink-0 border-t border-border bg-background px-3 py-2 sm:px-4">
          <FollowUpActions
            message={message}
            actions={followUpActions}
            feedback={followUpFeedback}
            onDispatch={onFollowUpAction}
            disabled={followUpDisabled}
            variant="inline"
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
  const t = useTranslations("AiChat");
  const metadata = message.metadata;
  const queryResult = metadata?.queryResult;
  const chartSpec = metadata?.chartSpec;
  const citations = Array.isArray(metadata?.citations) ? metadata!.citations! : [];
  const title = String(chartSpec?.title || queryResult?.title || t("analysisWorkspace.fallbackTitle"));
  const answerContent = String(message.content || "").replace(/▌+$/, "").trim();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const effectiveChartSpec = chartSpec
    ? chartTypeOverride
      ? { ...chartSpec, type: chartTypeOverride }
      : chartSpec
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("analysisWorkspace.aria")}
      className="ai-chat-theme font-ui fixed inset-0 z-[60] flex flex-col bg-primary/60"
    >
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative m-0 flex h-full w-full flex-col overflow-hidden bg-background sm:m-4 sm:h-[calc(100vh-2rem)] sm:rounded-sm sm:border sm:border-border">
        <div className="flex items-start justify-between gap-3 border-b border-border bg-background px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {t("analysisWorkspace.title")}
              {readOnly ? (
                <span className="inline-flex items-center rounded-sm border border-border bg-card px-2 py-0.5 text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
                  {t("analysisWorkspace.readOnlySaved")}
                </span>
              ) : null}
              {queryResult ? <ScopeBadge queryResult={queryResult} tone="prominent" /> : null}
              {metadata?.intent ? (
                <span className="inline-flex items-center rounded-sm border border-border bg-card px-1.5 py-0 text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
                  {humanizeIntent(metadata.intent, t)}
                </span>
              ) : null}
              {metadata?.resolvedMode ? (
                <span className="inline-flex items-center rounded-sm border border-border bg-card px-1.5 py-0 text-[10px] font-normal normal-case tracking-normal text-muted-foreground">
                  {humanizeMode(metadata.resolvedMode, t)}
                </span>
              ) : null}
            </div>
            <div className="font-sans mt-3 text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] text-foreground">
              {title}
            </div>
            {prompt ? (
              <div className="mt-3 border-l-2 border-border bg-card px-3 py-2 text-ed-sm italic font-sans text-muted-foreground leading-relaxed">
                <span className="mr-2 inline-flex items-center text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground not-italic font-ui">
                  {t("analysisWorkspace.prompt")}
                </span>
                &ldquo;{prompt}&rdquo;
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
                  "h-8 rounded-sm px-2.5 text-ed-xs border border-transparent transition-colors",
                  readOnly
                    ? "text-[hsl(var(--data-neg))] hover:border-border hover:bg-muted"
                    : isSaved
                      ? "text-data-pos border-border"
                      : "text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted"
                )}
                onClick={onSave}
                title={
                  readOnly
                    ? t("analysisWorkspace.removeFromSaved")
                    : isSaved
                      ? t("analysisWorkspace.removeFromSaved")
                      : t("analysisWorkspace.saveAnalysis")
                }
              >
                {readOnly ? (
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                ) : isSaved ? (
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                ) : null}
                <span className="hidden sm:inline">
                  {readOnly ? t("analysisWorkspace.remove") : isSaved ? t("analysisWorkspace.saved") : t("analysisWorkspace.save")}
                </span>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onClose}
              title={t("analysisWorkspace.minimizeTitle")}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onClose}
              title={t("analysisWorkspace.closeTitle")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-background px-4 py-6 sm:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            {answerContent ? (
              <section className="border-l border-border pl-4">
                <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  {t("analysisWorkspace.answer")}
                </div>
                <div className="mt-3 text-ed-base leading-[1.75] text-foreground max-w-[68ch]">
                  <MarkdownRenderer content={answerContent} />
                </div>
              </section>
            ) : null}

            <div className="grid gap-8 xl:grid-cols-2">
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
                <section className="xl:col-span-2 border-l border-border pl-4">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 border-b border-border pb-3 text-left"
                    onClick={() => setAdvancedOpen((current) => !current)}
                  >
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        {t("analysisWorkspace.advanced")}
                      </div>
                      <div className="mt-1 text-ed-sm text-muted-foreground">
                        {advancedOpen ? t("runtime.hide") : t("runtime.show")}
                      </div>
                    </div>
                    {advancedOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {advancedOpen ? (
                    <div className="pt-4">
                      <SqlPreviewPanel
                        message={message}
                        queryResult={queryResult}
                        onCopySql={onCopySql}
                      />
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>

            {citations.length > 0 ? (
              <section className="border-l border-border pl-4">
                <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  {t("analysisWorkspace.sources")}
                </div>
                <ol className="mt-4 space-y-4 list-none">
                  {citations.map((citation, index) => {
                    const courseId = citation.courseId || citation.course_id;
                    const label = String(
                      citation.title || citation.kind || `source-${index + 1}`
                    );
                    return (
                      <li key={`${label}-${index}`} className="flex items-baseline gap-3 text-ed-sm">
                        <span className="font-mono text-ed-xs text-muted-foreground tabular-nums min-w-[1.5em]">{String(index + 1).padStart(2, "0")}</span>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{label}</div>
                          {courseId ? (
                            <a
                              href={`/courses/${courseId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-ed-xs text-muted-foreground underline decoration-border decoration-1 underline-offset-4 hover:text-primary hover:decoration-primary"
                            >
                              {t("analysisWorkspace.openSource")}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
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
  const t = useTranslations("AiChat");
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
        "group flex items-start gap-2 pl-3 pr-2 py-1.5 rounded-sm cursor-pointer transition-colors border-l-2",
        isActive
          ? "border-primary bg-card text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      )}
      onClick={onSelect}
      title={saved.prompt || saved.title}
    >
      <div className="flex-1 min-w-0">
        <div className="text-ed-xs font-medium truncate text-foreground">{saved.title}</div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
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
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:bg-transparent hover:text-[hsl(var(--data-neg))]"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title={t("analysisWorkspace.removeFromSaved")}
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
  const t = useTranslations("AiChat");
  return (
    <div
      className={`group flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-sm cursor-pointer transition-colors border-l-2 ${
        isActive
          ? "border-primary bg-card text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      }`}
      onClick={onSelect}
    >
      <span className="flex-1 text-ed-xs truncate">{session.label}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:bg-transparent hover:text-[hsl(var(--data-neg))]"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title={t("deleteSession")}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
