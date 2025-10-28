# Features

Cerberus IAM provides a comprehensive suite of identity and access management features designed for modern applications.

## Authentication Features

### Email/Password Authentication

- **Secure Password Hashing**: Argon2 algorithm (Password Hashing Competition winner)
- **Baseline Password Policy**: Minimum length plus upper/lowercase and numeric checks
- **Email Verification**: Secure token-based email confirmation
- **Password Reset Flow**: Self-service password recovery with time-limited tokens
- **Login Telemetry**: `lastLoginAt`, `lastLoginIp`, and `loginCount` tracking

### Multi-Factor Authentication (MFA)

- **TOTP Support**: Time-based One-Time Password (RFC 6238) compatible with Google Authenticator, Authy, etc.
- **Backup Codes**: One-time recovery codes for account access
- **Organization-Level Enforcement**: Require MFA for all users in an organization
- **User-Level Control**: Individual users can enable/disable MFA
- **QR Code Enrollment**: Easy setup with QR code scanning

### Session Management

- **Secure Session Tokens**: Cryptographically secure random tokens
- **Configurable Lifetime**: Per-organization session duration settings
- **Idle Timeout**: Automatic session expiration after inactivity
- **Multi-Device Support**: Users can have multiple active sessions
- **Session Revocation**: Terminate individual sessions via `/v1/me/sessions/:id`
- **Device Tracking**: IP address and user agent logging for audit

## Authorization Features

### Role-Based Access Control (RBAC)

- **Tenant-Scoped Roles**: Organization-specific role definitions
- **Granular Permissions**: Resource-action based permission model (`resource:action`)
- **Wildcard Support**: `users:*` for all user operations, `*` for superuser access
- **Default Roles**: Automatically assigned roles for new users
- **Dynamic Assignment**: Add/remove roles at runtime
- **Permission Caching**: High-performance permission checks with request-level caching

### Teams & Organizational Structure

- **Teams**: Group users within organizations for collaboration
- **Organization Isolation**: Complete data separation between tenants
- **Owner Management**: Organization owner with elevated privileges
- **Flexible Membership**: Users can belong to multiple teams

### API Key Authentication

- **Long-Lived Tokens**: Server-to-server authentication without user sessions
- **Scope Metadata**: Persist allowed scopes for downstream authorization
- **Key Rotation**: Generate new keys without downtime
- **Prefix-Based Identification**: Easily identify key types (`ck_live_...`)
- **Secure Hashing**: Keys are hashed at rest using SHA-256

## OAuth2 & OpenID Connect

### OAuth 2.1 Authorization Server

- **Authorization Code Flow**: Primary OAuth2 flow with PKCE support
- **PKCE (Proof Key for Code Exchange)**: Protection against authorization code interception
- **Refresh Token Rotation**: Automatic token rotation for enhanced security
- **Token Family Tracking**: Detect and revoke compromised token families
- **Client Authentication**: Support for confidential and public clients
- **Multiple Grant Types**: Authorization code, refresh token

### OpenID Connect 1.0

- **ID Tokens**: JWT-based identity tokens with user claims
- **UserInfo Endpoint**: Retrieve user profile information
- **Discovery**: Well-known configuration endpoint for client auto-configuration
- **JWKS**: Public key set for token signature verification
- **Standard Claims**: Support for standard OIDC claims (sub, email, name, etc.)

### Token Management

- **JWT Signing**: EdDSA (Ed25519) or RS256 algorithms
- **Key Rotation**: Automatic key rotation with overlapping validity
- **Token Introspection**: Validate token status and metadata
- **Token Revocation**: Invalidate access and refresh tokens
- **Configurable Lifetimes**: Per-client or per-organization token TTL

### Client Management

- **Dynamic Client Registration**: Programmatically register OAuth clients
- **Client Types**: Confidential (with secret) and public (native/SPA) clients
- **Redirect URI Validation**: Strict validation against allowed URIs
- **Scope Management**: Define available scopes per client
- **First-Party Clients**: Skip consent for trusted applications
- **Client Revocation**: Disable clients and revoke all issued tokens

## User Management

### Self-Service Features

- **User Registration**: Email-based account creation with verification
- **Profile Management**: Update name, email, phone, profile photo
- **Password Change**: Secure password update with current password verification
- **MFA Enrollment**: Self-service TOTP setup
- **Data Export**: GDPR-compliant download of personal data (JSON format)
- **Session Management**: View and revoke active sessions

### Administrative Features

- **User Lifecycle**: Create, read, update, delete (soft-delete) users
- **Role Assignment**: Add/remove roles from users
- **Team Management**: Add users to teams
- **Account Status**: Block/unblock user accounts
- **Force Password Reset**: Require password change on next login
- **User Invitations**: Invite users to join organization with pre-assigned roles

### Data Management

- **Soft Delete**: Mark users as deleted without removing data
- **Data Retention**: Configurable retention periods for deleted data
- **Cascade Deletion**: Automatically clean up sessions, tokens, and consents
- **Audit Trail**: Complete history of user lifecycle events

## Multi-Tenancy

### Organization Management

- **Complete Isolation**: Data boundaries between organizations
- **Custom Slugs**: User-friendly organization identifiers
- **Owner Assignment**: Designated organization owner
- **Status Management**: Trial, active, suspended, cancelled states
- **Configuration**: Per-organization settings for policies and security

### Organization Settings

- **MFA Requirements**: Enforce MFA for all organization users
- **Session Policies**: Custom session lifetime and idle timeout
- **Password Policy Metadata**: Store intended password rules for custom enforcement
- **Token Lifetimes**: Custom access/refresh token TTLs
- **Allowed Domains**: Whitelist callback URLs, logout URLs, and origins

## Security Features

### Cryptography

