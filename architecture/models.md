# Data Models

## Complete Entity Reference

This document provides detailed field-level descriptions for all database entities in Cerberus IAM.

## Global Entities

### Permission

**Purpose:** System-wide permissions for RBAC

| Field         | Type     | Description                                      |
| ------------- | -------- | ------------------------------------------------ |
| `id`          | UUID     | Primary key                                      |
| `name`        | String   | Human-readable name (e.g., "Read Users")         |
| `slug`        | String   | Machine-readable identifier (e.g., "users:read") |
| `description` | String?  | Optional permission description                  |
| `createdAt`   | DateTime | Creation timestamp                               |
| `updatedAt`   | DateTime | Last update timestamp                            |

**Relations:**

- `roles`: Many-to-many with `Role`

**Indexes:**

- Unique on `name`
- Unique on `slug`

**Permission Format:**

- `resource:action` (e.g., `users:read`, `roles:create`)
- `resource:*` for all actions on resource
- `*` for super admin (all permissions)

---

### Scope

**Purpose:** OAuth 2.0 / OIDC scopes

| Field         | Type     | Description                                  |
| ------------- | -------- | -------------------------------------------- |
| `id`          | UUID     | Primary key                                  |
| `name`        | String   | Scope identifier (e.g., "openid", "profile") |
| `displayName` | String   | Human-readable name                          |
| `description` | String   | Scope description for consent screen         |
| `isDefault`   | Boolean  | Included by default in token requests        |
| `isSystem`    | Boolean  | System scope, cannot be modified             |
| `category`    | String?  | Grouping category                            |
| `createdAt`   | DateTime | Creation timestamp                           |
| `updatedAt`   | DateTime | Last update timestamp                        |

**Standard OIDC Scopes:**

- `openid`: Required for OIDC (triggers ID token)
- `profile`: User profile claims (name, picture, etc.)
- `email`: Email address
- `address`: Physical address
- `phone`: Phone number

---

### JWK

**Purpose:** JWT signing keys with rotation support

| Field        | Type     | Description                                 |
| ------------ | -------- | ------------------------------------------- |
| `id`         | UUID     | Primary key                                 |
| `kid`        | String   | Key ID (included in JWT header)             |
| `alg`        | String   | Algorithm: "EdDSA" or "RS256"               |
| `publicKey`  | String   | PEM-encoded public key                      |
| `privateKey` | String   | PEM-encoded private key (encrypted at rest) |
| `isActive`   | Boolean  | Currently used for signing                  |
| `createdAt`  | DateTime | Creation timestamp                          |
| `updatedAt`  | DateTime | Last update timestamp                       |

**Key Rotation:**

- New keys created every `JWKS_ROTATE_DAYS` (default: 30 days)
- Old keys kept active for verification (grace period)
- Deactivated keys retained for audit/debugging

---

## Tenant-Scoped Entities

### Organisation

**Purpose:** Root tenant entity

| Field                 | Type      | Description                                        |
| --------------------- | --------- | -------------------------------------------------- |
| `id`                  | UUID      | Primary key                                        |
| `name`                | String    | Organisation name (unique)                         |
| `slug`                | String    | URL-friendly identifier (unique)                   |
| `email`               | String    | Primary contact email (unique)                     |
| `phone`               | String?   | Contact phone number                               |
| `website`             | String?   | Organisation website                               |
| `ownerId`             | UUID?     | User ID of organisation owner                      |
| `status`              | Enum      | `trial`, `active`, `suspended`, `cancelled`        |
| `allowedCallbackUrls` | JSON?     | Allowed OAuth callback URLs                        |
| `allowedLogoutUrls`   | JSON?     | Allowed post-logout redirect URLs                  |
| `allowedOrigins`      | JSON?     | CORS allowed origins                               |
| `sessionLifetime`     | Integer   | Session duration in seconds (default: 3600)        |
| `sessionIdleTimeout`  | Integer   | Idle timeout in seconds (default: 1800)            |
| `requireMfa`          | Boolean   | Enforce MFA for all users                          |
| `allowedMfaMethods`   | JSON?     | Allowed MFA methods (e.g., ["totp", "sms"])        |
| `passwordPolicy`      | JSON?     | Password requirements (minLength, uppercase, etc.) |
| `tokenLifetimePolicy` | JSON?     | Custom token lifetimes                             |
| `branding`            | JSON?     | UI customization (logo, colors, etc.)              |
| `metadata`            | JSON?     | Custom metadata                                    |
| `createdAt`           | DateTime  | Creation timestamp                                 |
| `updatedAt`           | DateTime  | Last update timestamp                              |
| `deletedAt`           | DateTime? | Soft delete timestamp                              |

