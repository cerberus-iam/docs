# Project Structure

## Directory Layout

```
/Users/jerome/Projects/cerberus-iam/api/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Continuous integration pipeline
│       └── deploy.yml              # AWS ECS deployment
├── .husky/                         # Git hooks
│   └── pre-commit                  # Lint and format staged files
├── docs/
│   └── architecture/               # Architecture documentation
├── prisma/
│   ├── schema.prisma               # Database schema definition
│   ├── migrations/                 # Database migration files
│   └── seed.ts                     # Database seeding script
├── scripts/
│   └── generate-secret-encryption-key.js  # Key generation utility
├── src/
│   ├── app.ts                      # Express application factory
│   ├── server.ts                   # Server entry point
│   ├── config/
│   │   └── index.ts                # Configuration with Zod validation
│   ├── logger.ts                   # Pino logger setup
│   ├── middleware/                 # Express middleware
│   │   ├── requestId.ts            # Request ID generation
│   │   ├── authn.ts                # Authentication (session/bearer/optional)
│   │   ├── tenant.ts               # Multi-tenancy context
│   │   ├── rbac.ts                 # Role-based access control
│   │   ├── csrf.ts                 # CSRF protection
│   │   ├── rateLimit.ts            # Rate limiting
│   │   └── apikey.ts               # API key authentication
│   ├── routes/                     # Route definitions
│   │   ├── index.ts                # Health check route
│   │   ├── well-known/             # OIDC discovery endpoints
│   │   │   ├── index.ts
│   │   │   └── openid-configuration.ts
│   │   ├── oauth2/                 # OAuth 2.0/OIDC endpoints
│   │   │   ├── index.ts
│   │   │   ├── authorize.ts
│   │   │   ├── token.ts
│   │   │   ├── userinfo.ts
│   │   │   ├── introspect.ts
│   │   │   ├── revoke.ts
│   │   │   ├── jwks.ts
│   │   │   └── consent.ts
│   │   └── api/v1/                 # REST API v1
│   │       ├── index.ts
│   │       ├── auth/               # Public authentication endpoints
│   │       │   ├── index.ts
│   │       │   ├── register.ts
│   │       │   ├── login.ts
│   │       │   ├── logout.ts
│   │       │   ├── forgot-password.ts
│   │       │   ├── reset-password.ts
│   │       │   ├── verify-email.ts
│   │       │   └── invitations.ts
│   │       ├── me/                 # User self-service endpoints
│   │       │   ├── index.ts
│   │       │   ├── profile.ts
│   │       │   ├── sessions.ts
│   │       │   ├── mfa.ts
│   │       │   └── export.ts
│   │       └── admin/              # Admin endpoints (RBAC protected)
│   │           ├── index.ts
│   │           ├── users.ts
│   │           ├── roles.ts
│   │           ├── permissions.ts
│   │           ├── teams.ts
│   │           ├── clients.ts
│   │           ├── organisation.ts
│   │           ├── invitations.ts
│   │           ├── api-keys.ts
│   │           ├── webhooks.ts
│   │           └── audit-logs.ts
│   ├── controllers/                # Request handlers
│   │   ├── user.controller.ts
│   │   ├── client.controller.ts
│   │   ├── role.controller.ts
│   │   ├── team.controller.ts
│   │   ├── organisation.controller.ts
│   │   ├── invitation.controller.ts
│   │   ├── mfa.controller.ts
│   │   ├── apikey.controller.ts
│   │   ├── webhook.controller.ts
│   │   └── auditlog.controller.ts
│   ├── services/                   # Business logic layer
│   │   ├── user.service.ts
│   │   ├── token.service.ts
│   │   ├── organisation.service.ts
│   │   ├── role.service.ts
│   │   ├── team.service.ts
│   │   ├── client.service.ts
│   │   ├── invitation.service.ts
│   │   ├── mfa.service.ts
│   │   ├── apikey.service.ts
│   │   ├── webhook.service.ts
│   │   ├── auditlog.service.ts
│   │   ├── jwk.service.ts
│   │   ├── account-token.service.ts
│   │   ├── data-export.service.ts
│   │   └── data-erasure.service.ts
│   ├── auth/                       # Authentication utilities
│   │   ├── jwt.ts                  # JWT signing and verification
│   │   ├── password.ts             # Password hashing/verification
│   │   ├── sessions.ts             # Session management
│   │   ├── mfa.ts                  # MFA/TOTP utilities
│   │   └── jwks.ts                 # JWKS key management
│   ├── oidc/                       # OIDC-specific logic
│   │   ├── discovery.ts
│   │   ├── authorize.ts
│   │   ├── consent.ts
│   │   ├── introspect.ts
│   │   ├── revoke.ts
│   │   ├── userinfo.ts
│   │   └── jwks.ts
│   ├── db/
│   │   └── prisma.ts               # Prisma client singleton
│   ├── utils/                      # Utility functions
│   │   ├── crypto.ts               # Cryptographic functions
│   │   ├── problem.ts              # RFC 7807 Problem Details
│   │   ├── audit.ts                # Audit logging helpers
│   │   └── ids.ts                  # ID generation utilities
│   ├── logging/
│   │   └── remote-exporter.ts      # Remote log shipping
│   ├── types/                      # TypeScript type definitions
│   │   ├── index.ts
│   │   ├── auth.types.ts
│   │   ├── token.types.ts
│   │   ├── audit.types.ts
│   │   ├── webhook.types.ts
│   │   ├── middleware.types.ts
│   │   ├── logging.types.ts
│   │   ├── problem.types.ts
│   │   ├── data-export.types.ts
│   │   ├── data-erasure.types.ts
│   │   └── test.types.ts
│   └── **/*.test.ts                # Test files (co-located)
├── e2e/                            # End-to-end tests
├── dist/                           # Compiled JavaScript (gitignored)
├── coverage/                       # Test coverage reports (gitignored)
├── node_modules/                   # Dependencies (gitignored)
├── .env                            # Environment variables (gitignored)
├── .env.example                    # Environment variable template
├── .eslintrc.json                  # ESLint configuration
├── .prettierrc                     # Prettier configuration
├── .gitignore                      # Git ignore patterns
├── jest.config.ts                  # Jest configuration
├── jest.setup.ts                   # Jest global setup
├── jest.setup-env.js               # Jest environment setup
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.test.json              # TypeScript test configuration
├── package.json                    # NPM dependencies and scripts
├── package-lock.json               # Dependency lock file
├── README.md                       # Project overview
├── TESTING.md                      # Testing documentation
├── AGENTS.md                       # AI agent guidelines
├── CONTRIBUTING.md                 # Contribution guidelines
├── SECURITY.md                     # Security policy
└── CLAUDE.md                       # Claude Code instructions
```

