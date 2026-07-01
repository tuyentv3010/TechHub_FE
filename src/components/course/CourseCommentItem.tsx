"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Reply,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGetAccount } from "@/queries/useAccount";
import { cn } from "@/lib/utils";
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Resolve the commenter's account (avatar + display name) from their userId.
 * The comment API only returns `userId`, so we look the account up once and
 * reuse it for both the avatar and the name.
 */
const useCommentUser = (userId: string) => {
  const canFetchUser = UUID_RE.test(userId);
  const { data: userResponse, isLoading } = useGetAccount({
    id: userId,
    enabled: canFetchUser,
  });
  const user = userResponse?.payload?.data;
  return {
    user,
    isLoading: canFetchUser && isLoading,
    displayName: user?.username || `@${userId.slice(0, 8)}`,
  };
};

const CommentAvatar = ({
  isLoading,
  avatar,
  fallback,
  alt,
}: {
  isLoading: boolean;
  avatar?: string;
  fallback: string;
  alt: string;
}) => {
  if (isLoading) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />;
  }
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={alt}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
      {fallback.slice(0, 2).toUpperCase()}
    </div>
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
  const t = useTranslations("CourseComments");
  const localReplyRef = useRef<HTMLTextAreaElement | null>(null);
  const [showLocalEmoji, setShowLocalEmoji] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const { user, isLoading: isUserLoading, displayName } = useCommentUser(
    comment.userId
  );

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
      <div className={cn("flex gap-3", depth > 0 && "ml-8 border-l pl-4 sm:ml-12")}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <CommentAvatar
            isLoading={isUserLoading}
            avatar={user?.avatar}
            fallback={user?.username || comment.userId}
            alt={displayName}
          />
        </div>

        {/* Comment Content */}
        <div className="min-w-0 flex-1 space-y-2">
          {/* Username & Time */}
          <div
            className={cn(
              "rounded-xl bg-muted/50 px-4 py-3",
              comment.isPending && "opacity-70"
            )}
          >
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium text-foreground">
                {displayName}
              </span>
              <span className="text-muted-foreground">
                {format(new Date(comment.created), "dd/MM/yyyy HH:mm")}
              </span>
              {comment.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
              {comment.content}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onReply(comment.id)}
              disabled={comment.isPending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Reply className="h-3.5 w-3.5" />
              {t("reply")}
            </button>
          </div>

          {/* Reply Input (khi đang trả lời comment này) */}
          {isReplying && (
            <div className="pt-3 space-y-2">
              <div className="relative">
                <Textarea
                  placeholder={t("replyPlaceholder")}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                  ref={localReplyRef}
                />

                <button
                  type="button"
                  onClick={() => setShowLocalEmoji((s) => !s)}
                  className="absolute right-2 bottom-2 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground"
                  title={t("insertEmoji")}
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
                  {t("cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={() => onSubmitReply(comment.id, replyContent)}
                  disabled={!replyContent.trim() || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  {t("submitReply")}
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
              <span>{t("replyCount", { count: comment.replies.length })}</span>
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
