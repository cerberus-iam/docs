# Password Reset

Request and complete password reset flow.

## Overview

The password reset flow consists of two endpoints:

1. **POST /v1/auth/forgot-password** - Request password reset (send reset email)
2. **POST /v1/auth/reset-password** - Complete password reset with token

---

## Request Password Reset

Send a password reset email to the user.

### Endpoint

```
POST /v1/auth/forgot-password
```

### Description

Initiates the password reset process by sending a password reset email to the user. To prevent email enumeration attacks, this endpoint always returns success regardless of whether the email exists in the system.

**Important:** Password reset is only available for users with `identityProvider: 'local'`. Users who login via SSO/OAuth cannot reset their password through this endpoint.

### Authentication

**Required:** No (public endpoint)

### Headers

| Header         | Required | Description                |
| -------------- | -------- | -------------------------- |
| `Content-Type` | Yes      | Must be `application/json` |

### Request Body

| Field   | Type   | Required | Description          |
| ------- | ------ | -------- | -------------------- |
| `email` | string | Yes      | User's email address |

#### Example Request

```json
{
  "email": "user@example.com"
}
```

### Response

#### Success Response

**Status Code:** `200 OK`

```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

**Note:** This response is returned whether the email exists or not (anti-enumeration).

#### Error Responses

**400 Bad Request - Invalid Email:**

```json
{
  "type": "https://cerberus.local/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid email"
}
```

**429 Too Many Requests:**

```json
{
  "type": "https://cerberus.local/errors/rate-limit-exceeded",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Please try again later.",
  "retryAfter": 30
}
```

**Rate limits:** 30 requests per 60 seconds

### Side Effects

If the email exists and belongs to a local identity provider user:

1. **Password reset token generated** and stored in database
2. **Password reset email sent** with reset link containing token
3. **Token expiration set** (typically 1 hour)

If the email doesn't exist or belongs to SSO user:

- No action taken
- Same success response returned (prevent enumeration)

### Code Example

```typescript
async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch('http://localhost:4000/v1/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }

  const data = await response.json();
  console.log(data.message);
  // Always shows: "If the email exists, a password reset link has been sent"
}
```

---

## Complete Password Reset

Reset password using the token from email.

### Endpoint

```
POST /v1/auth/reset-password
```

### Description

Completes the password reset process by:

1. Validating the reset token
2. Verifying the new password meets strength requirements
3. Updating the user's password (hashed with Argon2id)
4. Revoking all existing sessions and refresh tokens
5. Consuming the reset token (one-time use)

### Authentication

**Required:** No (uses token from email)

### Headers

| Header         | Required | Description                |
| -------------- | -------- | -------------------------- |
| `Content-Type` | Yes      | Must be `application/json` |

### Request Body

| Field      | Type   | Required | Description                     | Constraints                                           |
| ---------- | ------ | -------- | ------------------------------- | ----------------------------------------------------- |
| `token`    | string | Yes      | Password reset token from email | Minimum 1 character                                   |
| `password` | string | Yes      | New password                    | Minimum 8 characters, must meet strength requirements |

#### Example Request

```json
{
  "token": "prt_a1b2c3d4e5f6g7h8",
  "password": "NewSecurePass123!"
}
```

### Response

#### Success Response

**Status Code:** `200 OK`

```json
{
  "message": "Password reset successfully"
}
```

#### Error Responses

**400 Bad Request - Invalid Input:**

```json
{
  "type": "https://cerberus.local/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid input",
  "errors": [
    {
      "code": "too_small",
      "minimum": 8,
      "path": ["password"],
      "message": "String must contain at least 8 character(s)"
    }
  ]
}
```

**400 Bad Request - Password Too Weak:**

```json
{
  "type": "https://cerberus.local/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Password too weak",
  "errors": [
    "Password must be at least 8 characters",
    "Password must contain at least one uppercase letter",
    "Password must contain at least one number"
  ]
}
```

**400 Bad Request - Invalid Token:**

```json
{
  "type": "https://cerberus.local/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid or expired password reset token"
}
```

**401 Unauthorized - SSO User:**

```json
{
  "type": "https://cerberus.local/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Password reset not available for this account"
}
```

**429 Too Many Requests:**

```json
{
  "type": "https://cerberus.local/errors/rate-limit-exceeded",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Please try again later.",
  "retryAfter": 30
}
```

### Password Strength Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (recommended)

### Side Effects

On successful password reset:

1. **Password updated** - Hashed with Argon2id and stored
2. **All sessions deleted** - User is logged out from all devices
3. **All refresh tokens revoked** - OAuth2 refresh tokens invalidated
4. **Reset token consumed** - Token is deleted and cannot be reused
5. **Audit log entry created** - Password reset event logged

### Code Example

```typescript
interface ResetPasswordRequest {
  token: string;
  password: string;
}

