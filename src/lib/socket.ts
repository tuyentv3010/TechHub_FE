import envConfig from "@/config";
import { io, Socket } from "socket.io-client";
import { getAccessTokenFromLocalStorage } from "./utils";

class SocketManager {
  private socket: Socket | null = null;
  private isConnected = false;

  // Khởi tạo kết nối socket
  connect(): Socket {
    if (!this.socket || this.socket.disconnected) {
      const token = getAccessTokenFromLocalStorage();

      console.log('🚀 Connecting to socket server:', envConfig.NEXT_PUBLIC_API_ENDPOINT);
      console.log('🔑 Token available:', !!token);

      // Không kết nối nếu không có token
      if (!token) {
        console.error('❌ Cannot connect to socket: No authentication token available');
        throw new Error('Authentication token required for socket connection');
      }

      this.socket = io(envConfig.NEXT_PUBLIC_API_ENDPOINT, {
        // Thử polling trước, sau đó upgrade lên websocket
        transports: ['polling', 'websocket'],
        upgrade: true,
        // Authentication - Server yêu cầu token
        auth: {
          token: token,
        },
        extraHeaders: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        query: {
          token: token || '',
        },
        // Connection settings
        timeout: 10000,
        reconnection: token ? true : false, // Chỉ reconnect nếu có token
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        forceNew: false,
        // CORS settings
        withCredentials: true, // Cần thiết cho auth
        autoConnect: !!token, // Chỉ auto-connect nếu có token
      });

      // Lắng nghe các sự kiện kết nối
      this.socket.on('connect', () => {
        console.log('✅ Socket connected successfully!');
        console.log('🔌 Socket ID:', this.socket?.id);
        console.log('🚀 Transport:', this.socket?.io.engine.transport.name);
        this.isConnected = true;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        this.isConnected = false;
        
        // Log chi tiết lý do disconnect
        if (reason === 'io server disconnect') {
          console.log('Server initiated disconnect');
        } else if (reason === 'io client disconnect') {
          console.log('Client initiated disconnect');
        } else {
          console.log('Connection lost, will attempt to reconnect...');
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        console.error('Error details:', error);
        
        // Check for authentication errors
        if (error.message.includes('Authentication') || error.message.includes('401')) {
          console.error('🔒 Authentication failed. Token might be invalid or expired.');
          console.error('💡 Try logging in again to refresh the token.');
        } else if (error.message.includes('xhr poll error') || error.message.includes('websocket error')) {
          console.error('🚫 Server connection failed. Server might not be running.');
          console.error('📍 Endpoint:', envConfig.NEXT_PUBLIC_API_ENDPOINT);
          console.error('💡 Make sure server is running and accepting Socket.IO connections.');
        }
      });

      // Lắng nghe engine events
      this.socket.io.engine.on('upgrade', () => {
        console.log('📈 Socket upgraded to:', this.socket?.io.engine.transport.name);
      });

      this.socket.io.engine.on('upgradeError', (error: any) => {
        console.warn('⚠️ Socket upgrade failed:', error);
      });

      // Lắng nghe sự kiện auth error và reconnect với token mới
      this.socket.on('auth_error', () => {
        console.log('🔐 Auth error, reconnecting with new token...');
        this.reconnectWithNewToken();
      });
    }

    return this.socket;
  }

  // Reconnect với token mới
  reconnectWithNewToken(): void {
    if (this.socket) {
      const newToken = getAccessTokenFromLocalStorage();
      console.log('🔄 Reconnecting with new token...');
      
      // Update auth info
      this.socket.auth = {
        token: newToken || '',
      };
      
      // Update headers
      if (this.socket.io.opts.extraHeaders) {
        this.socket.io.opts.extraHeaders.Authorization = newToken ? `Bearer ${newToken}` : '';
      }
      
      // Disconnect and reconnect
      this.socket.disconnect();
      this.socket.connect();
    }
  }

  // Lấy socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // Kiểm tra trạng thái kết nối
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected || false;
  }

  // Đóng kết nối
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Emit event với error handling
  emit(event: string, data?: any): void {
    if (this.socket && this.isSocketConnected()) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Socket not connected, cannot emit event:', event);
    }
  }

  // Listen cho event với callback
  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Hủy lắng nghe event
  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

// Tạo singleton instance
const socketManager = new SocketManager();

export default socketManager;
