# Authorization

This guide covers the Role-Based Access Control (RBAC) system, permissions, roles, and teams in Cerberus IAM.

## Overview

Cerberus implements a flexible RBAC system with:

- **Permissions** - Granular capabilities (e.g., `users:read`, `clients:write`)
- **Roles** - Collections of permissions
- **Teams** - User groups for organizational structure
- **Organization-scoped** - Roles and teams are tenant-specific

## Permission System

### Permission Structure

Permissions follow a `resource:action` naming convention:

```
<resource>:<action>
```

**Examples:**

```
users:read
users:write
users:delete
clients:manage
roles:assign
audit_logs:read
*                  # Wildcard (super admin)
```

### Permission Model

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

**Global Permissions:**

- Permissions are global (not organization-scoped)
- Shared across all organizations
- Managed by system administrators

### Common Permissions

| Permission            | Description                   |
| --------------------- | ----------------------------- |
| `users:read`          | View users                    |
| `users:write`         | Create/update users           |
| `users:delete`        | Delete users                  |
| `roles:read`          | View roles                    |
| `roles:write`         | Create/update roles           |
| `roles:assign`        | Assign roles to users         |
| `permissions:manage`  | Manage permissions            |
| `clients:read`        | View OAuth clients            |
| `clients:write`       | Create/update clients         |
| `clients:delete`      | Delete clients                |
| `api_keys:read`       | View API keys                 |
| `api_keys:write`      | Create API keys               |
| `api_keys:revoke`     | Revoke API keys               |
| `webhooks:manage`     | Manage webhooks               |
| `audit_logs:read`     | View audit logs               |
| `organisation:manage` | Manage organization settings  |
| `*`                   | All permissions (super admin) |

### Wildcard Permissions

**Resource Wildcard:**

```
users:*    # All user actions (read, write, delete)
clients:*  # All client actions
```

**Super Admin:**

```
*          # All permissions on all resources
```

### Permission Matching

The RBAC middleware supports hierarchical matching:

```typescript
// User has: users:*
requirePerm('users:read'); // ✓ Allowed (wildcard)
requirePerm('users:write'); // ✓ Allowed (wildcard)
requirePerm('users:delete'); // ✓ Allowed (wildcard)
requirePerm('clients:read'); // ✗ Denied (different resource)

// User has: *
requirePerm('users:read'); // ✓ Allowed (super admin)
requirePerm('anything'); // ✓ Allowed (super admin)
```

## Roles