async function resetPassword(data: ResetPasswordRequest): Promise<void> {
  const response = await fetch('http://localhost:4000/v1/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const problem = await response.json();

    // Handle specific errors
    if (problem.status === 400 && problem.errors) {
      // Password validation errors
      const errorMessages = Array.isArray(problem.errors)
        ? problem.errors.join(', ')
        : 'Password validation failed';
      throw new Error(errorMessages);
    }

    if (problem.detail.includes('expired')) {
      throw new Error('Reset link has expired. Please request a new one.');
    }

    throw new Error(problem.detail || 'Password reset failed');
  }

  const result = await response.json();
  return result;
}
```

---

## Complete Password Reset Flow

### Step-by-Step Flow

```
1. User clicks "Forgot Password" on login page
   ↓
2. Client calls POST /v1/auth/forgot-password with email
   ↓
3. Server sends password reset email (if email exists)
   ↓
4. User receives email with reset link containing token
   ↓
5. User clicks reset link, opens password reset page
   ↓
6. Client extracts token from URL, shows password reset form
   ↓
7. User enters new password
   ↓
8. Client calls POST /v1/auth/reset-password with token and password
   ↓
9. Server validates token, updates password, revokes sessions
   ↓
10. Client shows success message and redirects to login
```

### Full Implementation Example

```typescript
// Step 1: Request password reset
async function handleForgotPassword(email: string) {
  try {
    await fetch('http://localhost:4000/v1/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    // Always show same message (prevent enumeration)
    showMessage('If that email exists, we sent you a reset link. Please check your inbox.');
  } catch (error) {
    showError('Something went wrong. Please try again.');
  }
}

// Step 2: Complete password reset
async function handleResetPassword(token: string, password: string) {
  try {
    const response = await fetch('http://localhost:4000/v1/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });

    if (!response.ok) {
      const problem = await response.json();

      // Handle validation errors
      if (problem.errors) {
        if (Array.isArray(problem.errors)) {
          throw new Error(problem.errors.join('\n'));
        }
        if (problem.errors[0]?.message) {
          throw new Error(problem.errors.map(e => e.message).join('\n'));
        }
      }

      throw new Error(problem.detail);
    }

    showMessage('Password reset successful! Redirecting to login...');

    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  } catch (error) {
    showError(error.message);
  }
}

// React component example
function PasswordResetPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!token) {
      setError('Invalid reset link');
      return;
    }

    setLoading(true);

    try {
      await handleResetPassword(token, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div>Invalid reset link</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Reset Your Password</h2>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        required
        minLength={8}
      />

      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm password"
        required
        minLength={8}
      />

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}
```

## Security Considerations

1. **Anti-Enumeration:** Forgot password endpoint doesn't reveal if email exists
2. **Rate Limiting:** Both endpoints are rate-limited to prevent abuse
3. **One-Time Tokens:** Reset tokens can only be used once
4. **Token Expiration:** Tokens expire after set period (typically 1 hour)
5. **Session Revocation:** All sessions are logged out on password reset
6. **Refresh Token Revocation:** All OAuth2 refresh tokens are revoked
7. **Password Hashing:** New password is hashed with Argon2id
8. **Local Identity Only:** Only works for local accounts (not SSO)
9. **HTTPS Required:** Reset links should use HTTPS in production
10. **Email Security:** Ensure email service is secure and authenticated

## Common Issues

### Token Expired

**Problem:** User clicks reset link after token expiration.

**Solution:** Display error message and provide link to request new reset email.

### Multiple Reset Requests

**Problem:** User requests multiple password resets.

**Solution:** Each request generates a new token. Only the most recent token is valid.

### SSO User Reset Attempt

**Problem:** User with SSO account tries to reset password.

**Solution:** Return 401 error. Direct them to their SSO provider.

### Password Validation Failed

**Problem:** New password doesn't meet strength requirements.

**Solution:** Display all validation errors clearly. Show requirements upfront.

## Related Endpoints

- [POST /v1/auth/login](./login.md) - Login after password reset
- [POST /v1/auth/register](./register.md) - Create new account
