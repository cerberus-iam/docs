# System Architecture Overview

## Introduction

Cerberus IAM API is a comprehensive Identity and Access Management service built with Node.js, Express 4, and TypeScript 5. It provides OAuth 2.0/OIDC authentication, multi-tenancy, role-based access control (RBAC), and audit logging capabilities for the Cerberus platform.

## Tech Stack

### Core Technologies

- **Runtime**: Node.js 20+ (LTS)
- **Framework**: Express.js 4.19+
- **Language**: TypeScript 5.4+ (strict mode)
- **Database**: PostgreSQL (via Prisma ORM 5.22+)
- **ORM**: Prisma Client with migration tooling

### Key Dependencies

#### Security & Authentication

- **helmet** (7.0+): Security headers middleware
- **cors** (2.8+): Cross-Origin Resource Sharing with allow-list
- **argon2** (0.31+): Password hashing with Argon2id algorithm
- **jose** (5.2+): JWT signing and verification (EdDSA/RS256)
- **csurf** (1.11+): CSRF protection for session-based routes

#### Validation & Configuration

- **zod** (3.23+): Schema validation for environment and payloads
- **dotenv** (16.4+): Environment variable management

#### Logging & Observability

- **pino** (8.17+): High-performance structured logging
- **pino-http** (9.0+): HTTP request logging middleware
- **morgan** (1.10+): Legacy HTTP logger (being phased out)

#### Rate Limiting & Security

- **rate-limiter-flexible** (5.0+): Memory-based rate limiting with Redis support
- **cookie-parser** (1.4+): Cookie parsing for session management

#### MFA & Token Management

- **otplib** (12.0+): TOTP generation and verification
- **uuid** (9.0+): UUID v4 generation for IDs

#### Email & Notifications

- **nodemailer** (6.9+): SMTP email delivery for verification and password reset

### Development Tools

- **ESLint 9**: Flat config with TypeScript support
- **Prettier 3**: Code formatting
- **Husky**: Git hooks for pre-commit quality checks
- **lint-staged**: Run linters on staged files only
- **Jest 29**: Testing framework with ts-jest
- **Supertest**: HTTP integration testing
- **ts-node-dev**: Development server with hot reload

## Design Principles

### 1. Layered Architecture

```
┌─────────────────────────────────────────────┐
│           Client Applications               │
│  (Admin Web, Mobile Apps, Third-party)      │
└────────────────┬────────────────────────────┘
                 │ HTTP/HTTPS
                 ▼
┌─────────────────────────────────────────────┐
│          Middleware Pipeline                │
│  Request ID → Helmet → Logger → CORS        │
│  → Body Parser → Cookie Parser              │
│  → Tenant → Auth → RBAC → CSRF              │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│            Route Handlers                   │
│  /health, /.well-known, /oauth2, /api/v1    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│           Controllers                       │
│  Request validation, response formatting     │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│          Service Layer                      │
│  Business logic, domain operations           │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│      Prisma Client (ORM)                    │
│  Type-safe database queries                  │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│         PostgreSQL Database                 │
│  Multi-tenant data storage                   │
└─────────────────────────────────────────────┘
```

### 2. Multi-Tenancy

Cerberus IAM implements **Organization-scoped multi-tenancy**:

- Each `Organisation` is the root tenant entity
- All user operations are scoped to an organisation via `organisationId`
- Tenant context is established via `X-Org-Slug` header
- Data isolation enforced at database query level using Prisma filters

```typescript
// Tenant middleware extracts organisation context
req.tenant = {
  id: organisation.id,
  slug: organisation.slug,
  organisation: Organisation,
};
```

### 3. Strict Configuration Validation

Environment configuration is validated at startup using Zod schemas:

```typescript
// src/config/index.ts
const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().min(1),
  JWT_ALG: z.enum(['EdDSA', 'RS256']),
  SECRET_ENCRYPTION_KEY: z.string().min(44),
  // ... more fields
});

// Process exits if validation fails
if (!parsedEnv.success) {
  console.error('Invalid environment configuration');
  process.exit(1);
}
```

