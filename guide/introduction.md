# What is Cerberus IAM?

Cerberus IAM is an enterprise-grade **Identity and Access Management (IAM)** API that provides comprehensive authentication, authorization, and user management capabilities for modern applications. Built with Express.js and TypeScript, it offers a production-ready OAuth2/OIDC provider with multi-tenant architecture and role-based access control.

## Overview

Cerberus IAM is designed to be the central identity layer for SaaS applications, microservices, and enterprise systems. It handles all aspects of identity management, from user registration and authentication to fine-grained authorization and audit logging.

### Key Capabilities

**Authentication**

- Email/password authentication with Argon2 hashing
- Multi-factor authentication (TOTP) with backup codes
- Session-based auth for web applications
- Token-based auth for APIs and mobile apps
- Email verification and password reset flows
- User invitation system

**Authorization**

- Role-Based Access Control (RBAC) with hierarchical permissions
- Organization-level and user-level access control
- Permission wildcards for flexible policy definition
- Dynamic permission evaluation with caching
- API key authentication for server-to-server communication

**OAuth2 & OpenID Connect**

- Full OAuth 2.1 authorization server implementation
- OpenID Connect 1.0 compliant identity provider
- Authorization code flow with PKCE support
- Refresh token rotation with family tracking
- Token introspection and revocation
- Consent management
- Public key discovery (JWKS)

**Multi-Tenancy**

- Organization isolation with dedicated data boundaries
- Per-tenant configuration (MFA requirements, session policies, etc.)
- Team-based user grouping within organizations
- Flexible role assignment at organization level

**User Management**

- Self-service user registration and profile management
- Admin APIs for user lifecycle management
- Soft-delete with data retention policies
- GDPR-compliant data export
- Comprehensive audit logging

**Integration & Extensibility**

- Webhook system for event-driven integrations
- API keys for programmatic access
- RESTful API design
- Structured logging with remote export
- Health checks and monitoring endpoints

## Architecture Highlights

### Layered Design

Cerberus IAM follows a clean, layered architecture:

```
┌─────────────────────────────────────────────┐
│         Routes & Controllers               │  ← HTTP Request Handlers
├─────────────────────────────────────────────┤
│            Middleware Layer                │  ← Auth, RBAC, Rate Limiting
├─────────────────────────────────────────────┤
│           Service Layer                    │  ← Business Logic
├─────────────────────────────────────────────┤
│         Database Layer (Prisma)            │  ← Data Access
└─────────────────────────────────────────────┘
```

### Security First

- Argon2 password hashing (winner of Password Hashing Competition)
- AES-256-GCM encryption for sensitive secrets
- EdDSA/RS256 JWT signing with key rotation
- CSRF protection with token validation
- Rate limiting with configurable thresholds
- Security headers via Helmet
- Token family reuse detection for breach response

### Production Ready

- Docker and Docker Compose support
- Health checks and graceful shutdown
- Structured logging with Pino
- Comprehensive test suite (unit, integration, E2E)
- TypeScript strict mode for type safety
- Database migrations with Prisma
- CI/CD pipeline with GitHub Actions

## Use Cases

### SaaS Application Identity

Deploy Cerberus IAM as the identity backbone for your SaaS platform:

- Multi-tenant user management with organization isolation
- Flexible RBAC for role and permission management
- Self-service user registration and profile management
- Admin dashboard APIs for customer management

### Enterprise Single Sign-On (SSO)

Use Cerberus IAM as a centralized identity provider:

- OAuth2/OIDC integration with existing applications
- Support for multiple client applications
- Centralized user directory and authentication
- Audit trail for compliance requirements

### API Gateway Authentication

Integrate with API gateways and microservices:

- JWT-based token validation
- Token introspection endpoint for authorization
- API key authentication for service-to-service communication
- Rate limiting and security policies

### Customer Identity & Access Management (CIAM)

Provide customer-facing identity services:

- User registration with email verification
- Password reset and account recovery
- Multi-factor authentication for enhanced security
- GDPR-compliant data export and deletion

## Design Principles

### 1. Security by Default

All security features are enabled by default. Password hashing uses Argon2, tokens are signed with EdDSA, and all secrets are encrypted at rest.

### 2. Developer Experience

Clear code patterns, comprehensive TypeScript types, and detailed error messages make integration straightforward.

### 3. Standards Compliance

Full adherence to OAuth 2.1, OpenID Connect 1.0, and RFC 7807 (Problem Details) standards.

### 4. Extensibility

Webhook system, custom claim support, and pluggable architecture enable customization for specific requirements.

### 5. Observability

Structured logging, audit trails, and monitoring endpoints provide visibility into system behavior.

## Technology Stack

| Component        | Technology              |
| ---------------- | ----------------------- |
| Runtime          | Node.js 18+/20+         |
| Framework        | Express.js 4            |
| Language         | TypeScript 5 (strict)   |
| Database         | PostgreSQL 14+          |
| ORM              | Prisma                  |
| Password Hashing | Argon2                  |
| Encryption       | AES-256-GCM             |
| JWT Signing      | EdDSA (Ed25519) / RS256 |
| MFA              | TOTP (RFC 6238)         |
| Logging          | Pino                    |
| Testing          | Jest + Supertest        |
| Deployment       | Docker                  |

## Comparison with Alternatives

### vs. Auth0 / Okta

- **Self-hosted**: Full control over your identity infrastructure
- **Open source**: No vendor lock-in or per-user pricing
- **Customizable**: Modify the codebase to fit your exact requirements

### vs. Keycloak

- **Lightweight**: Node.js/Express vs. Java/WildFly
- **API-first**: RESTful JSON APIs vs. admin console-centric
- **Modern stack**: TypeScript, Prisma, Pino vs. Java EE

### vs. Building Your Own

- **Production-ready**: Comprehensive security features out of the box
- **Standards-compliant**: Full OAuth2/OIDC implementation
- **Battle-tested**: Comprehensive test suite and security best practices

## What's Next?

Ready to get started? Here's what to do next:

1. [**Quick Start**](/guide/quick-start) - Get Cerberus IAM running in 5 minutes
2. [**Installation**](/guide/installation) - Detailed setup instructions
3. [**Core Concepts**](/guide/authentication) - Understand authentication and authorization flows
4. [**API Reference**](/api/overview) - Explore the API endpoints

## Community & Contributing

Cerberus IAM is open source and welcomes contributions:

- **GitHub**: [github.com/cerberus-iam/api](https://github.com/cerberus-iam/api)
- **Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Pull Requests**: Contribute code and documentation

See the [Contributing Guide](https://github.com/cerberus-iam/api/blob/main/CONTRIBUTING.md) for more information.

## Documentation

The complete documentation is available at [docs.cerberus-iam.com](https://docs.cerberus-iam.com).