**Relations:**

- `owner`: One-to-one with `User`
- `users`: One-to-many with `User`
- `teams`: One-to-many with `Team`
- `roles`: One-to-many with `Role`
- `clients`: One-to-many with `Client`
- `sessions`: One-to-many with `Session`
- `tokens`: One-to-many with `Token`
- `auditLogs`: One-to-many with `AuditLog`

---

### User

**Purpose:** User accounts

| Field              | Type      | Description                                        |
| ------------------ | --------- | -------------------------------------------------- |
| `id`               | UUID      | Primary key                                        |
| `organisationId`   | UUID      | Parent organisation                                |
| `firstName`        | String    | First name                                         |
| `lastName`         | String    | Last name                                          |
| `middleName`       | String?   | Middle name                                        |
| `name`             | String    | Full name (computed from first + last)             |
| `email`            | String    | Email address (unique globally)                    |
| `emailVerifiedAt`  | DateTime? | Email verification timestamp                       |
| `phone`            | String?   | Phone number                                       |
| `phoneVerifiedAt`  | DateTime? | Phone verification timestamp                       |
| `password`         | String?   | Argon2id hash (null for SSO users)                 |
| `profilePhotoPath` | String?   | Profile photo storage path                         |
| `externalId`       | String?   | ID from external identity provider                 |
| `identityProvider` | String    | "local", "google", "saml", etc. (default: "local") |
| `mfaEnabled`       | Boolean   | MFA enrollment status                              |
| `mfaMethods`       | JSON?     | Enabled MFA methods                                |
| `totpSecret`       | String?   | TOTP secret (encrypted)                            |
| `backupCodes`      | JSON?     | MFA backup codes (hashed)                          |
| `lastLoginAt`      | DateTime? | Last successful login                              |
| `lastLoginIp`      | String?   | IP address of last login                           |
| `loginCount`       | Integer   | Total login count                                  |
| `blockedAt`        | DateTime? | Account blocked timestamp                          |
| `blockedReason`    | String?   | Reason for blocking                                |
| `lockedAt`         | DateTime? | Account locked timestamp (failed logins)           |
| `metadata`         | JSON?     | Custom metadata                                    |
| `createdAt`        | DateTime  | Creation timestamp                                 |
| `updatedAt`        | DateTime  | Last update timestamp                              |
| `deletedAt`        | DateTime? | Soft delete timestamp                              |

**Relations:**

- `organisation`: Many-to-one with `Organisation`
- `roles`: Many-to-many with `Role`
- `teams`: Many-to-many with `Team`
- `sessions`: One-to-many with `Session`
- `tokens`: One-to-many with `Token`
- `refreshTokens`: One-to-many with `RefreshToken`
- `consents`: One-to-many with `Consent`

**Unique Constraints:**

- `email` globally unique
- `[organisationId, email]` composite unique

---

### Role

**Purpose:** RBAC roles

| Field            | Type     | Description                        |
| ---------------- | -------- | ---------------------------------- |
| `id`             | UUID     | Primary key                        |
| `organisationId` | UUID     | Parent organisation                |
| `name`           | String   | Role name (e.g., "Admin")          |
| `slug`           | String   | Machine identifier (e.g., "admin") |
| `description`    | String?  | Role description                   |
| `isDefault`      | Boolean  | Assigned to new users by default   |
| `createdAt`      | DateTime | Creation timestamp                 |
| `updatedAt`      | DateTime | Last update timestamp              |

**Relations:**

