# Verify Email

Verify a user's email address using a verification token.

## Endpoint

```
GET /v1/auth/verify-email
```

## Description

Verifies a user's email address using a one-time verification token sent via email during registration. The token is consumed upon successful verification and cannot be reused.

## Authentication

**Required:** No (public endpoint - uses token from email)

## Headers

No special headers required.

## Query Parameters

| Parameter | Type   | Required | Description                                          |
| --------- | ------ | -------- | ---------------------------------------------------- |
| `token`   | string | Yes      | Email verification token from the verification email |

## Request

### Example Request

```
GET /v1/auth/verify-email?token=evt_a1b2c3d4e5f6g7h8
```

## Response

### Success Response

**Status Code:** `200 OK`

```json
{
  "message": "Email verified successfully"
}
```

**Note:** If the email is already verified, the endpoint still returns success (idempotent).

### Error Responses

#### 400 Bad Request - Missing or Invalid Token

**Missing token:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Missing verification token"
}
```

**Invalid or expired token:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid or expired verification token"
}
```

#### 404 Not Found - User Not Found

**User associated with token not found:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "User not found for provided token"
}
```

## Token Details

### Token Format

- **Prefix:** `evt_` (email verification token)
- **Length:** Variable (secure random string)
- **Expiration:** Configurable (typically 24-48 hours)
- **One-time use:** Token is consumed/deleted after successful verification

### Token Generation

Tokens are generated during:

1. **User registration** (POST /v1/auth/register)
2. **Email change requests** (if implemented)
3. **Resend verification email** (if implemented)

## Side Effects

1. **User record updated:**
   - `emailVerifiedAt` field set to current timestamp

2. **Token consumed:**
   - Token record deleted from database
   - Cannot be used again

3. **Audit log entry created** (if audit logging is enabled)

## Email Verification Flow

1. **User registers:** POST /v1/auth/register
2. **Server sends email:** Contains verification link with token
3. **User clicks link:** Opens this endpoint with token parameter
4. **Server verifies token:** Updates user record
5. **Client shows success:** Redirect to login or dashboard

## Code Examples

### Email Link (Sent to User)

```html
<p>Please verify your email address by clicking the link below:</p>
<a href="https://app.cerberus.local/verify-email?token=evt_a1b2c3d4e5f6g7h8">
  Verify Email Address
</a>
<p>This link will expire in 24 hours.</p>
```

### cURL

```bash
curl -X GET 'http://localhost:4000/v1/auth/verify-email?token=evt_a1b2c3d4e5f6g7h8'
```

### JavaScript (fetch)

```javascript
async function verifyEmail(token) {
  const response = await fetch(
    `http://localhost:4000/v1/auth/verify-email?token=${encodeURIComponent(token)}`,
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }

  const data = await response.json();
  return data;
}

// Usage (extract token from URL)
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (token) {
  try {
    const result = await verifyEmail(token);
    console.log(result.message); // "Email verified successfully"

    // Show success message and redirect
    showSuccessMessage('Email verified! You can now login.');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  } catch (error) {
    console.error('Verification failed:', error.message);
    showErrorMessage(error.message);
  }
} else {
  showErrorMessage('No verification token provided');
}
```

### TypeScript (with React)

```typescript
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface VerificationResult {
  message: string;
}

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
}

export function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  async function verifyEmail(token: string) {
    try {
      const response = await fetch(
        `http://localhost:4000/v1/auth/verify-email?token=${encodeURIComponent(token)}`
      );

      if (!response.ok) {
        const problem: ProblemDetails = await response.json();
        throw new Error(problem.detail);
      }

      const result: VerificationResult = await response.json();

      setStatus('success');
      setMessage(result.message);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login?verified=1');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Verification failed');
    }
  }

  return (
    <div className="verification-page">
      {status === 'verifying' && (
        <div className="loading">
          <h2>Verifying your email...</h2>
          <div className="spinner" />
        </div>
      )}

      {status === 'success' && (
        <div className="success">
          <h2>Email Verified!</h2>
          <p>{message}</p>
          <p>Redirecting to login...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="error">
          <h2>Verification Failed</h2>
          <p>{message}</p>
          <button onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      )}
    </div>
  );
}
```

### Server-Side Verification (Node.js)

```typescript
// Useful for server-side email verification flows
async function verifyEmailServerSide(token: string): Promise<boolean> {
  const response = await fetch(
    `http://localhost:4000/v1/auth/verify-email?token=${encodeURIComponent(token)}`,
  );

  return response.ok;
}

// Usage in an Express route
app.get('/verify', async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).render('error', {
      message: 'Invalid verification link',
    });
  }

  const verified = await verifyEmailServerSide(token);

  if (verified) {
    res.render('success', {
      title: 'Email Verified',
      message: 'Your email has been verified successfully. You can now login.',
    });
  } else {
    res.render('error', {
      title: 'Verification Failed',
      message: 'The verification link is invalid or has expired.',
    });
  }
});
```

## Security Considerations

1. **One-Time Use:** Tokens are deleted after successful verification
2. **Expiration:** Tokens expire after a set period (typically 24-48 hours)
3. **Secure Random:** Tokens use cryptographically secure random generation
4. **No Personal Data in Token:** Token is an opaque identifier
5. **HTTPS Required:** Verification links should use HTTPS in production
6. **Rate Limiting:** Consider rate limiting this endpoint (though less critical than login)

## Best Practices

### Client Implementation

1. **Extract Token from URL:** Parse query parameters on page load
2. **Show Loading State:** Display spinner while verifying
3. **Handle Success:** Show success message and redirect to login
4. **Handle Errors:** Show clear error messages with actionable steps
5. **Resend Option:** Provide link to resend verification email (if implemented)

### Email Template

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Verify Your Email</title>
  </head>
  <body>
    <h1>Welcome to Cerberus IAM!</h1>

    <p>Thank you for registering. Please verify your email address by clicking the button below:</p>

    <a
      href="https://app.cerberus.local/verify-email?token={{token}}"
      style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;"
    >
      Verify Email Address
    </a>

    <p>Or copy and paste this link into your browser:</p>
    <p>
      <a href="https://app.cerberus.local/verify-email?token={{token}}"
        >https://app.cerberus.local/verify-email?token={{token}}</a
      >
    </p>

    <p>This link will expire in 24 hours.</p>

    <p>If you didn't create an account, you can safely ignore this email.</p>
  </body>
</html>
```

## Common Issues

### Token Already Used

**Problem:** User clicks verification link multiple times.

**Solution:** Endpoint is idempotent - returns success if email is already verified.

### Token Expired

**Problem:** User clicks link after token expiration.

**Solution:** Return 400 error. Implement "Resend Verification Email" feature.

### User Not Found

**Problem:** User account was deleted after token was sent.

**Solution:** Return 404 error. User needs to register again.

## Related Endpoints

- [POST /v1/auth/register](./register.md) - Register and receive verification email
- [POST /v1/auth/login](./login.md) - Login after email verification
- Resend Verification Email - (if implemented)
