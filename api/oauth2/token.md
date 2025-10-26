# OAuth2 Token Endpoint

Exchange authorization code or refresh token for access tokens.

## Endpoint

```
POST /oauth2/token
```

## Description

The token endpoint supports two grant types:

1. **authorization_code** - Exchange authorization code for tokens
2. **refresh_token** - Refresh access token using refresh token

This endpoint handles client authentication and issues JWT access tokens and optionally refresh tokens.

## Authentication

**Required:** Client authentication (see Client Authentication section)

## Headers

| Header          | Required    | Description                                 |
| --------------- | ----------- | ------------------------------------------- |
| `Content-Type`  | Yes         | Must be `application/x-www-form-urlencoded` |
| `Authorization` | Conditional | Basic auth for `client_secret_basic` method |

## Grant Type: authorization_code

Exchange an authorization code for access and refresh tokens.

### Request Body Parameters

| Parameter       | Type   | Required    | Description                                            |
| --------------- | ------ | ----------- | ------------------------------------------------------ |
| `grant_type`    | string | Yes         | Must be `authorization_code`                           |
| `code`          | string | Yes         | Authorization code from /oauth2/authorize              |
| `redirect_uri`  | string | Yes         | Must match the redirect URI from authorization request |
| `client_id`     | string | Conditional | Required if not using HTTP Basic auth                  |
| `client_secret` | string | Conditional | Required for confidential clients                      |
| `code_verifier` | string | Conditional | PKCE verifier (required if PKCE was used)              |

### Example Request (with PKCE)

```http
POST /oauth2/token HTTP/1.1
Host: localhost:4000
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=authz_a1b2c3d4e5f6g7h8&redirect_uri=https://app.example.com/callback&client_id=cli_abc123&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

### Success Response

**Status Code:** `200 OK`

**With refresh token (offline_access scope):**

```json
{
  "access_token": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "rt_x1y2z3a4b5c6d7e8f9",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email offline_access"
}
```

**Without refresh token:**

```json
{
  "access_token": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}
```

## Grant Type: refresh_token

Obtain a new access token using a refresh token.

### Request Body Parameters

| Parameter       | Type   | Required    | Description                           |
| --------------- | ------ | ----------- | ------------------------------------- |
| `grant_type`    | string | Yes         | Must be `refresh_token`               |
| `refresh_token` | string | Yes         | Valid refresh token                   |
| `client_id`     | string | Conditional | Required if not using HTTP Basic auth |
| `client_secret` | string | Conditional | Required for confidential clients     |

### Example Request

```http
POST /oauth2/token HTTP/1.1
Host: localhost:4000
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=rt_x1y2z3a4b5c6d7e8f9&client_id=cli_abc123
```

### Success Response

**Status Code:** `200 OK`

```json
{
  "access_token": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "rt_new_token_here",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email offline_access"
}
```

**Note:** Refresh token rotation is enabled. A new refresh token is issued and the old one is revoked.

## Client Authentication

The token endpoint supports three authentication methods:

### 1. client_secret_basic (HTTP Basic)

```http
Authorization: Basic Y2xpX2FiYzEyMzpjbGllbnRfc2VjcmV0X2hlcmU=
```

The `Authorization` header contains Base64-encoded `client_id:client_secret`.

### 2. client_secret_post (Request Body)

```http
POST /oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=...&client_id=cli_abc123&client_secret=secret_here
```

### 3. none (Public Clients)

Public clients (mobile apps, SPAs) don't have a client secret:

```http
POST /oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=...&client_id=cli_abc123&code_verifier=...
```

**Note:** Public clients MUST use PKCE.

## Error Responses

All errors return JSON with OAuth2 error format:

**Invalid authorization code:**

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid or expired authorization code"
}
```

**Invalid client credentials:**

```json
{
  "error": "invalid_client",
  "error_description": "Invalid client credentials"
}
```

**Missing parameters:**

```json
{
  "error": "invalid_request",
  "error_description": "Missing required parameters"
}
```

**Invalid PKCE verifier:**

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid code_verifier"
}
```

**Invalid refresh token:**

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid or expired refresh token"
}
```

