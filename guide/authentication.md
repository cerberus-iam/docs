# Authentication

This guide covers authentication mechanisms, password hashing, multi-factor authentication (MFA), and session management in Cerberus IAM.

## Overview

Cerberus supports multiple authentication methods:

- **Session-based** - Cookie-based sessions for admin UI
- **Bearer tokens** - JWT access tokens for API access
- **API keys** - Long-lived keys for server-to-server
- **OAuth2/OIDC** - Standard protocol flows

## Authentication Middleware

### Session Authentication

Used for admin UI and web applications:

```typescript
import { authenticateSession } from '@/middleware/authn';

router.get('/me/profile', authenticateSession, async (req, res) => {
  // req.user is populated with authenticated user
  // req.authOrganisation contains the organization
  res.json(req.user);
});
```

**How it Works:**

1. Extracts session cookie (`cerb_sid` by default)
2. Validates session token (SHA-256 hash lookup)
3. Checks expiration and idle timeout
4. Loads user with roles and permissions
5. Verifies user is not blocked
6. Attaches `req.user` and `req.authOrganisation`

**Response on Failure:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid or expired session"
}
```

### Bearer Token Authentication

Used for OAuth2 clients and API access:

```typescript
import { authenticateBearer } from '@/middleware/authn';

router.get('/v1/users', authenticateBearer, async (req, res) => {
  // req.user contains JWT payload data
  const users = await prisma.user.findMany({
    where: { organisationId: req.user.organisationId },
  });
  res.json(users);
});
```

**How it Works:**

1. Extracts `Authorization: Bearer <token>` header
2. Verifies JWT signature with public key
3. Validates issuer, expiration
4. Attaches minimal user info from JWT claims

### API Key Authentication

Used for server-to-server integration:

```typescript
import { authenticateApiKey } from '@/middleware/apikey';

router.post('/webhooks/incoming', authenticateApiKey, async (req, res) => {
  // req.user contains API key user context
  // req.tenant contains organization context
  // req.apiKeyScopes contains granted scopes
  res.json({ received: true });
});
```

**How it Works:**

1. Extracts `Authorization: Bearer <api_key>` header
2. Looks up key by prefix
3. Verifies hash with Argon2
4. Checks revocation and expiration
5. Updates `lastUsedAt` timestamp
6. Attaches organization and scopes

### Optional Authentication

Allows both authenticated and anonymous access:

```typescript
import { optionalAuth } from '@/middleware/authn';

router.get('/oauth2/authorize', optionalAuth, async (req, res) => {
  if (req.user) {
    // User is authenticated
    return showConsentPage(req, res);
  } else {
    // Redirect to login
    return redirectToLogin(req, res);
  }
});
```

## Password Authentication

### Password Hashing

Cerberus uses **Argon2id** for password hashing:

```typescript
import { hashPassword, verifyPassword } from '@/auth/password';

// Hash password
const hash = await hashPassword('user-password');
// $argon2id$v=19$m=65536,t=3,p=4$...

// Verify password
const valid = await verifyPassword(hash, 'user-password');
// true or false
```

**Algorithm Details:**

- **Algorithm**: Argon2id (hybrid mode)
- **Memory**: 64 MB
- **Iterations**: 3
- **Parallelism**: 4 threads
- **Salt**: Random 16 bytes per password

**Why Argon2id?**

- Winner of Password Hashing Competition (2015)
- Resistant to GPU/ASIC attacks
- Memory-hard algorithm
- Hybrid mode (combines data-independent and data-dependent)

### Password Validation

```typescript
import { validatePasswordStrength } from '@/auth/password';

