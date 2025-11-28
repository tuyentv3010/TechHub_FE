"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  CommentWebSocketService,
  CommentWebSocketMessage,
  CommentTargetType,
  SendCommentInput,
  UpdateCommentInput,
  DeleteCommentInput,
  getBlogCommentWebSocket,
  getCourseCommentWebSocket,
} from "@/services/websocket";

interface UseCommentWebSocketOptions {
  /**
   * Target type: BLOG, COURSE, or LESSON
   */
  targetType: CommentTargetType;

  /**
   * Target ID (blog id, course id, or lesson id)
   */
  targetId: number;

  /**
   * Auto connect on mount (default: true)
   */
  autoConnect?: boolean;

  /**
   * Enable debug logging (default: false)
   */
  debug?: boolean;

  /**
   * Callback when new comment is received
   */
  onCommentCreated?: (payload: CommentWebSocketMessage["payload"]) => void;

  /**
   * Callback when comment is updated
   */
  onCommentUpdated?: (payload: CommentWebSocketMessage["payload"]) => void;

  /**
   * Callback when comment is deleted
   */
  onCommentDeleted?: (payload: CommentWebSocketMessage["payload"]) => void;

  /**
   * Callback on connection established
   */
  onConnect?: () => void;

  /**
   * Callback on disconnection
   */
  onDisconnect?: () => void;

  /**
   * Callback on error
   */
  onError?: (error: string) => void;
}

interface UseCommentWebSocketReturn {
  /**
   * Whether WebSocket is connected
   */
  isConnected: boolean;

  /**
   * Connection status: 'connecting' | 'connected' | 'disconnected' | 'error'
   */
  status: "connecting" | "connected" | "disconnected" | "error";

  /**
   * Connect to WebSocket server
   */
  connect: () => void;

  /**
   * Disconnect from WebSocket server
   */
  disconnect: () => void;

  /**
   * Send a new comment
   */
  sendComment: (content: string, parentId?: number) => void;

  /**
   * Update an existing comment
   */
  updateComment: (commentId: number, content: string) => void;

  /**
   * Delete a comment
   */
  deleteComment: (commentId: number) => void;

  /**
   * Error message if any
   */
  error: string | null;
}

/**
 * Hook for real-time comments via WebSocket
 *
 * @example
 * ```tsx
 * const { isConnected, sendComment, status } = useCommentWebSocket({
 *   targetType: "BLOG",
 *   targetId: 123,
 *   onCommentCreated: (comment) => {
 *     setComments(prev => [comment, ...prev]);
 *   },
 * });
 * ```
 */
export function useCommentWebSocket(
  options: UseCommentWebSocketOptions
): UseCommentWebSocketReturn {
  const {
    targetType,
    targetId,
    autoConnect = true,
    debug = false,
    onCommentCreated,
    onCommentUpdated,
    onCommentDeleted,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [status, setStatus] = useState<UseCommentWebSocketReturn["status"]>(
    "disconnected"
  );
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<CommentWebSocketService | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Get the appropriate WebSocket service based on target type
  const getWebSocketService = useCallback((): CommentWebSocketService => {
    if (targetType === "BLOG") {
      return getBlogCommentWebSocket();
    }
    // COURSE and LESSON both use course-service
    return getCourseCommentWebSocket();
  }, [targetType]);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback(
    (message: CommentWebSocketMessage) => {
      if (debug) {
        console.log("[useCommentWebSocket] Received:", message);
      }

      switch (message.eventType) {
        case "CREATED":
          onCommentCreated?.(message.payload);
          break;
        case "UPDATED":
          onCommentUpdated?.(message.payload);
          break;
        case "DELETED":
          onCommentDeleted?.(message.payload);
          break;
      }
    },
    [debug, onCommentCreated, onCommentUpdated, onCommentDeleted]
  );

  // Connect to WebSocket
  const connect = useCallback(() => {
    setStatus("connecting");
    setError(null);

    const ws = getWebSocketService();
    wsRef.current = ws;

    ws.connect({
      debug,
      onConnect: () => {
        setStatus("connected");

        // Subscribe to comments for this target
        unsubscribeRef.current = ws.subscribeToComments(
          targetType,
          targetId,
          handleMessage
        );

        onConnect?.();
      },
      onDisconnect: () => {
        setStatus("disconnected");
        onDisconnect?.();
      },
      onError: (err) => {
        setStatus("error");
        setError(err);
        onError?.(err);
      },
    });
  }, [
    getWebSocketService,
    targetType,
    targetId,
    debug,
    handleMessage,
    onConnect,
    onDisconnect,
    onError,
  ]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;

    // Note: We don't disconnect the service itself as it might be shared
    // Just unsubscribe from this specific topic
    setStatus("disconnected");
  }, []);

  // Send a new comment
  const sendComment = useCallback(
    (content: string, parentId?: number) => {
      const ws = wsRef.current;
      if (!ws?.connected) {
        console.error("[useCommentWebSocket] Not connected");
        return;
      }

      const input: SendCommentInput = {
        content,
        targetId,
        targetType,
        parentId,
      };

      ws.sendComment(input);
    },
    [targetId, targetType]
  );

  // Update an existing comment
  const updateComment = useCallback(
    (commentId: number, content: string) => {
      const ws = wsRef.current;
      if (!ws?.connected) {
        console.error("[useCommentWebSocket] Not connected");
        return;
      }

      const input: UpdateCommentInput = {
        commentId,
        content,
        targetId,
        targetType,
      };

      ws.updateComment(input);
    },
    [targetId, targetType]
  );

  // Delete a comment
  const deleteComment = useCallback(
    (commentId: number) => {
      const ws = wsRef.current;
      if (!ws?.connected) {
        console.error("[useCommentWebSocket] Not connected");
        return;
      }

      const input: DeleteCommentInput = {
        commentId,
        targetId,
        targetType,
      };

      ws.deleteComment(input);
    },
    [targetId, targetType]
  );

  // Auto connect on mount
  useEffect(() => {
    if (autoConnect && targetId) {
      connect();
    }

    return () => {
      unsubscribeRef.current?.();
    };
  }, [autoConnect, targetId, connect]);

  // Resubscribe when targetId changes
  useEffect(() => {
    const ws = wsRef.current;
    if (ws?.connected && targetId) {
      // Unsubscribe from old topic
      unsubscribeRef.current?.();

      // Subscribe to new topic
      unsubscribeRef.current = ws.subscribeToComments(
        targetType,
        targetId,
        handleMessage
      );
    }
  }, [targetId, targetType, handleMessage]);

  return {
    isConnected: status === "connected",
    status,
    connect,
    disconnect,
    sendComment,
    updateComment,
    deleteComment,
    error,
  };
}

export default useCommentWebSocket;