### 4. Pure Application Factory

The `createApp()` function in `src/app.ts` is pure - it returns an Express app without side effects like port binding. This enables:

- Easy testing with Supertest
- Multiple app instances for different environments
- Clean separation of app configuration and server lifecycle

```typescript
// Pure factory
export const createApp = (): Application => {
  const app = express();
  // ... middleware setup
  return app;
};

// Server binding happens separately
// src/server.ts
const app = createApp();
app.listen(config.PORT);
```

### 5. Dependency Injection Ready

Services are instantiated as singletons but designed for future DI:

```typescript
// Current pattern
export class UserService {
  async findById(userId: string) {
    /* ... */
  }
}
export const userService = new UserService();

// Future DI pattern (ready)
export class UserService {
  constructor(
    private prisma: PrismaClient,
    private auditService: AuditLogService,
  ) {}
}
```

### 6. Error Handling Strategy

- **Problem Details (RFC 7807)**: Structured error responses
- **Central error handler**: Catches all unhandled errors
- **Domain-specific errors**: `UnauthorizedError`, `ForbiddenError`, etc.
- **Logging**: Errors logged with request context using Pino

```typescript
// utils/problem.ts
export const unauthorized = (detail: string): Problem => ({
  type: 'https://cerberus.local/errors/unauthorized',
  title: 'Unauthorized',
  status: 401,
  detail,
});
```

### 7. Security-First Design

- **Helmet**: Security headers enabled by default
- **CORS**: Strict origin allow-list
- **Rate Limiting**: Multiple limiters (global, auth, token)
- **CSRF Protection**: Token-based for session endpoints
- **Password Hashing**: Argon2id with strong parameters
- **Secret Encryption**: AES-256-GCM for sensitive data
- **JWT Signing**: EdDSA (Ed25519) or RS256
- **Token Storage**: Refresh tokens hashed with SHA-256

### 8. Observability

- **Structured Logging**: Pino JSON logs with request IDs
- **Request Tracing**: Every request gets a unique ID
- **Audit Logging**: Critical operations logged to `audit_logs` table
- **Remote Log Export**: Optional batched log shipping to external systems

```typescript
// Every log entry includes:
{
  service: 'cerberus-iam-api',
  environment: 'production',
  requestId: 'uuid-v4',
  level: 'info',
  msg: 'User logged in',
  userId: '...',
  organisationId: '...'
}
```

## Key Architectural Patterns

### Request Context Propagation

Request-scoped data flows through middleware chain:

```typescript
Request {
  id: string;                    // Request ID (from requestIdMiddleware)
  tenant?: TenantContext;        // Organisation context (from tenantMiddleware)
  user?: User;                   // Authenticated user (from authn middleware)
  authOrganisation?: Organisation; // Auth'd org (from authn middleware)
  apiKeyScopes?: string[];       // API key permissions
}
```

### Service Layer Pattern

Business logic lives in service classes:

```typescript
class UserService {
  async findById(userId: string, organisationId: string): Promise<User | null>;
  async create(data: CreateUserData, actorId?: string): Promise<User>;
  async update(userId: string, data: UpdateUserData): Promise<User>;
  async softDelete(userId: string): Promise<void>;
}
```

### Middleware Factories

Reusable middleware with configuration:

```typescript
export function requirePerm(permission: string) {
  return async (req, res, next) => {
    // Permission check logic
    if (!hasPermission) {
      sendProblem(res, forbidden('Missing permission'));
      return;
    }
    next();
  };
}

// Usage
router.get('/admin/users', requirePerm('users:read'), handler);
```

### Token Family Tracking

Refresh token rotation with reuse detection:

```typescript
RefreshToken {
  familyId: string;      // Links all tokens in rotation chain
  parentTokenId?: string; // Previous token in chain
  children: RefreshToken[]; // Next token(s) in chain
  revokedAt?: Date;      // Revoked if reused or expired
}

// Reuse detection algorithm:
// 1. Check if token has children (already rotated)
// 2. If yes → revoke entire family (compromise detected)
// 3. If no → create new token with current as parent
```

