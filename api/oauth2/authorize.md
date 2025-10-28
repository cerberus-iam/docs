# OAuth2 Authorization Endpoint

Initiate OAuth2 authorization code flow.

## Endpoint

```
GET /oauth2/authorize
```

## Description

Initiates the OAuth2/OIDC authorization code flow. This endpoint:

1. Validates the client and redirect URI
2. Checks if the user is authenticated (redirects to login if not)
3. Checks for existing consent (shows consent screen if needed)
4. Generates an authorization code
5. Redirects back to the client with the code

This is the first step in the OAuth2 authorization code flow, typically used by web and mobile applications.

## Authentication

**Required:** Yes (redirects to login if not authenticated)

**Optional:** Session cookie or will redirect to login page

## Query Parameters

| Parameter               | Type   | Required    | Description                                                         |
| ----------------------- | ------ | ----------- | ------------------------------------------------------------------- |
| `client_id`             | string | Yes         | OAuth2 client identifier                                            |
| `redirect_uri`          | string | Yes         | Callback URL (must match registered redirect URI)                   |
| `response_type`         | string | Yes         | Must be `code`                                                      |
| `scope`                 | string | No          | Space-separated list of scopes (default: `openid`)                  |
| `state`                 | string | Recommended | Opaque value to maintain state between request and callback         |
| `code_challenge`        | string | Conditional | PKCE code challenge (required for public clients)                   |
| `code_challenge_method` | string | Conditional | PKCE method: `S256` or `plain` (required if code_challenge present) |

### Example Request

**Basic request:**

```
GET /oauth2/authorize?client_id=cli_abc123&redirect_uri=https://app.example.com/callback&response_type=code&scope=openid%20profile%20email&state=xyz789
```

**With PKCE (for public clients):**

```
GET /oauth2/authorize?client_id=cli_abc123&redirect_uri=https://app.example.com/callback&response_type=code&scope=openid%20profile%20email&state=xyz789&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256
```

## Response

### Success Response (Redirect)

**Status Code:** `302 Found`

**Location Header:**

```
https://app.example.com/callback?code=authz_a1b2c3d4e5f6g7h8&state=xyz789
```

The client application receives:

- `code`: Authorization code (exchange for tokens at token endpoint)
- `state`: Same state value that was sent in the request

### Consent Screen Redirect

If user needs to grant consent:

**Status Code:** `302 Found`

**Location Header:**

```
/oauth2/consent?client_id=cli_abc123&scope=openid+profile+email&redirect_uri=https://app.example.com/callback&state=xyz789&return_to=/oauth2/authorize?...
```

### Login Redirect

If user is not authenticated:

**Status Code:** `302 Found`

**Location Header:**

```
/auth/login?redirect_uri=/oauth2/authorize?client_id=...
```

### Error Responses

Errors are returned as query parameters in the redirect URI (per OAuth2 spec):

**Invalid redirect_uri:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid redirect_uri"
}
```

**Client not found:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Client not found or inactive"
}
```

**Missing required parameters:**

```
https://app.example.com/callback?error=invalid_request&error_description=Missing+required+parameters&state=xyz789
```

**PKCE required but not provided:**

```
https://app.example.com/callback?error=invalid_request&error_description=PKCE+required+for+this+client&state=xyz789
```

## Authorization Code Details

- **Validity:** 10 minutes
- **One-time use:** Code is revoked after exchange
- **Scopes:** Requested scopes are encoded in the code
- **PKCE:** Code challenge is stored for validation during token exchange

## PKCE (Proof Key for Code Exchange)

PKCE is required for public clients and recommended for all clients.

### PKCE Flow

1. **Client generates verifier:** Random string (43-128 characters)
2. **Client creates challenge:** SHA-256 hash of verifier, base64url encoded
3. **Client includes challenge in authorization request**
4. **Server stores challenge with authorization code**
5. **Client includes verifier in token exchange**
6. **Server validates verifier matches challenge**

### PKCE Example

```javascript
// 1. Generate code verifier
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

// 2. Generate code challenge
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

// 3. Build authorization URL
const verifier = generateCodeVerifier();
const challenge = await generateCodeChallenge(verifier);

// Store verifier for later use in token exchange
sessionStorage.setItem('pkce_verifier', verifier);

const authUrl = new URL('http://localhost:4000/oauth2/authorize');
authUrl.searchParams.set('client_id', 'cli_abc123');
authUrl.searchParams.set('redirect_uri', 'https://app.example.com/callback');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('state', generateRandomState());
authUrl.searchParams.set('code_challenge', challenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

// Redirect user to authorization endpoint
window.location.href = authUrl.toString();
```

