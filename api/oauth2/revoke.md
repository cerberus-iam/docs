# OAuth2 Token Revocation

Revoke an access or refresh token.

## Endpoint

```
POST /oauth2/revoke
```

## Description

Revokes an access token or refresh token, immediately invalidating it. This endpoint follows [RFC 7009: OAuth 2.0 Token Revocation](https://tools.ietf.org/html/rfc7009).

When revoking a refresh token, the entire token family may be revoked depending on the implementation.

## Authentication

**Required:** No (but may require client authentication in production)

## Headers

| Header         | Required | Description                                 |
| -------------- | -------- | ------------------------------------------- |
| `Content-Type` | Yes      | Must be `application/x-www-form-urlencoded` |

## Request Body

| Parameter         | Type   | Required | Description                                              |
| ----------------- | ------ | -------- | -------------------------------------------------------- |
| `token`           | string | Yes      | The token to revoke (access or refresh token)            |
| `token_type_hint` | string | No       | Hint about token type: `access_token` or `refresh_token` |

### Example Request

```http
POST /oauth2/revoke HTTP/1.1
Host: localhost:4000
Content-Type: application/x-www-form-urlencoded

token=rt_x1y2z3a4b5c6d7e8f9&token_type_hint=refresh_token
```

## Response

### Success Response

**Status Code:** `200 OK`

```json
{}
```

**Note:** Per RFC 7009, the revocation endpoint always returns 200 OK, even if the token doesn't exist or is already revoked. This prevents token scanning attacks.

### Error Response

**400 Bad Request - Missing Token:**

```json
{
  "error": "invalid_request"
}
```

## Token Type Hint

The `token_type_hint` parameter is optional but recommended:

- **`access_token`** - Token is an access token (JWT)
- **`refresh_token`** - Token is a refresh token (opaque)

If not provided, the server will attempt to determine the token type automatically.

## Revocation Behavior

### Access Token Revocation

When an access token is revoked:

1. Token is marked as revoked in database (by JTI)
2. Token becomes immediately invalid
3. Subsequent API calls with this token will fail
4. Token introspection will return `active: false`

### Refresh Token Revocation

When a refresh token is revoked:

1. Token is marked as revoked in database
2. Token can no longer be used to obtain new access tokens
3. Related access tokens remain valid until expiry (stateless JWT)
4. Optionally, the entire token family may be revoked

## Code Examples

### cURL

```bash
# Revoke refresh token
curl -X POST http://localhost:4000/oauth2/revoke \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=rt_x1y2z3a4b5c6d7e8f9&token_type_hint=refresh_token"

# Revoke access token
curl -X POST http://localhost:4000/oauth2/revoke \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...&token_type_hint=access_token"
```

### JavaScript

```javascript
async function revokeToken(token, tokenTypeHint = 'refresh_token') {
  const response = await fetch('http://localhost:4000/oauth2/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      token,
      token_type_hint: tokenTypeHint,
    }),
  });

  // Always returns 200 OK per RFC 7009
  return response.ok;
}

// Usage - Logout function
async function logout() {
  const refreshToken = localStorage.getItem('refresh_token');
  const accessToken = localStorage.getItem('access_token');

  // Revoke refresh token
  if (refreshToken) {
    await revokeToken(refreshToken, 'refresh_token');
  }

  // Revoke access token
  if (accessToken) {
    await revokeToken(accessToken, 'access_token');
  }

  // Clear local storage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');

  // Redirect to login
  window.location.href = '/login';
}
```

### TypeScript

```typescript
type TokenTypeHint = 'access_token' | 'refresh_token';

async function revokeToken(token: string, tokenTypeHint?: TokenTypeHint): Promise<void> {
  const params = new URLSearchParams({ token });

  if (tokenTypeHint) {
    params.set('token_type_hint', tokenTypeHint);
  }

  const response = await fetch('http://localhost:4000/oauth2/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok && response.status === 400) {
    const error = await response.json();
    throw new Error(`Token revocation failed: ${error.error}`);
  }
}

// Token manager with revocation
class TokenManager {
  async revokeAll(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    const accessToken = this.getAccessToken();

    try {
      if (refreshToken) {
        await revokeToken(refreshToken, 'refresh_token');
      }

      if (accessToken) {
        await revokeToken(accessToken, 'access_token');
      }
    } finally {
      // Always clear tokens locally
      this.clearTokens();
    }
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}
```

## Best Practices

1. **Logout:** Always revoke tokens when user logs out
2. **Token Leak:** Revoke tokens if you suspect they've been compromised
3. **Clear Local Storage:** Always clear tokens from client storage after revocation
4. **Error Handling:** Don't rely on revocation success for logout flow
5. **Both Tokens:** Revoke both access and refresh tokens during logout

## Security Considerations

1. **Always Success:** Endpoint always returns 200 OK to prevent token scanning
2. **Immediate Effect:** Tokens are immediately invalidated upon revocation
3. **Client-Side Cleanup:** Always clear tokens from client storage
4. **Network Failure:** If revocation fails, still clear tokens locally and logout user
5. **HTTPS Required:** Use HTTPS in production to protect tokens in transit

## Related Endpoints

- [POST /oauth2/token](./token.md) - Get tokens
- [POST /oauth2/introspect](./introspect.md) - Check token validity
- [POST /api/v1/auth/logout](../auth/logout.md) - Session-based logout
