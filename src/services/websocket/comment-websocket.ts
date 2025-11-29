import { Client, IMessage } from "@stomp/stompjs";
import {
  createStompClient,
  SubscriptionManager,
  WebSocketServiceType,
} from "./stomp-client";

/**
 * Comment target types supported by WebSocket
 */
export type CommentTargetType = "BLOG" | "COURSE" | "LESSON";

/**
 * Comment event types
 */
export type CommentEventType = "CREATED" | "UPDATED" | "DELETED";

/**
 * Comment payload structure from WebSocket
 */
export interface CommentPayload {
  id: number;
  content: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  targetId: number;
  targetType: CommentTargetType;
  parentId?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * WebSocket message structure for comments
 */
export interface CommentWebSocketMessage {
  eventType: CommentEventType;
  payload: CommentPayload;
  timestamp: string;
}

/**
 * Input for sending a new comment
 */
export interface SendCommentInput {
  content: string;
  targetId: number;
  targetType: CommentTargetType;
  parentId?: number;
}

/**
 * Input for updating a comment
 */
export interface UpdateCommentInput {
  commentId: number;
  content: string;
  targetId: number;
  targetType: CommentTargetType;
}

/**
 * Input for deleting a comment
 */
export interface DeleteCommentInput {
  commentId: number;
  targetId: number;
  targetType: CommentTargetType;
}

/**
 * Comment WebSocket Service
 * Handles real-time comment operations for Blog, Course, and Lesson
 */
export class CommentWebSocketService {
  private client: Client | null = null;
  private subscriptionManager = new SubscriptionManager();
  private service: WebSocketServiceType;
  private isConnected = false;
  private messageHandlers: Map<
    string,
    (message: CommentWebSocketMessage) => void
  > = new Map();

  constructor(service: WebSocketServiceType) {
    this.service = service;
  }

  /**
   * Connect to WebSocket server
   */
  connect(options?: {
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: string) => void;
    debug?: boolean;
    /**
     * If true, connect directly to service (bypass gateway)
     * Default: true for better compatibility
     */
    directConnection?: boolean;
  }): void {
    if (this.isConnected && this.client?.connected) {
      console.log(`[CommentWS] Already connected to ${this.service}`);
      return;
    }

    this.client = createStompClient({
      service: this.service,
      debug: options?.debug,
      directConnection: options?.directConnection ?? true,
      onConnect: () => {
        this.isConnected = true;
        options?.onConnect?.();
      },
      onDisconnect: () => {
        this.isConnected = false;
        options?.onDisconnect?.();
      },
      onError: options?.onError,
    });

    this.client.activate();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.subscriptionManager.clear();
    this.messageHandlers.clear();
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.isConnected = false;
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected && (this.client?.connected ?? false);
  }

  /**
   * Subscribe to comments for a specific target (blog, course, or lesson)
   */
  subscribeToComments(
    targetType: CommentTargetType,
    targetId: number,
    onMessage: (message: CommentWebSocketMessage) => void
  ): () => void {
    if (!this.client || !this.connected) {
      console.error("[CommentWS] Not connected. Call connect() first.");
      return () => {};
    }

    const destination = this.getTopicDestination(targetType, targetId);
    const subscriptionId = `${targetType}-${targetId}`;

    // Store handler for potential reconnection
    this.messageHandlers.set(subscriptionId, onMessage);

    const subscription = this.client.subscribe(
      destination,
      (message: IMessage) => {
        try {
          const parsed: CommentWebSocketMessage = JSON.parse(message.body);
          onMessage(parsed);
        } catch (error) {
          console.error("[CommentWS] Failed to parse message:", error);
        }
      }
    );

    this.subscriptionManager.add(subscriptionId, subscription);

    console.log(`[CommentWS] Subscribed to ${destination}`);

    // Return unsubscribe function
    return () => {
      this.subscriptionManager.remove(subscriptionId);
      this.messageHandlers.delete(subscriptionId);
      console.log(`[CommentWS] Unsubscribed from ${destination}`);
    };
  }

  /**
   * Send a new comment
   */
  sendComment(input: SendCommentInput): void {
    if (!this.client || !this.connected) {
      console.error("[CommentWS] Not connected. Call connect() first.");
      return;
    }

    const destination = this.getAppDestination(input.targetType, input.targetId, "comment");

    this.client.publish({
      destination,
      body: JSON.stringify(input),
    });

    console.log(`[CommentWS] Sent comment to ${destination}`);
  }

  /**
   * Update an existing comment
   */
  updateComment(input: UpdateCommentInput): void {
    if (!this.client || !this.connected) {
      console.error("[CommentWS] Not connected. Call connect() first.");
      return;
    }

    const destination = this.getAppDestination(
      input.targetType,
      input.targetId,
      `comment/${input.commentId}`
    );

    this.client.publish({
      destination,
      body: JSON.stringify({ content: input.content }),
    });

    console.log(`[CommentWS] Updated comment ${input.commentId}`);
  }

  /**
   * Delete a comment
   */
  deleteComment(input: DeleteCommentInput): void {
    if (!this.client || !this.connected) {
      console.error("[CommentWS] Not connected. Call connect() first.");
      return;
    }

    const destination = this.getAppDestination(
      input.targetType,
      input.targetId,
      `comment/${input.commentId}/delete`
    );

    this.client.publish({
      destination,
      body: JSON.stringify({}),
    });

    console.log(`[CommentWS] Deleted comment ${input.commentId}`);
  }

  /**
   * Get topic destination for subscribing
   */
  private getTopicDestination(
    targetType: CommentTargetType,
    targetId: number
  ): string {
    const prefix = targetType.toLowerCase();
    return `/topic/${prefix}/${targetId}/comments`;
  }

  /**
   * Get app destination for sending messages
   */
  private getAppDestination(
    targetType: CommentTargetType,
    targetId: number,
    action: string
  ): string {
    const prefix = targetType.toLowerCase();
    return `/app/${prefix}/${targetId}/${action}`;
  }
}

// Singleton instances for each service
let blogCommentWS: CommentWebSocketService | null = null;
let courseCommentWS: CommentWebSocketService | null = null;

/**
 * Get or create Blog Comment WebSocket service
 */
export function getBlogCommentWebSocket(): CommentWebSocketService {
  if (!blogCommentWS) {
    blogCommentWS = new CommentWebSocketService("blog");
  }
  return blogCommentWS;
}

/**
 * Get or create Course Comment WebSocket service
 */
export function getCourseCommentWebSocket(): CommentWebSocketService {
  if (!courseCommentWS) {
    courseCommentWS = new CommentWebSocketService("course");
  }
  return courseCommentWS;
}

/**
 * Cleanup all WebSocket connections
 */
export function cleanupAllCommentWebSockets(): void {
  blogCommentWS?.disconnect();
  courseCommentWS?.disconnect();
  blogCommentWS = null;
  courseCommentWS = null;
}