- **Argon2 Password Hashing**: Memory-hard algorithm resistant to GPU attacks
- **AES-256-GCM Encryption**: Authenticated encryption for secrets (webhook secrets, client secrets)
- **EdDSA/RS256 JWT**: Asymmetric signing for token verification
- **Secure Random Generation**: Cryptographically secure token generation
- **Key Rotation**: Automatic JWT signing key rotation

### Protection Mechanisms

- **CSRF Protection**: Token-based CSRF prevention for session-based auth
- **Rate Limiting**: Configurable per-endpoint rate limits (auth, token, global)
- **Security Headers**: Helmet middleware for CSP, HSTS, X-Frame-Options, etc.
- **CORS Whitelist**: Explicit origin allow-list for cross-origin requests
- **Input Validation**: Zod schema validation for all API inputs

### Breach Detection

- **Refresh Token Reuse Detection**: Automatically detect and respond to token reuse
- **Token Family Revocation**: Revoke entire token family on suspicious activity
- **Login Analytics**: Track login attempts, failures, and success rates

## Integration Features

### Webhooks

- **Event Subscriptions**: Subscribe to user, auth, and token events
- **Reliable Delivery**: Automatic retries with exponential backoff
- **Signature Validation**: HMAC-SHA256 signatures for webhook payloads
- **Secret Rotation**: Generate new webhook secrets without downtime
- **Event Filtering**: Subscribe only to specific event types
- **Batch Support**: Efficient processing of multiple events

### API Features

- **RESTful Design**: Predictable, resource-oriented API structure
- **JSON Payloads**: Standard JSON request and response bodies
- **Problem Details**: RFC 7807 compliant error responses
- **Pagination**: Cursor-based or offset pagination for list endpoints
- **Filtering & Sorting**: Query parameters for data retrieval
- **Partial Responses**: Select specific fields to reduce payload size

### Observability

- **Structured Logging**: Pino-based JSON logging with log levels
- **Request ID Propagation**: Trace requests across service boundaries
- **Remote Log Export**: Send logs to SIEM or log aggregation systems
- **Audit Logging**: Comprehensive audit trail for compliance
- **Health Checks**: `/health` endpoint for load balancer probes
- **Metrics Ready**: Structured logs for metric extraction

## Audit & Compliance

### Audit Logging

- **Comprehensive Events**: Login, logout, user create/update/delete, token operations, etc.
- **Event Categories**: Auth, user, client, permission, system
- **Contextual Metadata**: IP address, user agent, request ID, custom data
- **Permanent Records**: Audit logs are never deleted (no soft-delete)
- **Query API**: Search and filter audit logs by user, event type, date range

### Compliance Features

- **GDPR Compliance**: Data export, right to be forgotten (soft-delete)
- **Data Retention Policies**: Configurable retention for different data types
- **Consent Management**: OAuth2 consent records for user authorization
- **Audit Trail**: Complete history of security-relevant events
- **Privacy by Design**: Sensitive data redaction in logs

### Standards Compliance

- **OAuth 2.1**: Latest OAuth2 security best practices
- **OpenID Connect 1.0**: Certified OIDC implementation
- **RFC 6749**: OAuth 2.0 Authorization Framework
- **RFC 7519**: JSON Web Token (JWT)
- **RFC 7807**: Problem Details for HTTP APIs
- **RFC 6238**: TOTP for MFA

## Developer Features

### Development Experience

- **TypeScript**: Full type safety with strict mode
- **Path Aliases**: Clean imports with `@/` prefix
- **Hot Reload**: Fast iteration with ts-node-dev
- **Comprehensive Tests**: Unit, integration, and E2E test suites
- **Linting & Formatting**: ESLint 9 and Prettier 3
- **Git Hooks**: Pre-commit hooks with Husky and lint-staged

### Deployment

- **Docker Support**: Multi-stage Dockerfile for optimized builds
- **Docker Compose**: Local development environment with all dependencies
- **Health Checks**: Built-in health check endpoint
- **Graceful Shutdown**: Clean termination of connections
- **Non-Root User**: Security-hardened container with non-root execution
- **CI/CD Ready**: GitHub Actions workflow for testing and deployment

### Documentation

- **Comprehensive Docs**: VitePress-based documentation site
- **API Reference**: Detailed endpoint documentation with examples
- **Architecture Guide**: In-depth technical documentation
- **Code Examples**: Real-world integration patterns
- **Migration Guides**: Version upgrade instructions

## Performance Features

### Optimization

- **Connection Pooling**: Prisma connection pooling for database efficiency
- **Request-Level Caching**: Permission checks cached per request
- **Efficient Queries**: Optimized database queries with proper indexes
- **Pagination**: Limit result sets to prevent large payloads
- **Conditional Requests**: Support for If-None-Match, ETag headers

### Scalability

- **Stateless Design**: Horizontal scaling with no session affinity required
- **Redis Support**: Pluggable Redis store for rate limiting and caching
- **Database Replication**: Read replica support via Prisma
- **CDN-Friendly**: Static assets and public endpoints cacheable
- **Async Operations**: Non-blocking I/O for high concurrency

## Upcoming Features

The following features are planned for future releases:

- **SAML 2.0 Support**: Enterprise SSO with SAML identity providers
- **Social Login**: OAuth2 integration with Google, GitHub, Microsoft, etc.
- **WebAuthn**: Passwordless authentication with FIDO2
- **Risk-Based Authentication**: Adaptive MFA based on login context
- **Custom Claims**: Extensible token claims for application-specific data
- **GraphQL API**: Alternative API interface for flexible data fetching
- **Admin Dashboard**: Web-based administration interface
- **Email Templates**: Customizable email templates for verification, reset, etc.

See the [roadmap](https://github.com/cerberus-iam/api/blob/main/README.md#roadmap) for more details.
