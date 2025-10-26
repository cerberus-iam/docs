# Database

This guide covers database setup, schema management, migrations, and Prisma usage in Cerberus IAM API.

## Overview

Cerberus uses:

- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5
- **Migrations**: Prisma Migrate
- **Schema**: Multi-tenant with organization isolation

## Quick Start

### 1. Install PostgreSQL

**macOS (Homebrew):**

```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**

```bash
sudo apt install postgresql-14
sudo systemctl start postgresql
```

**Docker:**

```bash
docker run --name cerberus-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=cerberus_iam \
  -p 5432:5432 \
  -d postgres:14-alpine
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE cerberus_iam;

# Create user (optional)
CREATE USER cerberus WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE cerberus_iam TO cerberus;
```

### 3. Configure Connection

Update `.env`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cerberus_iam?schema=public
```

### 4. Run Migrations

```bash
# Run all migrations
npx prisma migrate deploy

# Or in development (with Prisma Studio access)
npx prisma migrate dev
```

### 5. Seed Database (Optional)

```bash
# Generate initial data
npx prisma db seed
```

## Database Schema

### Schema Overview

The database uses a multi-tenant architecture centered around **Organizations**:

```
Organization (tenant root)
├── Users
│   ├── Roles
│   ├── Teams
│   └── Sessions
├── OAuth Clients
│   ├── Tokens
│   ├── Refresh Tokens
│   └── Authorization Codes
├── API Keys
├── Webhooks
└── Audit Logs
```

### Global Entities

Not scoped to organizations:

#### Permissions

```prisma
model Permission {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  roles Role[]
}
```

**Examples:**

- `users:read`, `users:write`, `users:delete`
- `clients:manage`, `roles:assign`
- `*` (super admin wildcard)

#### Scopes

OAuth2/OIDC scopes:

