# Entity Relationships

## Entity Relationship Diagrams

### Core Multi-Tenancy Structure

```mermaid
erDiagram
    Organisation ||--o{ User : "has many"
    Organisation ||--|| User : "owned by"
    Organisation ||--o{ Client : "has many"
    Organisation ||--o{ Role : "has many"
    Organisation ||--o{ Team : "has many"
    Organisation ||--o{ Session : "has many"
    Organisation ||--o{ Token : "has many"
    Organisation ||--o{ AuditLog : "has many"

    Organisation {
        uuid id PK
        string name
        string slug UK
        string email UK
        uuid ownerId FK
        enum status
        datetime createdAt
        datetime deletedAt
    }

    User {
        uuid id PK
        uuid organisationId FK
        string email UK
        string name
        string password
        boolean mfaEnabled
        datetime createdAt
        datetime deletedAt
    }
```

### User Access Control

```mermaid
erDiagram
    User }o--o{ Role : "has roles"
    User }o--o{ Team : "member of"
    Role }o--o{ Permission : "has permissions"

    User {
        uuid id PK
        uuid organisationId FK
        string email
        string name
    }

    Role {
        uuid id PK
        uuid organisationId FK
        string name
        string slug
        boolean isDefault
    }

    Permission {
        uuid id PK
        string name UK
        string slug UK
        string description
    }

    Team {
        uuid id PK
        uuid organisationId FK
        string name
        string slug
    }
```

### OAuth/OIDC Token Flow

```mermaid
erDiagram
    Client ||--o{ AuthorizationCode : "receives"
    Client ||--o{ Token : "issues"
    Client ||--o{ RefreshToken : "issues"
    Client ||--o{ Consent : "receives"

    User ||--o{ AuthorizationCode : "authorizes"
    User ||--o{ Token : "owns"
    User ||--o{ RefreshToken : "owns"
    User ||--o{ Consent : "grants"

    Token ||--|| RefreshToken : "paired with"
    RefreshToken ||--o| RefreshToken : "rotates to"

    Client {
        uuid id PK
        string clientId UK
        string clientSecret
        enum clientType
        json scopes
        json redirectUris
    }

    AuthorizationCode {
        uuid id PK
        string code UK
        uuid clientId FK
        uuid userId FK
        datetime expiresAt
        datetime revokedAt
    }

    Token {
        uuid id PK
        string jti UK
        uuid clientId FK
        uuid userId FK
        json scopes
        datetime expiresAt
        datetime revokedAt
    }

    RefreshToken {
        uuid id PK
        string token UK
        uuid accessTokenId FK
        uuid clientId FK
        uuid userId FK
        uuid familyId
        uuid parentTokenId FK
        datetime expiresAt
        datetime revokedAt
    }
```

### Refresh Token Family

```mermaid
graph TB
    RT1[RefreshToken 1<br/>familyId: abc<br/>parentTokenId: null]
    RT2[RefreshToken 2<br/>familyId: abc<br/>parentTokenId: RT1]
    RT3[RefreshToken 3<br/>familyId: abc<br/>parentTokenId: RT2]
    RT4[RefreshToken 4<br/>familyId: abc<br/>parentTokenId: RT3]

    RT1 -->|rotated to| RT2
    RT2 -->|rotated to| RT3
    RT3 -->|rotated to| RT4

    style RT1 fill:#f9f,stroke:#333
    style RT2 fill:#ff9,stroke:#333
    style RT3 fill:#9ff,stroke:#333
    style RT4 fill:#9f9,stroke:#333

    note[Reuse Detection:<br/>If RT2 is used after RT3 exists,<br/>revoke entire family abc]

    RT2 -.->|reuse detected| note
```

### Session Management

```mermaid
erDiagram
    User ||--o{ Session : "has sessions"
    Organisation ||--o{ Session : "scopes"

    Session {
        uuid id PK
        uuid userId FK
        uuid organisationId FK
        string sessionToken UK
        string ipAddress
        string userAgent
        datetime lastActivityAt
        datetime expiresAt
    }
```

