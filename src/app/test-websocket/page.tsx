"use client";

import { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import envConfig from "@/config";

export default function WebSocketTestPage() {
  const [status, setStatus] = useState<string>("Disconnected");
  const [messages, setMessages] = useState<string[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [blogId, setBlogId] = useState("090d869c-0a4b-4f59-8f3b-196e26c2d05a"); // Default to a real blog UUID
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  const connect = () => {
    setStatus("Connecting...");
    addMessage("🔄 Starting connection...");

    const wsBase = envConfig.NEXT_PUBLIC_WS_BASE || envConfig.NEXT_PUBLIC_API_ENDPOINT;
    const sockJsUrl = `${wsBase}/blog-service/ws-comment`;
    addMessage(`📡 SockJS URL: ${sockJsUrl}`);

    const stompClient = new Client({
      webSocketFactory: () => {
        addMessage("🔧 Creating SockJS connection...");
        const sock = new SockJS(sockJsUrl);
        
        sock.onopen = () => addMessage("✅ SockJS: onopen");
        sock.onclose = (e) => addMessage(`❌ SockJS: onclose - code=${e.code}, reason=${e.reason}`);
        sock.onerror = (e) => addMessage(`⚠️ SockJS: onerror - ${JSON.stringify(e)}`);
        
        return sock as WebSocket;
      },
      debug: (str) => {
        console.log("[STOMP]", str);
        // Only log important STOMP messages
        if (str.includes("CONNECT") || str.includes("SUBSCRIBE") || 
            str.includes("MESSAGE") || str.includes("ERROR") ||
            str.includes("DISCONNECT")) {
          addMessage(`[STOMP] ${str.substring(0, 100)}`);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: (frame) => {
        setStatus("Connected!");
        addMessage("✅ STOMP Connected!");
        addMessage(`📋 Frame: ${JSON.stringify(frame.headers)}`);

        // Subscribe to blog comments
        const destination = `/topic/blog/${blogId}/comments`;
        addMessage(`📡 Subscribing to: ${destination}`);
        
        stompClient.subscribe(destination, (message) => {
          addMessage(`📩 RECEIVED MESSAGE:`);
          addMessage(`   Body: ${message.body}`);
          try {
            const parsed = JSON.parse(message.body);
            addMessage(`   Parsed: eventType=${parsed.eventType}, content=${parsed.payload?.content}`);
          } catch (e) {
            addMessage(`   (Could not parse as JSON)`);
          }
        });

        addMessage(`✅ Subscribed to ${destination}`);
      },
      onDisconnect: () => {
        setStatus("Disconnected");
        addMessage("❌ STOMP Disconnected");
      },
      onStompError: (frame) => {
        setStatus("STOMP Error");
        addMessage(`⚠️ STOMP Error: ${frame.headers["message"]}`);
        addMessage(`   Details: ${frame.body}`);
      },
      onWebSocketError: (event) => {
        setStatus("WebSocket Error");
        addMessage(`⚠️ WebSocket Error: ${JSON.stringify(event)}`);
      },
      onWebSocketClose: (event) => {
        addMessage(`🔌 WebSocket Closed: code=${event.code}, reason=${event.reason}, wasClean=${event.wasClean}`);
      },
    });

    stompClient.activate();
    setClient(stompClient);
  };

  const disconnect = () => {
    if (client) {
      client.deactivate();
      setClient(null);
    }
  };

  const sendMessage = () => {
    if (client && client.connected && inputMessage.trim()) {
      const destination = `/app/blog/${blogId}/comment`;
      const payload = {
        content: inputMessage,
        targetId: parseInt(blogId),
        targetType: "BLOG",
      };
      
      addMessage(`📤 Sending to: ${destination}`);
      addMessage(`   Payload: ${JSON.stringify(payload)}`);
      
      client.publish({
        destination,
        body: JSON.stringify(payload),
      });
      
      addMessage(`✅ Message sent!`);
      setInputMessage("");
    } else {
      addMessage(`⚠️ Cannot send: connected=${client?.connected}, message="${inputMessage}"`);
    }
  };

  useEffect(() => {
    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [client]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">WebSocket STOMP Test</h1>

      <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
        <p>
          Status:{" "}
          <span
            className={
              status === "Connected!"
                ? "text-green-600"
                : status.includes("Error")
                ? "text-red-600"
                : "text-yellow-600"
            }
        >
          {status}
        </span>
      </p>
      <p className="text-sm text-gray-500">
          Endpoint: {`${envConfig.NEXT_PUBLIC_WS_BASE || envConfig.NEXT_PUBLIC_API_ENDPOINT}/blog-service/ws-comment`}
      </p>
    </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={blogId}
          onChange={(e) => setBlogId(e.target.value)}
          placeholder="Blog ID (UUID)"
          className="border px-3 py-2 rounded w-80"
        />
        <button
          onClick={connect}
          disabled={status === "Connected!"}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Connect
        </button>
        <button
          onClick={disconnect}
          disabled={status !== "Connected!"}
          className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Disconnect
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="border px-3 py-2 rounded flex-1"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={status !== "Connected!" || !inputMessage.trim()}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>

      <div className="border rounded p-4 h-96 overflow-y-auto bg-black text-green-400 font-mono text-sm">
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet...</p>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="mb-1 whitespace-pre-wrap">
              {msg}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 mt-2">
        <button 
          onClick={() => setMessages([])}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear logs
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>
          <strong>Instructions:</strong>
        </p>
        <ol className="list-decimal ml-4">
          <li>Make sure BlogService is running on port 8081</li>
          <li>Enter Blog ID and click Connect</li>
          <li>Type a message and click Send</li>
          <li>Open another browser tab to test real-time sync</li>
        </ol>
      </div>
    </div>
  );
}
