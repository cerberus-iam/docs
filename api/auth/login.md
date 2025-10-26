# Login

Authenticate a user and create a session.

## Endpoint

```
POST /api/v1/auth/login
```

## Description

Authenticates a user with email and password credentials. On successful authentication, creates a session and sets an HttpOnly session cookie. Supports Multi-Factor Authentication (MFA) for enhanced security.

The endpoint:

1. Validates credentials (email and password)
2. Checks if the user account is blocked
3. Verifies MFA token (if required)
4. Creates a session with the user's IP address and user agent
5. Sets an HttpOnly session cookie
6. Updates login statistics (last login time, IP, count)

## Authentication

**Required:** No (this endpoint creates authentication)

## Headers

| Header         | Required | Description                |
| -------------- | -------- | -------------------------- |
| `Content-Type` | Yes      | Must be `application/json` |

**Note:** `X-Org-Slug` header is NOT required for login (organisation is determined from user's account).

## Request Body

| Field      | Type   | Required    | Description                                    |
| ---------- | ------ | ----------- | ---------------------------------------------- |
| `email`    | string | Yes         | User's email address                           |
| `password` | string | Yes         | User's password                                |
| `mfaToken` | string | Conditional | 6-digit TOTP code (required if MFA is enabled) |

### Example Request (Basic Login)

```json
{
  "email": "admin@acme.com",
  "password": "SecurePass123!"
}
```

### Example Request (With MFA)

```json
{
  "email": "admin@acme.com",
  "password": "SecurePass123!",
  "mfaToken": "123456"
}
```

## Response

### Success Response

**Status Code:** `200 OK`

**Headers:**

```
Set-Cookie: cerb_sid=<session_token>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600
```

**Body:**

```json
{
  "message": "Login successful",
  "user": {
    "id": "usr_x1y2z3a4b5c6",
    "email": "admin@acme.com",
    "name": "John Doe"
  },
  "organisation": {
    "id": "org_a1b2c3d4e5f6",
    "slug": "acme-corp",
    "name": "Acme Corporation"
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid Input

**Invalid email format:**

```json
{
  "type": "https://cerberus.local/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid input"
}
```

#### 401 Unauthorized - Authentication Failed

**Invalid credentials:**

```json
{
  "type": "https://cerberus.local/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid email or password"
}
```

**Account blocked:**

```json
{
  "type": "https://cerberus.local/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Account is blocked"
}
```

**MFA required (token not provided):**

```json
{
  "type": "https://cerberus.local/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Multi-factor authentication required",
  "requiresMfa": true
}
```

**MFA enrollment required:**

```json
{
  "type": "https://cerberus.local/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "MFA enrollment required before logging in",
  "requiresEnrollment": true
}
```

**Invalid MFA token:**

```json
{
  "type": "https://cerberus.local/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid MFA token",
  "requiresMfa": true
}
```

#### 429 Too Many Requests

**Rate limit exceeded:**

```json
{
  "type": "https://cerberus.local/errors/rate-limit-exceeded",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Please try again later.",
  "retryAfter": 30
}
```

**Rate limits:** 30 requests per 60 seconds (authentication endpoint limit)

## Multi-Factor Authentication (MFA)

### When MFA is Required

MFA is required when:

1. **Organisation-level requirement:** Organisation has `requireMfa: true`
2. **User-level enrollment:** User has enabled MFA (`mfaEnabled: true` and `totpSecret` configured)

### MFA Flow

1. **First login attempt:** Submit email and password (without `mfaToken`)
2. **Server responds:** Returns 401 with `requiresMfa: true`
3. **Client prompts:** Show MFA input field
4. **Second login attempt:** Submit email, password, and `mfaToken`
5. **Server validates:** Verifies TOTP token and creates session

### MFA Enrollment Requirement

If organisation requires MFA but user hasn't enrolled:

1. Server returns 401 with `requiresEnrollment: true`
2. Client should redirect to MFA enrollment flow
3. User must enroll before they can login

## Session Cookie Details

| Property | Value                | Description                            |
| -------- | -------------------- | -------------------------------------- |
| Name     | `cerb_sid`           | Configurable via `SESSION_COOKIE_NAME` |
| HttpOnly | `true`               | Prevents JavaScript access             |
| Secure   | `true` (production)  | HTTPS only in production               |
| SameSite | `Lax`                | CSRF protection                        |
| Domain   | Configurable         | Set via `SESSION_COOKIE_DOMAIN`        |
| Max-Age  | Organisation setting | Default: 3600 seconds (1 hour)         |

## Side Effects

On successful login:

1. **Session created** in database with:
   - Hashed session token
   - User ID and organisation ID
   - IP address and user agent
   - Expiration timestamp

2. **User record updated** with:
   - `lastLoginAt`: Current timestamp
   - `lastLoginIp`: Request IP address
   - `loginCount`: Incremented by 1

3. **Audit log entry created** (if audit logging is enabled)

## Code Examples

### cURL

```bash
# Basic login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt # Save session cookie

# Login with MFA
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "SecurePass123!",
    "mfaToken": "123456"
  }' \
  -c cookies.txt
