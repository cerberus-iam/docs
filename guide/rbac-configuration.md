# RBAC Configuration

This guide explains Cerberus IAM's configuration-driven Role-Based Access Control (RBAC) system.

## Overview

Cerberus uses a **configuration-driven RBAC system** where all roles and permissions are defined in a single JSON configuration file. This provides:

- **Single Source of Truth** - All RBAC rules in one place
- **Type Safety** - TypeScript enums generated from configuration
- **Automatic Provisioning** - Roles auto-created for every new organization
- **Version Control** - RBAC changes tracked in git
- **Zero Downtime** - Changes synced on application startup

## Configuration File

All roles and permissions are defined in `config/roles-permissions-mapping.json`:

```json
{
  "Owner": {
    "users": ["create", "read", "update", "delete"],
    "organisations": ["create", "read", "update", "delete"],
    "roles": ["read"],
    "permissions": ["read"],
    "teams": ["create", "read", "update", "delete"],
    "invitations": ["create", "read", "update", "delete"]
  },
  "Admin": {
    "users": ["create", "read", "update", "delete"],
    "organisations": ["create", "read", "update", "delete"],
    "roles": ["create", "read", "update", "delete"],
    "permissions": ["create", "read", "update", "delete"],
    "teams": ["create", "read", "update", "delete"],
    "invitations": ["create", "read", "update", "delete"]
  },
  "Manager": {
    "users": ["create", "read", "update"],
    "organisations": ["read"],
    "roles": ["read"],
    "permissions": ["read"],
    "teams": ["read", "update"],
    "invitations": ["create", "read", "update", "delete"]
  },
  "Staff": {
    "users": ["create", "read"],
    "organisations": ["read"],
    "roles": ["read"],
    "permissions": ["read"],
    "teams": ["read"],
    "invitations": ["read"]
  }
}
```

### Structure

```json
{
  "RoleName": {
    "resource": ["action1", "action2", "..."]
  }
}
```

- **RoleName**: The display name of the role (e.g., "Owner", "Admin")
- **resource**: The resource type (e.g., "users", "teams", "organisations")
- **actions**: Array of actions (e.g., "create", "read", "update", "delete")

## Permission Naming Convention

Permissions are automatically generated as `resource:action`:

| Configuration               | Generated Permission |
| --------------------------- | -------------------- |
| `"users": ["read"]`         | `users:read`         |
| `"users": ["create"]`       | `users:create`       |
| `"teams": ["update"]`       | `teams:update`       |
| `"organisations": ["read"]` | `organisations:read` |

**Examples:**

```
users:create
users:read
users:update
users:delete
roles:read
teams:update
invitations:delete
```

## Default Roles

### Owner

**Purpose:** Organization owner with limited administrative access

**Permissions:**

- Full access: users, organisations, teams, invitations
- Read-only: roles, permissions

**Use Case:** Primary account holder who manages the organization but doesn't need to modify RBAC configuration

```json
{
  "users": ["create", "read", "update", "delete"],
  "organisations": ["create", "read", "update", "delete"],
  "roles": ["read"],
  "permissions": ["read"],
  "teams": ["create", "read", "update", "delete"],
  "invitations": ["create", "read", "update", "delete"]
}
```

### Admin

**Purpose:** Full administrative access to all resources

**Permissions:**

- Full access to all resources

**Use Case:** System administrators who need complete control

```json
{
  "users": ["create", "read", "update", "delete"],
  "organisations": ["create", "read", "update", "delete"],
  "roles": ["create", "read", "update", "delete"],
  "permissions": ["create", "read", "update", "delete"],
  "teams": ["create", "read", "update", "delete"],
  "invitations": ["create", "read", "update", "delete"]
}
```

### Manager

**Purpose:** User and team management with read-only configuration access

**Permissions:**

- Can create/update users (but not delete)
- Can manage teams and invitations
- Read-only access to roles, permissions, and organizations

**Use Case:** Team leads and HR managers

```json
{
  "users": ["create", "read", "update"],
  "organisations": ["read"],
  "roles": ["read"],
  "permissions": ["read"],
  "teams": ["read", "update"],
  "invitations": ["create", "read", "update", "delete"]
}
```

### Staff

**Purpose:** Default role with read-only access

**Permissions:**

- Read-only access to most resources
- Can create and view users (for self-service)

**Use Case:** Regular team members (default role for new users)

