# Refresh Token

Obtain a new access token using a refresh token.

## Endpoint

```
POST /oauth2/token
```

**Note:** This is the same endpoint as the token exchange, but with `grant_type=refresh_token`.

## Description

The refresh token grant type allows clients to obtain a new access token using a previously issued refresh token. This endpoint implements refresh token rotation for enhanced security - each time a refresh token is used, a new access token AND a new refresh token are issued, and the old refresh token is revoked.

Refresh token reuse detection is enabled: if a refresh token is used more than once, the entire token family is revoked to prevent token theft attacks.

## Authentication

**Required:** Client authentication (see Client Authentication section)

## Headers

| Header          | Required    | Description                                 |
| --------------- | ----------- | ------------------------------------------- |
| `Content-Type`  | Yes         | Must be `application/x-www-form-urlencoded` |
| `Authorization` | Conditional | Basic auth for `client_secret_basic` method |

## Request Body Parameters

| Parameter       | Type   | Required    | Description                           |
| --------------- | ------ | ----------- | ------------------------------------- |
| `grant_type`    | string | Yes         | Must be `refresh_token`               |
| `refresh_token` | string | Yes         | Valid refresh token                   |
| `client_id`     | string | Conditional | Required if not using HTTP Basic auth |
| `client_secret` | string | Conditional | Required for confidential clients     |

## Example Request

```http
POST /oauth2/token HTTP/1.1
Host: localhost:4000
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=rt_x1y2z3a4b5c6d7e8f9&client_id=cli_abc123
```

## Success Response

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

**Note:** Both the access token AND refresh token are new. The old refresh token is revoked.

### Response Fields

| Field           | Type   | Description                                      |
| --------------- | ------ | ------------------------------------------------ |
| `access_token`  | string | New JWT access token                             |
| `refresh_token` | string | New refresh token (old one is revoked)           |
| `token_type`    | string | Always `Bearer`                                  |
| `expires_in`    | number | Access token lifetime in seconds (default: 3600) |
| `scope`         | string | Space-separated list of granted scopes           |

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

grant_type=refresh_token&refresh_token=...&client_id=cli_abc123&client_secret=secret_here
```

### 3. none (Public Clients)

Public clients (mobile apps, SPAs) don't have a client secret:

```http
POST /oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=...&client_id=cli_abc123
```

## Error Responses

All errors return JSON with OAuth2 error format:

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

## Refresh Token Properties

- **Format:** Opaque token (not JWT)
- **Storage:** Hashed in database using SHA-256
- **Rotation:** New refresh token issued on each use (old one revoked)
- **Expiration:** Configurable per client (default: 30 days)
- **Revocation:** Can be revoked via [POST /oauth2/revoke](./revoke.md)
- **Family Tracking:** Token reuse detection with automatic family revocation
- **Reuse Detection:** If a refresh token is used twice, the entire token family is revoked

## Code Examples

### JavaScript (Basic Refresh)

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

// Usage
const tokens = await refreshAccessToken('rt_x1y2z3a4b5c6d7e8f9');

// Store new tokens
localStorage.setItem('access_token', tokens.access_token);
localStorage.setItem('refresh_token', tokens.refresh_token);
```

### TypeScript (Automatic Token Refresh)

```typescript
class TokenManager {
  private accessToken: string | null;
  private refreshToken: string | null;
  private clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    // Check if token is expired (decode JWT and check exp claim)
    if (this.isTokenExpired(this.accessToken)) {
      await this.refresh();
    }

    return this.accessToken;
  }

  private async refresh(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('http://localhost:4000/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description);
      }

      const tokens = await response.json();

      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;

      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
    } catch (error) {
      // Clear tokens and require re-authentication
      this.clearTokens();
      throw error;
    }
  }

  private isTokenExpired(token: string): boolean {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      // Refresh 1 minute before expiry
      return Date.now() >= exp - 60000;
    } catch {
      return true;
    }
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}
```

### Python (requests)

```python
import requests
from typing import Dict, Any

class OAuth2TokenClient:
    def __init__(self, base_url: str, client_id: str, client_secret: str = None):
        self.base_url = base_url
        self.client_id = client_id
        self.client_secret = client_secret

    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token."""
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': self.client_id
        }

        if self.client_secret:
            data['client_secret'] = self.client_secret

        response = requests.post(
            f'{self.base_url}/oauth2/token',
            data=data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )

        if not response.ok:
            error = response.json()
            raise Exception(f"Token refresh failed: {error.get('error_description')}")

        return response.json()

# Usage
client = OAuth2TokenClient(
    base_url='http://localhost:4000',
    client_id='cli_abc123'
)

tokens = client.refresh_token('rt_x1y2z3a4b5c6d7e8f9')
print(f"New access token: {tokens['access_token']}")
print(f"New refresh token: {tokens['refresh_token']}")
```

## Security Considerations

1. **Token Rotation:** Refresh tokens are rotated on each use - store the new refresh token
2. **Reuse Detection:** Using a refresh token twice revokes the entire token family
3. **Secure Storage:** Store refresh tokens securely (not in localStorage for sensitive apps)
4. **HTTPS Required:** Always use HTTPS in production
5. **Token Expiration:** Refresh tokens have a finite lifetime (default: 30 days)
6. **Family Revocation:** If token reuse is detected, all tokens in the family are revoked
7. **Rate Limiting:** Token endpoint is rate-limited to prevent brute-force attacks

## Token Rotation Flow

```
Client                    Cerberus IAM
  |                              |
  |  POST /oauth2/token          |
  |  (refresh_token = RT1)       |
  |----------------------------->|
  |                              |
  |                              | 1. Validate RT1
  |                              | 2. Create new AT2 + RT2
  |                              | 3. Revoke RT1
  |                              | 4. Store RT2 in same family
  |                              |
  |  200 OK                      |
  |  (access_token = AT2,        |
  |   refresh_token = RT2)       |
  |<-----------------------------|
  |                              |
```

If RT1 is used again after RT2 is issued, the entire family is revoked.

## Related Endpoints

- [POST /oauth2/token](./token.md) - Token exchange (authorization code)
- [POST /oauth2/revoke](./revoke.md) - Revoke tokens
- [POST /oauth2/introspect](./introspect.md) - Validate tokens
- [GET /oauth2/userinfo](./userinfo.md) - Get user information
