"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowUp,
  Clock,
  Facebook,
  FileImage,
  FileText,
  Link2,
  Loader2,
  MessageCircle,
  Share2,
  Twitter,
} from "lucide-react";

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
import {
  buildContentWithToc,
  estimateReadingTime,
  normalizeTags,
} from "@/lib/blog";
import type { BlogComment, TocItem } from "@/types/blog.types";

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
};

const CommentItem = ({
  comment,
  depth = 0,
  onReply,
  activeReplyId,
}: CommentItemProps) => {
  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl border border-muted/40 bg-card/60 p-4 transition ${
          depth > 0 ? "ml-6 border-l-2 border-l-primary/30 pl-6" : ""
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
            {comment.userId.slice(0, 2)}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
              <span>Người dùng {comment.userId.slice(0, 8)}</span>
              <time>{format(new Date(comment.created), "HH:mm dd/MM/yyyy")}</time>
            </div>
            <p className="text-sm text-foreground">{comment.content}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="link"
                size="sm"
                className="px-0 text-primary"
                onClick={() => onReply(comment.id)}
              >
                Trả lời
              </Button>
              {activeReplyId === comment.id && (
                <Badge variant="secondary" className="rounded-full text-xs">
                  Đang trả lời
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      {comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              activeReplyId={activeReplyId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function BlogDetailPage() {
  const params = useParams<{ id: string }>();
  const blogId = params?.id;
  const { toast } = useToast();

  const { data: blogResponse, isLoading, error } = useBlog(blogId, !!blogId);
  const blog = blogResponse?.data;

  const { data: commentResponse, isLoading: isLoadingComments } =
    useBlogComments(blogId, !!blogId);
  const comments = commentResponse?.data ?? [];

  const [commentContent, setCommentContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const addCommentMutation = useAddBlogCommentMutation();

  const preparedContent = useMemo(() => {
    return buildContentWithToc(blog?.content ?? "");
  }, [blog?.content]);

  const readingMinutes = blog ? estimateReadingTime(blog.content) : 1;
  const shareUrl = `${envConfig.NEXT_PUBLIC_URL}/blog/${blogId}`;

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
          parentId: replyTo ?? undefined,
        },
      },
      {
        onSuccess: () => {
          setCommentContent("");
          setReplyTo(null);
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
      <article className="container mx-auto grid gap-10 px-4 lg:grid-cols-[80px_minmax(0,1fr)_260px]">
        <aside className="order-1 hidden lg:block">
          <div className="sticky top-24 flex flex-col items-center gap-4">
            {shareItems.map((item) => (
              <ShareButton key={item.label} {...item} />
            ))}
          </div>
        </aside>

        <section className="order-2 space-y-8">
          <div className="space-y-3">
            <Link
              href="/blog"
              className="text-sm font-medium text-primary transition hover:underline"
            >
              ← Quay lại danh sách
            </Link>
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

          <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-img:rounded-2xl">
            <div
              dangerouslySetInnerHTML={{ __html: preparedContent.html }}
              className="leading-relaxed text-muted-foreground"
            />
          </div>

          {blog.attachments && blog.attachments.length > 0 && (
            <section className="rounded-2xl border border-muted/40 bg-card/60 p-6">
              <h2 className="text-lg font-semibold">Tệp đính kèm</h2>
              <p className="text-sm text-muted-foreground">
                Tải về tài liệu hoặc hình ảnh liên quan.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {blog.attachments.map((attachment) => {
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

          <section className="space-y-6 rounded-2xl border border-muted/40 bg-card/60 p-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <MessageCircle className="h-5 w-5" />
              Bình luận
            </div>
            <div className="space-y-4">
              <Textarea
                placeholder="Chia sẻ cảm nhận của bạn..."
                value={commentContent}
                onChange={(event) => setCommentContent(event.target.value)}
                rows={replyTo ? 5 : 4}
              />
              {replyTo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Đang trả lời một bình luận</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0"
                    onClick={() => setReplyTo(null)}
                  >
                    Hủy
                  </Button>
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={addCommentMutation.isPending}
                >
                  {addCommentMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Gửi bình luận
                </Button>
              </div>
            </div>
            <Separator />
            <div className="space-y-6">
              {isLoadingComments ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 w-full rounded-2xl" />
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Hãy là người đầu tiên chia sẻ cảm nghĩ của bạn.
                </p>
              ) : (
                comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReply={(id) => {
                      setReplyTo(id);
                      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                    }}
                    activeReplyId={replyTo}
                  />
                ))
              )}
            </div>
          </section>
        </section>

        <aside className="order-3">
          <div className="sticky top-24 space-y-4 rounded-2xl border border-muted/40 bg-card/70 p-6">
            <h2 className="text-lg font-semibold">Mục lục</h2>
            <p className="text-sm text-muted-foreground">
              Các nội dung chính trong bài viết này.
            </p>
            <div className="space-y-2">
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
                    style={{ marginLeft: (item.level - 1) * 12 }}
                  >
                    {item.text}
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>
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
