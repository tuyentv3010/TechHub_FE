# 🔌 API Integration Guide

## 📋 Overview

TechHub Frontend được thiết kế để dễ dàng chuyển đổi giữa Mock API (dữ liệu giả)
và Real API (backend thật). Hiện tại đang sử dụng **Mock API** để phát triển UI.

## 🔧 Current Setup (Mock API)

### Mock Services Available:

- ✅ **Authentication**: Login, Register, Logout, Profile
- ✅ **Courses**: List, Detail, Enrollment, Filters
- ✅ **Blog**: Posts, Categories, Search
- ✅ **Users**: Profile management

### Demo Accounts:

```javascript
// Admin Account
Email: admin@demo.com
Password: 123456

// Instructor Account
Email: instructor@demo.com
Password: 123456

// Learner Account
Email: learner@demo.com
Password: 123456
```

## 🚀 How to Switch to Real API

### Step 1: Update Environment Variable

```bash
# In .env.local
NEXT_PUBLIC_USE_MOCK_API=false
```

### Step 2: Update API Base URL (if needed)

```bash
# Point to your microservice API Gateway
NEXT_PUBLIC_API_URL=https://your-api-gateway.com/api
```

### Step 3: Verify API Endpoints

Make sure your backend implements these endpoints:

#### Authentication Endpoints:

```
POST /auth/login
POST /auth/register
POST /auth/logout
GET  /auth/profile
PUT  /auth/profile
POST /auth/refresh
```

#### Course Endpoints:

```
GET    /courses
GET    /courses/:id
POST   /courses/:id/enroll
GET    /courses/enrolled
GET    /categories
```

#### Blog Endpoints:

```
GET    /blog/posts
GET    /blog/posts/:id
GET    /blog/categories
```

## 📁 File Structure

```
src/
├── lib/
│   ├── api/                 # Real API services
│   │   ├── auth.service.ts  # 🔴 Real auth API calls
│   │   ├── course.service.ts# 🔴 Real course API calls
│   │   ├── blog.service.ts  # 🔴 Real blog API calls
│   │   ├── client.ts        # HTTP client config
│   │   └── index.ts         # 🔧 Auto-switches services
│   └── mock/                # Mock API services
│       ├── data.ts          # 🟢 Hardcoded mock data
│       └── services.ts      # 🟢 Mock implementations
```

## 🔄 How Auto-Switching Works

The `src/lib/api/index.ts` file automatically exports the correct service:

```typescript
// Auto-switch based on config
export const authService = config.features.useMockApi
  ? mockAuthService      // 🟢 Mock data
  : realAuthService;     // 🔴 Real API

// Your components use the same import
import { authService } from '@/lib/api';
```

## 📝 API Response Format

Your backend should return responses in this format:

### Success Response:

```json
{
  "data": { ... },
  "success": true,
  "message": "Optional success message"
}
```

### Error Response:

```json
{
  "error": "Error message",
  "success": false,
  "code": "ERROR_CODE"
}
```

### Paginated Response:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 🔍 Testing Integration

### 1. Check Current Mode:

Open browser console - you'll see:

```
🔧 API Mode: MOCK - Services ready!
```

### 2. Test Authentication:

```javascript
// Try login with demo account
Email: admin@demo.com
Password: 123456
```

### 3. Verify Network Calls:

- **Mock Mode**: No network requests in DevTools
- **Real Mode**: API calls visible in Network tab

## 🛠️ Development Workflow

### Phase 1: UI Development (Current)

```bash
NEXT_PUBLIC_USE_MOCK_API=true  # Use mock data
```

- ✅ Develop UI components
- ✅ Test user flows
- ✅ Validate designs

### Phase 2: API Integration (Future)

```bash
NEXT_PUBLIC_USE_MOCK_API=false  # Use real API
```

- 🔄 Connect to backend
- 🔄 Test real authentication
- 🔄 Validate API responses

## 🚨 Troubleshooting

### Mock API Issues:

- Check browser console for "API Mode: MOCK"
- Verify demo credentials are correct
- Check localStorage for 'mock_current_user'

### Real API Issues:

- Check Network tab for failed requests
- Verify API base URL is correct
- Check CORS configuration
- Validate API response format

## 📞 Backend Integration Checklist

- [ ] Authentication endpoints implemented
- [ ] JWT token format matches frontend expectations
- [ ] CORS configured for frontend domain
- [ ] API response format matches expected structure
- [ ] Error handling returns proper status codes
- [ ] Pagination format matches frontend expectations

## 🎯 Next Steps

1. **Current**: Using mock data for UI development
2. **Next**: Backend team implements API endpoints
3. **Integration**: Switch `NEXT_PUBLIC_USE_MOCK_API=false`
4. **Testing**: Verify all functionality with real API
5. **Production**: Deploy with real backend integration
