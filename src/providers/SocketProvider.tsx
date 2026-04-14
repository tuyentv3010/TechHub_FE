import React, {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useMemo,
  useState,
} from "react";
import socketManager from "@/lib/socket";

interface SocketContextType {
  isConnected: boolean;
  connect: () => void;
  emit: (event: string, data?: any) => void;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({
  children,
  autoConnect = false,
}) => {
  const [isConnected, setIsConnected] = useState(
    socketManager.isSocketConnected()
  );

  useEffect(() => {
    const unsubscribe = socketManager.subscribe(setIsConnected);

    if (autoConnect) {
      socketManager.connect();
    }

    return () => {
      unsubscribe();
      socketManager.disconnect();
    };
  }, [autoConnect]);

  const value = useMemo<SocketContextType>(
    () => ({
      isConnected,
      connect: () => {
        socketManager.connect();
      },
      emit: (event: string, data?: any) => {
        socketManager.emit(event, data);
      },
      reconnect: () => {
        socketManager.reconnectWithNewToken();
      },
    }),
    [isConnected]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
