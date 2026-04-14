import envConfig from "@/config";
import { io, Socket } from "socket.io-client";
import { getAccessTokenFromLocalStorage } from "./utils";

type ConnectionListener = (isConnected: boolean) => void;

class SocketManager {
  private socket: Socket | null = null;
  private isConnected = false;
  private listeners = new Set<ConnectionListener>();

  private notifyConnectionChange(): void {
    const status = this.isSocketConnected();
    this.listeners.forEach((listener) => listener(status));
  }

  private applyAuth(token: string): void {
    if (!this.socket) {
      return;
    }

    this.socket.auth = { token };
    this.socket.io.opts.extraHeaders = {
      ...(this.socket.io.opts.extraHeaders ?? {}),
      Authorization: `Bearer ${token}`,
    };
    this.socket.io.opts.query = {
      ...(this.socket.io.opts.query ?? {}),
      token,
    };
  }

  connect(): Socket | null {
    const token = getAccessTokenFromLocalStorage();

    if (!token) {
      this.disconnect();
      return null;
    }

    if (!this.socket) {
      this.socket = io(envConfig.NEXT_PUBLIC_API_ENDPOINT, {
        transports: ["polling", "websocket"],
        upgrade: true,
        auth: { token },
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
        query: { token },
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        forceNew: false,
        withCredentials: true,
        autoConnect: false,
      });

      this.socket.on("connect", () => {
        this.isConnected = true;
        this.notifyConnectionChange();
      });

      this.socket.on("disconnect", () => {
        this.isConnected = false;
        this.notifyConnectionChange();
      });

      this.socket.on("connect_error", () => {
        this.isConnected = false;
        this.notifyConnectionChange();
      });

      this.socket.on("auth_error", () => {
        this.reconnectWithNewToken();
      });
    }

    this.applyAuth(token);

    if (this.socket.disconnected) {
      this.socket.connect();
    }

    return this.socket;
  }

  reconnectWithNewToken(): void {
    const token = getAccessTokenFromLocalStorage();

    if (!token) {
      this.disconnect();
      return;
    }

    if (!this.socket) {
      this.connect();
      return;
    }

    this.applyAuth(token);
    this.socket.disconnect();
    this.socket.connect();
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isSocketConnected(): boolean {
    return this.isConnected && !!this.socket?.connected;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.notifyConnectionChange();
  }

  emit(event: string, data?: any): void {
    if (!this.isSocketConnected()) {
      this.connect();
    }

    if (this.socket && this.isSocketConnected()) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) {
      this.connect();
    }

    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  subscribe(listener: ConnectionListener): () => void {
    this.listeners.add(listener);
    listener(this.isSocketConnected());

    return () => {
      this.listeners.delete(listener);
    };
  }
}

const socketManager = new SocketManager();

export default socketManager;