const result = validatePasswordStrength('weak');
// {
//   valid: false,
//   errors: [
//     'Password must be at least 8 characters',
//     'Password must contain at least one uppercase letter',
//     'Password must contain at least one number'
//   ]
// }
```

**Default Policy:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Custom Policy (Organization-Level):**

```typescript
// Organization password policy (JSON field)
{
  "minLength": 12,
  "requireUppercase": true,
  "requireLowercase": true,
  "requireNumber": true,
  "requireSpecial": true,
  "preventReuse": 5,
  "maxAge": 90
}
```

### Login Flow

```typescript
// POST /v1/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "mfaToken": "123456" // optional - required when the user/org enforces MFA
}
```

**Process:**

1. Find user by email
2. Check user is not blocked
3. Verify password with Argon2
4. Determine if MFA is required (organisation policy or prior enrolment)
5. When required, verify the provided `mfaToken`
6. Create the session and set the cookie
7. Update login stats (`lastLoginAt`, `lastLoginIp`, `loginCount`)

**Response:**

```json
{
  "message": "Login successful",
  "user": {
    "id": "usr_...",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "organisation": {
    "id": "org_...",
    "slug": "acme-corp",
    "name": "Acme Corporation"
  }
}
```

### Password Reset Flow

#### 1. Request Reset

```typescript
// POST /v1/auth/forgot-password
{
  "email": "user@example.com"
}
```

**Process:**

1. Find user by email
2. Generate secure reset token (32 bytes)
3. Store hashed token in database
4. Set expiration (1 hour)
5. Send reset email with link

**Email Link:**

```
https://admin.acme.com/reset-password?token=tok_...
```

#### 2. Reset Password

```typescript
// POST /v1/auth/reset-password
{
  "token": "tok_...",
  "newPassword": "NewSecurePass123"
}
```

**Process:**

1. Validate token (format, existence, expiration, not yet consumed)
2. Validate password strength
3. Hash new password
4. Update user password
5. Mark token as consumed
6. Revoke all existing sessions

> Note: The API does not expose a separate token-inspection endpoint. Clients typically render a reset form using the token from the email link and rely on the POST request above to validate it.

## Multi-Factor Authentication (MFA)

### TOTP (Time-Based One-Time Password)

Cerberus implements TOTP based on RFC 6238.

#### Enable TOTP

`POST /v1/me/mfa/enable`

Returns the TOTP secret and OTP Auth URI for enrolment:

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUri": "otpauth://totp/Cerberus:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Cerberus"
}
```

**Process:**

1. Check MFA not already enabled
2. Generate random 32-character secret
3. Encrypt secret with `SECRET_ENCRYPTION_KEY`
4. Generate QR code URI
5. Store encrypted secret (not yet active)

**QR Code Display:**
Users scan the QR code with authenticator apps:

- Google Authenticator
- Authy
- 1Password
- Microsoft Authenticator

#### Verify and Activate TOTP

`POST /v1/me/mfa/verify`

```json
{
  "token": "123456"
}
```

Response:

```json
{
  "message": "MFA enabled successfully",
  "backupCodes": ["ABCD-1234-EFGH-5678", "IJKL-9012-MNOP-3456"],
  "warning": "Save these backup codes in a safe place. They can be used if you lose access to your authenticator."
}
```

**Process:**

1. Verify TOTP code against stored secret
2. Generate 10 backup codes
3. Hash backup codes with Argon2
4. Set `mfaEnabled = true`
5. Return plaintext backup codes (only shown once!)

**TOTP Parameters:**

- **Period**: 30 seconds
- **Digits**: 6
- **Algorithm**: SHA-1 (TOTP standard)
- **Window**: ±1 period (allows 30s clock skew)

#### Login with MFA

MFA is handled through the standard login endpoint. Supply the six-digit code via the optional `mfaToken` field when the organisation or user requires MFA.

#### Disable MFA

`POST /v1/me/mfa/disable`

```json
{
  "token": "123456"
}
```

Process:

1. Verify current TOTP code
2. Set `mfaEnabled = false`
3. Clear `totpSecret`, `backupCodes`, and `mfaMethods`

#### Regenerate Backup Codes

`POST /v1/me/mfa/backup-codes`

```json
{
  "token": "123456"
}
```

Response:

```json
{
  "backupCodes": ["NEW1-2345-CODE-6789"],
  "message": "Backup codes regenerated successfully"
}
```

### Future MFA Methods

Planned support for:

- **SMS**: One-time codes via SMS
- **Email**: One-time codes via email
- **WebAuthn**: FIDO2/passkeys
- **Push notifications**: Mobile app approval

## Session Management

### Session Creation

```typescript
import { createSession } from '@/auth/sessions';

const { session, sessionToken } = await createSession(userId, organisationId, ipAddress, userAgent);

// Set cookie
res.cookie(config.SESSION_COOKIE_NAME, sessionToken, {
  httpOnly: true,
  secure: config.SESSION_COOKIE_SECURE,
  domain: config.SESSION_COOKIE_DOMAIN,
  sameSite: 'lax',
  maxAge: organisation.sessionLifetime * 1000,
});
```

**Session Properties:**

- Token hashed with SHA-256
- Absolute expiration (from `organisation.sessionLifetime`)
- Idle timeout (from `organisation.sessionIdleTimeout`)
- IP address and user agent tracking

### Session Validation

```typescript
import { getSessionByToken } from '@/auth/sessions';

const sessionData = await getSessionByToken(sessionToken);

if (!sessionData) {
  // Session invalid, expired, or idle timeout exceeded
  return unauthorized('Invalid or expired session');
}

// Session is valid
const { user, organisation } = sessionData;
```

**Validation Checks:**

1. Session exists in database
2. Not past `expiresAt`
3. Not past idle timeout (`lastActivityAt + sessionIdleTimeout`)
4. User not blocked

**Automatic Cleanup:**

- Expired sessions deleted on validation
- Idle sessions deleted on validation
- `lastActivityAt` updated on each request

### Session Revocation

```typescript
import { revokeSession, revokeAllUserSessions } from '@/auth/sessions';

// Revoke single session (logout)
await revokeSession(sessionId);

// Revoke all user sessions (security action)
await revokeAllUserSessions(userId);
```

### Session Lifetime Configuration

Per-organization configuration:

```typescript
// Organisation table
{
  "sessionLifetime": 3600,      // 1 hour absolute expiration
  "sessionIdleTimeout": 1800    // 30 minutes idle timeout
}
```

**Recommendations:**

- **Admin UI**: 1 hour absolute, 30 min idle
- **High-security**: 15 min absolute, 5 min idle
- **Low-security**: 24 hours absolute, 2 hours idle

## Email Verification

### Verification Flow

#### 1. Send Verification Email

```typescript
// POST /v1/auth/send-verification-email
```

**Process:**

1. Generate verification token
2. Create `EmailVerificationToken` record
3. Set expiration (24 hours)
4. Send email with link

**Email Link:**

```
https://admin.acme.com/verify-email?token=tok_...
```

#### 2. Verify Email

```typescript
// POST /v1/auth/verify-email
{
  "token": "tok_..."
}
```

**Process:**

1. Find token
2. Check not expired
3. Check not consumed
4. Set `user.emailVerifiedAt`
5. Mark token as consumed

## Account Security

### Account Blocking

Administrators can block user accounts:

```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    blockedAt: new Date(),
    blockedReason: 'Suspicious activity detected',
  },
});
```

**Effects:**

- All login attempts fail
- All sessions immediately invalidated
- All tokens remain valid (consider revoking separately)

**Unblock:**

```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    blockedAt: null,
    blockedReason: null,
  },
});
```

### Login Tracking

Every successful login updates:

```typescript
{
  "lastLoginAt": "2024-01-15T10:30:00Z",
  "lastLoginIp": "203.0.113.42",
  "loginCount": 47
}
```

Use for:

- Security monitoring
- Detecting unusual activity
- User analytics

### Failed Login Attempts

(Coming soon: Account lockout after N failed attempts)

## Security Best Practices

### 1. Password Storage

- Never store plaintext passwords
- Never log passwords
- Use Argon2id for hashing
- Never send passwords in URLs

### 2. Session Security

```typescript
// Production settings
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_DOMAIN=.yourcompany.com
```

- Always use `httpOnly` cookies
- Enable `secure` flag in production
- Use `sameSite: 'lax'` or `'strict'`
- Set appropriate domain

### 3. MFA Enforcement

```typescript
// Organization-level MFA requirement
{
  "requireMfa": true,
  "allowedMfaMethods": ["totp"]
}
```

### 4. Token Security

- Short access token lifetime (15-60 minutes)
- Long refresh token lifetime (days/weeks)
- Implement refresh token rotation
- Revoke on suspicious activity

### 5. Rate Limiting

Already configured for auth endpoints:

- Login: 30 requests/minute
- Password reset: 30 requests/minute
- Token endpoint: 30 requests/minute

## Troubleshooting

### Session Cookie Not Set

**Problem:** Login succeeds but session not created

**Solutions:**

1. Check `SESSION_COOKIE_DOMAIN` matches request domain
2. Verify `SESSION_COOKIE_SECURE` appropriate for protocol
3. Check CORS credentials enabled
4. Inspect browser cookie settings

### MFA Code Invalid

**Problem:** TOTP code always fails

**Solutions:**

1. Check device time is synchronized (NTP)
2. Verify secret not corrupted
3. Check `SECRET_ENCRYPTION_KEY` consistent
4. Try adjacent time window codes

### Password Reset Link Expired

**Problem:** Token expired before user clicks

**Solutions:**

1. Increase token expiration (default 1 hour)
2. Check email delivery speed
3. Allow token regeneration
4. Clear expired tokens regularly

## Next Steps

- [Authorization](/guide/authorization) - Roles and permissions
- [Sessions](/guide/sessions) - Session management deep dive
- [OAuth2](/guide/oauth2) - OAuth2/OIDC authentication
