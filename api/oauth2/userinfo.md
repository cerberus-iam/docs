# OAuth2 UserInfo Endpoint

Get authenticated user's profile information.

## Endpoint

```
GET /oauth2/userinfo
```

## Description

Returns the authenticated user's profile information based on the requested scopes. This endpoint is part of the OpenID Connect (OIDC) specification and returns standard OIDC claims.

## Authentication

**Required:** Yes (Bearer token)

## Headers

| Header          | Required | Description                            |
| --------------- | -------- | -------------------------------------- |
| `Authorization` | Yes      | Bearer access token from /oauth2/token |

### Example Request

```http
GET /oauth2/userinfo HTTP/1.1
Host: localhost:4000
Authorization: Bearer eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

## Response

### Success Response

**Status Code:** `200 OK`

```json
{
  "sub": "usr_x1y2z3a4b5c6",
  "email": "john.doe@acme.com",
  "email_verified": true,
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "middle_name": null,
  "phone_number": "+1234567890",
  "phone_number_verified": true,
  "picture": "https://cdn.example.com/avatars/user123.jpg",
  "updated_at": 1638356400
}
```

### Claims Returned

Claims returned depend on the scopes granted:

#### Always Returned

- `sub` (string) - User ID (subject identifier)
- `updated_at` (number) - Last update timestamp (Unix time)

#### With `email` scope

- `email` (string) - Email address
- `email_verified` (boolean) - Email verification status

#### With `profile` scope

- `name` (string) - Full name
- `given_name` (string) - First name
- `family_name` (string) - Last name
- `middle_name` (string | null) - Middle name
- `picture` (string | null) - Profile photo URL

#### With `phone` scope

- `phone_number` (string | null) - Phone number
- `phone_number_verified` (boolean) - Phone verification status

### Error Responses

**401 Unauthorized - Missing Token:**

```json
{
  "type": "https://cerberus.local/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required"
}
```

**401 Unauthorized - Invalid Token:**

```json
{
  "type": "https://cerberus.local/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid or expired token"
}
```

**404 Not Found - User Not Found:**

```json
{
  "type": "https://cerberus.local/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "User not found"
}
```

## Code Examples

### cURL

```bash
curl -X GET http://localhost:4000/oauth2/userinfo \
  -H "Authorization: Bearer eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."
```

### JavaScript (fetch)

```javascript
async function getUserInfo(accessToken) {
  const response = await fetch('http://localhost:4000/oauth2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  return response.json();
}

// Usage
const accessToken = localStorage.getItem('access_token');
const userInfo = await getUserInfo(accessToken);
console.log('User:', userInfo);
```

### TypeScript

```typescript
interface UserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string | null;
  phone_number?: string | null;
  phone_number_verified?: boolean;
  picture?: string | null;
  updated_at: number;
}

async function getUserInfo(accessToken: string): Promise<UserInfo> {
  const response = await fetch('http://localhost:4000/oauth2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch user info');
  }

  return response.json();
}

// Usage with token manager
class UserService {
  constructor(private tokenManager: TokenManager) {}

  async getCurrentUser(): Promise<UserInfo> {
    const accessToken = await this.tokenManager.getAccessToken();
    return getUserInfo(accessToken);
  }
}
```

## Related Endpoints

- [POST /oauth2/token](./token.md) - Get access token
- [GET /.well-known/openid-configuration](./discovery.md) - OIDC discovery
