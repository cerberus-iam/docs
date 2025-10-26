# OAuth2 Client Setup

Step-by-step guide to integrating OAuth2 authentication with Cerberus IAM.

## Overview

This guide shows you how to integrate your application with Cerberus IAM as an OAuth2/OIDC client. We'll cover:

- Registering an OAuth2 client
- Implementing the authorization code flow with PKCE
- Handling tokens securely
- Making authenticated API calls

## Prerequisites

- Cerberus IAM instance running
- Admin access to create OAuth2 clients
- Basic understanding of OAuth2 (see [OAuth2 & OIDC Guide](/guide/oauth2))

## Step 1: Register OAuth2 Client

### Using the Admin API

```bash
curl -X POST https://auth.example.com/v1/admin/clients \
  -H "Content-Type: application/json" \
  -H "X-Org-Slug: your-org" \
  -H "Cookie: cerb_sid=..." \
  -d '{
    "name": "My Application",
    "clientType": "public",
    "redirectUris": ["https://myapp.example.com/callback"],
    "allowedOrigins": ["https://myapp.example.com"],
    "grantTypes": ["authorization_code", "refresh_token"],
    "scopes": ["openid", "profile", "email"],
    "requirePkce": true,
    "requireConsent": false,
    "isFirstParty": true
  }'
```

**Response:**

```json
{
  "id": "uuid-here",
  "clientId": "client_abc123xyz",
  "clientSecret": null,
  "name": "My Application",
  "clientType": "public",
  "redirectUris": ["https://myapp.example.com/callback"],
  "requirePkce": true,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

Save the `clientId` - you'll need it for OAuth2 requests.

::: tip
For **single-page apps (SPA)** and **mobile apps**, use `clientType: "public"` with `requirePkce: true`.

For **server-side apps**, use `clientType: "confidential"` and save the `clientSecret`.
:::

## Step 2: Implement Authorization Flow

### JavaScript/TypeScript (SPA)

Install dependencies:

```bash
npm install jose
```

Create OAuth2 client utility:

```typescript
// oauth2-client.ts
import { randomBytes } from 'crypto';
import { base64url } from 'jose';

export class OAuth2Client {
  private readonly issuerUrl: string;
  private readonly clientId: string;
  private readonly redirectUri: string;

  constructor(issuerUrl: string, clientId: string, redirectUri: string) {
    this.issuerUrl = issuerUrl;
    this.clientId = clientId;
    this.redirectUri = redirectUri;
  }

  // Generate PKCE code verifier and challenge
  private generatePKCE() {
    const codeVerifier = base64url.encode(randomBytes(32));
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);

    return crypto.subtle.digest('SHA-256', data).then((hash) => {
      const codeChallenge = base64url.encode(new Uint8Array(hash));
      return { codeVerifier, codeChallenge };
    });
  }

  // Generate random state for CSRF protection
  private generateState(): string {
    return base64url.encode(randomBytes(16));
  }

  // Start authorization flow
  async authorize(scopes: string[] = ['openid', 'profile', 'email']) {
    const { codeVerifier, codeChallenge } = await this.generatePKCE();
    const state = this.generateState();

    // Store for later use
    sessionStorage.setItem('oauth_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    // Redirect to authorization endpoint
    window.location.href = `${this.issuerUrl}/oauth2/authorize?${params}`;
  }

  // Handle callback
  async handleCallback(): Promise<TokenResponse> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    // Check for errors
    if (error) {
      throw new Error(`OAuth2 error: ${error} - ${params.get('error_description')}`);
    }

    // Validate state
    const storedState = sessionStorage.getItem('oauth_state');
    if (state !== storedState) {
      throw new Error('State mismatch - possible CSRF attack');
    }

    // Get code verifier
    const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    // Exchange code for tokens
    const response = await fetch(`${this.issuerUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code!,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.error_description}`);
    }

    const tokens: TokenResponse = await response.json();

    // Clean up
    sessionStorage.removeItem('oauth_code_verifier');
    sessionStorage.removeItem('oauth_state');

    return tokens;
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(`${this.issuerUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${error.error_description}`);
    }

    return response.json();
  }

  // Get user info
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch(`${this.issuerUrl}/oauth2/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return response.json();
  }

  // Revoke token
  async revokeToken(
    token: string,
    tokenTypeHint: 'access_token' | 'refresh_token' = 'refresh_token',
  ) {
    await fetch(`${this.issuerUrl}/oauth2/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token,
        token_type_hint: tokenTypeHint,
        client_id: this.clientId,
      }),
    });
  }
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope: string;
}

export interface UserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
}
```

### Usage in Your App

```typescript
// Initialize client
const oauth2 = new OAuth2Client(
  'https://auth.example.com',
  'client_abc123xyz',
  'https://myapp.example.com/callback',
);

// Login button click
document.getElementById('login-btn')?.addEventListener('click', () => {
  oauth2.authorize(['openid', 'profile', 'email']);
});

