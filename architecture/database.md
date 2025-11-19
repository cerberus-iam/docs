# Database Schema Overview

::: info Updated for v2.0
The schema now supports **many-to-many relationships** between users and organisations via the `OrganisationMember` join table. See the [Migration Guide](/guide/migration-v2) for upgrade details.
:::

## Database Technology

- **DBMS**: PostgreSQL 14+
- **ORM**: Prisma Client 5.22+
- **Schema Definition**: Prisma Schema Language (`prisma/schema.prisma`)
- **Migrations**: Prisma Migrate
- **Connection**: PostgreSQL connection string via `DATABASE_URL` env var

## Schema Organization

The schema is organized into logical sections:

1. **Enums**: Type-safe enum definitions
2. **Global Entities**: Non-tenant-scoped entities (Permissions, Scopes)
3. **Organisation**: Root tenant entity
4. **User & Authentication**: User accounts, memberships, sessions, MFA
5. **Organisation Membership**: Many-to-many user-organisation relationships
6. **Roles & Teams**: RBAC structures (scoped per membership)
7. **OAuth/OIDC**: Clients, tokens, authorization codes
8. **Audit & Compliance**: Audit logs, data export
9. **Integrations**: Webhooks, API keys, SAML

## Entity Categories

### Global Entities (Non-Tenanted)

These entities are shared across all organisations:

- **Permission**: System-wide permissions (e.g., `users:read`, `roles:create`)
- **Scope**: OAuth scopes (e.g., `openid`, `profile`, `email`)
- **JWK**: JWT signing keys for all organisations

### Tenant-Scoped Entities

All other entities belong to a specific `Organisation`:

- Organisation
- User
- Role
- Team
- Client
- Token
- RefreshToken
- AuthorizationCode
- Consent
- Session
- Invitation
- AuditLog
- WebhookEndpoint
- ApiKey
- SamlConnection

## Key Prisma Features Used

### 1. Enums

```prisma
enum ClientType {
  confidential
  public
}

enum OrganisationStatus {
  trial
  active
  suspended
  cancelled
}
```

### 2. Relation Types

**Many-to-Many (via Join Table):**

```prisma
model User {
  id          String               @id @default(uuid())
  email       String               @unique  // Globally unique
  memberships OrganisationMember[]
}

model Organisation {
  id      String               @id @default(uuid())
  members OrganisationMember[]
}

model OrganisationMember {
  id             String   @id @default(uuid())
  userId         String
  organisationId String
  joinedAt       DateTime @default(now())
  leftAt         DateTime?  // Soft delete for membership

  user         User         @relation(fields: [userId], references: [id])
  organisation Organisation @relation(fields: [organisationId], references: [id])
  roles        Role[]       // Roles for this specific membership
  teams        Team[]       // Teams for this specific membership

  @@unique([userId, organisationId])
  @@index([userId])
  @@index([organisationId])
  @@map("organisation_members")
}
```

**One-to-Many:**

```prisma
model Organisation {
  id    String @id @default(uuid())
  roles Role[] @relation("OrganisationRoles")
}

model Role {
  id             String       @id @default(uuid())
  organisationId String       @map("organisation_id")
  organisation   Organisation @relation("OrganisationRoles", fields: [organisationId], references: [id])
}
```

**One-to-One:**

```prisma
model Organisation {
  id      String  @id @default(uuid())
  ownerId String? @unique @map("owner_id")
  owner   User?   @relation("OrganisationOwner", fields: [ownerId], references: [id])
}

model User {
  ownedOrganisation Organisation? @relation("OrganisationOwner")
}
```

**Many-to-Many (implicit):**

```prisma
model Role {
  permissions Permission[] @relation("PermissionRole")
  users       User[]       @relation("UserRole")
}

model User {
  roles Role[] @relation("UserRole")
}
```

### 3. Indexes

```prisma
model User {
  @@index([email])
  @@index([organisationId])
  @@index([externalId])
  @@unique([organisationId, email])
}
```

### 4. Timestamps

All entities have:

```prisma
createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
```

Optional soft delete:

```prisma
deletedAt DateTime? @map("deleted_at") @db.Timestamptz(6)
```

### 5. JSON Fields

For flexible structured data:

```prisma
metadata      Json?  @db.JsonB
scopes        Json   @db.JsonB
passwordPolicy Json? @db.JsonB
```

### 6. Field Mapping

Database column names use snake_case, Prisma models use camelCase:

```prisma
organisationId String @map("organisation_id")
```

## Data Types

### IDs

- **Format**: UUID v4
- **Generated**: `@default(uuid())`
- **Type**: `String`

### Timestamps

- **Type**: `DateTime`
- **Database Type**: `@db.Timestamptz(6)` (timestamp with timezone, 6 decimal places)
- **Auto-updated**: `@updatedAt` for `updatedAt` fields

### JSON/JSONB

- **Type**: `Json`
- **Database Type**: `@db.JsonB` (binary JSON for better performance)
- **Usage**: Flexible schemas, arrays, configuration

### Text

- **Type**: `String`
- **Database Type**: `@db.Text` for large text fields

### Booleans

- **Type**: `Boolean`
- **Defaults**: Explicit defaults via `@default(false)`

## Soft Delete Pattern

Entities support soft deletion via `deletedAt` timestamp:

```prisma
model User {
  deletedAt DateTime? @map("deleted_at") @db.Timestamptz(6)
}
```

**Query pattern:**

