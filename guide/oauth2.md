# OAuth2 & OpenID Connect

Understanding OAuth 2.1 and OpenID Connect 1.0 in Cerberus IAM.

## Overview

Cerberus IAM is a complete **OAuth 2.1 authorization server** and **OpenID Connect 1.0 identity provider**. It enables secure delegated access and federated authentication for your applications.

### What is OAuth2?

OAuth 2.0 (and the newer 2.1) is an authorization framework that enables applications to obtain limited access to user accounts on an HTTP service. It works by delegating user authentication to the service that hosts the user account and authorizing third-party applications to access that account.

### What is OpenID Connect?

OpenID Connect (OIDC) is an identity layer built on top of OAuth 2.0. It allows clients to verify the identity of end-users based on the authentication performed by an authorization server, as well as to obtain basic profile information about the user.

## Key Concepts

### Roles

**Resource Owner (User)**

- The entity that can grant access to a protected resource
- Typically the end-user

**Client (Application)**

- The application requesting access to protected resources
- Can be confidential (server-side) or public (SPA, mobile)

**Authorization Server (Cerberus IAM)**

- Issues access tokens to the client after successfully authenticating the resource owner

**Resource Server (Your API)**

- Hosts the protected resources
- Accepts and validates access tokens

### Tokens

**Authorization Code**

- Short-lived, one-time use code exchanged for tokens
- Lifetime: 10 minutes (default)
- Used in authorization code flow

**Access Token (JWT)**

- Bearer token used to access protected resources
- Lifetime: 1 hour (default, configurable)
- Contains claims about the user and authorization

**Refresh Token**

- Long-lived token used to obtain new access tokens
- Lifetime: 30 days (default, configurable)
- Supports rotation for enhanced security

**ID Token (JWT)**

- Contains claims about the authentication event and user
- Used in OpenID Connect for identity verification
- Lifetime: 1 hour (default, configurable)

### Scopes

Scopes define the level of access requested:

```
openid          - Required for OIDC, returns ID token
profile         - Access to user profile (name, picture, etc.)
email           - Access to user email and email_verified
phone           - Access to user phone number
offline_access  - Request refresh token for offline access
```

Custom scopes can be defined per client for application-specific permissions.

### PKCE (Proof Key for Code Exchange)

PKCE (RFC 7636) protects against authorization code interception attacks. It's **required** for public clients and recommended for all clients.

**Flow:**

1. Client generates random `code_verifier` (43-128 characters)
2. Client creates `code_challenge` = BASE64URL(SHA256(code_verifier))
3. Client sends `code_challenge` and `code_challenge_method=S256` in authorization request
4. Client sends `code_verifier` in token exchange request
5. Server verifies: SHA256(code_verifier) == code_challenge

## Authorization Code Flow

The recommended OAuth2 flow for web and mobile applications.

### Step 1: Authorization Request

Client redirects user to authorization endpoint:

```http
GET /oauth2/authorize?
  response_type=code&
  client_id=abc123&
  redirect_uri=https://app.example.com/callback&
  scope=openid profile email&
  state=random-state-value&
  code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&
  code_challenge_method=S256
```

**Parameters:**

- `response_type` - Must be `code`
- `client_id` - Your client identifier
- `redirect_uri` - Must match registered URI
- `scope` - Space-separated list of scopes
- `state` - CSRF protection token (recommended)
- `code_challenge` - PKCE challenge (required for public clients)
- `code_challenge_method` - `S256` (SHA256) or `plain`

###Step 2: User Authentication

If not authenticated, user is redirected to login page:

```
https://auth.example.com/login?returnTo=/oauth2/authorize?...
```

User enters credentials, completes MFA if required.

### Step 3: Consent (Optional)

If consent is required (`requireConsent: true` on client), user sees consent screen:

```
App Name wants to:
☑ View your profile
☑ Access your email address

[Cancel] [Allow]
```

### Step 4: Authorization Response

Server redirects back to client with authorization code:

```http
HTTP/1.1 302 Found
Location: https://app.example.com/callback?
  code=auth_code_here&
  state=random-state-value
```

Client must:

1. Verify `state` matches original value
2. Extract `code` parameter

### Step 5: Token Exchange

Client exchanges authorization code for tokens:

```bash
curl -X POST https://auth.example.com/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "client_id:client_secret" \
  -d "grant_type=authorization_code" \
  -d "code=auth_code_here" \
  -d "redirect_uri=https://app.example.com/callback" \
  -d "code_verifier=original_verifier_here"
```

**Response:**

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "rt_...",
  "id_token": "eyJhbGc...",
  "scope": "openid profile email"
}
```

### Step 6: Access Protected Resources

Use access token to call APIs:

```bash
curl https://api.example.com/v1/users/me \
  -H "Authorization: Bearer eyJhbGc..."