```prisma
model Scope {
  id          String   @id @default(uuid())
  name        String   @unique
  displayName String
  description String
  isDefault   Boolean  @default(false)
  isSystem    Boolean  @default(false)
  category    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Examples:**

- `openid`, `profile`, `email`, `offline_access`
- Custom application scopes

#### JWK (Signing Keys)

```prisma
model JWK {
  id         String   @id @default(uuid())
  kid        String   @unique
  alg        String
  publicKey  String
  privateKey String
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### Tenant-Scoped Entities

#### Organization

```prisma
model Organisation {
  id                  String             @id @default(uuid())
  name                String             @unique
  slug                String             @unique
  email               String             @unique
  status              OrganisationStatus @default(trial)
  sessionLifetime     Int                @default(3600)
  sessionIdleTimeout  Int                @default(1800)
  requireMfa          Boolean            @default(false)
  passwordPolicy      Json?
  tokenLifetimePolicy Json?
  branding            Json?
  metadata            Json?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
  deletedAt           DateTime?
}
```

**Features:**

- Soft delete support (`deletedAt`)
- Configurable session policies
- Custom branding and metadata
- Trial/Active/Suspended/Cancelled status

#### User

```prisma
model User {
  id               String    @id @default(uuid())
  organisationId   String
  firstName        String
  lastName         String
  name             String
  email            String    @unique
  emailVerifiedAt  DateTime?
  password         String?
  mfaEnabled       Boolean   @default(false)
  mfaMethods       Json?
  totpSecret       String?
  backupCodes      Json?
  lastLoginAt      DateTime?
  lastLoginIp      String?
  loginCount       Int       @default(0)
  blockedAt        DateTime?
  blockedReason    String?
  metadata         Json?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  deletedAt        DateTime?

  organisation Organisation @relation(fields: [organisationId], references: [id])
  roles        Role[]
  teams        Team[]
  sessions     Session[]
}
```

**Features:**

- MFA support (TOTP, backup codes)
- Email verification
- Account blocking
- Soft delete
- Login tracking

#### Role

```prisma
model Role {
  id             String   @id @default(uuid())
  organisationId String
  name           String
  slug           String
  description    String?
  isDefault      Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organisation Organisation @relation(fields: [organisationId], references: [id])
  permissions  Permission[]
  users        User[]
}
```

**Organization-Scoped:**

- Each organization has its own roles
- Slug unique per organization: `@@unique([organisationId, slug])`

#### OAuth Client

```prisma
model Client {
  id                      String   @id @default(uuid())
  organisationId          String
  name                    String
  clientId                String   @unique
  clientSecret            String?
  clientType              ClientType
  grantTypes              Json
  redirectUris            Json
  scopes                  Json
  requirePkce             Boolean  @default(true)
  requireConsent          Boolean  @default(true)
  tokenEndpointAuthMethod TokenEndpointAuthMethod
  accessTokenLifetime     Int
  refreshTokenLifetime    Int
  idTokenLifetime         Int
  isActive                Boolean  @default(true)
  isFirstParty            Boolean  @default(false)
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  deletedAt               DateTime?

  organisation Organisation @relation(fields: [organisationId], references: [id])
}
```

**Client Types:**

- `confidential` - Server-side apps with client secret
- `public` - SPAs, mobile apps (PKCE required)

### Session Management

#### Session

```prisma
model Session {
  id             String   @id @default(uuid())
  userId         String
  organisationId String
  sessionToken   String   @unique
  ipAddress      String
  userAgent      String
  lastActivityAt DateTime
  expiresAt      DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user         User         @relation(fields: [userId], references: [id])
  organisation Organisation @relation(fields: [organisationId], references: [id])
}
```

**Features:**

- Hashed session tokens (SHA-256)
- Absolute expiration (`expiresAt`)
- Idle timeout (`lastActivityAt`)
- IP and user agent tracking

### OAuth2 Tokens

#### Access Token

```prisma
model Token {
  id             String    @id @default(uuid())
  jti            String    @unique
  clientId       String
  userId         String?
  organisationId String
  tokenType      String    @default("Bearer")
  scopes         Json
  issuedAt       DateTime
  expiresAt      DateTime
  revokedAt      DateTime?
  lastUsedAt     DateTime?
  ipAddress      String?
  userAgent      String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  client       Client        @relation(fields: [clientId], references: [id])
  user         User?         @relation(fields: [userId], references: [id])
  organisation Organisation  @relation(fields: [organisationId], references: [id])
}
```

#### Refresh Token

```prisma
model RefreshToken {
  id             String    @id @default(uuid())
  token          String    @unique
  accessTokenId  String    @unique
  clientId       String
  userId         String
  organisationId String
  scopes         Json
  expiresAt      DateTime
  revokedAt      DateTime?
  familyId       String
  parentTokenId  String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  accessToken  Token          @relation(fields: [accessTokenId], references: [id])
  client       Client         @relation(fields: [clientId], references: [id])
  user         User           @relation(fields: [userId], references: [id])
  organisation Organisation   @relation(fields: [organisationId], references: [id])
  parent       RefreshToken?  @relation("RefreshTokenFamily", fields: [parentTokenId], references: [id])
  children     RefreshToken[] @relation("RefreshTokenFamily")
}
```

**Features:**

- Refresh token rotation
- Token family tracking
- Automatic revocation on reuse detection

### Audit & Security

#### Audit Log

```prisma
model AuditLog {
  id             String        @id @default(uuid())
  organisationId String
  userId         String?
  clientId       String?
  eventType      String
  eventCategory  EventCategory
  action         EventAction
  resourceType   String?
  resourceId     String?
  ipAddress      String
  userAgent      String
  metadata       Json?
  success        Boolean
  errorMessage   String?
  createdAt      DateTime      @default(now())

  organisation Organisation @relation(fields: [organisationId], references: [id])
  user         User?        @relation(fields: [userId], references: [id])
  client       Client?      @relation(fields: [clientId], references: [id])
}
```

**Indexed Fields:**

- `organisationId`, `userId`, `clientId`
- `eventType`, `createdAt`

## Prisma Usage

### Prisma Client

Import the shared instance:

```typescript
import { prisma } from '@/db/prisma';

// Query users
const users = await prisma.user.findMany({
  where: { organisationId: 'org-id' },
  include: {
    roles: {
      include: {
        permissions: true,
      },
    },
  },
});
```

### Common Patterns

#### Organization Scoping

Always scope queries to organization:

```typescript
// Find user within organization
const user = await prisma.user.findFirst({
  where: {
    id: userId,
    organisationId: orgId,
    deletedAt: null,
  },
});

// Create organization-scoped entity
const role = await prisma.role.create({
  data: {
    organisationId: orgId,
    name: 'Manager',
    slug: 'manager',
  },
});
```

#### Soft Deletes

Use `deletedAt` for soft deletes:

```typescript
// Soft delete
await prisma.user.update({
  where: { id: userId },
  data: { deletedAt: new Date() },
});

// Exclude deleted
const activeUsers = await prisma.user.findMany({
  where: {
    organisationId: orgId,
    deletedAt: null,
  },
});
```

#### Transactions

Use transactions for multi-step operations:

```typescript
await prisma.$transaction(async (tx) => {
  // Delete user
  await tx.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });

  // Revoke sessions
  await tx.session.deleteMany({
    where: { userId },
  });

  // Revoke tokens
  await tx.token.updateMany({
    where: { userId },
    data: { revokedAt: new Date() },
  });
});
```

#### Include Relations

```typescript
const user = await prisma.user.findUnique({
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

#### Select Specific Fields

```typescript
const users = await prisma.user.findMany({
  where: { organisationId: orgId },
  select: {
    id: true,
    name: true,
    email: true,
    roles: {
      select: {
        id: true,
        name: true,
      },
    },
  },
});
```

## Migrations

### Development Workflow

#### Create Migration

```bash
# Make schema changes in prisma/schema.prisma
# Generate migration
npx prisma migrate dev --name add_user_phone_field

# This will:
# 1. Create migration file in prisma/migrations/
# 2. Apply migration to database
# 3. Regenerate Prisma Client
```

#### Reset Database

```bash
# Drop database and reapply all migrations
npx prisma migrate reset

# Warning: This deletes all data!
```

#### Generate Prisma Client

```bash
# Regenerate client after schema changes
npx prisma generate
```

### Production Deployment

#### Apply Migrations

```bash
# In production, use migrate deploy
npx prisma migrate deploy

# This applies pending migrations without prompts
```

#### Migration Safety

**Safe Operations:**

- Adding new tables
- Adding nullable columns
- Adding indexes
- Creating new relations

**Unsafe Operations (require care):**

- Dropping columns
- Changing column types
- Adding NOT NULL columns
- Renaming tables/columns

**For Unsafe Operations:**

1. Create multi-step migration:

```sql
-- Step 1: Add new column (nullable)
ALTER TABLE users ADD COLUMN new_field TEXT;

-- Step 2: Backfill data
UPDATE users SET new_field = old_field;

-- Step 3: Make NOT NULL (next migration)
ALTER TABLE users ALTER COLUMN new_field SET NOT NULL;

-- Step 4: Drop old column (next migration)
ALTER TABLE users DROP COLUMN old_field;
```

2. Deploy incrementally
3. Monitor for errors

### Migration Files

Located in `prisma/migrations/`:

```
prisma/migrations/
├── 20240101000000_initial/
│   └── migration.sql
├── 20240102000000_add_mfa/
│   └── migration.sql
└── migration_lock.toml
```

Each migration contains:

- Timestamp prefix
- Descriptive name
- SQL migration file

## Connection Pooling

### Prisma Connection Pool

Prisma manages connections automatically:

```typescript
// Default configuration
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});
```

### Custom Pool Configuration

Via `DATABASE_URL` parameters:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
```

