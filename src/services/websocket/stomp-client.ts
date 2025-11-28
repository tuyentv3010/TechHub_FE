import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import envConfig from "@/config";
import { getAccessTokenFromLocalStorage } from "@/lib/utils";

export type WebSocketServiceType = "blog" | "course";

interface StompClientConfig {
  service: WebSocketServiceType;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
  debug?: boolean;
  /**
   * If true, connect directly to service (bypass gateway)
   * blog: http://localhost:8081/ws-comment
   * course: http://localhost:8082/ws-comment
   */
  directConnection?: boolean;
}

/**
 * Direct service ports for WebSocket connections
 */
const DIRECT_PORTS: Record<WebSocketServiceType, number> = {
  blog: 8081,
  course: 8082,
};

/**
 * Get WebSocket URL based on service type
 * Uses SockJS for better compatibility
 */
function getWebSocketUrl(service: WebSocketServiceType, directConnection: boolean = false): string {
  if (directConnection) {
    // Connect directly to service (bypass API Gateway)
    const port = DIRECT_PORTS[service];
    return `http://localhost:${port}/ws-comment`;
  }
  
  const baseUrl = envConfig.NEXT_PUBLIC_API_ENDPOINT;
  const servicePath = service === "blog" ? "blog-service" : "course-service";
  return `${baseUrl}/${servicePath}/ws-comment`;
}

/**
 * Create STOMP client for WebSocket communication
 */
export function createStompClient(config: StompClientConfig): Client {
  const { service, onConnect, onDisconnect, onError, debug = false, directConnection = true } = config;

  const wsUrl = getWebSocketUrl(service, directConnection);
  
  if (debug) {
    console.log(`[STOMP] Connecting to: ${wsUrl}`);
  }

  const client = new Client({
    // Use SockJS for compatibility
    webSocketFactory: () => {
      return new SockJS(wsUrl) as WebSocket;
    },

    // Connection headers with auth
    connectHeaders: {
      Authorization: `Bearer ${getAccessTokenFromLocalStorage() || ""}`,
    },

    // Debug logging
    debug: (str) => {
      if (debug) {
        console.log(`[STOMP ${service}]`, str);
      }
    },

    // Reconnect settings
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    // Callbacks
    onConnect: () => {
      console.log(`[WebSocket] Connected to ${service} service at ${wsUrl}`);
      onConnect?.();
    },

    onDisconnect: () => {
      console.log(`[WebSocket] Disconnected from ${service} service`);
      onDisconnect?.();
    },

    onStompError: (frame) => {
      console.error(`[WebSocket] STOMP error:`, frame.headers["message"]);
      onError?.(frame.headers["message"] || "Unknown STOMP error");
    },

    onWebSocketError: (event) => {
      console.error(`[WebSocket] WebSocket error:`, event);
      onError?.("WebSocket connection error");
    },
  });

  return client;
}

/**
 * Subscription manager for handling multiple subscriptions
 */
export class SubscriptionManager {
  private subscriptions: Map<string, StompSubscription> = new Map();

  add(id: string, subscription: StompSubscription): void {
    // Unsubscribe existing if any
    this.remove(id);
    this.subscriptions.set(id, subscription);
  }

  remove(id: string): void {
    const sub = this.subscriptions.get(id);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(id);
    }
  }

  clear(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
  }

  has(id: string): boolean {
    return this.subscriptions.has(id);
  }
}

export type { IMessage, StompSubscription };