```

### Step 7: Token Refresh

When access token expires, use refresh token:

```bash
curl -X POST https://auth.example.com/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "client_id:client_secret" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=rt_..."
```

**Response:**

```json
{
  "access_token": "eyJhbGc...", // New access token
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "rt_new...", // New refresh token (rotation)
  "scope": "openid profile email"
}
```

## OpenID Connect Flow

OIDC builds on OAuth2 by adding identity verification.

### ID Token Structure

The ID token is a JWT with claims about the authentication:

```json
{
  "iss": "https://auth.example.com",
  "sub": "user-id-uuid",
  "aud": "client-id",
  "exp": 1704567890,
  "iat": 1704564290,
  "auth_time": 1704564000,
  "nonce": "random-nonce",

  // Standard claims (if profile scope granted)
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "email": "john@example.com",
  "email_verified": true,
  "picture": "https://..."
}
```

### UserInfo Endpoint

Retrieve additional user claims:

```bash
curl https://auth.example.com/oauth2/userinfo \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:**

```json
{
  "sub": "user-id-uuid",
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "email": "john@example.com",
  "email_verified": true,
  "phone_number": "+1234567890",
  "phone_number_verified": false,
  "picture": "https://...",
  "updated_at": 1704564000
}
```

### Discovery Document

OIDC provides a discovery endpoint for client auto-configuration:

```bash
curl https://auth.example.com/.well-known/openid-configuration
```

**Response:**

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/oauth2/authorize",
  "token_endpoint": "https://auth.example.com/oauth2/token",
  "userinfo_endpoint": "https://auth.example.com/oauth2/userinfo",
  "jwks_uri": "https://auth.example.com/oauth2/jwks.json",
  "scopes_supported": ["openid", "profile", "email", "phone", "offline_access"],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token", "client_credentials"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["EdDSA", "RS256"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post", "none"]
}
```

## Client Types

### Confidential Clients

Server-side applications that can securely store secrets:

```typescript
{
  clientType: "confidential",
  clientSecret: "secret-here",
  tokenEndpointAuthMethod: "client_secret_basic",
  redirectUris: ["https://app.example.com/callback"],
  grantTypes: ["authorization_code", "refresh_token"],
  requirePkce: false  // Optional for confidential clients
}
```

**Authentication methods:**

- `client_secret_basic` - Credentials in Authorization header (recommended)
- `client_secret_post` - Credentials in request body

### Public Clients

Single-page apps (SPA) and mobile apps that cannot securely store secrets:

```typescript
{
  clientType: "public",
  clientSecret: null,
  tokenEndpointAuthMethod: "none",
  redirectUris: ["https://app.example.com/callback"],
  grantTypes: ["authorization_code", "refresh_token"],
  requirePkce: true  // REQUIRED for public clients
}
```

::: warning
Public clients MUST use PKCE to prevent authorization code interception.
:::

## Security Features

### Refresh Token Rotation

Every refresh token use generates a new token pair and revokes the old refresh token:

```
RT1 → (AT1, RT2)
RT2 → (AT2, RT3)
RT3 → (AT3, RT4)
```

### Token Family Tracking

All refresh tokens in a rotation chain share a `familyId` for breach detection.

### Reuse Detection

If a refresh token is reused (already rotated), the entire token family is revoked:

```
User uses RT2 → Gets AT2, RT3
Attacker uses RT2 → Entire family (RT1, RT2, RT3) revoked
```

This detects token theft and protects the user.

### Token Revocation

Revoke access or refresh tokens:

```bash
curl -X POST https://auth.example.com/oauth2/revoke \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "client_id:client_secret" \
  -d "token=eyJhbGc..." \
  -d "token_type_hint=access_token"
```

### Token Introspection

Validate and inspect tokens:

```bash
curl -X POST https://auth.example.com/oauth2/introspect \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "client_id:client_secret" \
  -d "token=eyJhbGc..."
```

**Response:**

```json
{
  "active": true,
  "token_type": "Bearer",
  "scope": "openid profile email",
  "client_id": "client-id",
  "username": "john@example.com",
  "exp": 1704567890,
  "iat": 1704564290,
  "sub": "user-id-uuid",
  "aud": "client-id"
}
```

## JWKS (JSON Web Key Set)

Public keys for JWT signature verification:

```bash
curl https://auth.example.com/oauth2/jwks.json
```

**Response:**

```json
{
  "keys": [
    {
      "kid": "key-id-1",
      "kty": "OKP",
      "use": "sig",
      "alg": "EdDSA",
      "crv": "Ed25519",
      "x": "base64-public-key"
    }
  ]
}
```

Clients use this to verify JWT signatures without shared secrets.

## Best Practices

### Always Use PKCE

Even for confidential clients, PKCE provides additional security:

```javascript
// Generate code verifier
const codeVerifier = base64url(crypto.randomBytes(32));

