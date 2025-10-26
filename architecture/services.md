# Service Layer

## Overview

The service layer contains business logic and domain operations. Services are implemented as TypeScript classes with methods that perform CRUD operations, complex workflows, and coordinate interactions between multiple entities.

## Service Layer Pattern

### Structure

```typescript
export class ServiceName {
  // Public methods for domain operations
  async findById(id: string, organisationId: string): Promise<Entity | null> {
    // Implementation
  }

  async create(data: CreateData, actorId?: string): Promise<Entity> {
    // Implementation with audit logging
  }

  async update(id: string, data: UpdateData): Promise<Entity> {
    // Implementation
  }

  async softDelete(id: string): Promise<void> {
    // Soft delete with cascading operations
  }

  // Private helper methods
  private async validateSomething(): Promise<boolean> {
    // Internal logic
  }
}

// Export singleton instance
export const serviceName = new ServiceName();
```

### Design Principles

1. **Single Responsibility**: Each service manages one entity or related group
2. **Stateless**: No instance state, all state in database
3. **Transactional**: Complex operations wrapped in Prisma transactions
4. **Auditable**: Critical operations emit audit logs
5. **Tenant-Scoped**: All queries filtered by `organisationId`

## Available Services

### UserService

**File:** `src/services/user.service.ts`

**Responsibilities:**

- User CRUD operations
- Role assignment/unassignment
- Login statistics tracking
- Soft deletion with cascade (revoke tokens, delete sessions)

**Key Methods:**

```typescript
class UserService {
  async findById(userId: string, organisationId: string): Promise<User | null>;
  async findByEmail(email: string): Promise<User | null>;
  async listByOrganisation(organisationId: string): Promise<User[]>;
  async create(data: CreateUserData, actorId?: string): Promise<User>;
  async update(userId: string, organisationId: string, data: UpdateUserData): Promise<User>;
  async softDelete(userId: string, organisationId: string): Promise<void>;
  async assignRole(userId: string, roleId: string): Promise<void>;
  async unassignRole(userId: string, roleId: string): Promise<void>;
  async updateLoginStats(userId: string, ipAddress: string): Promise<void>;
}
```

**Soft Delete Cascade:**

- Marks user as deleted (`deletedAt`)
- Deletes all sessions
- Revokes all refresh tokens
- Revokes all access tokens
- Deletes authorization codes
- Revokes all consents

### TokenService

**File:** `src/services/token.service.ts`

**Responsibilities:**

- Access token (JWT) creation
- Refresh token creation with family tracking
- Token rotation with reuse detection
- Token revocation (single and family-wide)
- Token introspection (RFC 7662)

**Key Methods:**

```typescript
class TokenService {
  async createAccessToken(params: CreateAccessTokenParams): Promise<{ jti; token; expiresIn }>;
  async createRefreshToken(params: CreateRefreshTokenParams): Promise<string>;
  async createTokenPair(params: CreateAccessTokenParams): Promise<TokenPair>;
  async rotateRefreshToken(refreshTokenValue: string): Promise<TokenPair | null>;
  async revokeRefreshToken(refreshTokenValue: string): Promise<boolean>;
  async revokeTokenFamily(familyId: string): Promise<void>;
  async revokeAccessToken(jti: string): Promise<boolean>;
  async isAccessTokenRevoked(jti: string): Promise<boolean>;
  async introspectAccessToken(jti: string): Promise<IntrospectionResponse>;
  async cleanupExpiredTokens(daysToKeep?: number): Promise<void>;
}
```

**Refresh Token Reuse Detection:**

```typescript
// When rotating a refresh token:
// 1. Check if already revoked → token reuse detected, revoke entire family
// 2. Check if already used (has children) → token reuse detected, revoke family
// 3. Otherwise, revoke current token and create new one in same family
```

### OrganisationService

**File:** `src/services/organisation.service.ts`

**Responsibilities:**

- Organisation retrieval and updates
- Soft deletion with cascade

**Key Methods:**

```typescript
class OrganisationService {
  async findById(id: string): Promise<Organisation | null>;
  async update(id: string, data: UpdateOrganisationData): Promise<Organisation>;
  async softDelete(id: string, ownerId: string): Promise<void>;
}
```

**Soft Delete Cascade:**

- Marks organisation as deleted
- Soft deletes all users
- Soft deletes all clients
- Deletes all sessions
- Revokes all tokens
- Deletes authorization codes
- Deletes invitations
- Revokes all consents
- Deletes webhook endpoints

### RoleService

**File:** `src/services/role.service.ts`

**Responsibilities:**

- Role CRUD operations
- Permission assignment to roles

**Key Methods:**

```typescript
class RoleService {
  async findById(roleId: string, organisationId: string): Promise<Role | null>;
  async listByOrganisation(organisationId: string): Promise<Role[]>;
  async create(data: CreateRoleData): Promise<Role>;
  async update(roleId: string, data: UpdateRoleData): Promise<Role>;
  async delete(roleId: string): Promise<void>;
  async assignPermission(roleId: string, permissionId: string): Promise<void>;
  async unassignPermission(roleId: string, permissionId: string): Promise<void>;
}
```

