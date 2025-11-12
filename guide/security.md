# Security Controls

Cerberus IAM enforces a multi-layer security posture across middleware, services, and data
boundaries. This guide highlights the controls that engineers interact with most frequently,
with a particular focus on cross-site request forgery (CSRF) mitigation and session handling.

## CSRF Protection Strategy

All state-changing requests authenticated with a browser session must present a CSRF token.
Tokens are issued as `HttpOnly`, `SameSite=Lax` cookies and mirrored in the `X-CSRF-Token`
response header by `sessionCsrfMiddleware`. Clients submit the header value on subsequent
`POST`, `PUT`, `PATCH`, or `DELETE` requests to satisfy the middleware guard.

The enforcement behaviour is centralised in `@/lib/security/csrf-policy.ts`. Policy defaults to
requiring CSRF validation for every unsafe HTTP method, while allowing a narrowly-scoped list
of exemptions to cover user logout flows and future session revocation endpoints.

### Exemption Matrix

| Endpoint           | Methods  | CSRF Required | Policy ID             | Rationale                                                            |
| ------------------ | -------- | ------------- | --------------------- | -------------------------------------------------------------------- |
| `/v1/auth/logout`  | `POST`   | No            | `auth.logout`         | Allow users to log out even when their CSRF cookie has expired.      |
| `/v1/auth/session` | `DELETE` | No            | `auth.session.delete` | Enable idempotent session revocation that downstream apps can reuse. |

The matrix is generated from `listCsrfExemptions()` and is covered by unit tests in
`csrf-policy.unit.test.ts`. When adding new exemptions, follow this checklist:

1. Extend `@/lib/security/csrf-policy.ts` with a descriptive rule ID and rationale.
2. Add focused unit tests for the new matcher.
3. Update this table and the high-level security guidance in `SECURITY.md`.
4. Document consumer impact (admin portal, third-party apps) before merging.

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