### Role Model

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

  @@unique([organisationId, slug])
}
```

**Organization-Scoped:**

- Each organization has its own roles
- Role slugs unique per organization
- Default roles automatically assigned to new users

### Create Role

```typescript
// POST /v1/admin/roles
{
  "name": "User Manager",
  "slug": "user-manager",
  "description": "Can manage users but not organization settings",
  "permissionIds": [
    "perm_users_read",
    "perm_users_write"
  ],
  "isDefault": false
}
```

**Response:**

```json
{
  "id": "role_abc123",
  "organisationId": "org_xyz789",
  "name": "User Manager",
  "slug": "user-manager",
  "description": "Can manage users but not organization settings",
  "isDefault": false,
  "permissions": [
    {
      "id": "perm_users_read",
      "slug": "users:read",
      "name": "View Users"
    },
    {
      "id": "perm_users_write",
      "slug": "users:write",
      "name": "Create/Update Users"
    }
  ],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Assign Role to User

```typescript
// POST /v1/admin/users/{userId}/roles
{
  "roleId": "role_abc123"
}
```

**Alternative (Batch):**

```typescript
// PATCH /v1/admin/users/{userId}
{
  "roleIds": ["role_abc123", "role_def456"]
}
```

### Common Role Patterns

#### Super Administrator

```typescript
{
  "name": "Super Administrator",
  "slug": "super-admin",
  "permissions": ["*"]  // Wildcard permission
}
```

#### Organization Administrator

```typescript
{
  "name": "Administrator",
  "slug": "admin",
  "permissions": [
    "users:*",
    "roles:*",
    "clients:*",
    "api_keys:*",
    "webhooks:*",
    "audit_logs:read",
    "organisation:manage"
  ]
}
```

#### User Manager

```typescript
{
  "name": "User Manager",
  "slug": "user-manager",
  "permissions": [
    "users:read",
    "users:write",
    "roles:read",
    "roles:assign"
  ]
}
```

#### Read-Only User

```typescript
{
  "name": "Viewer",
  "slug": "viewer",
  "permissions": [
    "users:read",
    "roles:read",
    "clients:read",
    "audit_logs:read"
  ]
}
```

#### Developer

```typescript
{
  "name": "Developer",
  "slug": "developer",
  "permissions": [
    "clients:read",
    "clients:write",
    "api_keys:read",
    "api_keys:write"
  ]
}
```

### Default Roles

Set `isDefault: true` to automatically assign role to new users:

```typescript
{
  "name": "Member",
  "slug": "member",
  "isDefault": true,
  "permissions": ["users:read"]
}
```

**Use Cases:**

- New user registration
- Invitation acceptance
- SSO/SAML user provisioning

## Permission Checking Middleware

### Require Permission

```typescript
import { requirePerm } from '@/middleware/rbac';

// Single permission
router.delete(
  '/admin/users/:id',
  authenticateSession,
  requirePerm('users:delete'),
  deleteUserHandler,
);

// Multiple endpoints with same permission
router.get('/admin/users', requirePerm('users:read'), listUsers);
router.get('/admin/users/:id', requirePerm('users:read'), getUser);
```

### How It Works

```typescript
export function requirePerm(permission: string) {
  return async (req, res, next) => {
    if (!req.user) {
      return unauthorized('Authentication required');
    }

    const permissions = await getPermissionsForRequest(req, req.user.id);

    // Check for super admin wildcard
    if (permissions.has('*')) {
      return next();
    }

    // Check for exact permission
    if (permissions.has(permission)) {
      return next();
    }

    // Check for resource wildcard (e.g., users:* matches users:read)
    const [resource] = permission.split(':');
    if (permissions.has(`${resource}:*`)) {
      return next();
    }

    return forbidden(`You do not have the required permission: ${permission}`);
  };
}
```

### Permission Caching

Permissions are cached per request to avoid repeated database queries:

```typescript
// First check - loads from database
await requirePerm('users:read')(req, res, next);

// Subsequent checks - uses cache
await requirePerm('users:write')(req, res, next);
```

**Cache Scope:**

- Per-request only (not shared across requests)
- Cleared after response sent
- Keyed by user ID

## Teams

### Team Model

```prisma
model Team {
  id             String   @id @default(uuid())
  organisationId String
  name           String
  slug           String
  description    String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  organisation Organisation @relation(fields: [organisationId], references: [id])
  members      User[]

  @@unique([organisationId, slug])
}
```

**Purpose:**

- Organize users into groups
- Filter/scope data by team
- Report on team activity
- Future: Team-specific permissions

### Create Team

```typescript
// POST /v1/admin/teams
{
  "name": "Engineering",
  "slug": "engineering",
  "description": "Software engineering team"
}
```

### Add Users to Team

```typescript
// POST /v1/admin/teams/{teamId}/members
{
  "userIds": ["user_abc123", "user_def456"]
}
```

### Team Use Cases

**1. Data Scoping**

```typescript
// Filter users by team
const teamUsers = await prisma.user.findMany({
  where: {
    organisationId: orgId,
    teams: {
      some: {
        id: teamId,
      },
    },
  },
});
```

**2. Audit Filtering**

```typescript
// Audit logs for team members
const logs = await prisma.auditLog.findMany({
  where: {
    organisationId: orgId,
    user: {
      teams: {
        some: {
          id: teamId,
        },
      },
    },
  },
});
```

**3. Invitations**

```typescript
// Invite user to organization and team
{
  "email": "newuser@example.com",
  "roleId": "role_member",
  "teamIds": ["team_engineering"]
}
```

## Authorization Patterns

### Route-Level Authorization

```typescript
// Protect entire route
router.use('/admin/organisation', authenticateSession, requirePerm('organisation:manage'));

// All routes under /admin/organisation now require organisation:manage
router.get('/admin/organisation/settings', getSettings);
router.patch('/admin/organisation/settings', updateSettings);
```

### Resource-Level Authorization

```typescript
// Check ownership before allowing action
router.delete('/v1/me/sessions/:id', authenticateSession, async (req, res) => {
  const session = await prisma.session.findUnique({
    where: { id: req.params.id },
  });

  // Ensure user owns the session
  if (session.userId !== req.user.id) {
    return forbidden("Cannot delete another user's session");
  }

  await prisma.session.delete({ where: { id: session.id } });
  res.json({ success: true });
});
```

### Organization-Scoped Authorization

```typescript
// Ensure user can only access their organization's data
router.get('/admin/users/:id', authenticateSession, requirePerm('users:read'), async (req, res) => {
  const user = await prisma.user.findFirst({
    where: {
      id: req.params.id,
      organisationId: req.user.organisationId, // Scope to org
    },
  });

  if (!user) {
    return notFound('User not found');
  }

  res.json(user);
});
```

### Programmatic Permission Checks

```typescript
import { getEffectivePermissions } from '@/middleware/rbac';

// Get all user permissions
const permissions = await getEffectivePermissions(userId);
// ['users:read', 'users:write', 'clients:read']

// Check permission programmatically
if (permissions.includes('users:delete')) {
  // User can delete
}
```

## Multi-Level Authorization

### 1. Authentication (Who are you?)

```typescript
authenticateSession; // Must be logged in
```

### 2. Organization Context (Which tenant?)

```typescript
tenantMiddleware; // X-Org-Domain header
```

### 3. Permission Check (What can you do?)

```typescript
requirePerm('users:write'); // Must have permission
```

### 4. Resource Ownership (Is it yours?)

```typescript
// Custom check in handler
if (resource.userId !== req.user.id) {
  return forbidden();
}
```

### Combined Example

```typescript
router.patch(
  '/admin/users/:id',
  // 1. Must be authenticated
  authenticateSession,

  // 2. Must have permission
  requirePerm('users:write'),

  async (req, res) => {
    // 3. Scope to organization
    const user = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        organisationId: req.user.organisationId,
      },
    });

    if (!user) {
      return notFound('User not found');
    }

    // 4. Additional business logic checks
    if (user.id === req.user.organisationId.ownerId && !req.user.permissions.includes('*')) {
      return forbidden('Cannot modify organization owner');
    }

    // Update user
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: req.body,
    });

    res.json(updated);
  },
);
```

## Best Practices

### 1. Principle of Least Privilege

Grant minimum permissions necessary:

```typescript
// Bad: Giving admin to everyone
{ "permissions": ["*"] }

// Good: Specific permissions
{ "permissions": ["users:read", "clients:read"] }
```

### 2. Use Roles, Not Direct Permissions

```typescript
// Bad: Assigning permissions directly to users
user.permissions = ['users:read', 'users:write'];

// Good: Assign roles
user.roles = [userManagerRole];
```

### 3. Scope to Organization

Always filter by `organisationId`:

```typescript
// Bad: Global query
await prisma.user.findMany();

// Good: Organization-scoped
await prisma.user.findMany({
  where: { organisationId: req.user.organisationId },
});
```

### 4. Check Before Mutation

```typescript
// Bad: Delete without checking
await prisma.user.delete({ where: { id: userId } });

// Good: Verify access first
const user = await prisma.user.findFirst({
  where: { id: userId, organisationId: orgId },
});
if (!user) return notFound();

await prisma.user.delete({ where: { id: user.id } });
```

### 5. Audit Permission Changes

```typescript
// Log when permissions/roles change
await auditLog.create({
  eventType: 'role.assigned',
  userId: actorId,
  resourceId: targetUserId,
  metadata: { roleId, roleName },
});
```

## Troubleshooting

### Permission Denied Despite Having Role

**Problem:** User has role but permission check fails

**Solutions:**

1. Verify role has the required permission
2. Check permission slug matches exactly
3. Clear permission cache (restart server)
4. Verify user-role assignment in database

### Permissions Not Loading

**Problem:** `req.user.permissions` is undefined

**Solutions:**

1. Ensure authentication middleware runs first
2. Check session/token includes role data
3. Verify permissions loaded in include:
   ```typescript
   include: {
     roles: {
       include: {
         permissions: true;
       }
     }
   }
   ```

### Organization Boundary Violation

**Problem:** User accessing another organization's data

**Solutions:**

1. Always filter by `organisationId`
2. Use tenant middleware for API routes
3. Validate `req.tenant.id === req.user.organisationId`
4. Add database constraints

## Next Steps

- [Multi-Tenancy](/guide/multi-tenancy) - Organization isolation
- [Authentication](/guide/authentication) - User authentication
- [Audit Logging](/guide/monitoring#audit-logs) - Track permission usage
