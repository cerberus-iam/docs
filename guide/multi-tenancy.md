# Multi-Tenancy & Organisations

This guide covers the multi-tenant architecture, organisation isolation, many-to-many membership model, and tenant middleware in Cerberus IAM.

## Overview

Cerberus is designed as a **multi-tenant IAM platform** where each organization is completely isolated:

- **Organisation** - The tenant root entity
- **Many-to-Many Membership** - Users can belong to multiple organisations
- **Data Isolation** - Each organisation's data is strictly separated
- **Resource Scoping** - All resources belong to an organisation
- **Shared Infrastructure** - Single database, multiple organisations

::: tip What's New in v2.0
Version 2.0 introduces **many-to-many organisation membership**, allowing users to:

- Belong to multiple organisations with one email
- Have different roles per organisation
- Seamlessly switch between organisations

See the [Migration Guide](/guide/migration-v2) for upgrade details.
:::

## Organisation Model

The `Organisation` is the root tenant entity that owns all tenant-scoped resources:

```prisma
model Organisation {
  id                  String             @id @default(uuid())
  name                String             @unique
  slug                String             @unique
  email               String             @unique
  phone               String?
  website             String?
  ownerId             String?            @unique
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

  owner       User?                @relation("OrganisationOwner")
  users       User[]
  teams       Team[]
  roles       Role[]
  clients     Client[]
  apiKeys     ApiKey[]
  webhooks    WebhookEndpoint[]
  auditLogs   AuditLog[]
  sessions    Session[]
}
```

### Organization Status

```typescript
enum OrganisationStatus {
  trial      // Free trial period
  active     // Paid/active subscription
  suspended  // Payment issue or policy violation
  cancelled  // Cancelled by user
}
```

**Effects by Status:**

- `trial`: Full access with limits (e.g., user count, duration)
- `active`: Full access
- `suspended`: Read-only access, no new logins
- `cancelled`: No access, soft-deleted

### Organization Settings

**Session Configuration:**

```typescript
{
  "sessionLifetime": 3600,      // 1 hour
  "sessionIdleTimeout": 1800    // 30 minutes
}
```

**Security Policies:**

```typescript
{
  "requireMfa": true,
  "allowedMfaMethods": ["totp"],
  "passwordPolicy": {
    "minLength": 12,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireNumber": true,
    "requireSpecial": true,
    "preventReuse": 5,
    "maxAge": 90
  }
}
```

**Token Lifetimes:**

```typescript
{
  "tokenLifetimePolicy": {
    "accessTokenLifetime": 900,      // 15 minutes
    "refreshTokenLifetime": 604800,  // 7 days
    "idTokenLifetime": 3600          // 1 hour
  }
}
```

**Branding:**

```typescript
{
  "branding": {
    "primaryColor": "#007bff",
    "logoUrl": "https://cdn.acme.com/logo.png",
    "faviconUrl": "https://cdn.acme.com/favicon.ico"
  }
}
```

## Many-to-Many Organisation Membership

::: info New in v2.0
Cerberus now supports **many-to-many relationships** between users and organisations via the `OrganisationMember` join table.
:::

### Membership Model

Users can belong to multiple organisations, with independent roles and teams in each:

```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique  // Globally unique
  name        String
  memberships OrganisationMember[]
}

model OrganisationMember {
  id             String   @id @default(uuid())
  userId         String
  organisationId String
  joinedAt       DateTime @default(now())
  leftAt         DateTime?  // null = active, set = left org

  user         User         @relation(fields: [userId], references: [id])
  organisation Organisation @relation(fields: [organisationId], references: [id])
  roles        Role[]       // Per-membership roles
  teams        Team[]       // Per-membership teams

  @@unique([userId, organisationId])
}
```

### Key Benefits

**1. Single User Identity**

- One email address = one user account across all organisations
- Users can belong to multiple organisations with different roles
- Seamless SSO across all organisations

**2. Per-Organisation Roles**

```typescript
// Same user, different roles in different orgs
{
  "id": "user-123",
  "email": "john@example.com",
  "memberships": [
    {
      "organisationId": "acme-corp",
      "roles": [{ "name": "Admin", "slug": "admin" }],
      "joinedAt": "2024-01-01T00:00:00Z"
    },
    {
      "organisationId": "widgets-inc",
      "roles": [{ "name": "User", "slug": "user" }],
      "joinedAt": "2024-06-15T00:00:00Z"
    }
  ]
}
```

**3. Flexible User Management**

- Invite existing users to your organisation (no new account needed)
- Remove users from organisation without deleting their account
- Track join/leave dates for audit trails

### X-Org-Domain Header

Since users can belong to multiple organisations, **all authenticated requests must include the `X-Org-Domain` header** to specify which organisation context the request is for:

```bash
curl https://api.example.com/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Org-Domain: acme-corp"
```

The `tenantMiddleware` reads this header and validates the user is a member of that organisation.

**Required for:**