## Module Organization

```
src/
├── app.ts                  # Express app factory
├── server.ts               # Server entry point
├── config/                 # Configuration & environment
│   └── index.ts
├── middleware/             # Express middleware
│   ├── requestId.ts
│   ├── authn.ts
│   ├── tenant.ts
│   ├── rbac.ts
│   ├── csrf.ts
│   ├── rateLimit.ts
│   └── apikey.ts
├── routes/                 # Route definitions
│   ├── index.ts            # Health check
│   ├── well-known/         # OIDC discovery
│   ├── oauth2/             # OAuth 2.0 endpoints
│   └── api/v1/             # REST API
├── controllers/            # Request handlers
├── services/               # Business logic
│   ├── user.service.ts
│   ├── token.service.ts
│   ├── organisation.service.ts
│   └── ...
├── auth/                   # Auth utilities
│   ├── jwt.ts              # JWT signing/verification
│   ├── password.ts         # Password hashing
│   ├── sessions.ts         # Session management
│   └── mfa.ts              # MFA/TOTP
├── db/                     # Database
│   └── prisma.ts           # Prisma client singleton
├── utils/                  # Utilities
│   ├── crypto.ts           # Cryptographic functions
│   ├── problem.ts          # RFC 7807 errors
│   └── audit.ts            # Audit logging helpers
├── types/                  # TypeScript types
└── logger.ts               # Pino logger setup
```

## Multi-Environment Support

### Development

- Hot reload via `ts-node-dev`
- Detailed error messages
- Source maps enabled
- Pretty-printed logs

### Testing

- Isolated Jest projects (unit, integration, e2e)
- Mock Prisma client
- Ephemeral test databases
- Parallel test execution

### Production

- Compiled to JavaScript via `tsc`
- Structured JSON logs
- Error details suppressed
- Health check endpoint for load balancers

## Deployment Architecture

```
┌──────────────────────────────────────────────────┐
│              Load Balancer / CDN                 │
│            (AWS ALB / CloudFront)                │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│          API Container (ECS/EKS)                 │
│                                                  │
│  ┌────────────────────────────────────────┐     │
│  │   Node.js 20 + Express                 │     │
│  │   - Health check: /health              │     │
│  │   - Graceful shutdown                  │     │
│  │   - Request timeout handling           │     │
│  └────────────────────────────────────────┘     │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│         PostgreSQL (RDS/Aurora)                  │
│  - Multi-AZ for HA                               │
│  - Connection pooling                            │
│  - Automated backups                             │
└──────────────────────────────────────────────────┘
```

## Scalability Considerations

1. **Stateless Design**: No in-memory session storage; all state in DB
2. **Horizontal Scaling**: Multiple API instances behind load balancer
3. **Database Connection Pooling**: Prisma manages connection pool
4. **Rate Limiting**: Can be migrated to Redis for distributed limiting
5. **Caching**: Ready for Redis integration for JWK caching

## Future Enhancements

### Planned Features

- [ ] Redis-backed rate limiting for multi-instance deployments
- [ ] JWK caching with automatic key rotation
- [ ] Webhook event delivery with retry logic
- [ ] SAML SSO integration
- [ ] Social OAuth providers (Google, GitHub, etc.)
- [ ] Advanced audit log querying and export
- [ ] Real-time activity monitoring dashboard

### Technical Debt

- [ ] Replace Morgan with Pino HTTP logger entirely
- [ ] Implement comprehensive API documentation (OpenAPI/Swagger)
- [ ] Add end-to-end encryption for sensitive user data
- [ ] Improve test coverage to >90%
- [ ] Add performance benchmarks and load testing

## Related Documentation

- [Project Structure](./structure.md)
- [Middleware Pipeline](./middleware.md)
- [Service Layer](./services.md)
- [Database Schema](./database.md)
- [Security Architecture](./security.md)
- [Testing Strategy](./testing.md)