## Module Organization

### Core Application Files

#### `src/app.ts`

Pure Express application factory. Wires middleware in correct order:

1. Request ID generation
2. Security headers (Helmet)
3. HTTP logging (Pino)
4. CORS with allow-list
5. Body parsing (JSON, URL-encoded)
6. Cookie parsing
7. Route registration
8. 404 handler
9. Central error handler

#### `src/server.ts`

Server entry point. Binds app to port, handles graceful shutdown:

```typescript
import { createApp } from './app';
import { config } from './config';

const app = createApp();

const server = app.listen(config.PORT, () => {
  logger.info(`Server listening on port ${config.PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
```

### Configuration (`src/config/`)

Single source of truth for all environment variables. Uses Zod for validation.

**Pattern:**

```typescript
const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive().default(4000),
  // ... more fields
});

export const config: Config = parsedEnv.data;
```

### Middleware (`src/middleware/`)

All middleware follows Express signature:

```typescript
export function middlewareName(
  req: Request,
  res: Response,
  next: NextFunction,
): void | Promise<void> {
  // ... logic
  next();
}
```

#### Middleware Factories

Parameterized middleware for reusability:

```typescript
export function requirePerm(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check permission
  };
}

// Usage
router.get('/users', requirePerm('users:read'), controller);
```

### Routes (`src/routes/`)

Routes are organized by API surface area:

- **`/health`**: Health check for load balancers
- **`/.well-known`**: OIDC discovery endpoints
- **`/oauth2`**: OAuth 2.0/OIDC protocol endpoints
- **`/api/v1/auth`**: Public authentication (register, login, etc.)
- **`/api/v1/me`**: User self-service endpoints
- **`/api/v1/admin`**: Admin endpoints (RBAC protected)

**Naming Convention:**

- One file per route or route group
- Export Express `Router` instance
- Import and mount in parent `index.ts`

**Example:**

```typescript
// src/routes/api/v1/admin/users.ts
import { Router } from 'express';
import { requirePerm } from '@/middleware/rbac';

const router = Router();

router.get('/', requirePerm('users:read'), listUsers);
router.post('/', requirePerm('users:create'), createUser);

export default router;
```

### Controllers (`src/controllers/`)

Controllers handle HTTP concerns:

- Request validation
- Calling service layer
- Formatting responses
- Error handling

**Pattern:**

```typescript
export async function getUser(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;
  const organisationId = req.tenant!.id;

  const user = await userService.findById(userId, organisationId);

  if (!user) {
    sendProblem(res, notFound('User not found'));
    return;
  }

  res.json({ data: user });
}
```

### Services (`src/services/`)

Services contain business logic. Each service is a class with methods for domain operations.

**Pattern:**

```typescript
export class UserService {
  async findById(userId: string, organisationId: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id: userId, organisationId, deletedAt: null },
    });
  }

  async create(data: CreateUserData, actorId?: string): Promise<User> {
    const user = await prisma.user.create({ data });
    await auditUserCreated(organisationId, actorId, user.id);
    return user;
  }
}