- All `/v1/auth/*` endpoints (login, logout, etc.)
- All `/v1/me/*` endpoints (profile, sessions)
- All `/v1/admin/*` endpoints
- OAuth2 authorize/consent flows

**Not required for:**

- OAuth2 `/token` endpoint with `client_credentials` grant (machine-to-machine)
- Public endpoints (e.g., `/health`, `/v1/.well-known/*`)

## Tenant Middleware

### Tenant Context

The tenant middleware extracts organization context from the request:

```typescript
import { tenantMiddleware } from '@/middleware/tenant';

router.use('/v1/admin', tenantMiddleware);

// Now req.tenant is available
router.get('/v1/admin/users', (req, res) => {
  const { tenant } = req;
  console.log(tenant.id); // Organization ID
  console.log(tenant.slug); // Organization slug
  console.log(tenant.organisation); // Full organisation record
});
```

### How It Works

```typescript
export async function tenantMiddleware(req, res, next) {
  // Extract organization slug from header
  const orgSlug = req.headers['X-Org-Domain'];

  if (!orgSlug) {
    return badRequest('Missing X-Org-Domain header');
  }

  // Load organization
  const organisation = await prisma.organisation.findUnique({
    where: { slug: orgSlug, deletedAt: null },
  });

  if (!organisation) {
    return notFound(`Organisation '${orgSlug}' not found`);
  }

  // Attach to request
  req.tenant = {
    id: organisation.id,
    slug: organisation.slug,
    organisation,
  };

  next();
}
```

### TypeScript Extensions

```typescript
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        slug: string;
        organisation: Organisation;
      };
    }
  }
}
```

## Data Isolation Patterns

### Always Scope Queries

**Rule:** Every query must filter by `organisationId`:

```typescript
// Bad: Global query (security vulnerability!)
const users = await prisma.user.findMany();

// Good: Organization-scoped
const users = await prisma.user.findMany({
  where: { organisationId: req.tenant.id },
});
```

### Create with Organization

```typescript
// Always set organisationId on create
const user = await prisma.user.create({
  data: {
    organisationId: req.tenant.id,
    email: 'user@example.com',
    name: 'John Doe',
    // ... other fields
  },
});
```

### Update with Verification

```typescript
// Verify resource belongs to organization before update
const user = await prisma.user.findFirst({
  where: {
    id: userId,
    organisationId: req.tenant.id, // Important!
  },
});

if (!user) {
  return notFound('User not found');
}

const updated = await prisma.user.update({
  where: { id: user.id },
  data: { name: 'New Name' },
});
```

### Delete with Verification

```typescript
// Verify before delete
const client = await prisma.client.findFirst({
  where: {
    id: clientId,
    organisationId: req.tenant.id,
  },
});

if (!client) {
  return notFound('Client not found');
}

await prisma.client.delete({
  where: { id: client.id },
});
```

## Multi-Tenant Routes

### Admin Routes (Tenant-Scoped)

```typescript
// Require tenant context for admin routes
router.use(
  '/v1/admin',
  tenantMiddleware, // Extract tenant
  authenticateSession, // Verify authentication
);

router.get('/v1/admin/users', async (req, res) => {
  // req.tenant automatically available
  const users = await prisma.user.findMany({
    where: { organisationId: req.tenant.id },
  });
  res.json(users);
});
```

### OAuth2 Routes (Client Determines Tenant)

```typescript
// OAuth2 routes don't use tenant middleware
// Organization determined by client

router.post('/oauth2/token', async (req, res) => {
  const { client_id } = req.body;

  const client = await prisma.client.findUnique({
    where: { clientId: client_id },
    include: { organisation: true },
  });

  // Tenant context from client
  const organisationId = client.organisationId;
});
```

## Cross-Organization Operations

### Allowed Cases

Some operations span organizations (with care):

**1. System Administration**

```typescript
// Super admin managing all organizations
router.get('/system/organisations', authenticateSuperAdmin, async (req, res) => {
  const orgs = await prisma.organisation.findMany();
  res.json(orgs);
});
```

**2. User Invitation (Email Lookup)**

```typescript
// Check if user exists in ANY organization
const existingUser = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: { organisation: true },
});

if (existingUser) {
  // User already exists in another organization
  // Decide: allow multi-org membership or reject
}
```

**3. Global Resources (Permissions, Scopes)**

```typescript
// Permissions are global, not organization-scoped
const permissions = await prisma.permission.findMany();
```

### Forbidden Cases

Never allow these without explicit authorization:

**1. Cross-Organization Data Access**

```typescript
// Bad: User from Org A accessing Org B's data
const user = await prisma.user.findFirst({
  where: {
    id: userId,
    // Missing: organisationId check!
  },
});
```

**2. Cross-Organization Role Assignment**

```typescript
// Bad: Assigning Org A's role to Org B's user
// Always verify role.organisationId === user.organisationId
```

## Organization Lifecycle

### Create Organization

