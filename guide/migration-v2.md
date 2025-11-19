# Migration Guide: v2.0 Many-to-Many Organisations

This guide helps you migrate from Cerberus IAM v1.x (single organisation per user) to v2.0 (many-to-many organisation membership).

## Overview

Version 2.0 introduces a **fundamental architectural change** to support users belonging to multiple organisations. This enables:

- ✅ Single user account across all your applications
- ✅ Different roles and permissions per organisation
- ✅ Seamless SSO across all organisations a user belongs to
- ✅ True multi-tenancy for SaaS applications

## Breaking Changes

### 1. Organisation Context Required for Authentication

**Authentication requests** must now provide organisation context via **one of two methods**:

#### Method 1: OAuth Flows (Recommended) - Using `client_id`

For OAuth2/OIDC flows, simply include the `client_id` in your login request. The API automatically derives the organisation from the OAuth client configuration.

::: code-group

```bash [OAuth Login]
curl -X POST https://api.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "client_id": "your-client-id"
  }'
```

```typescript [Auth UI Example]
// The client_id is extracted from OAuth redirect URL
const params = new URLSearchParams(window.location.search);
const redirectUri = params.get('redirect_uri');
const redirectUrl = new URL(redirectUri);
const clientId = redirectUrl.searchParams.get('client_id');

// Pass to login
await login(email, password, clientId);
```

:::

**Why use client_id?**

- ✅ Simpler integration for OAuth flows
- ✅ No custom headers needed in login UI
- ✅ Organisation derived from trusted OAuth client configuration
- ✅ More secure (org not user-supplied)

#### Method 2: Direct API Access - Using `X-Org-Domain` Header

For direct API access (admin panels, API clients, backend services), include the `X-Org-Domain` header:

::: code-group