```json
{
  "users": ["create", "read"],
  "organisations": ["read"],
  "roles": ["read"],
  "permissions": ["read"],
  "teams": ["read"],
  "invitations": ["read"]
}
```

**Note:** Staff is marked as the default role. New users are automatically assigned this role upon registration or invitation acceptance.

## How It Works

### 1. Application Startup

When the server starts, permissions are automatically synced from the configuration:

```typescript
// src/server.ts
import { syncPermissionsOnStartup } from './startup/sync-permissions';

syncPermissionsOnStartup().then(() => {
  server.listen(port);
});
```

This ensures:

- All permissions from config exist in the database
- Permission names and descriptions are up-to-date
- New permissions are automatically added

### 2. Organization Registration

When a new organization is created, all default roles are automatically provisioned:

```typescript
// src/routes/v1/auth/register.ts
import { createDefaultRolesForOrganisation } from './services/roles-permissions-sync.service';

// After creating organization
await createDefaultRolesForOrganisation(org.id);
```

This creates:

1. **Owner** role with configured permissions
2. **Admin** role with configured permissions
3. **Manager** role with configured permissions
4. **Staff** role with configured permissions (marked as default)

### 3. Permission Checking

Permissions are checked using the standard RBAC middleware:

```typescript
import { requirePerm } from '@/middleware/rbac';

router.delete(
  '/admin/users/:id',
  authenticateSession,
  requirePerm('users:delete'), // Generated from config
  deleteUserHandler,
);
```

## Type Safety

The configuration automatically generates TypeScript types and enums:

```typescript
import {
  ROLE_NAMES,
  PERMISSION_NAMES,
  RoleName,
  PermissionName,
  isValidRoleName,
  isValidPermissionName,
} from '@/config/roles-permissions';

// Auto-complete for role names
const roles: RoleName[] = ROLE_NAMES;
// ['Owner', 'Admin', 'Manager', 'Staff']

// Auto-complete for permission names
const perms: PermissionName[] = PERMISSION_NAMES;
// ['users:create', 'users:read', 'users:update', ...]

// Type-safe validation
if (isValidRoleName('Owner')) {
  // TypeScript knows this is a valid role
}
```

### Utility Functions

```typescript
import {
  getPermissionsForRole,
  getRoleSlug,
  roleHasPermission,
  getAllRolesWithPermissions,
} from '@/config/roles-permissions';

// Get all permissions for a role
const ownerPerms = getPermissionsForRole('Owner');
// ['users:create', 'users:read', ...]

// Get role slug (for database queries)
const slug = getRoleSlug('Owner'); // 'owner'

// Check if role has specific permission
if (roleHasPermission('Manager', 'users:delete')) {
  // Manager can delete users
}

// Get all roles with their permissions
const all = getAllRolesWithPermissions();
// { Owner: ['users:create', ...], Admin: [...], ... }
```

## Adding a New Role

To add a new role, edit `config/roles-permissions-mapping.json`:

```json
{
  "Owner": { ... },
  "Admin": { ... },
  "Manager": { ... },
  "Staff": { ... },
  "Developer": {
    "users": ["read"],
    "clients": ["create", "read", "update"],
    "api_keys": ["create", "read", "revoke"]
  }
}
```

**Steps:**

1. Add role to configuration file
2. Restart the application (permissions auto-sync)
3. New organizations will automatically get the new role
4. Existing organizations can have the role added manually or via migration

## Modifying an Existing Role

To modify a role's permissions, edit the configuration:

```json
{
  "Manager": {
    "users": ["create", "read", "update", "delete"], // Added delete
    "organisations": ["read"],
    "roles": ["read"],
    "permissions": ["read"],
    "teams": ["read", "update"],
    "invitations": ["create", "read", "update", "delete"]
  }
}
```

**Steps:**

1. Update the configuration file
2. Restart the application
3. For **new organizations**: Roles are created with new permissions
4. For **existing organizations**: Run a sync script or migration

### Syncing Existing Organizations

To update roles for existing organizations:

```typescript
import { syncAllRolesForOrganisation } from '@/services/roles-permissions-sync.service';

// Sync all roles for a specific organization
await syncAllRolesForOrganisation(organisationId);
```

Or create a migration script:

```typescript
// scripts/sync-all-org-roles.ts
import { prisma } from '../src/db/prisma';
import { syncAllRolesForOrganisation } from '../src/services/roles-permissions-sync.service';

async function main() {
  const orgs = await prisma.organisation.findMany();

  for (const org of orgs) {
    console.log(`Syncing roles for ${org.name}...`);
    await syncAllRolesForOrganisation(org.id);
  }

  console.log('Done!');
}

main();
```

## Adding a New Resource

To add permissions for a new resource:

```json
{
  "Admin": {
    "users": ["create", "read", "update", "delete"],
    "webhooks": ["create", "read", "update", "delete"],
    "api_keys": ["create", "read", "revoke"]
  }
}
```

This automatically generates:

- `webhooks:create`
- `webhooks:read`
- `webhooks:update`
- `webhooks:delete`
- `api_keys:create`
- `api_keys:read`
- `api_keys:revoke`

## Custom Actions

You can use any action name (not just CRUD):

```json
{
  "Admin": {
    "users": ["create", "read", "update", "delete", "impersonate"],
    "api_keys": ["create", "read", "revoke"],
    "audit_logs": ["read", "export"]
  }
}
```

Generates:

- `users:impersonate`
- `api_keys:revoke`
- `audit_logs:export`

## Database Seeding

The seed script automatically uses the configuration:

```typescript
// prisma/seed.ts
import { syncPermissionsToDatabase } from '../src/services/roles-permissions-sync.service';
import { createDefaultRolesForOrganisation } from '../src/services/roles-permissions-sync.service';

// Sync permissions from config
await syncPermissionsToDatabase();

// Create demo organization
const demoOrg = await prisma.organisation.create({ ... });

// Create all default roles from config
await createDefaultRolesForOrganisation(demoOrg.id);
```

## Best Practices

### 1. Use Descriptive Role Names

```json
// Good
"Developer"
"QA Engineer"
"Customer Support"

// Avoid
"Role1"
"R2"
"temp"
```

### 2. Follow Principle of Least Privilege

```json
// Good: Specific permissions
"Staff": {
  "users": ["read"],
  "teams": ["read"]
}

// Avoid: Too permissive
"Staff": {
  "users": ["create", "read", "update", "delete"]
}
```

### 3. Use Consistent Action Names

```json
// Good: Consistent CRUD
"create", "read", "update", "delete"

// Avoid: Mixed naming
"add", "view", "modify", "remove"
```

### 4. Document Role Purposes

Add comments (though JSON doesn't support them, use documentation):

```markdown
## Developer Role

Purpose: Access to API clients and keys for development
Resources: clients (full), api_keys (full), users (read-only)
```

### 5. Version Control Changes

Always commit configuration changes with descriptive messages:

```bash
git commit -m "feat: add Developer role with API management permissions"
```

## Migration Strategy

When deploying RBAC changes to production:

1. **Test in Development**
   - Update configuration
   - Test with seed data
   - Verify permissions work correctly

2. **Deploy to Staging**
   - Deploy code changes
   - Run any required migrations
   - Test with production-like data

3. **Deploy to Production**
   - Deploy configuration changes
   - Application auto-syncs permissions on startup
   - Optionally run sync script for existing organizations

4. **Verify**
   - Check audit logs for permission changes
   - Test affected user roles
   - Monitor for permission errors

## Troubleshooting

### Permissions Not Syncing

**Problem:** New permissions not appearing in database

**Solution:**

```bash
# Check application logs
# Look for: "Syncing permissions from configuration..."

# Manually trigger sync
npm run sync-permissions
```

### Role Not Created for New Organization

**Problem:** New organization missing default roles

**Solution:**

```typescript
// Manually create roles
await createDefaultRolesForOrganisation(organisationId);
```

### Type Errors After Configuration Change

**Problem:** TypeScript errors after modifying roles/permissions

**Solution:**

```bash
# Rebuild TypeScript
npm run build

# The types are generated automatically from the JSON config
```

### Permission Check Failing

**Problem:** User has role but permission check fails

**Solutions:**

1. Verify permission name matches exactly (case-sensitive)
2. Check role has the required permission in configuration
3. Ensure permissions were synced to database
4. Restart server to refresh permission cache

## Next Steps

- [Authorization Guide](/guide/authorization) - Using permissions in code
- [Multi-Tenancy](/guide/multi-tenancy) - Organization isolation
- [API Reference](/api/admin/roles/list) - Role management endpoints