**Refresh token reuse detected:**

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid or expired refresh token"
}
```

**Note:** When refresh token reuse is detected, the entire token family is revoked for security.

## Access Token (JWT)

The access token is a JWT with the following structure:

### Header

```json
{
  "alg": "EdDSA",
  "typ": "JWT",
  "kid": "key_id_here"
}
```

### Payload

```json
{
  "iss": "http://localhost:4000",
  "sub": "usr_x1y2z3a4b5c6",
  "aud": "cli_abc123",
  "exp": 1638360000,
  "iat": 1638356400,
  "jti": "at_unique_id",
  "scope": "openid profile email",
  "org_id": "org_a1b2c3d4e5f6",
  "roles": ["owner", "admin"]
}
```

### Claims

| Claim    | Description                      |
| -------- | -------------------------------- |
| `iss`    | Issuer (API URL)                 |
| `sub`    | Subject (user ID)                |
| `aud`    | Audience (client ID)             |
| `exp`    | Expiration timestamp             |
| `iat`    | Issued at timestamp              |
| `jti`    | JWT ID (unique token identifier) |
| `scope`  | Granted scopes (space-separated) |
| `org_id` | Organisation ID                  |
| `roles`  | Array of user role slugs         |

## Refresh Token

- **Format:** Opaque token (not JWT)
- **Storage:** Hashed in database
- **Rotation:** New refresh token issued on each use
- **Expiration:** Configurable per client (default: 30 days)
- **Revocation:** Can be revoked via /oauth2/revoke
- **Family Tracking:** Token reuse detection with automatic family revocation

## Code Examples

### JavaScript (Authorization Code Exchange)

```javascript
async function exchangeCodeForTokens(code, verifier, redirectUri) {
  const response = await fetch('http://localhost:4000/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: 'cli_abc123',
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${error.error_description}`);
  }

  return response.json();
}

// Usage
const { code, verifier } = oauth2Client.handleCallback();
const tokens = await exchangeCodeForTokens(code, verifier, 'https://app.example.com/callback');

// Store tokens securely
localStorage.setItem('access_token', tokens.access_token);
if (tokens.refresh_token) {
  localStorage.setItem('refresh_token', tokens.refresh_token);
}
```

### JavaScript (Refresh Token)

```javascript
async function refreshAccessToken(refreshToken) {
  const response = await fetch('http://localhost:4000/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: 'cli_abc123',
    }),
  });

  if (!response.ok) {
    const error = await response.json();

    if (error.error === 'invalid_grant') {
      // Refresh token expired or revoked - need to re-authenticate
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }

    throw new Error(`Token refresh failed: ${error.error_description}`);
  }

  return response.json();
}

// Usage with automatic refresh
class TokenManager {
  constructor() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  async getAccessToken() {
    // Check if token is expired (decode JWT and check exp claim)
    if (this.isTokenExpired(this.accessToken)) {
      await this.refresh();
    }

    return this.accessToken;
  }

  async refresh() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const tokens = await refreshAccessToken(this.refreshToken);

      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;

      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
    } catch (error) {
      if (error.message === 'REFRESH_TOKEN_EXPIRED') {
        // Clear tokens and redirect to login
        this.clearTokens();
        window.location.href = '/login';
      }

      throw error;
    }
  }

  isTokenExpired(token) {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp - 60000; // Refresh 1 minute before expiry
    } catch {
      return true;
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}
```

### TypeScript (Full OAuth2 Client)

```typescript
interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

class OAuth2TokenClient {
  private baseUrl = 'http://localhost:4000';
  private clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  async exchangeCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string,
  ): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: this.clientId,
    });

    if (codeVerifier) {
      params.set('code_verifier', codeVerifier);
    }

    return this.requestToken(params);
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId,
    });

    return this.requestToken(params);
  }

  private async requestToken(params: URLSearchParams): Promise<TokenResponse> {
    const response = await fetch(`${this.baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new OAuth2Error(error.error, error.error_description);
    }

    return response.json();
  }
}

class OAuth2Error extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'OAuth2Error';
  }
}
```

## Security Considerations

1. **HTTPS Required:** Always use HTTPS in production
2. **Client Authentication:** Confidential clients must authenticate
3. **PKCE Required:** Public clients must use PKCE
4. **Code Expiration:** Authorization codes expire after 10 minutes
5. **Token Rotation:** Refresh tokens are rotated on each use
6. **Reuse Detection:** Refresh token reuse revokes entire family
7. **Rate Limiting:** Token endpoint is rate-limited
8. **Token Storage:** Store tokens securely (never in localStorage for sensitive apps)

## Related Endpoints

- [GET /oauth2/authorize](./authorize.md) - Start authorization flow
- [POST /oauth2/revoke](./revoke.md) - Revoke tokens
- [POST /oauth2/introspect](./introspect.md) - Validate tokens
- [GET /oauth2/userinfo](./userinfo.md) - Get user information
