import { useState, useCallback, useRef } from "react";
import aiApiRequest, { StreamingChatEvent } from "@/apiRequests/ai";
import { ChatMessageRequestType } from "@/schemaValidations/ai.schema";

interface UseStreamingChatOptions {
  onEvent?: (event: StreamingChatEvent) => void;
  onComplete?: (result: { fullMessage: string; finalEvent?: StreamingChatEvent }) => void;
  onError?: (error: Error) => void;
}

interface UseStreamingChatReturn {
  streamingMessage: string;
  isStreaming: boolean;
  error: Error | null;
  sendStreamingMessage: (body: ChatMessageRequestType) => Promise<void>;
  cancelStream: () => void;
  resetStream: () => void;
}

/**
 * Hook for handling streaming AI chat responses
 *
 * @example
 * ```tsx
 * const { streamingMessage, isStreaming, sendStreamingMessage } = useStreamingChat({
 *   onComplete: (fullMessage) => {
 *     // Save message to state or perform other actions
 *     console.log('Complete message:', fullMessage);
 *   }
 * });
 *
 * // In your handler:
 * await sendStreamingMessage({
 *   userId: user.id,
 *   sessionId: currentSession.id,
 *   message: userInput,
 *   mode: 'GENERAL'
 * });
 *
 * // In your JSX:
 * {isStreaming && <div>{streamingMessage}</div>}
 * ```
 */
export function useStreamingChat(
  options: UseStreamingChatOptions = {}
): UseStreamingChatReturn {
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const fullMessageRef = useRef<string>("");
  const lastEventRef = useRef<StreamingChatEvent | undefined>(undefined);

  const resetStream = useCallback(() => {
    setStreamingMessage("");
    setError(null);
    fullMessageRef.current = "";
    lastEventRef.current = undefined;
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const sendStreamingMessage = useCallback(
    async (body: ChatMessageRequestType): Promise<void> => {
      console.log("🎯 [useStreamingChat] ===== STARTING STREAMING =====");
      console.log("🎯 [useStreamingChat] Body:", JSON.stringify(body, null, 2));
      
      // Reset state
      resetStream();
      setIsStreaming(true);

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        await aiApiRequest.sendStreamingChatMessage(
          body,
          {
            onChunk: (chunk: string) => {
              console.log("🎯 [useStreamingChat] Chunk received:", chunk);
              fullMessageRef.current += chunk;
              console.log("🎯 [useStreamingChat] Full message so far:", fullMessageRef.current);
              setStreamingMessage(fullMessageRef.current);
            },
            onEvent: (event: StreamingChatEvent) => {
              lastEventRef.current = event;
              options.onEvent?.(event);
            },
            onComplete: (event?: StreamingChatEvent) => {
              console.log("🎯 [useStreamingChat] ===== STREAM COMPLETE =====");
              console.log("🎯 [useStreamingChat] Final message:", fullMessageRef.current);
              setIsStreaming(false);
              options.onComplete?.({
                fullMessage: fullMessageRef.current,
                finalEvent: event || lastEventRef.current,
              });
            },
            onError: (err: Error) => {
              console.error("🎯 [useStreamingChat] ===== STREAM ERROR =====", err);
              setError(err);
              setIsStreaming(false);
              options.onError?.(err);
            },
          }
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("🎯 [useStreamingChat] ===== CAUGHT ERROR =====", error);
        setError(error);
        setIsStreaming(false);
        options.onError?.(error);
      }
    },
    [options, resetStream]
  );

  return {
    streamingMessage,
    isStreaming,
    error,
    sendStreamingMessage,
    cancelStream,
    resetStream,
  };
}

export default useStreamingChat;
