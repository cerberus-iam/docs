# Quick Start

Get Cerberus IAM up and running in under 5 minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: 18.x or 20.x (LTS versions)
- **PostgreSQL**: 14.x or higher
- **Docker & Docker Compose** (optional, recommended for development)
- **Git**: For cloning the repository

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/cerberus-iam/api.git
cd api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and set the required variables:

```env
# Database
DATABASE_URL="postgresql://cerberus:secret@localhost:5432/cerberus_iam"

# Application
NODE_ENV="development"
PORT=4000
ISSUER_URL="http://localhost:4000"

# Cryptography
JWT_ALG="EdDSA"
SECRET_ENCRYPTION_KEY="your-base64-encoded-32-byte-key"

# CORS
ADMIN_WEB_ORIGIN="http://localhost:3000"

# Email (using Mailhog for development)
EMAIL_FROM="noreply@cerberus.local"
SMTP_HOST="localhost"
SMTP_PORT=1025
```

Generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Start the Database

Using Docker Compose (recommended):

```bash
docker-compose up -d postgres mailhog
```

Or manually start PostgreSQL on localhost:5432.

### 5. Run Database Migrations

```bash
npm run db:migrate
```

### 6. (Optional) Seed the Database

Populate the database with sample data:

```bash
npm run db:seed
```

This creates:

- A sample organization: "Acme Corp" (slug: `acme-corp`)
- An admin user: `admin@acme.local` / `password123`
- Default roles and permissions

### 7. Start the Development Server

```bash
npm run dev
```

The server will start on [http://localhost:4000](http://localhost:4000).

## Verify Installation

### Check Health Endpoint

```bash
curl http://localhost:4000/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test Registration

Register a new user:

```bash
curl -X POST http://localhost:4000/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Org-Domain: acme-corp" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Expected response:

```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "name": "John Doe",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Check Email (Mailhog)

If using Docker Compose, open [http://localhost:8025](http://localhost:8025) to view the verification email sent by Mailhog.

### Test Login

```bash
curl -X POST http://localhost:4000/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Org-Domain: acme-corp" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }' \
  -c cookies.txt
```

The session cookie will be saved to `cookies.txt`.

### Access Protected Endpoint

```bash
curl http://localhost:4000/v1/me/profile \
  -H "X-Org-Domain: acme-corp" \
  -b cookies.txt
```

Expected response includes user profile and permissions.

## Next Steps

Now that you have Cerberus IAM running, explore these topics:

### Learn Core Concepts

- [Authentication](/guide/authentication) - Understand authentication flows
- [Authorization & RBAC](/guide/authorization) - Learn about permissions and roles
- [Multi-Tenancy](/guide/multi-tenancy) - Understand organization isolation
- [OAuth2 & OIDC](/guide/oauth2) - Integrate OAuth2 clients

### Integration

- [OAuth2 Client Setup](/guide/oauth2-client) - Connect your application
- [API Keys](/guide/api-keys) - Server-to-server authentication
- [Webhooks](/guide/webhooks) - Event-driven integrations

### Deployment

- [Docker Deployment](/guide/docker) - Deploy with Docker
- [Production Checklist](/guide/production) - Production-ready configuration

### API Reference

- [Authentication API](/api/auth/register) - User registration and login
- [OAuth2 API](/api/oauth2/authorize) - OAuth2 flows
- [Admin API](/api/admin/users/list) - User and role management

## Common Issues

### Port Already in Use

If port 4000 is already in use, change the `PORT` environment variable:

```env
PORT=5000
```

### Database Connection Error

Ensure PostgreSQL is running and the `DATABASE_URL` is correct:

```bash
docker-compose ps postgres
```

Restart the database if needed:

```bash
docker-compose restart postgres
```

### Migration Errors

If migrations fail, reset the database:

```bash
npm run db:reset
```

::: warning
This will delete all data in the database.
:::

### Missing Encryption Key

If you see "SECRET_ENCRYPTION_KEY is required", generate a key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add it to `.env`:

```env
SECRET_ENCRYPTION_KEY="generated-key-here"
```

## Development Workflow

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage
```

### Linting and Formatting

```bash
# Lint
npm run lint

# Fix lint issues
npm run lint:fix

# Format
npm run format

# Format and fix
npm run format:fix
```

### Database Management

```bash
# Create a new migration
npm run db:migrate:create

# Apply migrations
npm run db:migrate

# Reset database (caution!)
npm run db:reset

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## Using Docker Compose

The full development environment includes:

- PostgreSQL (port 5432)
- Mailhog SMTP/Web UI (ports 1025, 8025)
- Cerberus IAM API (port 4000)

Start all services:

```bash
docker-compose up
```

Stop all services:

```bash
docker-compose down
```

View logs:

```bash
docker-compose logs -f api
```

## Getting Help

If you encounter issues:

1. Check the [troubleshooting guide](/guide/production#troubleshooting)
2. Search [GitHub Issues](https://github.com/cerberus-iam/api/issues)
3. Ask in [GitHub Discussions](https://github.com/cerberus-iam/api/discussions)
4. Read the [full documentation](/guide/installation)

## What's Next?

- [**Installation Guide**](/guide/installation) - Detailed setup instructions
- [**Configuration**](/guide/configuration) - Configure Cerberus IAM
- [**Environment Variables**](/guide/environment) - Complete reference
- [**API Reference**](/api/overview) - Explore API endpoints