- `organisation`: Many-to-one with `Organisation`
- `permissions`: Many-to-many with `Permission`
- `users`: Many-to-many with `User`
- `invitations`: One-to-many with `Invitation`

**Unique Constraints:**

- `[organisationId, slug]` composite unique

---

### Team

**Purpose:** User grouping

| Field            | Type     | Description           |
| ---------------- | -------- | --------------------- |
| `id`             | UUID     | Primary key           |
| `organisationId` | UUID     | Parent organisation   |
| `name`           | String   | Team name             |
| `slug`           | String   | Machine identifier    |
| `description`    | String?  | Team description      |
| `createdAt`      | DateTime | Creation timestamp    |
| `updatedAt`      | DateTime | Last update timestamp |

**Relations:**

- `organisation`: Many-to-one with `Organisation`
- `members`: Many-to-many with `User`

**Unique Constraints:**

- `[organisationId, slug]` composite unique

---

### Client

**Purpose:** OAuth 2.0 / OIDC client applications

| Field                     | Type      | Description                                         |
| ------------------------- | --------- | --------------------------------------------------- |
| `id`                      | UUID      | Primary key                                         |
| `organisationId`          | UUID      | Parent organisation                                 |
| `name`                    | String    | Client name                                         |
| `description`             | String?   | Client description                                  |
| `clientId`                | String    | Public client identifier (globally unique)          |
| `clientSecret`            | String?   | Argon2id hash (null for public clients)             |
| `clientType`              | Enum      | `confidential` or `public`                          |
| `grantTypes`              | JSON      | Allowed grant types (array)                         |
| `redirectUris`            | JSON      | Allowed redirect URIs (array)                       |
| `allowedOrigins`          | JSON?     | CORS allowed origins (array)                        |
| `scopes`                  | JSON      | Allowed scopes (array)                              |
| `requirePkce`             | Boolean   | Require PKCE (Proof Key for Code Exchange)          |
| `requireConsent`          | Boolean   | Show consent screen                                 |
| `tokenEndpointAuthMethod` | Enum      | `client_secret_basic`, `client_secret_post`, `none` |
| `accessTokenLifetime`     | Integer   | Access token lifetime (seconds)                     |
| `refreshTokenLifetime`    | Integer   | Refresh token lifetime (seconds)                    |
| `idTokenLifetime`         | Integer   | ID token lifetime (seconds)                         |
| `logoUri`                 | String?   | Client logo URL                                     |
| `policyUri`               | String?   | Privacy policy URL                                  |
| `tosUri`                  | String?   | Terms of service URL                                |
| `isActive`                | Boolean   | Client is active                                    |
| `isFirstParty`            | Boolean   | Trusted first-party client (skip consent)           |
| `revoked`                 | Boolean   | Client has been revoked                             |
| `createdAt`               | DateTime  | Creation timestamp                                  |
| `updatedAt`               | DateTime  | Last update timestamp                               |
| `deletedAt`               | DateTime? | Soft delete timestamp                               |

**Relations:**

- `organisation`: Many-to-one with `Organisation`
- `tokens`: One-to-many with `Token`
- `refreshTokens`: One-to-many with `RefreshToken`
- `authorizationCodes`: One-to-many with `AuthorizationCode`
- `consents`: One-to-many with `Consent`

**Grant Types:**

- `authorization_code`: Standard OAuth flow
- `refresh_token`: Token refresh
- `client_credentials`: Machine-to-machine (future)

---

### Token

**Purpose:** Access tokens (JWT records)

| Field            | Type      | Description                                  |
| ---------------- | --------- | -------------------------------------------- |
| `id`             | UUID      | Primary key                                  |
| `jti`            | String    | JWT ID (unique, included in JWT)             |
| `clientId`       | UUID      | Issuing client                               |
| `userId`         | UUID?     | Resource owner (null for client credentials) |
| `organisationId` | UUID      | Parent organisation                          |
| `tokenType`      | String    | "Bearer"                                     |
| `scopes`         | JSON      | Granted scopes (array)                       |
| `audience`       | String?   | Token audience                               |
| `issuedAt`       | DateTime  | Token issuance time                          |
| `expiresAt`      | DateTime  | Token expiration time                        |
| `revokedAt`      | DateTime? | Manual revocation timestamp                  |
| `lastUsedAt`     | DateTime? | Last time token was used                     |
| `ipAddress`      | String?   | IP address at issuance                       |
| `userAgent`      | String?   | User agent at issuance                       |
| `createdAt`      | DateTime  | Creation timestamp                           |
| `updatedAt`      | DateTime  | Last update timestamp                        |