// Callback page
if (window.location.pathname === '/callback') {
  oauth2
    .handleCallback()
    .then(async (tokens) => {
      // Store tokens (see security best practices)
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token!);
      localStorage.setItem('expires_at', String(Date.now() + tokens.expires_in * 1000));

      // Get user info
      const user = await oauth2.getUserInfo(tokens.access_token);
      console.log('Logged in as:', user.email);

      // Redirect to app
      window.location.href = '/dashboard';
    })
    .catch((error) => {
      console.error('Login failed:', error);
      window.location.href = '/login?error=' + encodeURIComponent(error.message);
    });
}
```

## Step 3: Token Management

### Store Tokens Securely

**Best practices:**

1. **Access tokens**: Store in memory only (not localStorage)
2. **Refresh tokens**: Use httpOnly cookies or secure encrypted storage
3. **Never** expose tokens in URLs or logs

```typescript
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;

  setTokens(tokens: TokenResponse) {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token || null;
    this.expiresAt = Date.now() + tokens.expires_in * 1000;

    // Schedule refresh before expiry
    this.scheduleRefresh();
  }

  getAccessToken(): string | null {
    if (!this.accessToken || this.isExpired()) {
      return null;
    }
    return this.accessToken;
  }

  private isExpired(): boolean {
    if (!this.expiresAt) return true;
    // Consider expired 5 minutes before actual expiry
    return Date.now() >= this.expiresAt - 5 * 60 * 1000;
  }

  private scheduleRefresh() {
    if (!this.expiresAt || !this.refreshToken) return;

    // Refresh 5 minutes before expiry
    const refreshAt = this.expiresAt - 5 * 60 * 1000;
    const delay = refreshAt - Date.now();

    if (delay > 0) {
      setTimeout(async () => {
        await this.refresh();
      }, delay);
    }
  }

  private async refresh() {
    if (!this.refreshToken) return;

    try {
      const tokens = await oauth2.refreshToken(this.refreshToken);
      this.setTokens(tokens);
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Redirect to login
      window.location.href = '/login';
    }
  }

  clear() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
  }
}

export const tokenManager = new TokenManager();
```

### API Client with Auto-Refresh

```typescript
class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = tokenManager.getAccessToken();

    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Handle token expiry
    if (response.status === 401) {
      // Try to refresh
      await tokenManager.refresh();

      // Retry request
      const newToken = tokenManager.getAccessToken();
      if (newToken) {
        return fetch(`${this.baseUrl}${path}`, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    }

    return response;
  }
}

const api = new ApiClient('https://api.example.com');

// Usage
const response = await api.fetch('/v1/me/profile');
const profile = await response.json();
```

## Step 4: Logout

```typescript
async function logout() {
  const refreshToken = tokenManager.getRefreshToken();

  // Revoke refresh token
  if (refreshToken) {
    try {
      await oauth2.revokeToken(refreshToken, 'refresh_token');
    } catch (error) {
      console.error('Token revocation failed:', error);
    }
  }

  // Clear local tokens
  tokenManager.clear();

  // Redirect to login
  window.location.href = '/login';
}
```

## Server-Side Implementation (Node.js)

For confidential clients (server-side apps):

```typescript
import express from 'express';
import session from 'express-session';
import { Issuer, generators } from 'openid-client';

const app = express();

// Configure session
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

// Discover OIDC configuration
const issuer = await Issuer.discover('https://auth.example.com');

// Create client
const client = new issuer.Client({
  client_id: 'client_abc123xyz',
  client_secret: 'your-client-secret',
  redirect_uris: ['https://myapp.example.com/callback'],
  response_types: ['code'],
});

// Login route
app.get('/login', (req, res) => {
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  const state = generators.state();

  req.session.codeVerifier = codeVerifier;
  req.session.state = state;

  const authUrl = client.authorizationUrl({
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });

  res.redirect(authUrl);
});

// Callback route
app.get('/callback', async (req, res) => {
  const params = client.callbackParams(req);

  try {
    const tokenSet = await client.callback('https://myapp.example.com/callback', params, {
      code_verifier: req.session.codeVerifier,
      state: req.session.state,
    });

    req.session.accessToken = tokenSet.access_token;
    req.session.refreshToken = tokenSet.refresh_token;
    req.session.idToken = tokenSet.id_token;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect('/login?error=callback_failed');
  }
});

// Protected route
app.get('/dashboard', async (req, res) => {
  if (!req.session.accessToken) {
    return res.redirect('/login');
  }

  try {
    const userinfo = await client.userinfo(req.session.accessToken);
    res.send(`Welcome, ${userinfo.name}!`);
  } catch (error) {
    console.error('Userinfo error:', error);
    res.redirect('/login');
  }
});

// Logout route
app.post('/logout', async (req, res) => {
  if (req.session.refreshToken) {
    await client.revoke(req.session.refreshToken, 'refresh_token');
  }

  req.session.destroy(() => {
    res.redirect('/');
  });
});
```

## Testing Your Integration

### 1. Authorization Flow

```bash
# Start authorization
open "https://auth.example.com/oauth2/authorize?response_type=code&client_id=client_abc123xyz&redirect_uri=https://myapp.example.com/callback&scope=openid%20profile%20email&state=xyz&code_challenge=CHALLENGE&code_challenge_method=S256"

# After redirect, you should have:
# https://myapp.example.com/callback?code=AUTH_CODE&state=xyz
```

### 2. Token Exchange

```bash
curl -X POST https://auth.example.com/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTH_CODE" \
  -d "client_id=client_abc123xyz" \
  -d "redirect_uri=https://myapp.example.com/callback" \
  -d "code_verifier=VERIFIER"
```

### 3. UserInfo

```bash
curl https://auth.example.com/oauth2/userinfo \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

## Troubleshooting

### redirect_uri_mismatch

Ensure the `redirect_uri` in your request exactly matches one registered with the client (including protocol, domain, port, and path).

### invalid_grant

Authorization code has expired (10 minutes) or was already used. Start the flow again.

### invalid_code_verifier

The `code_verifier` doesn't match the `code_challenge`. Ensure you're sending the same verifier used to generate the challenge.

### Access token expired

Implement automatic token refresh before expiry (recommended) or handle 401 responses.

## Next Steps

- [OAuth2 & OIDC Guide](/guide/oauth2) - Deep dive into OAuth2 concepts
- [Sessions Guide](/guide/sessions) - Session management
- [API Reference](/api/oauth2/authorize) - OAuth2 endpoint documentation
- [Security Best Practices](/architecture/security) - Security architecture
