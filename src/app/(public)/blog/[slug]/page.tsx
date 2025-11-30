"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import {
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Clock,
  Facebook,
  FileImage,
  FileText,
  Link2,
  Loader2,
  MessageCircle,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Smile,
  Twitter,
} from "lucide-react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// Dynamic import emoji picker để tránh SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

import envConfig from "@/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  useAddBlogCommentMutation,
  useBlog,
  useBlogComments,
} from "@/queries/useBlog";
import { useQueryClient } from "@tanstack/react-query";
import { useGetAccount } from "@/queries/useAccount";
import {
  buildContentWithToc,
  estimateReadingTime,
  normalizeTags,
  parseMarkdownToHtml,
  extractIdFromSlug,
} from "@/lib/blog";
import type { Blog, BlogComment, TocItem, BlogAttachment } from "@/types/blog.types";

const ShareButton = ({
  label,
  icon: Icon,
  onClick,
  href,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  href?: string;
}) => {
  const className =
    "flex h-12 w-12 items-center justify-center rounded-full border border-muted bg-background text-muted-foreground transition hover:border-primary hover:text-primary";

  if (href) {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer" title={label}>
        <div className={className}>
          <Icon className="h-5 w-5" />
        </div>
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className} title={label}>
      <Icon className="h-5 w-5" />
    </button>
  );
};

type CommentItemProps = {
  comment: BlogComment;
  depth?: number;
  onReply: (commentId: string) => void;
  activeReplyId: string | null;
  replyContent: string;
  setReplyContent: (content: string) => void;
  onSubmitReply: (parentId: string, content: string) => void;
  isSubmitting: boolean;
  onCancelReply: () => void;
};

const CommentUserInfo = ({ userId }: { userId: string }) => {
  const { data: userResponse, isLoading } = useGetAccount({
    id: userId,
    enabled: !!userId,
  });
  const user = userResponse?.payload?.data;

  // Loading state
  if (isLoading) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />;
  }

  // Fallback nếu không load được user
  if (!user) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
        {userId.slice(0, 2)}
      </div>
    );
  }

  return (
    <>
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.username || "User"}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
          {user.username?.slice(0, 2).toUpperCase() || "U"}
        </div>
      )}
    </>
  );
};