```

### JavaScript (fetch)

```javascript
// Basic login
const response = await fetch('http://localhost:4000/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important: Include cookies
  body: JSON.stringify({
    email: 'admin@acme.com',
    password: 'SecurePass123!',
  }),
});

if (!response.ok) {
  const error = await response.json();

  // Check if MFA is required
  if (error.requiresMfa) {
    // Show MFA input prompt
    const mfaToken = await promptForMfa();

    // Retry with MFA token
    const retryResponse = await fetch('http://localhost:4000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'admin@acme.com',
        password: 'SecurePass123!',
        mfaToken,
      }),
    });

    if (!retryResponse.ok) {
      throw new Error('Login failed with MFA');
    }

    const data = await retryResponse.json();
    console.log('Login successful with MFA:', data);
  } else if (error.requiresEnrollment) {
    // Redirect to MFA enrollment
    window.location.href = '/mfa/enroll';
  } else {
    throw new Error(error.detail);
  }
} else {
  const data = await response.json();
  console.log('Login successful:', data);
}
```

### TypeScript (with full error handling)

```typescript
interface LoginRequest {
  email: string;
  password: string;
  mfaToken?: string;
}

interface LoginResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  organisation: {
    id: string;
    slug: string;
    name: string;
  };
}

interface LoginError {
  type: string;
  title: string;
  status: number;
  detail: string;
  requiresMfa?: boolean;
  requiresEnrollment?: boolean;
}

class LoginService {
  private baseUrl = 'http://localhost:4000';

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error: LoginError = await response.json();
      throw error;
    }

    return response.json();
  }

  async loginWithMfaFlow(email: string, password: string): Promise<LoginResponse> {
    try {
      // First attempt without MFA
      return await this.login({ email, password });
    } catch (error) {
      const loginError = error as LoginError;

      if (loginError.requiresEnrollment) {
        throw new Error('MFA_ENROLLMENT_REQUIRED');
      }

      if (loginError.requiresMfa) {
        // Prompt for MFA token
        const mfaToken = await this.promptForMfaToken();

        // Retry with MFA token
        return await this.login({ email, password, mfaToken });
      }

      // Other errors
      throw new Error(loginError.detail || 'Login failed');
    }
  }

  private async promptForMfaToken(): Promise<string> {
    // Implementation depends on your UI framework
    // This could show a modal, prompt, or navigate to MFA page
    return new Promise((resolve) => {
      // Example: show MFA input modal
      const token = prompt('Enter your 6-digit MFA code:');
      if (!token || token.length !== 6) {
        throw new Error('Invalid MFA token format');
      }
      resolve(token);
    });
  }
}

// Usage
const loginService = new LoginService();

try {
  const result = await loginService.loginWithMfaFlow('admin@acme.com', 'SecurePass123!');

  console.log('Login successful:', result);
  // Store user info, redirect to dashboard, etc.
} catch (error) {
  if (error.message === 'MFA_ENROLLMENT_REQUIRED') {
    // Redirect to MFA enrollment page
    window.location.href = '/mfa/enroll';
  } else {
    console.error('Login failed:', error.message);
    // Show error to user
  }
}
```

## Security Considerations

1. **Password Verification:** Uses Argon2id for secure password comparison
2. **Rate Limiting:** Prevents brute-force attacks (30 requests/minute)
3. **HttpOnly Cookies:** Protects against XSS attacks
4. **Secure Flag:** Cookies only sent over HTTPS in production
5. **SameSite=Lax:** Protects against CSRF attacks
6. **Account Blocking:** Blocked accounts cannot login
7. **Session Expiry:** Sessions expire based on organisation settings
8. **IP and User Agent Tracking:** Recorded for audit purposes
9. **MFA Support:** Additional security layer for sensitive accounts
10. **Time-Based MFA:** TOTP tokens expire after 30 seconds

## Session Lifetime

Sessions have two timeout mechanisms:

1. **Absolute timeout:** `sessionLifetime` (default: 3600 seconds)
   - Maximum session duration from creation
   - Configurable per organisation

2. **Idle timeout:** `sessionIdleTimeout` (default: 1800 seconds)
   - Session expires after period of inactivity
   - Refreshed on each authenticated request

## Related Endpoints

- [POST /api/v1/auth/register](./register.md) - Create new account
- [POST /api/v1/auth/logout](./logout.md) - End session
- [POST /api/v1/auth/forgot-password](./password-reset.md) - Reset password
- [GET /api/v1/me/mfa](../me/mfa.md) - MFA enrollment and management