**Relations:**

- `client`: Many-to-one with `Client`
- `user`: Many-to-one with `User`
- `organisation`: Many-to-one with `Organisation`
- `refreshToken`: One-to-one with `RefreshToken`

**Indexes:**

- Unique on `jti`
- Index on `clientId`, `userId`, `organisationId`, `expiresAt`

---

### RefreshToken

**Purpose:** Long-lived tokens for obtaining new access tokens

| Field            | Type      | Description                            |
| ---------------- | --------- | -------------------------------------- |
| `id`             | UUID      | Primary key                            |
| `token`          | String    | SHA-256 hash of refresh token (unique) |
| `accessTokenId`  | UUID      | Associated access token                |
| `clientId`       | UUID      | Issuing client                         |
| `userId`         | UUID      | Resource owner                         |
| `organisationId` | UUID      | Parent organisation                    |
| `scopes`         | JSON      | Granted scopes (array)                 |
| `expiresAt`      | DateTime  | Token expiration time                  |
| `revokedAt`      | DateTime? | Revocation timestamp                   |
| `familyId`       | UUID      | Token family ID (rotation chain)       |
| `parentTokenId`  | UUID?     | Previous token in rotation chain       |
| `createdAt`      | DateTime  | Creation timestamp                     |
| `updatedAt`      | DateTime  | Last update timestamp                  |

**Relations:**

- `accessToken`: One-to-one with `Token`
- `client`: Many-to-one with `Client`
- `user`: Many-to-one with `User`
- `organisation`: Many-to-one with `Organisation`
- `parent`: Self-relation (token family tree)
- `children`: Self-relation (token family tree)

**Token Family Pattern:**

- All tokens from same authorization have same `familyId`
- Each rotation creates new token with current as `parentTokenId`
- Reuse detection: If revoked token used → revoke entire family

---

### AuthorizationCode

**Purpose:** OAuth authorization codes (short-lived, single-use)

| Field                 | Type      | Description                         |
| --------------------- | --------- | ----------------------------------- |
| `id`                  | UUID      | Primary key                         |
| `code`                | String    | Authorization code (unique, random) |
| `clientId`            | UUID      | Requesting client                   |
| `userId`              | UUID      | Authorizing user                    |
| `organisationId`      | UUID      | Parent organisation                 |
| `redirectUri`         | String    | Callback URL                        |
| `scopes`              | JSON      | Requested scopes (array)            |
| `codeChallenge`       | String?   | PKCE code challenge                 |
| `codeChallengeMethod` | Enum?     | `plain` or `S256`                   |
| `expiresAt`           | DateTime  | Code expiration (10 minutes)        |
| `revokedAt`           | DateTime? | Used/revoked timestamp              |
| `createdAt`           | DateTime  | Creation timestamp                  |
| `updatedAt`           | DateTime  | Last update timestamp               |

**Relations:**

- `client`: Many-to-one with `Client`
- `user`: Many-to-one with `User`
- `organisation`: Many-to-one with `Organisation`

**Lifecycle:**

- Created during `/oauth2/authorize`
- Exchanged once at `/oauth2/token`
- Deleted or revoked after exchange

---

### Consent

**Purpose:** User consent to grant client access

| Field            | Type      | Description                           |
| ---------------- | --------- | ------------------------------------- |
| `id`             | UUID      | Primary key                           |
| `userId`         | UUID      | Consenting user                       |
| `clientId`       | UUID      | Client being authorized               |
| `organisationId` | UUID      | Parent organisation                   |
| `scopes`         | JSON      | Granted scopes (array)                |
| `expiresAt`      | DateTime? | Consent expiration (null = permanent) |
| `revokedAt`      | DateTime? | User revoked consent                  |
| `createdAt`      | DateTime  | Creation timestamp                    |
| `updatedAt`      | DateTime  | Last update timestamp                 |

