"use client";

import { useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { Loader2, MessageCircle, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { CourseCommentItem } from "./CourseCommentItem";
import type { CourseComment } from "@/types/course-comment.types";

// Dynamic import emoji picker
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

type CommentsListProps = {
  comments: CourseComment[];
  isLoading: boolean;
  isSubmitting: boolean;
  onSubmitComment: (content: string) => void;
  onSubmitReply: (parentId: string, content: string) => void;
};

export function CourseCommentsList({
  comments,
  isLoading,
  isSubmitting,
  onSubmitComment,
  onSubmitReply,
}: CommentsListProps) {
  const { toast } = useToast();
  const [commentContent, setCommentContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
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

  const handleSubmitComment = () => {
    if (!commentContent.trim()) {
      toast({
        title: "Vui lòng nhập nội dung bình luận",
        variant: "destructive",
      });
      return;
    }

    onSubmitComment(commentContent.trim());
    setCommentContent("");
  };

  const handleSubmitReply = (parentId: string, content: string) => {
    if (!content.trim()) {
      toast({
        title: "Vui lòng nhập nội dung phản hồi",
        variant: "destructive",
      });
      return;
    }

    onSubmitReply(parentId, content.trim());
    setReplyContent("");
    setReplyTo(null);
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
    const countReplies = (comment: CourseComment): number => {
      let count = 1;
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.forEach((reply: CourseComment) => {
          count += countReplies(reply);
        });
      }
      return count;
    };

    return comments.reduce(
      (total: number, comment: CourseComment) => total + countReplies(comment),
      0
    );
  }, [comments]);

  return (
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
              <EmojiPicker
                onEmojiClick={(e: any) => {
                  insertEmojiAtCursor(
                    mainTextareaRef.current,
                    e.emoji,
                    setCommentContent
                  );
                  setShowEmojiPickerMain(false);
                }}
              />
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitComment}
            disabled={isSubmitting || !commentContent.trim()}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Bình luận
          </Button>
        </div>
      </div>

      <Separator />

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
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
          sortedComments.map((comment: CourseComment) => (
            <CourseCommentItem
              key={comment.id}
              comment={comment}
              onReply={(id) => setReplyTo(id)}
              activeReplyId={replyTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSubmitReply={handleSubmitReply}
              isSubmitting={isSubmitting}
              onCancelReply={handleCancelReply}
            />
          ))
        )}
      </div>
    </section>
  );
}