### Invitations & Onboarding

```mermaid
erDiagram
    Organisation ||--o{ Invitation : "sends"
    Role ||--o{ Invitation : "assigns"
    User ||--o{ Invitation : "sends"

    Invitation {
        uuid id PK
        uuid organisationId FK
        string email
        uuid roleId FK
        json teamIds
        string token UK
        uuid invitedById FK
        datetime acceptedAt
        datetime expiresAt
    }
```

### Audit Logging

```mermaid
erDiagram
    Organisation ||--o{ AuditLog : "tracks"
    User ||--o{ AuditLog : "performs actions"
    Client ||--o{ AuditLog : "performs actions"

    AuditLog {
        uuid id PK
        uuid organisationId FK
        uuid userId FK
        uuid clientId FK
        string eventType
        enum eventCategory
        enum action
        string resourceType
        string resourceId
        string ipAddress
        boolean success
        datetime createdAt
    }
```

### API Keys & Webhooks

```mermaid
erDiagram
    Organisation ||--o{ ApiKey : "has"
    Organisation ||--o{ WebhookEndpoint : "has"
    Client ||--o{ WebhookEndpoint : "subscribes"

    ApiKey {
        uuid id PK
        uuid organisationId FK
        string name
        string keyPrefix
        string keyHash
        json scopes
        datetime lastUsedAt
        datetime expiresAt
        datetime revokedAt
    }

    WebhookEndpoint {
        uuid id PK
        uuid organisationId FK
        uuid clientId FK
        string url
        string secretEncrypted
        json events
        boolean isActive
        datetime lastTriggeredAt
    }
```

### Account Security Tokens

```mermaid
erDiagram
    User ||--o{ EmailVerificationToken : "has"
    User ||--o{ PasswordResetToken : "has"

    EmailVerificationToken {
        uuid id PK
        uuid userId FK
        string token UK
        datetime expiresAt
        datetime consumedAt
    }

    PasswordResetToken {
        uuid id PK
        uuid userId FK
        string token UK
        datetime expiresAt
        datetime consumedAt
    }
```

## Relationship Types

### One-to-One

- **Organisation ↔ User (owner)**
  - Organisation has one owner
  - User can own one organisation
  - Foreign key: `Organisation.ownerId`

- **Token ↔ RefreshToken**
  - Each access token can have one refresh token
  - Each refresh token belongs to one access token
  - Foreign key: `RefreshToken.accessTokenId`

### One-to-Many

- **Organisation → Users**
  - One organisation has many users
  - Each user belongs to one organisation
  - Foreign key: `User.organisationId`

- **Organisation → Clients**
  - One organisation has many OAuth clients
  - Each client belongs to one organisation
  - Foreign key: `Client.organisationId`

- **Organisation → Roles**
  - One organisation has many roles
  - Each role belongs to one organisation
  - Foreign key: `Role.organisationId`

- **Client → Tokens**
  - One client can issue many tokens
  - Each token belongs to one client
  - Foreign key: `Token.clientId`

- **User → Sessions**
  - One user can have multiple sessions
  - Each session belongs to one user
  - Foreign key: `Session.userId`

### Many-to-Many

- **User ↔ Role**
  - Users can have multiple roles
  - Roles can be assigned to multiple users
  - Join table: `_UserRole`

- **User ↔ Team**
  - Users can belong to multiple teams
  - Teams can have multiple members
  - Join table: `_TeamUser`

- **Role ↔ Permission**
  - Roles can have multiple permissions
  - Permissions can belong to multiple roles
  - Join table: `_PermissionRole`

### Self-Referencing

- **RefreshToken → RefreshToken (parent)**
  - Refresh tokens form a chain (family)
  - Each token has optional parent
  - Foreign key: `RefreshToken.parentTokenId`
  - Indexed by: `RefreshToken.familyId`

## Cascading Operations

### Soft Delete Organisation

When an organisation is soft-deleted:

1. Mark `Organisation.deletedAt`
2. Soft delete all `User` records
3. Soft delete all `Client` records
4. Hard delete all `Session` records
5. Revoke all `Token` records (set `revokedAt`)
6. Revoke all `RefreshToken` records
7. Hard delete all `AuthorizationCode` records
8. Hard delete all `Invitation` records
9. Revoke all `Consent` records
10. Hard delete all `WebhookEndpoint` records

### Soft Delete User

When a user is soft-deleted:

1. Mark `User.deletedAt`
2. Hard delete all `Session` records
3. Revoke all `RefreshToken` records
4. Revoke all `Token` records
5. Hard delete all `AuthorizationCode` records
6. Revoke all `Consent` records

### Revoke Client

When a client is revoked:

1. Mark `Client.revoked = true`
2. Revoke all `Token` records
3. Revoke all `RefreshToken` records
4. Hard delete all `AuthorizationCode` records

### Revoke Refresh Token Family

When token reuse is detected:

1. Find all tokens with matching `familyId`
2. Revoke all tokens in family (set `revokedAt`)
3. Revoke associated access tokens

## Indexes for Performance

### Primary Keys

All entities use UUID primary keys for global uniqueness and security.

### Unique Constraints

- `Organisation.slug`
- `Organisation.email`
- `User.email` (globally unique)
- `[User.organisationId, User.email]` (composite)
- `Client.clientId`
- `Token.jti`
- `RefreshToken.token`
- `AuthorizationCode.code`
- `Session.sessionToken`
- `[Consent.userId, Consent.clientId]` (composite)

### Foreign Key Indexes

- `User.organisationId`
- `Role.organisationId`
- `Team.organisationId`
- `Client.organisationId`
- `Token.clientId`
- `Token.userId`
- `RefreshToken.clientId`
- `RefreshToken.userId`
- `RefreshToken.familyId`
- `RefreshToken.parentTokenId`
- `Session.userId`
- `AuditLog.organisationId`
- `AuditLog.userId`

### Query Optimization Indexes

- `Token.expiresAt` (cleanup expired tokens)
- `RefreshToken.expiresAt` (cleanup)
- `Session.expiresAt` (cleanup)
- `AuditLog.createdAt` (time-based queries)
- `AuditLog.eventType` (filter by event)

## Data Integrity Rules

### Required Relationships

- Every `User` must belong to an `Organisation`
- Every `Token` must belong to a `Client` and `Organisation`
- Every `RefreshToken` must belong to a `Client`, `User`, and have an `accessTokenId`
- Every `Role` must belong to an `Organisation`

### Optional Relationships

- `Organisation.ownerId` can be null (until owner assigned)
- `User.password` can be null (SSO users)
- `Token.userId` can be null (client credentials grant)
- `RefreshToken.parentTokenId` can be null (first token in family)

### Referential Integrity

Enforced by PostgreSQL foreign key constraints at database level.

## Query Patterns

### Get User with Full Access Context

```typescript
prisma.user.findUnique({
  where: { id: userId },
  include: {
    organisation: true,
    roles: {
      include: {
        permissions: true,
      },
    },
    teams: true,
  },
});
```

### Get Client with Token Statistics

```typescript
prisma.client.findUnique({
  where: { clientId },
  include: {
    _count: {
      select: {
        tokens: true,
        refreshTokens: true,
        consents: true,
      },
    },
  },
});
```

### Get Organisation with Counts

```typescript
prisma.organisation.findUnique({
  where: { slug },
  include: {
    owner: { select: { id: true, name: true, email: true } },
    _count: {
      select: {
        users: true,
        clients: true,
        roles: true,
        teams: true,
      },
    },
  },
});
```

### Get Refresh Token with Family

```typescript
prisma.refreshToken.findUnique({
  where: { token: hashedToken },
  include: {
    client: { select: { clientId: true } },
    parent: true,
    children: true,
  },
});
```

## Related Documentation

- [Database Schema](./database.md)
- [Data Models](./models.md)
- [Service Layer](./services.md)