// Generate code challenge
const codeChallenge = base64url(sha256(codeVerifier));

// Authorization request
window.location = `${authUrl}?code_challenge=${codeChallenge}&code_challenge_method=S256&...`;
```

### Validate State Parameter

Prevent CSRF attacks:

```javascript
// Before redirect
const state = crypto.randomBytes(16).toString('hex');
sessionStorage.setItem('oauth_state', state);

// After callback
const returnedState = new URLSearchParams(window.location.search).get('state');
if (returnedState !== sessionStorage.getItem('oauth_state')) {
  throw new Error('State mismatch - possible CSRF');
}
```

### Store Tokens Securely

- **Access tokens**: Memory only (SPA) or httpOnly cookies (server-side)
- **Refresh tokens**: Secure httpOnly cookies or encrypted storage
- **Never**: localStorage or sessionStorage

### Use Appropriate Token Lifetimes

```typescript
{
  accessTokenLifetime: 3600,      // 1 hour
  refreshTokenLifetime: 2592000,  // 30 days
  authorizationCodeTtl: 600       // 10 minutes
}
```

### Implement Token Refresh

Don't wait for 401 errors:

```javascript
// Refresh 5 minutes before expiry
const expiresAt = tokenResponse.expires_in * 1000 + Date.now();
const refreshAt = expiresAt - 5 * 60 * 1000;

setTimeout(async () => {
  const newTokens = await refreshAccessToken();
  // Update stored tokens
}, refreshAt - Date.now());
```

## Common Flows

### SPA with Authorization Code + PKCE

See [OAuth2 Client Setup](/guide/oauth2-client) for detailed implementation.

### Mobile App with Authorization Code + PKCE

Similar to SPA but with app-specific redirect URI:

```
myapp://oauth/callback
```

### Machine-to-Machine (Client Credentials)

The client credentials grant enables service-to-service authentication without user context.

**Use Cases:**

- Backend services calling APIs
- Microservices communication
- Scheduled jobs and cron tasks
- System-level integrations

**Requirements:**

- Confidential client (has client_secret)
- Client must authenticate
- No user involved (no refresh tokens)
- Custom scopes only (OIDC scopes prohibited)

**Example Request:**

```bash
curl -X POST https://auth.example.com/oauth2/token \
  -u "client_id:client_secret" \
  -d "grant_type=client_credentials" \
  -d "scope=api:read api:write"
```

**Response:**

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "api:read api:write"
}
```

**Access Token Claims:**

```json
{
  "iss": "https://auth.example.com",
  "sub": "client-id",
  "client_id": "client-id",
  "aud": "client-id",
  "exp": 1704567890,
  "iat": 1704564290,
  "jti": "token-id",
  "scope": "api:read api:write",
  "org": "org-id",
  "roles": []
}
```

**Key Differences from User Tokens:**

- `sub` is the client_id (not user ID)
- No `refresh_token` in response
- `roles` is always empty array
- Cannot use OIDC scopes (openid, profile, email, etc.)

**Token Management:**

```typescript
class ServiceClient {
  private token: string | null = null;
  private expiresAt: number = 0;

  async getToken(): Promise<string> {
    // Request new token if expired or expiring soon
    if (!this.token || Date.now() >= this.expiresAt - 5 * 60 * 1000) {
      await this.requestToken();
    }
    return this.token;
  }

  private async requestToken(): Promise<void> {
    const response = await fetch('https://auth.example.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'api:read api:write',
      }),
    });

    const data = await response.json();
    this.token = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;
  }

  async callAPI(url: string): Promise<Response> {
    const token = await this.getToken();
    return fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
```

See [Token Endpoint - Client Credentials](/api/oauth2/token#grant-type-client-credentials) for full documentation.

## Troubleshooting

### invalid_grant

**Cause**: Expired or invalid authorization code

**Solution**: Authorization codes are single-use and expire in 10 minutes. Start authorization flow again.

### invalid_client

**Cause**: Invalid client credentials

**Solution**: Verify `client_id` and `client_secret`. Check authentication method.

### invalid_redirect_uri

**Cause**: Redirect URI doesn't match registered URI

**Solution**: Ensure exact match including protocol, domain, port, and path.

### invalid_code_verifier

**Cause**: PKCE verification failed

**Solution**: Ensure `code_verifier` matches the original value used to generate `code_challenge`.

## Next Steps

- [OAuth2 Client Setup](/guide/oauth2-client) - Integrate your application
- [Authorization API](/api/oauth2/authorize) - API reference
- [Token Exchange API](/api/oauth2/token) - Token endpoint reference
- [Security Best Practices](/architecture/security) - Security architecture