### TeamService

**File:** `src/services/team.service.ts`

**Responsibilities:**

- Team CRUD operations
- Team membership management

**Key Methods:**

```typescript
class TeamService {
  async findById(teamId: string, organisationId: string): Promise<Team | null>;
  async listByOrganisation(organisationId: string): Promise<Team[]>;
  async create(data: CreateTeamData): Promise<Team>;
  async update(teamId: string, data: UpdateTeamData): Promise<Team>;
  async delete(teamId: string): Promise<void>;
  async addMember(teamId: string, userId: string): Promise<void>;
  async removeMember(teamId: string, userId: string): Promise<void>;
}
```

### ClientService

**File:** `src/services/client.service.ts`

**Responsibilities:**

- OAuth/OIDC client management
- Client secret generation and rotation
- Client revocation with token cascade

**Key Methods:**

```typescript
class ClientService {
  async findById(clientId: string, organisationId: string): Promise<Client | null>;
  async findByClientId(clientId: string): Promise<Client | null>;
  async listByOrganisation(organisationId: string): Promise<Client[]>;
  async create(organisationId: string, data: CreateClientData): Promise<{ client; clientSecret? }>;
  async update(clientId: string, data: UpdateClientData): Promise<Client>;
  async rotateSecret(clientId: string, context?: AuditContext): Promise<{ client; clientSecret }>;
  async revoke(clientId: string): Promise<void>;
  async softDelete(clientId: string): Promise<void>;
}
```

**Client Types:**

- **Confidential**: Server-side apps with client secret (traditional web apps)
- **Public**: Client-side apps without secret (SPAs, mobile apps) - requires PKCE

### InvitationService

**File:** `src/services/invitation.service.ts`

**Responsibilities:**

- User invitation creation
- Invitation acceptance and validation
- Email delivery (via nodemailer)

**Key Methods:**

```typescript
class InvitationService {
  async create(data: CreateInvitationData): Promise<Invitation>;
  async findByToken(token: string): Promise<Invitation | null>;
  async accept(token: string, userData: AcceptInvitationData): Promise<User>;
  async revoke(invitationId: string): Promise<void>;
  async listByOrganisation(organisationId: string): Promise<Invitation[]>;
}
```

### MfaService

**File:** `src/services/mfa.service.ts`

**Responsibilities:**

- TOTP secret generation and storage
- TOTP verification
- Backup code generation and validation
- MFA enrollment and unenrollment

**Key Methods:**

```typescript
class MfaService {
  async enrollTotp(userId: string): Promise<{ secret; qrCodeUri }>;
  async verifyTotpEnrollment(userId: string, token: string): Promise<boolean>;
  async completeTotpEnrollment(userId: string, backupCodes: string[]): Promise<void>;
  async verifyTotp(userId: string, token: string): Promise<boolean>;
  async verifyBackupCode(userId: string, code: string): Promise<boolean>;
  async unenrollMfa(userId: string): Promise<void>;
  async regenerateBackupCodes(userId: string): Promise<string[]>;
}
```

### ApiKeyService

**File:** `src/services/apikey.service.ts`

**Responsibilities:**

- API key generation
- API key validation
- Scope management

**Key Methods:**

```typescript
class ApiKeyService {
  async create(
    organisationId: string,
    data: CreateApiKeyData,
  ): Promise<{ apiKey: ApiKey; rawKey: string }>;
  async verify(key: string): Promise<ApiKey | null>;
  async listByOrganisation(organisationId: string): Promise<ApiKey[]>;
  async revoke(keyId: string): Promise<void>;
  async updateLastUsed(keyId: string): Promise<void>;
}
```

**Key Format:**

```
cerb_live_<prefix>_<random>
```

- `cerb_live_`: Prefix for production keys
- `<prefix>`: First 8 chars of key (for display/lookup)
- `<random>`: Cryptographically random 32 bytes

### WebhookService

**File:** `src/services/webhook.service.ts`

**Responsibilities:**

- Webhook endpoint management
- Event delivery with retry logic
- Signature generation (HMAC-SHA256)

**Key Methods:**

```typescript
class WebhookService {
  async create(data: CreateWebhookData): Promise<WebhookEndpoint>;
  async update(webhookId: string, data: UpdateWebhookData): Promise<WebhookEndpoint>;
  async delete(webhookId: string): Promise<void>;
  async listByOrganisation(organisationId: string): Promise<WebhookEndpoint[]>;
  async deliverEvent(webhookId: string, event: WebhookEvent): Promise<void>;
  async testWebhook(webhookId: string): Promise<{ success: boolean; statusCode: number }>;
}
```

**Webhook Payload:**

```json
{
  "id": "evt_...",
  "type": "user.created",
  "createdAt": "2025-01-26T10:00:00Z",
  "data": {
    "userId": "...",
    "email": "user@example.com"
  }
}
```

**Signature Header:**

```
X-Cerberus-Signature: t=<timestamp>,v1=<hmac-sha256-hex>
```

### AuditLogService

**File:** `src/services/auditlog.service.ts`

**Responsibilities:**