**Relations:**

- `user`: Many-to-one with `User`
- `client`: Many-to-one with `Client`
- `organisation`: Many-to-one with `Organisation`

**Unique Constraints:**

- `[userId, clientId]` composite unique

---

### Session

**Purpose:** Admin UI sessions (cookie-based)

| Field            | Type     | Description                    |
| ---------------- | -------- | ------------------------------ |
| `id`             | UUID     | Primary key                    |
| `userId`         | UUID     | Session owner                  |
| `organisationId` | UUID     | Parent organisation            |
| `sessionToken`   | String   | SHA-256 hash (unique)          |
| `ipAddress`      | String   | IP address at session creation |
| `userAgent`      | String   | Browser user agent             |
| `lastActivityAt` | DateTime | Last request timestamp         |
| `expiresAt`      | DateTime | Session expiration             |
| `createdAt`      | DateTime | Creation timestamp             |
| `updatedAt`      | DateTime | Last update timestamp          |

**Relations:**

- `user`: Many-to-one with `User`
- `organisation`: Many-to-one with `Organisation`

**Lifecycle:**

- Created at login
- Updated on each request (lastActivityAt)
- Deleted at logout or expiration

---

### AuditLog

**Purpose:** Audit trail for compliance

| Field            | Type     | Description                                             |
| ---------------- | -------- | ------------------------------------------------------- |
| `id`             | UUID     | Primary key                                             |
| `organisationId` | UUID     | Parent organisation                                     |
| `userId`         | UUID?    | Actor (null for system events)                          |
| `clientId`       | UUID?    | Client if API request                                   |
| `eventType`      | String   | Event type (e.g., "user.login")                         |
| `eventCategory`  | Enum     | `auth`, `user`, `client`, `permission`, `system`        |
| `action`         | Enum     | `create`, `read`, `update`, `delete`, `login`, `logout` |
| `resourceType`   | String?  | Affected resource type                                  |
| `resourceId`     | UUID?    | Affected resource ID                                    |
| `ipAddress`      | String   | Request IP address                                      |
| `userAgent`      | String   | Request user agent                                      |
| `metadata`       | JSON?    | Additional event data                                   |
| `success`        | Boolean  | Event success status                                    |
| `errorMessage`   | String?  | Error message if failed                                 |
| `createdAt`      | DateTime | Event timestamp                                         |

**Relations:**

- `organisation`: Many-to-one with `Organisation`
- `user`: Many-to-one with `User`
- `client`: Many-to-one with `Client`

**Indexes:**

- Index on `organisationId`, `userId`, `clientId`, `eventType`, `createdAt`

---

### Invitation

**Purpose:** User invitations

| Field            | Type      | Description                       |
| ---------------- | --------- | --------------------------------- |
| `id`             | UUID      | Primary key                       |
| `organisationId` | UUID      | Parent organisation               |
| `email`          | String    | Invitee email                     |
| `roleId`         | UUID      | Assigned role                     |
| `teamIds`        | JSON?     | Assigned teams (array of UUIDs)   |
| `token`          | String    | Invitation token (unique, random) |
| `invitedById`    | UUID?     | Inviting user                     |
| `acceptedAt`     | DateTime? | Acceptance timestamp              |
| `expiresAt`      | DateTime  | Invitation expiration (7 days)    |
| `createdAt`      | DateTime  | Creation timestamp                |
| `updatedAt`      | DateTime  | Last update timestamp             |

**Relations:**

- `organisation`: Many-to-one with `Organisation`
- `role`: Many-to-one with `Role`
- `invitedBy`: Many-to-one with `User`

---

### ApiKey

**Purpose:** API key authentication