## Scopes

Supported scopes:

| Scope            | Description                              |
| ---------------- | ---------------------------------------- |
| `openid`         | Required for OIDC, returns ID token      |
| `profile`        | Access to user's profile information     |
| `email`          | Access to user's email address           |
| `phone`          | Access to user's phone number            |
| `address`        | Access to user's address                 |
| `offline_access` | Request refresh token for offline access |

**Default:** If no scope is specified, `openid` is used.

**Example:**

```
scope=openid profile email offline_access
```

## State Parameter

The `state` parameter is used to prevent CSRF attacks:

1. **Client generates random state:** Before authorization request
2. **Client includes state in request**
3. **Server echoes state in redirect**
4. **Client validates state matches:** Ensures response corresponds to request

```javascript
// Generate state
const state = generateRandomString(32);
sessionStorage.setItem('oauth_state', state);

// Include in authorization URL
authUrl.searchParams.set('state', state);

// Validate on callback
const receivedState = new URLSearchParams(window.location.search).get('state');
const storedState = sessionStorage.getItem('oauth_state');

if (receivedState !== storedState) {
  throw new Error('State mismatch - possible CSRF attack');
}
```

## Code Examples

### JavaScript (Full Authorization Flow)

```javascript
class OAuth2Client {
  constructor(clientId, redirectUri) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
    this.authzEndpoint = 'http://localhost:4000/oauth2/authorize';
  }

  // Generate PKCE code verifier
  generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  // Generate PKCE code challenge
  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(hash));
  }

  // Base64 URL encoding
  base64URLEncode(buffer) {
    return btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Generate random state
  generateState() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  // Start authorization flow
  async authorize(scopes = ['openid', 'profile', 'email']) {
    // Generate PKCE parameters
    const verifier = this.generateCodeVerifier();
    const challenge = await this.generateCodeChallenge(verifier);
    const state = this.generateState();

    // Store for later validation
    sessionStorage.setItem('pkce_verifier', verifier);
    sessionStorage.setItem('oauth_state', state);

    // Build authorization URL
    const url = new URL(this.authzEndpoint);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scopes.join(' '));
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');

    // Redirect to authorization endpoint
    window.location.href = url.toString();
  }

  // Handle callback (call this on redirect URI page)
  handleCallback() {
    const params = new URLSearchParams(window.location.search);

    // Check for errors
    const error = params.get('error');
    if (error) {
      throw new Error(`OAuth2 error: ${error} - ${params.get('error_description')}`);
    }

    // Get code and state
    const code = params.get('code');
    const state = params.get('state');

    if (!code) {
      throw new Error('No authorization code received');
    }

    // Validate state
    const storedState = sessionStorage.getItem('oauth_state');
    if (state !== storedState) {
      throw new Error('State mismatch - possible CSRF attack');
    }

    // Get stored PKCE verifier
    const verifier = sessionStorage.getItem('pkce_verifier');

    // Clean up storage
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('pkce_verifier');

    return { code, verifier };
  }
}

// Usage
const client = new OAuth2Client('cli_abc123', 'https://app.example.com/callback');

// On login button click
await client.authorize(['openid', 'profile', 'email', 'offline_access']);

// On callback page
try {
  const { code, verifier } = client.handleCallback();

  // Now exchange code for tokens at /oauth2/token
  // (See token.md for token exchange)
} catch (error) {
  console.error('Authorization failed:', error.message);
}
```

## Security Considerations

1. **HTTPS Required:** Always use HTTPS in production
2. **State Parameter:** Required to prevent CSRF attacks
3. **PKCE:** Required for public clients, recommended for all
4. **Redirect URI Validation:** Server validates redirect URI matches registered value
5. **Code Expiration:** Authorization codes expire after 10 minutes
6. **One-Time Use:** Codes can only be exchanged once
7. **Client Validation:** Client must be active and not revoked

## Related Endpoints

- [POST /oauth2/token](./token.md) - Exchange authorization code for tokens
- [POST /oauth2/consent](./consent.md) - User consent screen
- [GET /.well-known/openid-configuration](./discovery.md) - OIDC discovery
