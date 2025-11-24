# Security Controls

Cerberus IAM enforces a multi-layer security posture across middleware, services, and data
boundaries. This guide highlights the controls that engineers interact with most frequently,
with a particular focus on cross-site request forgery (CSRF) mitigation, password policies,
rate limiting, and session handling.

## Password Strength Requirements

All user passwords must meet the following strength criteria:

| Requirement       | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| Minimum length    | 8 characters                                               |
| Uppercase letter  | At least one A-Z                                           |
| Lowercase letter  | At least one a-z                                           |
| Number            | At least one 0-9                                           |
| Special character | At least one of `!@#$%^&*(),.?":{}` or similar punctuation |

These requirements apply to:

- Organisation onboarding (`POST /v1/auth/onboard`)
- Invitation acceptance (`POST /v1/public/invitations/:token/accept`)
- Password reset (`POST /v1/auth/reset-password`)
- Password change (`POST /v1/me/password`)

### Password Hashing

Passwords are hashed using **Argon2id** with the following parameters:

- **Memory**: 64 MB
- **Iterations**: 3
- **Parallelism**: 4 threads
- **Salt**: Random 16 bytes per password

See the [Authentication Guide](./authentication.md) for implementation details.

## Rate Limiting

Cerberus applies rate limiting to protect against brute-force attacks and abuse. Rate limits vary by endpoint category.

### Authentication Endpoints

| Endpoint                        | Limit           | Window                 |
| ------------------------------- | --------------- | ---------------------- |
| `POST /v1/auth/login`           | `AUTH_RATE_MAX` | `AUTH_RATE_WINDOW_SEC` |
| `POST /v1/auth/onboard`         | `AUTH_RATE_MAX` | `AUTH_RATE_WINDOW_SEC` |
| `POST /v1/auth/forgot-password` | `AUTH_RATE_MAX` | `AUTH_RATE_WINDOW_SEC` |
| `POST /v1/auth/reset-password`  | `AUTH_RATE_MAX` | `AUTH_RATE_WINDOW_SEC` |

Default: 30 requests per 60 seconds per IP.

### Public Invitation Endpoints

| Endpoint                                    | Limit | Window     |
| ------------------------------------------- | ----- | ---------- |
| `GET /v1/public/invitations/:token`         | 10    | 15 minutes |
| `POST /v1/public/invitations/:token/accept` | 30    | 60 seconds |

These stricter limits protect invitation tokens from enumeration attacks.

### API Endpoints

General API endpoints use the default rate limiter configured via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_SEC` environment variables.

## CSRF Protection Strategy

All state-changing requests authenticated with a browser session must present a CSRF token.
Tokens are issued as `HttpOnly`, `SameSite=Lax` cookies and mirrored in the `X-CSRF-Token`
response header by `sessionCsrfMiddleware`. Clients submit the header value on subsequent
`POST`, `PUT`, `PATCH`, or `DELETE` requests to satisfy the middleware guard.

The enforcement behaviour is centralised in `@/lib/security/csrf-policy.ts`. Policy defaults to
requiring CSRF validation for every unsafe HTTP method, while allowing a narrowly-scoped list
of exemptions to cover user logout flows, public endpoints, and future session revocation endpoints.

### Exemption Matrix

| Endpoint                               | Methods  | CSRF Required | Policy ID                  | Rationale                                                            |
| -------------------------------------- | -------- | ------------- | -------------------------- | -------------------------------------------------------------------- |
| `/v1/auth/logout`                      | `POST`   | No            | `auth.logout`              | Allow users to log out even when their CSRF cookie has expired.      |
| `/v1/auth/session`                     | `DELETE` | No            | `auth.session.delete`      | Enable idempotent session revocation that downstream apps can reuse. |
| `/v1/public/invitations/:token/accept` | `POST`   | No            | `public.invitation.accept` | Public endpoint for unauthenticated users accepting invitations.     |

The matrix is generated from `listCsrfExemptions()` and is covered by unit tests in
`csrf-policy.unit.test.ts`. When adding new exemptions, follow this checklist:

1. Extend `@/lib/security/csrf-policy.ts` with a descriptive rule ID and rationale.
2. Add focused unit tests for the new matcher.
3. Update this table and the high-level security guidance in `SECURITY.md`.
4. Document consumer impact (admin portal, third-party apps) before merging.

::: info Public Endpoints
Public endpoints (those under `/v1/public/*` and `/v1/auth/*` that don't require authentication) are exempt from CSRF protection by design. These endpoints use other security measures like rate limiting and token validation.
:::

### Session Termination Contract

Two endpoints are available for terminating browser sessions:

- `POST /v1/auth/logout` retains backwards compatibility for existing clients.
- `DELETE /v1/auth/session` provides an idempotent REST resource that other Cerberus apps can
  adopt going forward.

Both routes call the shared helper `terminateAuthenticatedSession`, which revokes the hashed
session token, clears the session and CSRF cookies using `getSessionCookieOptions`, and emits
an `auditLogout` event. Integration and end-to-end tests assert that neither route requires a
CSRF token but both invalidate access immediately.

## Additional Security Practices

- All audit-relevant actions emit structured events to `audit_logs`. Monitor the stream for
  unexpected authentication or authorisation changes.
- MFA enforcement can be configured per organisation; high-privilege roles should mandate it.
- Use the configuration reference to ensure TLS termination, secure cookie flags, and token
  lifetimes align with your deployment posture.
- Invitation tokens are hashed in the database; the plaintext token is only sent via email.
- Email validation on invitation accept prevents token hijacking.
