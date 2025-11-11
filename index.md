# Cerberus IAM Documentation

Welcome to the Cerberus IAM documentation. This comprehensive guide will help you understand and implement our enterprise-grade Identity and Access Management API.

## What is Cerberus IAM?

Cerberus IAM is an enterprise-grade **Identity and Access Management (IAM)** API that provides comprehensive authentication, authorization, and user management capabilities for modern applications. Built with Express.js and TypeScript, it offers a production-ready OAuth2/OIDC provider with multi-tenant architecture and role-based access control.

## Quick Start

Get started quickly with our [Quick Start Guide](/guide/quick-start) or explore the [Installation Guide](/guide/installation).

## Documentation Sections

- **[Guide](/guide/introduction)** - Learn about Cerberus IAM concepts and features
- **[API Reference](/api/overview)** - Complete API documentation
- **[Architecture](/architecture/overview)** - System design and implementation details

## Key Features

### Authentication

- Email/password authentication with Argon2 hashing
- Multi-factor authentication (TOTP) with backup codes
- Session-based auth for web applications
- Token-based auth for APIs and mobile apps

### Authorization

- Role-Based Access Control (RBAC) with hierarchical permissions
- Organization-level and user-level access control
- Permission wildcards for flexible policy definition

### OAuth2 & OpenID Connect

- Full OAuth 2.1 authorization server implementation
- OpenID Connect 1.0 compliant identity provider
- Authorization code flow with PKCE support

### Multi-Tenancy

- Organization isolation with dedicated data boundaries
- Per-tenant configuration
- Team-based user grouping

[Get Started →](/guide/introduction)