```bash [Direct Login]
curl -X POST https://api.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Org-Domain: your-org-slug" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

```bash [Other Authenticated Requests]
curl https://api.example.com/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Org-Domain: your-org-slug"
```

:::

**When to use X-Org-Domain?**

- Direct API access (not via OAuth)
- Admin panels or internal tools
- Backend-to-backend API calls
- CLI tools or scripts

**Affected Endpoints:**

- All `/v1/auth/*` routes (login, logout, register) - unless using `client_id`
- All `/v1/me/*` routes (profile, sessions)
- All `/v1/admin/*` routes
- OAuth2 `/authorize` and `/consent` endpoints

**Exception:** Client credentials flow (`/oauth2/token` with `grant_type=client_credentials`) does NOT require either method.

### 2. User Data Structure Changed

Users no longer have a direct `organisationId` field. Instead, they have a `memberships` array.

::: code-group

```json [Before v2.0]
{
  "id": "user-123",
  "email": "user@example.com",
  "organisationId": "org-123",
  "roles": [{ "id": "role-1", "name": "Admin", "slug": "admin" }]
}
```

```json [After v2.0]
{
  "id": "user-123",
  "email": "user@example.com",
  "memberships": [
    {
      "organisationId": "org-123",
      "joinedAt": "2024-01-01T00:00:00Z",
      "roles": [{ "id": "role-1", "name": "Admin", "slug": "admin" }]
    },
    {
      "organisationId": "org-456",
      "joinedAt": "2024-06-15T00:00:00Z",
      "roles": [{ "id": "role-2", "name": "User", "slug": "user" }]
    }
  ]
}
```

:::

### 3. Login Flow Updated

When a user belongs to multiple organisations, they must specify which organisation to log in to using **either** `client_id` (OAuth) **or** `X-Org-Domain` header (direct API).

::: code-group

```bash [OAuth Flow (client_id)]
# OAuth flows - organisation derived from client
curl -X POST https://api.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "client_id": "your-oauth-client-id"
  }'
```

```bash [Direct API (X-Org-Domain)]
# Direct API - must specify organisation header
curl -X POST https://api.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Org-Domain: acme-corp" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

```bash [Multi-Org User]
# Same user can login to different orgs
# Using X-Org-Domain approach:
curl -X POST https://api.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Org-Domain: company-a" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Different organisation
curl -X POST https://api.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Org-Domain: company-b" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

:::

### 4. JWT Tokens Scoped to Organisation

Access tokens now include an `org` claim and are only valid for requests to that specific organisation.

```json
{
  "sub": "user-123",
  "org": "org-123",
  "client_id": "client-abc",
  "roles": ["admin"],
  "scope": "openid profile email",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Important:** When switching organisations, users must obtain a new access token by logging in with a different `X-Org-Domain` header.

### 5. Email Addresses Are Globally Unique

In v1.x, the same email could exist in different organisations (scoped uniqueness). In v2.0, emails are globally unique across all organisations.

**Impact:**

- One email = one user account
- User can be a member of multiple organisations with that account
- No more duplicate emails across organisations

## Migration Steps

### For API Consumers

#### Step 1: Update All API Requests

Add `X-Org-Domain` header to all authenticated requests:

```typescript
// Example using fetch
const response = await fetch('https://api.example.com/v1/users', {
  headers: {
    Authorization: `Bearer ${token}`,
    'X-Org-Domain': 'your-org-slug', // Add this
    'Content-Type': 'application/json',
  },
});
```

```typescript
// Example using Axios
axios.defaults.headers.common['X-Org-Domain'] = 'your-org-slug';

const response = await axios.get('https://api.example.com/v1/users', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

#### Step 2: Update User Data Handling

Update code that accesses user organisation:

```typescript
// Before v2.0
const orgId = user.organisationId;
const roles = user.roles;

// After v2.0
const membership = user.memberships.find((m) => m.organisationId === currentOrgId);
const orgId = membership?.organisationId;
const roles = membership?.roles;
```

#### Step 3: Handle Multi-Organisation Users

If your application allows users from multiple organisations:

```typescript
// List organisations user belongs to
const response = await fetch('https://api.example.com/v1/me/organisations', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const organisations = await response.json();

// organisations = [
//   { id: "org-1", name: "Company A", slug: "company-a" },
//   { id: "org-2", name: "Company B", slug: "company-b" }
// ]

// Let user select organisation
const selectedOrg = userSelectOrganisation(organisations);

// Login to selected organisation
await login(email, password, selectedOrg.slug);
```

#### Step 4: Update Error Handling

Handle new error responses:

```typescript
try {
  const response = await fetch(url, {
    headers: {
      'X-Org-Domain': orgSlug,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();

    // New error: User not a member of organisation
    if (response.status === 403 && error.detail.includes('not a member')) {
      // User tried to access org they don't belong to
      redirectToOrgSelection();
    }

    // New error: Missing X-Org-Domain header
    if (response.status === 400 && error.detail.includes('X-Org-Domain')) {
      // Add header to request
    }
  }
} catch (error) {
  console.error('API Error:', error);
}
```

### For Self-Hosted Deployments

#### Step 1: Backup Database

```bash
# Create full database backup before migration
pg_dump -h localhost -U cerberus -d cerberus_iam > backup_pre_v2_$(date +%Y%m%d).sql
```

#### Step 2: Run Database Migration

```bash
# Navigate to API directory
cd /path/to/cerberus-iam/api

# Install dependencies
npm install

# Run Prisma migration
npx prisma migrate deploy
```

The migration will:

1. Create `organisation_members` table
2. Migrate existing user-organisation relationships
3. Migrate role and team assignments
4. Validate data integrity (6 checks)
5. Clean up old structures

**Expected Duration:** 1-5 minutes for databases with < 100k users

#### Step 3: Deploy New Code

```bash
# Build application
npm run build

# Restart application
pm2 restart cerberus-api

# Or with Docker
docker-compose up -d --build
```

#### Step 4: Verify Migration

```bash
# Check migration status
npx prisma migrate status

# Verify data integrity
npm run verify:migration

# Test login with X-Org-Domain header
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Org-Domain: your-org" \
  -d '{"email":"admin@example.com","password":"password"}'
```

#### Step 5: Update Client Applications

Update all client applications (web apps, mobile apps, etc.) to include the `X-Org-Domain` header in all API requests.

## New Features in v2.0

### 1. Cross-Organisation SSO

Users can now seamlessly switch between organisations without re-entering credentials:

```typescript
// List user's organisations
GET /v1/me/organisations

// Switch organisation (get new token)
POST /v1/auth/login
Headers: { "X-Org-Domain": "different-org" }
Body: { "email": "user@example.com", "password": "password" }
```

### 2. Organisation Invitations

Invite existing users to join your organisation:

```typescript
// Invite existing user by email
POST /v1/admin/invitations
Body: {
  "email": "existing.user@example.com",
  "roleId": "role-123"
}

// User accepts invitation (joins org, no new account needed)
POST /v1/auth/invitations/accept
Body: {
  "token": "invitation-token"
}
```

### 3. Per-Organisation Roles

Same user can have different roles in different organisations:

```json
{
  "memberships": [
    {
      "organisationId": "company-a",
      "roles": [{ "name": "Admin", "slug": "admin" }]
    },
    {
      "organisationId": "company-b",
      "roles": [{ "name": "User", "slug": "user" }]
    }
  ]
}
```

### 4. Membership Management

New API endpoints for managing memberships:

```typescript
// Add user to organisation
POST /v1/admin/memberships
Body: {
  "userId": "user-123",
  "roleIds": ["role-456"]
}

// Remove user from organisation
DELETE /v1/admin/memberships/{membershipId}

// Update membership roles
PATCH /v1/admin/memberships/{membershipId}
Body: {
  "roleIds": ["role-789"]
}
```

## Common Issues & Solutions

### Issue: 400 Bad Request - Missing X-Org-Domain

**Error:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "X-Org-Domain header is required"
}
```

**Solution:** Add `X-Org-Domain` header to all authenticated requests.

### Issue: 403 Forbidden - Not a member

**Error:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "You are not a member of this organisation"
}
```

**Solution:** Verify the user is a member of the organisation specified in `X-Org-Domain` header. Check memberships with `GET /v1/me/organisations`.

### Issue: Login succeeds but API calls fail

**Cause:** Token was issued for organisation A, but trying to access organisation B.

**Solution:** Obtain a new token by logging in with the correct `X-Org-Domain` header.

### Issue: Same email can't register in multiple organisations

**Expected Behavior:** This is correct. Emails are globally unique in v2.0. To add an existing user to another organisation, use the invitation system instead of registration.

## Testing Your Migration

### Test Checklist

- [ ] User with single organisation can log in
- [ ] User with multiple organisations can log in to each
- [ ] API requests with `X-Org-Domain` header succeed
- [ ] API requests without `X-Org-Domain` return 400
- [ ] User can't access organisation they're not a member of
- [ ] Roles are scoped per organisation
- [ ] Invitations work for adding users to organisations
- [ ] OAuth2 flows work with organisation context
- [ ] Session management works correctly
- [ ] Token refresh maintains organisation context

### Test Script Example

```bash
#!/bin/bash

ORG_SLUG="test-org"
API_URL="http://localhost:3000"

# Test 1: Login with X-Org-Domain
echo "Test 1: Login"
TOKEN=$(curl -s -X POST "$API_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Org-Domain: $ORG_SLUG" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# Test 2: Access API with token and header
echo "Test 2: API Access"
curl -s "$API_URL/v1/me/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Org-Domain: $ORG_SLUG" \
  | jq

# Test 3: List user's organisations
echo "Test 3: List Organisations"
curl -s "$API_URL/v1/me/organisations" \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# Test 4: Try accessing without X-Org-Domain (should fail)
echo "Test 4: Missing Header"
curl -s "$API_URL/v1/users" \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

## Getting Help

If you encounter issues during migration:

1. Review the [Migration Guide](/guide/migration-v2) thoroughly
2. Check the [X-Org-Domain Reference](/api/x-org-domain) for authentication details
3. Open an issue on [GitHub](https://github.com/cerberus-iam/api/issues)
4. Contact support at <support@cerberus-iam.com>

## Rollback Procedure

If you need to rollback to v1.x:

```bash
# Restore database from backup
psql -h localhost -U cerberus -d cerberus_iam < backup_pre_v2_YYYYMMDD.sql

# Deploy v1.x code
git checkout v1.x
npm install
npm run build
pm2 restart cerberus-api
```

::: warning
Rollback will lose any memberships created after the v2.0 migration. Use with caution in production.
:::

## Summary

v2.0 represents a major architectural improvement that enables true multi-organisation support. While the migration requires updating client applications to include the `X-Org-Domain` header, the benefits of flexible organisation membership and cross-organisation SSO make it worthwhile.

**Key Takeaways:**

- Add `X-Org-Domain` header to all authenticated requests
- Expect `memberships` array instead of single `organisationId`
- Users can belong to multiple organisations with different roles
- Tokens are scoped to a specific organisation
- Email addresses are globally unique