```typescript
// Exclude deleted records
prisma.user.findMany({
  where: { deletedAt: null },
});

// Soft delete
prisma.user.update({
  where: { id },
  data: { deletedAt: new Date() },
});
```

**Entities with soft delete:**

- Organisation
- User
- Client

## Multi-Tenancy Implementation

All tenant-scoped entities have `organisationId`:

```prisma
model User {
  organisationId String       @map("organisation_id")
  organisation   Organisation @relation("OrganisationUsers", fields: [organisationId], references: [id])

  @@index([organisationId])
}
```

**Query pattern:**

```typescript
prisma.user.findMany({
  where: {
    organisationId: tenantId,
    deletedAt: null,
  },
});
```

## Cascading Deletes

Prisma handles cascading via:

1. **Database-level**: `onDelete: Cascade` (rare, used sparingly)
2. **Application-level**: Explicit transaction logic in services

**Example (application-level cascade):**

```typescript
await prisma.$transaction(async (tx) => {
  await tx.user.update({ where: { id }, data: { deletedAt: now } });
  await tx.session.deleteMany({ where: { userId: id } });
  await tx.refreshToken.updateMany({ where: { userId: id }, data: { revokedAt: now } });
});
```

## Indexes for Performance

### Query Patterns and Indexes

**Organisation queries:**

- `@@index([slug])` - Lookup by slug (tenant middleware)
- `@@index([email])` - Lookup by email
- `@@index([ownerId])` - Find organisations owned by user

**User queries:**

- `@@index([email])` - Login lookup
- `@@index([organisationId])` - List users by org
- `@@unique([organisationId, email])` - Unique email per org

**Token queries:**

- `@@index([jti])` - Token introspection
- `@@index([clientId])` - Tokens by client
- `@@index([userId])` - Tokens by user
- `@@index([expiresAt])` - Cleanup expired tokens

**Session queries:**

- `@@index([sessionToken])` - Session lookup
- `@@index([userId])` - User sessions
- `@@index([expiresAt])` - Cleanup expired sessions

**Audit log queries:**

- `@@index([organisationId])` - Org audit trail
- `@@index([userId])` - User activity
- `@@index([eventType])` - Filter by event
- `@@index([createdAt])` - Chronological queries

## Connection Pooling

Prisma manages connection pooling automatically:

**Default connection limit:**

- Development: 2 connections
- Production: `num_physical_cpus * 2 + 1`

**Custom pool size:**

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=10"
```

## Migration Strategy

### Development

```bash
npm run db:migrate      # Create and apply migration
npm run db:generate     # Regenerate Prisma Client
```

### Production

```bash
npm run db:deploy       # Apply migrations (non-interactive)
```

### Seed Data

```bash
npm run db:seed         # Run seed script
```

**Seed script** (`prisma/seed.ts`):

- Creates default permissions
- Creates default OAuth scopes
- Optionally creates test organisation

## Query Optimization Tips

### 1. Use `select` to limit fields

```typescript
prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
  },
});
```

### 2. Use `include` judiciously

```typescript
// Good: Only include what you need
prisma.user.findUnique({
  include: {
    roles: { select: { slug: true } },
  },
});

// Bad: Over-fetching
prisma.user.findUnique({
  include: {
    roles: {
      include: {
        permissions: {
          include: {
            /* everything */
          },
        },
      },
    },
  },
});
```

### 3. Batch queries with `findMany`

```typescript
const userIds = ['id1', 'id2', 'id3'];
const users = await prisma.user.findMany({
  where: { id: { in: userIds } },
});
```

### 4. Use transactions for consistency

```typescript
await prisma.$transaction([
  prisma.user.update({ where: { id }, data: { ... } }),
  prisma.auditLog.create({ data: { ... } }),
]);
```

### 5. Count queries

```typescript
// Efficient count
const count = await prisma.user.count({
  where: { organisationId },
});

// Include counts in relations
prisma.organisation.findUnique({
  include: {
    _count: {
      select: {
        users: true,
        clients: true,
      },
    },
  },
});
```

## Security Considerations

### 1. Parameterized Queries

Prisma automatically uses parameterized queries, preventing SQL injection.

### 2. Row-Level Security (RLS)

Not implemented at database level. Enforced in application via:

- `organisationId` filters on all queries
- Middleware-level tenant context validation

### 3. Sensitive Data

- Passwords: Hashed with Argon2id (never stored plain)
- Client secrets: Hashed with Argon2id
- Session tokens: Hashed with SHA-256
- Refresh tokens: Hashed with SHA-256
- TOTP secrets: Encrypted with AES-256-GCM
- Webhook secrets: Encrypted with AES-256-GCM

## Database Maintenance

### Cleanup Tasks

**Expired tokens:**

```typescript
tokenService.cleanupExpiredTokens(90); // Delete tokens older than 90 days
```

**Expired sessions:**

```typescript
prisma.session.deleteMany({
  where: {
    expiresAt: { lt: new Date() },
  },
});
```

**Expired account tokens:**

```typescript
accountTokenService.cleanupExpiredTokens();
```

### Backup Strategy

1. **Automated PostgreSQL backups**: RDS/Aurora automatic backups
2. **Point-in-time recovery**: Enabled for production
3. **Replica for read scaling**: Optional read replica

## Related Documentation

- [Models & Entities](./models.md)
- [Entity Relationships](./relationships.md)
- [Service Layer](./services.md)
- [Security Architecture](./security.md)