```typescript
// POST /v1/organisations
{
  "name": "Acme Corporation",
  "slug": "acme",
  "email": "admin@acme.com",
  "ownerEmail": "owner@acme.com"
}
```

**Process:**

1. Create organization
2. Create owner user
3. Assign owner to organization
4. Create default roles
5. Send welcome email

### Update Organization

```typescript
// PATCH /v1/admin/organisation
{
  "name": "New Name",
  "sessionLifetime": 7200,
  "requireMfa": true
}
```

**Requires:** `organisation:manage` permission

### Suspend Organization

```typescript
// PATCH /v1/system/organisations/:id/suspend
{
  "reason": "Payment failure"
}
```

**Effects:**

- Set `status = 'suspended'`
- Invalidate all sessions
- Block new logins
- Allow read-only admin access

### Delete Organization (Soft)

```typescript
// DELETE /v1/system/organisations/:id
```

**Process:**

1. Set `deletedAt = now()`
2. Set `status = 'cancelled'`
3. Revoke all sessions
4. Revoke all tokens
5. Schedule data export (GDPR compliance)
6. Schedule permanent deletion (after retention period)

## Multi-Tenant API Design

### Request Headers

```http
GET /v1/admin/users HTTP/1.1
Host: api.cerberus.local
X-Org-Domain: acme
Cookie: cerb_sid=...
```

**Headers:**

- `X-Org-Domain` - Organization slug (required for admin routes)
- `Cookie` - Session cookie (authentication)

### Response Format

Include organization context when helpful:

```json
{
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "organisationId": "org_acme"
  },
  "meta": {
    "organisation": {
      "id": "org_acme",
      "name": "Acme Corporation",
      "slug": "acme"
    }
  }
}
```

### Error Responses

```json
{
  "type": "https://api.cerberus-iam.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Organisation 'invalid-slug' not found"
}
```

## Database Schema Patterns

### Tenant-Scoped Tables

```prisma
model User {
  id             String @id
  organisationId String  // Always include!

  organisation Organisation @relation(fields: [organisationId])

  @@index([organisationId])  // Always index!
  @@unique([organisationId, email])  // Unique per org
}
```

**Characteristics:**

- `organisationId` foreign key
- Index on `organisationId`
- Unique constraints scoped to organization

### Global Tables

```prisma
model Permission {
  id   String @id
  slug String @unique

  // No organisationId
}
```

**Examples:**

- Permissions
- Scopes
- JWKs (signing keys)
- System configuration

## Performance Optimization

### Database Indexes

Always index `organisationId`:

```prisma
model User {
  @@index([organisationId])
  @@index([organisationId, email])
  @@index([organisationId, deletedAt])
}
```

### Query Patterns

**Use Composite Indexes:**

```typescript
// Good: Uses composite index
await prisma.user.findFirst({
  where: {
    organisationId: orgId,
    email: 'user@example.com',
  },
});
```

**Avoid N+1 Queries:**

```typescript
// Bad: N+1 query
for (const user of users) {
  user.organisation = await prisma.organisation.findUnique({
    where: { id: user.organisationId },
  });
}

// Good: Include in original query
const users = await prisma.user.findMany({
  where: { organisationId: orgId },
  include: { organisation: true },
});
```

## Security Considerations

### 1. Always Validate Tenant Context

```typescript
// Verify session org matches tenant org
if (req.user.organisationId !== req.tenant.id) {
  return forbidden('Organization mismatch');
}
```

### 2. Prevent Tenant Enumeration

```typescript
// Bad: Reveals org exists
if (!organisation) {
  return notFound('Organisation not found');
}

// Good: Same response for invalid and unauthorized
return notFound('Resource not found');
```

### 3. Rate Limit Per Organization

```typescript
// Key by organization + IP
const rateLimitKey = `${req.tenant.id}:${req.ip}`;
```

### 4. Audit Cross-Tenant Operations

```typescript
// Log when org context changes
if (previousOrgId !== currentOrgId) {
  await auditLog.create({
    eventType: 'organisation.switched',
    metadata: { from: previousOrgId, to: currentOrgId },
  });
}
```

## Troubleshooting

### Missing X-Org-Domain Header

**Error:** "Missing X-Org-Domain header"

**Solutions:**

1. Add header to all admin API requests
2. Configure API client to include header
3. Use tenant middleware only on scoped routes

### Wrong Organization Data

**Problem:** Seeing another organization's data

**Solutions:**

1. Verify `organisationId` filter in all queries
2. Check tenant middleware is applied
3. Review query logs for missing filters

### Performance Issues

**Problem:** Slow queries in multi-tenant setup

**Solutions:**

1. Add indexes on `organisationId`
2. Use composite indexes for common queries
3. Consider partitioning large tables
4. Monitor slow query log

## Next Steps

- [Authorization](/guide/authorization) - Organization-scoped permissions
- [Database](/guide/database) - Multi-tenant schema patterns
- [Production](/guide/production) - Multi-tenant deployment
