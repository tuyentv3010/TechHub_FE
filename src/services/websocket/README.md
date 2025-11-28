# WebSocket Real-time Comments - Hướng dẫn sử dụng

## 📦 Cài đặt

Các package đã được cài đặt:
- `@stomp/stompjs` - STOMP client
- `sockjs-client` - SockJS fallback

## 🚀 Cách sử dụng

### 1. Sử dụng Component `RealtimeComments`

```tsx
import { RealtimeComments } from "@/components/common";

// Trong Blog page
export default function BlogDetailPage({ blogId }: { blogId: number }) {
  return (
    <div>
      {/* Blog content */}
      
      {/* Real-time comments */}
      <RealtimeComments
        targetType="BLOG"
        targetId={blogId}
        initialComments={[]} // Load từ API
        debug={false}
        placeholder="Viết bình luận về bài viết..."
      />
    </div>
  );
}

// Trong Course page
export default function CourseDetailPage({ courseId }: { courseId: number }) {
  return (
    <RealtimeComments
      targetType="COURSE"
      targetId={courseId}
      initialComments={[]}
    />
  );
}

// Trong Lesson page
export default function LessonPage({ lessonId }: { lessonId: number }) {
  return (
    <RealtimeComments
      targetType="LESSON"
      targetId={lessonId}
      initialComments={[]}
    />
  );
}
```

### 2. Sử dụng Hook `useCommentWebSocket`

Nếu bạn muốn customize giao diện:

```tsx
import { useCommentWebSocket } from "@/hooks/useCommentWebSocket";
import { useState } from "react";

export function CustomCommentSection({ blogId }: { blogId: number }) {
  const [comments, setComments] = useState([]);

  const {
    isConnected,
    status,
    sendComment,
    updateComment,
    deleteComment,
    error,
  } = useCommentWebSocket({
    targetType: "BLOG",
    targetId: blogId,
    debug: true, // Enable debug logs
    
    // Callbacks khi nhận được events
    onCommentCreated: (comment) => {
      setComments((prev) => [comment, ...prev]);
    },
    onCommentUpdated: (comment) => {
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? comment : c))
      );
    },
    onCommentDeleted: (comment) => {
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
    },
    
    // Connection callbacks
    onConnect: () => console.log("Connected!"),
    onDisconnect: () => console.log("Disconnected!"),
    onError: (err) => console.error("Error:", err),
  });

  return (
    <div>
      <p>Status: {status}</p>
      <p>Connected: {isConnected ? "Yes" : "No"}</p>
      
      {/* Your custom UI */}
      <button onClick={() => sendComment("Hello!")}>
        Send Comment
      </button>
    </div>
  );
}
```

### 3. Sử dụng Service trực tiếp

Cho advanced use cases:

```tsx
import {
  getBlogCommentWebSocket,
  getCourseCommentWebSocket,
} from "@/services/websocket";

// Get singleton instance
const blogWS = getBlogCommentWebSocket();

// Connect
blogWS.connect({
  debug: true,
  onConnect: () => {
    // Subscribe to blog comments
    blogWS.subscribeToComments("BLOG", 123, (message) => {
      console.log("Received:", message);
    });
  },
});

// Send comment
blogWS.sendComment({
  content: "Hello World!",
  targetId: 123,
  targetType: "BLOG",
});

// Disconnect when done
blogWS.disconnect();
```

## 📡 WebSocket Endpoints

| Service | Endpoint | Port |
|---------|----------|------|
| Blog | `/blog-service/ws-comment` | 8443 (via Gateway) |
| Course | `/course-service/ws-comment` | 8443 (via Gateway) |
| Direct Blog | `/ws-comment` | 8081 |
| Direct Course | `/ws-comment` | 8082 |

## 🔗 STOMP Destinations

### Subscribe (nhận messages)
- Blog: `/topic/blog/{blogId}/comments`
- Course: `/topic/course/{courseId}/comments`
- Lesson: `/topic/lesson/{lessonId}/comments`

### Publish (gửi messages)
- Create: `/app/blog/{blogId}/comment`
- Update: `/app/blog/{blogId}/comment/{commentId}`
- Delete: `/app/blog/{blogId}/comment/{commentId}/delete`

## 📦 Message Format

### Incoming Message
```json
{
  "eventType": "CREATED" | "UPDATED" | "DELETED",
  "payload": {
    "id": 1,
    "content": "Comment content",
    "userId": "user-uuid",
    "userName": "User Name",
    "userAvatar": "https://...",
    "targetId": 123,
    "targetType": "BLOG" | "COURSE" | "LESSON",
    "parentId": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Outgoing Message (Send Comment)
```json
{
  "content": "Comment content",
  "targetId": 123,
  "targetType": "BLOG",
  "parentId": null
}
```

## 🔐 Authentication

Token được tự động lấy từ `localStorage` và gửi trong STOMP CONNECT headers:
```
Authorization: Bearer <jwt_token>
```

## 🐛 Debug Mode

Enable debug để xem logs:
```tsx
<RealtimeComments debug={true} ... />
// hoặc
useCommentWebSocket({ debug: true, ... });
```