**Parameters:**

- `connection_limit` - Max connections (default: unlimited)
- `pool_timeout` - Connection timeout in seconds (default: 10)

### Production Recommendations

```bash
# Recommended production settings
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30&sslmode=require
```

**Guidelines:**

- Set `connection_limit` based on available connections
- Formula: `(number_of_instances * connection_limit) < max_db_connections`
- Leave headroom for maintenance connections

## Performance Optimization

### Indexes

Schema includes indexes on:

- Foreign keys
- Frequently queried fields
- Unique constraints

```prisma
model User {
  @@index([email])
  @@index([organisationId])
  @@index([deletedAt])
}
```

### Query Optimization

**Use Select for Large Objects:**

```typescript
// Bad: Fetches all fields
const users = await prisma.user.findMany();

// Good: Only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
});
```

**Pagination:**

```typescript
// Cursor-based (recommended)
const users = await prisma.user.findMany({
  take: 20,
  skip: 1,
  cursor: {
    id: lastUserId,
  },
});

// Offset-based
const users = await prisma.user.findMany({
  take: 20,
  skip: (page - 1) * 20,
});
```

**Batch Operations:**

```typescript
// Instead of multiple creates
for (const data of items) {
  await prisma.item.create({ data });
}

// Use createMany
await prisma.item.createMany({
  data: items,
});
```

### Query Logging

Enable in development:

```typescript
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});
```

## Backup & Recovery

### Automated Backups

**Using pg_dump:**

```bash
# Daily backup
pg_dump -U postgres -d cerberus_iam -F c -b -v -f backup_$(date +%Y%m%d).dump

# Restore
pg_restore -U postgres -d cerberus_iam -v backup_20240101.dump
```

**Docker Backup:**

```bash
docker exec cerberus-postgres pg_dump -U postgres cerberus_iam > backup.sql
```

### Continuous Backups

For production, use:

- AWS RDS Automated Backups
- Google Cloud SQL Automated Backups
- PostgreSQL WAL archiving
- Third-party backup solutions

## Troubleshooting

### Connection Refused

**Problem:** Can't connect to database

**Solutions:**

1. Verify PostgreSQL is running:

   ```bash
   pg_isready -h localhost -p 5432
   ```

2. Check connection string format

3. Test with psql:

   ```bash
   psql $DATABASE_URL
   ```

4. Verify network/firewall rules

### Migration Fails

**Problem:** Migration fails during deployment

**Solutions:**

1. Check migration SQL for errors
2. Verify database permissions
3. Check for conflicting data
4. Rollback and fix:
   ```bash
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

### Slow Queries

**Problem:** Database queries taking too long

**Solutions:**

1. Enable query logging
2. Add indexes for frequent queries
3. Use `EXPLAIN ANALYZE`:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
   ```
4. Optimize with `select` instead of full fetches
5. Consider read replicas for read-heavy workloads

### Connection Pool Exhausted

**Problem:** "Can't reach database server"

**Solutions:**

1. Increase `connection_limit`
2. Reduce connection usage (use connection pooling)
3. Check for connection leaks
4. Monitor active connections:
   ```sql
   SELECT count(*) FROM pg_stat_activity WHERE datname = 'cerberus_iam';
   ```

## Next Steps

- [Authentication](/guide/authentication) - User authentication and sessions
- [Multi-Tenancy](/guide/multi-tenancy) - Organization isolation patterns
- [Production Deployment](/guide/production) - Production database setup