export const userService = new UserService();
```

**Key Services:**

- `UserService`: User CRUD and management
- `TokenService`: JWT and refresh token lifecycle
- `OrganisationService`: Organisation management
- `RoleService`: Role and permission management
- `TeamService`: Team membership
- `ClientService`: OAuth client management
- `MfaService`: Multi-factor authentication
- `ApiKeyService`: API key validation
- `WebhookService`: Webhook delivery
- `AuditLogService`: Audit logging
- `JwkService`: JWK key rotation

### Auth Utilities (`src/auth/`)

Authentication-specific logic:

- **`jwt.ts`**: Sign and verify JWTs using `jose` library
- **`password.ts`**: Argon2 password hashing
- **`sessions.ts`**: Session CRUD operations
- **`mfa.ts`**: TOTP generation and verification
- **`jwks.ts`**: JWKS endpoint helpers

### Database (`src/db/`)

Single Prisma client instance:

```typescript
// src/db/prisma.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});
```

### Utilities (`src/utils/`)

Pure functions for common operations:

- **`crypto.ts`**: Cryptographic operations (hash, encrypt, token generation)
- **`problem.ts`**: RFC 7807 Problem Details constructors
- **`audit.ts`**: Audit log creation helpers
- **`ids.ts`**: UUID generation

### Types (`src/types/`)

Centralized TypeScript type definitions:

```typescript
// src/types/auth.types.ts
export interface JWTPayload {
  sub: string;
  org: string;
  roles: string[];
  scope: string;
}

// src/types/index.ts
export * from './auth.types';
export * from './token.types';
// ... re-export all types
```

## File Naming Conventions

### Source Files

- **Modules**: `kebab-case.ts` (e.g., `rate-limit.ts`)
- **Services**: `*.service.ts` (e.g., `user.service.ts`)
- **Controllers**: `*.controller.ts` (e.g., `user.controller.ts`)
- **Middleware**: `camelCase.ts` (e.g., `authn.ts`, `tenant.ts`)
- **Types**: `*.types.ts` (e.g., `auth.types.ts`)

### Test Files

- **Unit tests**: `*.unit.test.ts` (co-located with source)
- **Integration tests**: `*.integration.test.ts` (co-located with source)
- **E2E tests**: `*.e2e.test.ts` (in `e2e/` directory)

### Configuration Files

- **TypeScript**: `tsconfig.json`, `tsconfig.test.json`
- **Jest**: `jest.config.ts`, `jest.setup.ts`
- **ESLint**: `eslint.config.js` (flat config)
- **Prettier**: `.prettierrc`

## Import Path Aliases

TypeScript path alias `@/*` maps to `src/*`:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Usage:**

```typescript
import { userService } from '@/services/user.service';
import { requirePerm } from '@/middleware/rbac';
import { config } from '@/config';
```

## Code Organization Best Practices

### 1. Single Responsibility

Each file has one clear purpose. Controllers handle HTTP, services handle business logic, utilities are pure functions.

### 2. Co-located Tests

Tests live next to the code they test:

```
src/services/
├── user.service.ts
├── user.service.unit.test.ts
└── user.service.integration.test.ts
```

### 3. Explicit Exports

Services and utilities export named instances:

```typescript
export class UserService {
  /* ... */
}
export const userService = new UserService();
```

### 4. Barrel Exports

Type definitions use barrel exports:

```typescript
// src/types/index.ts
export * from './auth.types';
export * from './token.types';

// Usage
import { JWTPayload, TokenPair } from '@/types';
```

### 5. Layered Dependencies

Dependency flow is always downward:

```
Routes → Controllers → Services → Prisma → Database
  ↓         ↓            ↓
Middleware  Utils      Auth Utils
```

**Never:**

- Services importing controllers
- Utils importing services
- Circular dependencies

## Build Output (`dist/`)

TypeScript compiles to CommonJS in `dist/`:

```
dist/
├── app.js
├── server.js
├── config/
│   └── index.js
├── middleware/
│   ├── authn.js
│   └── ...
└── ... (mirrors src/ structure)
```

**Production Start:**

```bash
npm run build   # tsc -p tsconfig.json
npm start       # node dist/server.js
```

## Environment Files

### `.env` (gitignored)

Actual secrets and configuration:

```env
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/cerberus
SECRET_ENCRYPTION_KEY=base64-encoded-key
JWT_ALG=EdDSA
```

### `.env.example` (committed)

Template for required variables:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/cerberus_dev
SECRET_ENCRYPTION_KEY=<generate-with-npm-run-key:generate>
```

## Related Documentation

- [System Overview](./overview.md)
- [Middleware Pipeline](./middleware.md)
- [Service Layer](./services.md)
- [Database Schema](./database.md)
- [Testing Strategy](./testing.md)