- Audit log creation
- Audit log querying with filters
- Export for compliance

**Key Methods:**

```typescript
class AuditLogService {
  async create(data: CreateAuditLogData): Promise<AuditLog>;
  async listByOrganisation(organisationId: string, filters?: AuditLogFilters): Promise<AuditLog[]>;
  async listByUser(userId: string, organisationId: string): Promise<AuditLog[]>;
  async listByResource(resourceType: string, resourceId: string): Promise<AuditLog[]>;
  async export(organisationId: string, format: 'json' | 'csv'): Promise<Buffer>;
}
```

### JwkService

**File:** `src/services/jwk.service.ts`

**Responsibilities:**

- JWK key generation (EdDSA/RS256)
- Key rotation
- JWKS endpoint data

**Key Methods:**

```typescript
class JwkService {
  async getOrCreateActiveKey(): Promise<{ kid; publicKey; privateKey }>;
  async getPublicJWKS(): Promise<JWK[]>;
  async rotateKey(): Promise<void>;
  async deactivateOldKeys(daysOld?: number): Promise<void>;
}
```

### AccountTokenService

**File:** `src/services/account-token.service.ts`

**Responsibilities:**

- Email verification token generation
- Password reset token generation
- Token validation and consumption

**Key Methods:**

```typescript
class AccountTokenService {
  async createEmailVerificationToken(userId: string): Promise<string>;
  async createPasswordResetToken(userId: string): Promise<string>;
  async verifyEmailWithToken(token: string): Promise<User | null>;
  async resetPasswordWithToken(token: string, newPassword: string): Promise<User | null>;
  async cleanupExpiredTokens(): Promise<void>;
}
```

### DataExportService

**File:** `src/services/data-export.service.ts`

**Responsibilities:**

- GDPR data export (user personal data)
- JSON format with all user-related data

**Key Methods:**

```typescript
class DataExportService {
  async exportUserData(userId: string, organisationId: string): Promise<UserDataExport>;
}
```

**Export Includes:**

- User profile
- Sessions
- Consents
- Audit logs
- MFA settings (without secrets)

### DataErasureService

**File:** `src/services/data-erasure.service.ts`

**Responsibilities:**

- GDPR right to erasure implementation
- Permanent data deletion (not soft delete)

**Key Methods:**

```typescript
class DataErasureService {
  async eraseUserData(userId: string, organisationId: string): Promise<void>;
}
```

**Erasure Includes:**

- User record (anonymized or deleted)
- Sessions
- Tokens
- Authorization codes
- Consents
- Personal audit log data

## Service Layer Best Practices

### 1. Always Use Transactions for Multi-Step Operations

```typescript
async softDelete(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });
    await tx.session.deleteMany({ where: { userId } });
    await tx.refreshToken.updateMany({ where: { userId }, data: { revokedAt: new Date() } });
  });
}
```

### 2. Audit Critical Operations

```typescript
async create(data: CreateUserData, actorId?: string): Promise<User> {
  const user = await prisma.user.create({ data });

  if (actorId) {
    await auditUserCreated(data.organisationId, actorId, user.id, ipAddress, userAgent);
  }

  return user;
}
```

### 3. Validate Tenant Context

```typescript
async findById(userId: string, organisationId: string): Promise<User | null> {
  return prisma.user.findFirst({
    where: {
      id: userId,
      organisationId,  // Always filter by organisation
      deletedAt: null, // Exclude soft-deleted records
    },
  });
}
```

### 4. Handle Soft Deletes

```typescript
// Always check deletedAt when querying
where: {
  deletedAt: null;
}

// Soft delete instead of hard delete
await prisma.user.update({
  where: { id: userId },
  data: { deletedAt: new Date() },
});
```

### 5. Include Related Data with `include`

```typescript
async findById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          permissions: true,
        },
      },
      teams: true,
    },
  });
}
```

### 6. Use Type-Safe Prisma Queries

```typescript
// Good: Type-safe with Prisma generated types
const user: User = await prisma.user.create({ data });

// Bad: Avoid `as any` or type assertions
const user = (await prisma.user.create({ data })) as any;
```

### 7. Return Consistent Data Structures

```typescript
// For single items: return entity or null
async findById(): Promise<User | null> { }

// For lists: return array (empty if none)
async listByOrganisation(): Promise<User[]> { }

// For creation: return created entity
async create(): Promise<User> { }

// For deletion: return void
async softDelete(): Promise<void> { }
```

## Dependency Injection (Future)

Services are currently instantiated as singletons. For testing and modularity, they can be refactored to support DI:

```typescript
export class UserService {
  constructor(
    private prisma: PrismaClient,
    private auditService: AuditLogService,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    const user = await this.prisma.user.create({ data });
    await this.auditService.logUserCreated(user.id);
    return user;
  }
}

// In tests:
const mockPrisma = createMockPrisma();
const mockAudit = createMockAuditService();
const userService = new UserService(mockPrisma, mockAudit);
```

## Related Documentation

- [Database Schema](./database.md)
- [Models & Entities](./models.md)
- [Testing Strategy](./testing.md)
- [Code Patterns](./patterns.md)
