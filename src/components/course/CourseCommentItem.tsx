"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Smile,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGetAccount } from "@/queries/useAccount";
import type { CourseComment } from "@/types/course-comment.types";

// Dynamic import emoji picker để tránh SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

type CommentItemProps = {
  comment: CourseComment;
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

export function CourseCommentItem({
  comment,
  depth = 0,
  onReply,
  activeReplyId,
  replyContent,
  setReplyContent,
  onSubmitReply,
  isSubmitting,
  onCancelReply,
}: CommentItemProps) {
  const localReplyRef = useRef<HTMLTextAreaElement | null>(null);
  const [showLocalEmoji, setShowLocalEmoji] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

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
                    <EmojiPicker
                      onEmojiClick={(e: any) => {
                        insertEmojiToLocalReply(e.emoji);
                        setShowLocalEmoji(false);
                      }}
                    />
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
          {comment.replies.map((reply: CourseComment) => (
            <CourseCommentItem
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
}
