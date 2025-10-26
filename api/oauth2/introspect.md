# OAuth2 Token Introspection

Validate and get information about an access token.

## Endpoint

```
POST /oauth2/introspect
```

## Description

Introspects an access token to determine its validity and retrieve metadata. Returns whether the token is active and additional information about the token if active.

This endpoint follows [RFC 7662: OAuth 2.0 Token Introspection](https://tools.ietf.org/html/rfc7662).

## Authentication

**Required:** No (public endpoint, but may require client authentication in production)

## Headers

| Header         | Required | Description                                 |
| -------------- | -------- | ------------------------------------------- |
| `Content-Type` | Yes      | Must be `application/x-www-form-urlencoded` |

## Request Body

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `token`   | string | Yes      | The access token to introspect |

### Example Request

```http
POST /oauth2/introspect HTTP/1.1
Host: localhost:4000
Content-Type: application/x-www-form-urlencoded

token=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

## Response

### Success Response (Active Token)

**Status Code:** `200 OK`

```json
{
  "active": true,
  "scope": "openid profile email",
  "client_id": "cli_abc123",
  "username": "john.doe@acme.com",
  "token_type": "Bearer",
  "exp": 1638360000,
  "iat": 1638356400,
  "sub": "usr_x1y2z3a4b5c6",
  "aud": "cli_abc123",
  "iss": "http://localhost:4000",
  "jti": "at_unique_id"
}
```

### Inactive Token Response

**Status Code:** `200 OK`

```json
{
  "active": false
}
```

**Note:** No additional information is provided for inactive tokens.

## Token States

A token is considered **inactive** if:

- Token is expired (`exp` claim past)
- Token has been revoked
- Token signature is invalid
- Token doesn't exist in the system
- User associated with token no longer exists

## Response Fields (Active Token)

| Field        | Type    | Description                      |
| ------------ | ------- | -------------------------------- |
| `active`     | boolean | Always `true` for active tokens  |
| `scope`      | string  | Space-separated list of scopes   |
| `client_id`  | string  | Client identifier                |
| `username`   | string  | User's email address             |
| `token_type` | string  | Token type (always "Bearer")     |
| `exp`        | number  | Expiration timestamp (Unix time) |
| `iat`        | number  | Issued at timestamp (Unix time)  |
| `sub`        | string  | Subject (user ID)                |
| `aud`        | string  | Audience (client ID)             |
| `iss`        | string  | Issuer (API URL)                 |
| `jti`        | string  | JWT ID (unique token identifier) |

## Code Examples

### cURL

```bash
curl -X POST http://localhost:4000/oauth2/introspect \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."
```

### JavaScript

```javascript
async function introspectToken(token) {
  const response = await fetch('http://localhost:4000/oauth2/introspect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ token }),
  });

  return response.json();
}

// Usage
const result = await introspectToken(accessToken);

if (result.active) {
  console.log('Token is valid');
  console.log('Expires at:', new Date(result.exp * 1000));
} else {
  console.log('Token is invalid or expired');
}
```

### TypeScript

```typescript
interface IntrospectionResponse {
  active: boolean;
  scope?: string;
  client_id?: string;
  username?: string;
  token_type?: string;
  exp?: number;
  iat?: number;
  sub?: string;
  aud?: string;
  iss?: string;
  jti?: string;
}

async function introspectToken(token: string): Promise<IntrospectionResponse> {
  const response = await fetch('http://localhost:4000/oauth2/introspect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ token }),
  });

  return response.json();
}

// Validation helper
async function validateToken(token: string): Promise<boolean> {
  const result = await introspectToken(token);
  return result.active;
}
```

## Use Cases

1. **Resource Server Validation:** Validate tokens before granting access to resources
2. **Token Status Check:** Check if a token has been revoked
3. **Scope Verification:** Verify token has required scopes
4. **Debugging:** Inspect token claims and expiration

## Security Considerations

1. **Public Endpoint:** Currently public, but may require client authentication in production
2. **Rate Limiting:** Endpoint should be rate-limited to prevent abuse
3. **Minimal Information:** Inactive tokens return minimal information
4. **HTTPS Required:** Use HTTPS in production

## Related Endpoints

- [POST /oauth2/token](./token.md) - Get access token
- [POST /oauth2/revoke](./revoke.md) - Revoke token
- [GET /oauth2/userinfo](./userinfo.md) - Get user information