const CommentItem = ({
  comment,
  depth = 0,
  onReply,
  activeReplyId,
  replyContent,
  setReplyContent,
  onSubmitReply,
  isSubmitting,
  onCancelReply,
}: CommentItemProps) => {
  const localReplyRef = useRef<HTMLTextAreaElement | null>(null);
  const [showLocalEmoji, setShowLocalEmoji] = useState(false);
  const insertEmojiToLocalReply = (emoji: string) => {
    const ref = localReplyRef.current;
    if (!ref) {
      // fallback: append
      setReplyContent(replyContent + emoji);
      return;
    }
    const start = ref.selectionStart ?? ref.value.length;
    const end = ref.selectionEnd ?? ref.value.length;
    const newVal = ref.value.slice(0, start) + emoji + ref.value.slice(end);
    setReplyContent(newVal);
    requestAnimationFrame(() => {
      const pos = start + emoji.length;
      ref.focus();
      ref.setSelectionRange(pos, pos);
    });
  };
  const [showReplies, setShowReplies] = useState(true);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isReplying = activeReplyId === comment.id;
  return (
    <div className="space-y-3">
      <div className={`flex gap-3 ${depth > 0 ? "ml-12" : ""}`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <CommentUserInfo userId={comment.userId} />
        </div>

        {/* Comment Content */}
        <div className="flex-1 space-y-2">
          {/* Username & Time */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-foreground">
              @{comment.userId.slice(0, 8)}
            </span>
            <span className="text-muted-foreground">
              {format(new Date(comment.created), "dd/MM/yyyy")}
            </span>
          </div>

          {/* Comment Text */}
          <p className="text-sm text-foreground leading-relaxed">
            {comment.content}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition">
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition">
              <ThumbsDown className="h-4 w-4" />
            </button>
            <button
              onClick={() => onReply(comment.id)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              Trả lời
            </button>
          </div>

          {/* Reply Input (khi đang trả lời comment này) */}
          {isReplying && (
            <div className="pt-3 space-y-2">
              <div className="relative">
                <Textarea
                  placeholder="Viết phản hồi..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  className="text-sm"
                  ref={localReplyRef}
                />

                <button
                  type="button"
                  onClick={() => setShowLocalEmoji((s) => !s)}
                  className="absolute right-2 bottom-2 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground"
                  title="Chèn emoji"
                >
                  <Smile className="h-5 w-5" />
                </button>

                {showLocalEmoji && (
                  <div className="absolute right-0 bottom-12 z-50">
                    <EmojiPicker onEmojiClick={(e: any) => { insertEmojiToLocalReply(e.emoji); setShowLocalEmoji(false); }} />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancelReply}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSubmitReply(comment.id, replyContent)}
                  disabled={!replyContent.trim() || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  Phản hồi
                </Button>
              </div>
            </div>
          )}

          {/* Show/Hide Replies Button */}
          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition"
            >
              {showReplies ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span>{comment.replies.length} phản hồi</span>
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {hasReplies && showReplies && (
        <div className="space-y-3">
          {comment.replies.map((reply: BlogComment) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              activeReplyId={activeReplyId}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSubmitReply={onSubmitReply}
              isSubmitting={isSubmitting}
              onCancelReply={onCancelReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function BlogDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  
  // Extract ID từ slug để gọi API
  const blogId = useMemo(() => {
    if (!slug) return undefined;
    return extractIdFromSlug(slug);
  }, [slug]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: blogResponse, isLoading, error } = useBlog(blogId, !!blogId);
  const blog = blogResponse?.payload?.data;

  const { data: commentResponse, isLoading: isLoadingComments } =
    useBlogComments(blogId, !!blogId);
  const comments = commentResponse?.payload?.data ?? [];

  // Fetch author info
  const { data: authorResponse } = useGetAccount({
    id: blog?.authorId || "",
    enabled: !!blog?.authorId,
  });
  const author = authorResponse?.payload?.data;

  const [commentContent, setCommentContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [showEmojiPickerMain, setShowEmojiPickerMain] = useState(false);
  const mainTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertEmojiAtCursor = (
    ref: HTMLTextAreaElement | null,
    emoji: string,
    setter: (v: string) => void
  ) => {
    if (!ref) return;
    const start = ref.selectionStart ?? ref.value.length;
    const end = ref.selectionEnd ?? ref.value.length;
    const newVal = ref.value.slice(0, start) + emoji + ref.value.slice(end);
    setter(newVal);
    requestAnimationFrame(() => {
      const pos = start + emoji.length;
      ref.focus();
      ref.setSelectionRange(pos, pos);
    });
  };

  // Cập nhật document title khi blog được load
  useEffect(() => {
    if (blog?.title) {
      document.title = `${blog.title} | TechHub`;
    }
    
    return () => {
      document.title = "TechHub";
    };
  }, [blog?.title]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const addCommentMutation = useAddBlogCommentMutation();

  // WebSocket connection for real-time comments
  useEffect(() => {
    if (!blogId) return;

    console.log("[WebSocket] Connecting for blog:", blogId);
    
    const client = new Client({
      webSocketFactory: () => {
        const wsBase = envConfig.NEXT_PUBLIC_WS_BASE || envConfig.NEXT_PUBLIC_API_ENDPOINT;
        const sockJsUrl = `${wsBase}/blog-service/ws-comment`;
        console.log("[WebSocket] Creating SockJS connection to:", sockJsUrl);
        return new SockJS(sockJsUrl) as WebSocket;
      },
      debug: (str) => {
        if (str.includes("CONNECT") || str.includes("MESSAGE") || str.includes("ERROR")) {
          console.log("[STOMP]", str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        console.log("[WebSocket] Connected! Subscribing to comments...");
        
        const destination = `/topic/blog/${blogId}/comments`;
        console.log("[WebSocket] Subscribing to:", destination);
        
        client.subscribe(destination, (message) => {
          console.log("[WebSocket] Received message:", message.body);
          try {
            const newComment = JSON.parse(message.body);
            console.log("[WebSocket] New comment received:", newComment);
            
            // Invalidate comments query to refetch
            queryClient.invalidateQueries({ queryKey: ["blog-comments", blogId] });
            
            toast({
              title: "Bình luận mới",
              description: "Có người vừa bình luận trong bài viết này!",
            });
          } catch (e) {
            console.error("[WebSocket] Error parsing message:", e);
          }
        });
      },
      onDisconnect: () => {
        console.log("[WebSocket] Disconnected");
      },
      onStompError: (frame) => {
        console.error("[WebSocket] STOMP Error:", frame.headers["message"]);
      },
    });

    client.activate();

    return () => {
      console.log("[WebSocket] Cleaning up connection...");
      client.deactivate();
    };
  }, [blogId, queryClient, toast]);

  const preparedContent = useMemo(() => {
    if (!blog?.content) return { html: "", toc: [] as TocItem[] };
    
    // Parse markdown thành HTML trước
    const htmlContent = parseMarkdownToHtml(blog.content);
    
    // Sau đó build TOC
    return buildContentWithToc(htmlContent);
  }, [blog?.content]);

  const readingMinutes = blog ? estimateReadingTime(blog.content) : 1;
  const shareUrl = `${envConfig.NEXT_PUBLIC_URL}/blog/${slug}`;

  const shareItems = [
    {
      label: "Sao chép link",
      icon: Link2,
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast({
            title: "Đã sao chép liên kết",
            description: "Bạn có thể chia sẻ bài viết với bạn bè.",
          });
        } catch {
          toast({
            title: "Không thể sao chép liên kết",
            description: "Vui lòng thử lại.",
            variant: "destructive",
          });
        }
      },
    },
    {
      label: "Chia sẻ Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: "Chia sẻ Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
        blog?.title ?? ""
      )}`,
    },
    {
      label: "Sao chép để chat",
      icon: Share2,
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(`${blog?.title ?? ""} - ${shareUrl}`);
          toast({
            title: "Đã sao chép",
            description: "Bạn có thể dán liên kết vào các ứng dụng khác.",
          });
        } catch {
          toast({
            title: "Không thể sao chép",
            description: "Vui lòng thử lại.",
            variant: "destructive",
          });
        }
      },
    },
  ];

  const handleSubmitComment = () => {
    if (!blogId || !commentContent.trim()) {
      toast({
        title: "Vui lòng nhập nội dung bình luận",
        variant: "destructive",
      });
      return;
    }

    addCommentMutation.mutate(
      {
        blogId,
        body: {
          content: commentContent.trim(),
          parentId: undefined,
        },
      },
      {
        onSuccess: () => {
          setCommentContent("");
          toast({
            title: "Đã gửi bình luận",
          });
        },
        onError: () =>
          toast({
            title: "Không thể gửi bình luận",
            description: "Vui lòng đăng nhập và thử lại.",
            variant: "destructive",
          }),
      }
    );
  };

  const handleSubmitReply = (parentId: string, content: string) => {
    if (!blogId || !content.trim()) {
      toast({
        title: "Vui lòng nhập nội dung phản hồi",
        variant: "destructive",
      });
      return;
    }

    addCommentMutation.mutate(
      {
        blogId,
        body: {
          content: content.trim(),
          parentId: parentId,
        },
      },
      {
        onSuccess: () => {
          setReplyContent("");
          setReplyTo(null);
          toast({
            title: "Đã gửi phản hồi",
          });
        },
        onError: () =>
          toast({
            title: "Không thể gửi phản hồi",
            description: "Vui lòng đăng nhập và thử lại.",
            variant: "destructive",
          }),
      }
    );
  };

  const handleCancelReply = () => {
    setReplyTo(null);
    setReplyContent("");
  };

  // Sort comments
  const sortedComments = useMemo(() => {
    const commentsCopy = [...comments];
    return commentsCopy.sort((a, b) => {
      const dateA = new Date(a.created).getTime();
      const dateB = new Date(b.created).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [comments, sortOrder]);

  // Count total comments including replies
  const totalCommentCount = useMemo(() => {
    const countReplies = (comment: BlogComment): number => {
      let count = 1;
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.forEach((reply: BlogComment) => {
          count += countReplies(reply);
        });
      }
      return count;
    };

    return comments.reduce((total: number, comment: BlogComment) => total + countReplies(comment), 0);
  }, [comments]);

  const handleScrollToHeading = (item: TocItem) => {
    const element = document.getElementById(item.id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (error) {
    return (
      <main className="container mx-auto flex min-h-[70vh] items-center justify-center px-4">
        <Card className="w-full max-w-xl border-destructive/40 bg-destructive/10">
          <CardContent className="space-y-3 p-6 text-center text-destructive">
            <h1 className="text-2xl font-semibold">Không tìm thấy bài viết</h1>
            <p>Đường dẫn có thể đã thay đổi hoặc bài viết đã bị xóa.</p>
            <Button asChild variant="secondary">
              <Link href="/blog">Quay lại danh sách blog</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (isLoading || !blog) {
    return (
      <main className="container mx-auto px-4 py-20">
        <div className="grid gap-6 lg:grid-cols-[80px_minmax(0,1fr)_260px]">
          <div className="hidden lg:block" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-[400px] w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </main>
    );
  }

  const tags = normalizeTags(blog.tags ?? []);

  return (
    <main className="relative bg-background pb-24 pt-16">
      <article className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/blog"
            className="text-sm font-medium text-primary transition hover:underline"
          >
            ← Quay lại danh sách
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* Content Column */}
          <section className="order-2 lg:order-1 space-y-8">
            {/* Title & Meta */}
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                {blog.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{readingMinutes} phút đọc</span>
                <span>•</span>
                <span>Đăng ngày {format(new Date(blog.created), "dd/MM/yyyy")}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-full">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Author Info */}
            <div className="flex items-center gap-4 rounded-2xl border border-muted/40 bg-card/60 p-4">
              {author?.avatar ? (
                <img 
                  src={author.avatar} 
                  alt={author.username || "Author"}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                  {author?.username?.slice(0, 2).toUpperCase() || "HN"}
                </div>
              )}
              <div>
                <div className="font-semibold">{author?.username}</div>
                <div className="text-sm text-muted-foreground">Author</div>
              </div>
            </div>

            {/* Blog Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-img:rounded-2xl">
              <div
                dangerouslySetInnerHTML={{ __html: preparedContent.html }}
                className="leading-relaxed text-muted-foreground"
              />
            </div>

            {/* Attachments */}
            {blog.attachments && blog.attachments.length > 0 && (
              <section className="rounded-2xl border border-muted/40 bg-card/60 p-6">
                <h2 className="text-lg font-semibold">Tệp đính kèm</h2>
                <p className="text-sm text-muted-foreground">
                  Tải về tài liệu hoặc hình ảnh liên quan.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {blog.attachments.map((attachment: BlogAttachment) => {
                    const isImage = attachment.type === "image";
                    return (
                      <Button
                        key={attachment.url}
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-2"
                      >
                        <Link href={attachment.url} target="_blank">
                          {isImage ? (
                            <FileImage className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          {attachment.caption || (isImage ? "Xem hình ảnh" : "Xem tài liệu")}
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Share Section */}
            <section className="rounded-2xl border border-muted/40 bg-card/60 p-6">
              <h2 className="text-lg font-semibold mb-4">Chia sẻ bài viết</h2>
              <div className="flex flex-wrap gap-3">
                {shareItems.map((item) => (
                  <ShareButton key={item.label} {...item} />
                ))}
              </div>
            </section>

            {/* Comments Section */}
            <section className="space-y-6 rounded-2xl border border-muted/40 bg-card/60 p-6">
              {/* Header with count and sort */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <MessageCircle className="h-5 w-5" />
                  <span>{totalCommentCount} Bình luận</span>
                </div>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                  className="text-sm rounded-lg border border-muted bg-background px-3 py-1.5 text-muted-foreground hover:bg-muted/50 transition"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                </select>
              </div>

              {/* New Comment Input */}
              <div className="space-y-3">
                <div className="relative">
                  <Textarea
                    placeholder="Chia sẻ cảm nhận của bạn..."
                    value={commentContent}
                    onChange={(event) => setCommentContent(event.target.value)}
                    rows={3}
                    ref={mainTextareaRef}
                  />

                  <button
                    type="button"
                    onClick={() => setShowEmojiPickerMain((s) => !s)}
                    className="absolute right-2 bottom-2 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground"
                    title="Chèn emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </button>

                  {showEmojiPickerMain && (
                    <div className="absolute right-0 bottom-12 z-50">
                      <EmojiPicker onEmojiClick={(e: any) => { insertEmojiAtCursor(mainTextareaRef.current, e.emoji, setCommentContent); setShowEmojiPickerMain(false); }} />
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={addCommentMutation.isPending || !commentContent.trim()}
                  >
                    {addCommentMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Bình luận
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Comments List */}
              <div className="space-y-6">
                {isLoadingComments ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-28 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : sortedComments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Hãy là người đầu tiên chia sẻ cảm nghĩ của bạn.
                  </p>
                ) : (
                  sortedComments.map((comment: BlogComment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onReply={(id) => setReplyTo(id)}
                      activeReplyId={replyTo}
                      replyContent={replyContent}
                      setReplyContent={setReplyContent}
                      onSubmitReply={handleSubmitReply}
                      isSubmitting={addCommentMutation.isPending}
                      onCancelReply={handleCancelReply}
                    />
                  ))
                )}
              </div>
            </section>
          </section>

          {/* Sidebar - Mục lục */}
          <aside className="order-1 lg:order-2">
            <div className="sticky top-24 space-y-6">
              {/* Table of Contents */}
              <div className="rounded-2xl border border-muted/40 bg-card/70 p-6">
                <h2 className="text-lg font-semibold mb-2">Mục Lục</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Các nội dung chính trong bài viết này.
                </p>
                <div className="space-y-1">
                  {preparedContent.toc.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Bài viết chưa có cấu trúc tiêu đề rõ ràng.
                    </p>
                  ) : (
                    preparedContent.toc.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleScrollToHeading(item)}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted/60 hover:text-primary"
                        style={{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }}
                      >
                        {item.level === 1 && "1. "}
                        {item.level === 2 && "2. "}
                        {item.level === 3 && "3. "}
                        {item.text}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </article>

      {showScrollTop && (
        <Button
          className="fixed bottom-6 right-6 shadow-lg"
          size="icon"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </main>
  );
}