| Field            | Type      | Description                 |
| ---------------- | --------- | --------------------------- |
| `id`             | UUID      | Primary key                 |
| `organisationId` | UUID      | Parent organisation         |
| `name`           | String    | Key name/description        |
| `keyPrefix`      | String    | First 8 chars (for display) |
| `keyHash`        | String    | Argon2id hash of full key   |
| `scopes`         | JSON      | Allowed scopes (array)      |
| `lastUsedAt`     | DateTime? | Last usage timestamp        |
| `expiresAt`      | DateTime? | Key expiration              |
| `revokedAt`      | DateTime? | Revocation timestamp        |
| `createdAt`      | DateTime  | Creation timestamp          |
| `updatedAt`      | DateTime  | Last update timestamp       |

**Relations:**

- `organisation`: Many-to-one with `Organisation`

**Key Format:**

```
cerb_live_<prefix>_<random>
```

---

### WebhookEndpoint

**Purpose:** Webhook event delivery

| Field             | Type      | Description                          |
| ----------------- | --------- | ------------------------------------ |
| `id`              | UUID      | Primary key                          |
| `organisationId`  | UUID      | Parent organisation                  |
| `clientId`        | UUID?     | Associated client (optional)         |
| `url`             | String    | Webhook endpoint URL                 |
| `secretEncrypted` | String    | AES-256-GCM encrypted signing secret |
| `events`          | JSON      | Subscribed events (array)            |
| `isActive`        | Boolean   | Webhook is active                    |
| `lastTriggeredAt` | DateTime? | Last delivery attempt                |
| `failureCount`    | Integer   | Consecutive failure count            |
| `createdAt`       | DateTime  | Creation timestamp                   |
| `updatedAt`       | DateTime  | Last update timestamp                |

**Relations:**

- `organisation`: Many-to-one with `Organisation`
- `client`: Many-to-one with `Client`

---

### EmailVerificationToken

**Purpose:** Email verification tokens

| Field        | Type      | Description                         |
| ------------ | --------- | ----------------------------------- |
| `id`         | UUID      | Primary key                         |
| `userId`     | UUID      | User verifying email                |
| `token`      | String    | Verification token (unique, random) |
| `expiresAt`  | DateTime  | Token expiration (24 hours)         |
| `consumedAt` | DateTime? | Verification timestamp              |
| `createdAt`  | DateTime  | Creation timestamp                  |

**Relations:**

- `user`: Many-to-one with `User`

---

### PasswordResetToken

**Purpose:** Password reset tokens

| Field        | Type      | Description                  |
| ------------ | --------- | ---------------------------- |
| `id`         | UUID      | Primary key                  |
| `userId`     | UUID      | User resetting password      |
| `token`      | String    | Reset token (unique, random) |
| `expiresAt`  | DateTime  | Token expiration (1 hour)    |
| `consumedAt` | DateTime? | Reset completion timestamp   |
| `createdAt`  | DateTime  | Creation timestamp           |

**Relations:**

- `user`: Many-to-one with `User`

---

### SamlConnection

**Purpose:** SAML SSO configuration

| Field              | Type     | Description                               |
| ------------------ | -------- | ----------------------------------------- |
| `id`               | UUID     | Primary key                               |
| `organisationId`   | UUID     | Parent organisation                       |
| `name`             | String   | Connection name                           |
| `enabled`          | Boolean  | Connection is active                      |
| `idpEntityId`      | String   | IdP entity identifier                     |
| `idpSsoUrl`        | String   | IdP SSO URL                               |
| `idpCertificate`   | String   | IdP x509 certificate (PEM)                |
| `spEntityId`       | String   | Service Provider entity ID                |
| `spAcsUrl`         | String   | Assertion Consumer Service URL            |
| `attributeMapping` | JSON     | SAML attribute to user field mapping      |
| `domains`          | JSON     | Email domains for this connection (array) |
| `createdAt`        | DateTime | Creation timestamp                        |
| `updatedAt`        | DateTime | Last update timestamp                     |

**Relations:**

- `organisation`: Many-to-one with `Organisation`

---

## Related Documentation

- [Database Schema](./database.md)
- [Entity Relationships](./relationships.md)
- [Service Layer](./services.md)
