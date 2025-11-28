"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCommentWebSocket } from "@/hooks/useCommentWebSocket";
import {
  CommentTargetType,
  CommentPayload,
} from "@/services/websocket/comment-websocket";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  MessageCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Send,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn, getAccessTokenFromLocalStorage } from "@/lib/utils";
import { useAppContext } from "@/components/app-provider";
import { DecodedToken } from "@/types/jwt.types";
import jwt from "jsonwebtoken";

interface Comment extends CommentPayload {
  replies?: Comment[];
}

interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
}

interface RealtimeCommentsProps {
  /**
   * Target type: BLOG, COURSE, or LESSON
   */
  targetType: CommentTargetType;

  /**
   * Target ID (blog id, course id, or lesson id)
   */
  targetId: number;

  /**
   * Initial comments to display
   */
  initialComments?: Comment[];

  /**
   * Enable debug mode
   */
  debug?: boolean;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Placeholder text for comment input
   */
  placeholder?: string;
}

/**
 * Real-time Comments Component with WebSocket support
 */
export function RealtimeComments({
  targetType,
  targetId,
  initialComments = [],
  debug = false,
  className,
  placeholder = "Viết bình luận...",
}: RealtimeCommentsProps) {
  const { isAuth } = useAppContext();
  
  // Get current user from token
  const currentUser = useMemo<CurrentUser | null>(() => {
    if (typeof window === "undefined") return null;
    const token = getAccessTokenFromLocalStorage();
    if (!token) return null;
    try {
      const decoded = jwt.decode(token) as DecodedToken;
      if (decoded?.user) {
        return {
          id: decoded.user.id.toString(),
          email: decoded.user.email,
          fullName: decoded.user.name,
        };
      }
      return null;
    } catch {
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth]);

  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);

  // WebSocket connection
  const {
    isConnected,
    status,
    sendComment,
    updateComment,
    deleteComment,
  } = useCommentWebSocket({
    targetType,
    targetId,
    debug,
    onCommentCreated: useCallback((payload: CommentPayload) => {
      setComments((prev) => {
        // Check if it's a reply
        if (payload.parentId) {
          return prev.map((comment) => {
            if (comment.id === payload.parentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), payload as Comment],
              };
            }
            return comment;
          });
        }
        // New top-level comment
        return [payload as Comment, ...prev];
      });
      setIsSending(false);
    }, []),
    onCommentUpdated: useCallback((payload: CommentPayload) => {
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === payload.id) {
            return { ...comment, ...payload };
          }
          // Check replies
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === payload.id ? { ...reply, ...payload } : reply
              ),
            };
          }
          return comment;
        })
      );
    }, []),
    onCommentDeleted: useCallback((payload: CommentPayload) => {
      setComments((prev) =>
        prev
          .filter((comment) => comment.id !== payload.id)
          .map((comment) => ({
            ...comment,
            replies: comment.replies?.filter((reply) => reply.id !== payload.id),
          }))
      );
    }, []),
    onConnect: () => {
      if (debug) console.log("[RealtimeComments] Connected");
    },
    onError: (error) => {
      console.error("[RealtimeComments] Error:", error);
    },
  });

  // Update comments when initialComments changes
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Handle send comment
  const handleSendComment = () => {
    if (!newComment.trim() || !isConnected) return;

    setIsSending(true);
    sendComment(newComment.trim());
    setNewComment("");
  };

  // Handle send reply
  const handleSendReply = (parentId: number) => {
    if (!replyContent.trim() || !isConnected) return;

    setIsSending(true);
    sendComment(replyContent.trim(), parentId);
    setReplyContent("");
    setReplyingTo(null);
  };

  // Handle edit comment
  const handleEditComment = (commentId: number) => {
    if (!editContent.trim() || !isConnected) return;

    updateComment(commentId, editContent.trim());
    setEditingId(null);
    setEditContent("");
  };

  // Handle delete comment
  const handleDeleteComment = () => {
    if (commentToDelete && isConnected) {
      deleteComment(commentToDelete);
    }
    setDeleteDialogOpen(false);
    setCommentToDelete(null);
  };

  // Start editing
  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  // Confirm delete
  const confirmDelete = (commentId: number) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  // Check if current user owns the comment
  const isOwner = (userId: string) => currentUser?.id === userId;

  // Render single comment
  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={cn("flex gap-3", isReply && "ml-12 mt-3")}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.userAvatar} alt={comment.userName} />
        <AvatarFallback>
          {comment.userName?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-sm">{comment.userName}</span>
            {isOwner(comment.userId) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => startEdit(comment)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => confirmDelete(comment.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {editingId === comment.id ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleEditComment(comment.id)}
                  disabled={!editContent.trim()}
                >
                  Lưu
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingId(null)}
                >
                  Hủy
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          )}
        </div>

        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
          <span>
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
              locale: vi,
            })}
          </span>
          {!isReply && (
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="hover:text-foreground transition-colors"
            >
              Phản hồi
            </button>
          )}
        </div>

        {/* Reply input */}
        {replyingTo === comment.id && (
          <div className="mt-3 flex gap-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Viết phản hồi..."
              className="min-h-[60px] flex-1"
            />
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                onClick={() => handleSendReply(comment.id)}
                disabled={!replyContent.trim() || !isConnected}
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReplyingTo(null)}
              >
                Hủy
              </Button>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies?.map((reply) => renderComment(reply, true))}
      </div>
    </div>
  );

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        {/* Header with connection status */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Bình luận ({comments.length})
          </h3>
          <div
            className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
              isConnected
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
            )}
          >
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                Trực tiếp
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                {status === "connecting" ? "Đang kết nối..." : "Mất kết nối"}
              </>
            )}
          </div>
        </div>

        {/* New comment input */}
        {currentUser ? (
          <div className="flex gap-3 mb-6">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser.avatar} alt={currentUser.fullName} />
              <AvatarFallback>
                {currentUser.fullName?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={placeholder}
                className="min-h-[80px] flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleSendComment();
                  }
                }}
              />
              <Button
                onClick={handleSendComment}
                disabled={!newComment.trim() || !isConnected || isSending}
                className="self-end"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground mb-6">
            Vui lòng đăng nhập để bình luận
          </p>
        )}

        {/* Comments list */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </p>
          ) : (
            comments.map((comment) => renderComment(comment))
          )}
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa bình luận</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể
                hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteComment}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export default RealtimeComments;
