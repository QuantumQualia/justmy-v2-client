# Authentication Service

This service provides JWT-based authentication with automatic token management and session handling.

## Features

- ✅ JWT token storage (access token + refresh token)
- ✅ Automatic token attachment to API requests
- ✅ Automatic token refresh on 401 errors
- ✅ Session management utilities
- ✅ Compatible with NestJS/Fastify backend patterns

## Usage

### Login

```typescript
import { authService } from "@/lib/services/auth";

try {
  const response = await authService.login({
    email: "user@example.com",
    password: "password123"
  });
  // Tokens are automatically saved to localStorage
  console.log(response.user);
} catch (error) {
  if (error instanceof ApiClientError) {
    console.error(error.message);
  }
}
```

### Register

```typescript
import { authService } from "@/lib/services/auth";

try {
  const response = await authService.register({
    firstName: "John",
    lastName: "Doe",
    email: "user@example.com",
    password: "password123",
    zipCode: "38103",
    tier: "PERSONAL"
  });
  // Tokens are automatically saved
} catch (error) {
  // Handle error
}
```

### Check Authentication Status

```typescript
import { isAuthenticated, getCurrentUser } from "@/lib/services/session";

if (isAuthenticated()) {
  const user = getCurrentUser();
  console.log("Logged in as:", user?.email);
}
```

### Logout

```typescript
import { authService } from "@/lib/services/auth";

await authService.logout();
// Tokens are automatically cleared
```

### Making Authenticated API Requests

All API requests made through `apiRequest` automatically include the JWT token:

```typescript
import { apiRequest } from "@/lib/api-client";

// Token is automatically attached
const data = await apiRequest("users/profile");

// Skip auth for public endpoints
const publicData = await apiRequest("public/data", { skipAuth: true });
```

## Configuration

Set the backend API URL in your environment variables:

```bash
# .env.local or .env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

If `NEXT_PUBLIC_API_URL` is not set, the client will use relative paths (same domain).

## Backend API Endpoints Expected

The service expects the following NestJS/Fastify endpoints:

### POST `/api/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "tier": "PERSONAL"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

### POST `/api/auth/register`
**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "password": "password123",
  "zipCode": "38103",
  "tier": "PERSONAL"
}
```

**Response:** Same as login

### POST `/api/auth/refresh`
**Request:**
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:** Same as login

### GET `/api/auth/me`
**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "tier": "PERSONAL"
}
```

### POST `/api/auth/logout`
**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Token Storage

Tokens are stored in `localStorage` with the following keys:
- `auth_access_token` - JWT access token
- `auth_refresh_token` - JWT refresh token
- `auth_user` - User data (JSON)

## Automatic Token Refresh

When a request returns 401 Unauthorized:
1. The client automatically attempts to refresh the token using the refresh token
2. If refresh succeeds, the original request is retried with the new token
3. If refresh fails, tokens are cleared and user must login again

## Security Notes

- Tokens are stored in localStorage (consider httpOnly cookies for production)
- All API requests automatically include `Authorization: Bearer <token>` header
- Tokens are cleared on logout or failed refresh
- SSR-safe: token storage checks for browser environment

