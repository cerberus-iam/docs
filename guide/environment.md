# Environment Variables

Complete reference for all environment variables used in Cerberus IAM API.

## Overview

Cerberus uses environment variables for all configuration. Variables are:

- **Validated** - Zod schema validation at startup
- **Type-safe** - TypeScript types derived from schema
- **Documented** - Each variable has a clear purpose
- **Defaulted** - Sensible defaults where applicable

## Quick Start

1. Copy the example file:

```bash
cp .env.example .env
```

2. Generate required secrets:

```bash
# Generate SECRET_ENCRYPTION_KEY
node scripts/generate-secret-encryption-key.js
```

3. Update database connection and other variables

4. Validate configuration:

```bash
npm run dev
# Application will exit if configuration is invalid
```

## Variable Reference

### Server Configuration

#### `NODE_ENV`

- **Type:** `'development' | 'test' | 'production'`
- **Default:** `'development'`
- **Description:** Application environment

```bash
NODE_ENV=production
```

**Effects:**

- Logging format (pretty in dev, JSON in production)
- Error messages (verbose in dev, concise in production)
- Source maps, debugging features

#### `PORT`

- **Type:** `number`
- **Default:** `4000`
- **Description:** HTTP server port

```bash
PORT=4000
```

**Notes:**

- Must be between 1024-65535 for non-root users
- Use 4000 for development
- Cloud platforms often override this (e.g., Heroku sets `PORT`)

#### `ISSUER_URL`

- **Type:** `string` (URL)
- **Required:** Yes
- **Description:** OAuth2/OIDC issuer URL

```bash
ISSUER_URL=https://auth.yourcompany.com
```

**Requirements:**

- Must be a valid URL with protocol
- Should match your public-facing domain
- Used in JWT `iss` claim and OIDC discovery

**Examples:**

```bash
# Development
ISSUER_URL=http://localhost:4000

# Production
ISSUER_URL=https://auth.acme.com
```

### Database Configuration

#### `DATABASE_URL`

- **Type:** `string`
- **Required:** Yes
- **Description:** PostgreSQL connection string

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
```

**Format:**

```
postgresql://[user[:password]@][host][:port][/dbname][?param=value&...]
```

**Examples:**

```bash
# Development (with password)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cerberus_iam?schema=public

# Development (peer authentication)
DATABASE_URL=postgresql://jerome@localhost:5432/cerberus_iam?schema=public

# Production (connection pooling)
DATABASE_URL=postgresql://user:pass@db.internal:5432/cerberus?schema=public&connection_limit=10&pool_timeout=20

# Cloud database (SSL)
DATABASE_URL=postgresql://user:pass@db.cloud.com:5432/db?schema=public&sslmode=require
```

**Connection Pooling:**
Prisma manages connection pooling automatically. Additional parameters:

- `connection_limit` - Max connections (default: unlimited)
- `pool_timeout` - Connection timeout in seconds (default: 10)
- `sslmode` - SSL mode (`disable`, `prefer`, `require`)

### CORS Configuration

#### `ADMIN_WEB_ORIGIN`

- **Type:** `string` (URL)
- **Optional:** Yes
- **Description:** Public-facing admin web origin

```bash
ADMIN_WEB_ORIGIN=https://admin.yourcompany.com
```

**Notes:**

- Used for CORS allow-list
- Must include protocol and port
- Set to admin web app URL

#### `ADMIN_WEB_INTERNAL_ORIGIN`

- **Type:** `string` (URL)
- **Optional:** Yes
- **Description:** Internal/Docker network admin web origin

```bash
ADMIN_WEB_INTERNAL_ORIGIN=http://admin-web:3000
```

**Use Cases:**

- Docker Compose deployments
- Kubernetes internal networking
- Server-to-server communication

#### `LOGIN_UI_URL`

- **Type:** `string` (URL)
- **Optional:** Yes
- **Description:** Absolute URL to the hosted login experience

```bash
LOGIN_UI_URL=https://login.yourcompany.com/sign-in
```

**Behavior:**

- When set, unauthenticated authorization requests (`/oauth2/authorize`) redirect here
- The API appends a `redirect_uri` query parameter pointing back to the original issuer URL
- Leave unset to use the built-in `/auth/login` route (useful for development or legacy flows)

### Cryptography & JWT

#### `JWT_ALG`

- **Type:** `'EdDSA' | 'RS256'`
- **Default:** `'EdDSA'`
- **Description:** JWT signing algorithm

```bash
JWT_ALG=EdDSA
```

**Algorithms:**

- `EdDSA` - Ed25519, faster, smaller keys (recommended)
- `RS256` - RSA, widely supported, larger keys

#### `JWKS_ROTATE_DAYS`

- **Type:** `number`
- **Default:** `30`
- **Description:** Days between automatic key rotation

```bash
JWKS_ROTATE_DAYS=30
```

**Recommendations:**

- Development: 30 days
- Production: 30-90 days
- High-security: 7-14 days

#### `SECRET_ENCRYPTION_KEY`

- **Type:** `string` (base64)
- **Required:** Yes
- **Description:** AES-256-GCM encryption key for secrets

```bash
SECRET_ENCRYPTION_KEY=jcQ9C71Fqxj4E/n54rcu/87bXOQ4YN96lQu/LO449oY=
```

**Generation:**

```bash
node scripts/generate-secret-encryption-key.js
```

**Requirements:**

- Must be base64-encoded 32-byte key
- Keep secure and never commit to version control
- Rotate periodically (requires data migration)

**Used For:**

- Webhook secrets
- TOTP secrets
- OAuth client secrets (future)
- Any encrypted database fields

### Logging Configuration

#### `SERVICE_NAME`

- **Type:** `string`
- **Default:** `'cerberus-iam-api'`
- **Description:** Service name in logs

```bash
SERVICE_NAME=cerberus-iam-api
```

#### `LOG_LEVEL`

- **Type:** `'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'`
- **Default:** `'info'`
- **Description:** Minimum log level

```bash
LOG_LEVEL=info
```

**Levels (from highest to lowest):**

- `fatal` - Application-ending errors
- `error` - Errors requiring attention
- `warn` - Warning conditions
- `info` - General informational messages
- `debug` - Debugging information
- `trace` - Very verbose, trace-level logs

**Recommendations:**

- Development: `debug` or `trace`
- Staging: `info`
- Production: `info` or `warn`

#### `LOG_REMOTE_URL`

- **Type:** `string` (URL)
- **Optional:** Yes
- **Description:** Remote log aggregation endpoint

```bash
LOG_REMOTE_URL=https://logs.yourcompany.com/ingest
```

**Supported Services:**

- Custom HTTP endpoint
- Elasticsearch
- Datadog
- New Relic
- Any HTTP log collector

#### `LOG_REMOTE_API_KEY`

- **Type:** `string`
- **Optional:** Yes
- **Description:** API key for remote logging service

```bash
LOG_REMOTE_API_KEY=your-api-key-here
```

#### `LOG_REMOTE_BATCH_SIZE`

- **Type:** `number`
- **Default:** `50`
- **Description:** Number of logs to batch before sending

```bash
LOG_REMOTE_BATCH_SIZE=50
```

#### `LOG_REMOTE_FLUSH_INTERVAL_MS`

- **Type:** `number`
- **Default:** `5000`
- **Description:** Milliseconds between batch flushes

```bash
LOG_REMOTE_FLUSH_INTERVAL_MS=5000
```

### Session Configuration

#### `SESSION_COOKIE_NAME`

- **Type:** `string`
- **Default:** `'cerb_sid'`
- **Description:** Session cookie name

```bash
SESSION_COOKIE_NAME=cerb_sid
```

#### `SESSION_COOKIE_SECURE`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** Require HTTPS for session cookies

```bash
SESSION_COOKIE_SECURE=true
```

**Important:**

- Set to `true` in production
- Requires HTTPS connection
- Prevents cookie transmission over HTTP

#### `SESSION_COOKIE_DOMAIN`

- **Type:** `string`
- **Default:** `'localhost'`
- **Description:** Cookie domain attribute

```bash
SESSION_COOKIE_DOMAIN=.yourcompany.com
```

**Examples:**

```bash
# Development
SESSION_COOKIE_DOMAIN=localhost

# Production (allow subdomains)
SESSION_COOKIE_DOMAIN=.acme.com

# Production (single domain)
SESSION_COOKIE_DOMAIN=auth.acme.com
```

### Email Configuration

#### `EMAIL_FROM`

- **Type:** `string` (email)
- **Required:** Yes
- **Description:** Sender email address

```bash
EMAIL_FROM=noreply@yourcompany.com
```

#### `SMTP_HOST`

- **Type:** `string`
- **Required:** Yes
- **Description:** SMTP server hostname

```bash
SMTP_HOST=smtp.sendgrid.net
```

**Examples:**

```bash
# Development (Mailhog)
SMTP_HOST=localhost

# SendGrid
SMTP_HOST=smtp.sendgrid.net

# AWS SES
SMTP_HOST=email-smtp.us-east-1.amazonaws.com

# Gmail
SMTP_HOST=smtp.gmail.com
```

#### `SMTP_PORT`

- **Type:** `number`
- **Required:** Yes
- **Description:** SMTP server port

```bash
SMTP_PORT=587
```

**Common Ports:**

- `25` - Unencrypted (not recommended)
- `587` - STARTTLS (recommended)
- `465` - SSL/TLS
- `1025` - Mailhog development

#### `SMTP_USER`

- **Type:** `string`
- **Optional:** Yes
- **Default:** `''`
- **Description:** SMTP username

```bash
SMTP_USER=apikey
```

#### `SMTP_PASS`

- **Type:** `string`
- **Optional:** Yes
- **Default:** `''`
- **Description:** SMTP password

```bash
SMTP_PASS=your-smtp-password
```

**Security:**

- Never commit SMTP credentials
- Use environment-specific secrets
- Rotate credentials regularly

### Security & Rate Limiting

#### `RATE_WINDOW_SEC`

- **Type:** `number`
- **Default:** `60`
- **Description:** Default rate limit window (seconds)

```bash
RATE_WINDOW_SEC=60
```

#### `RATE_MAX`

- **Type:** `number`
- **Default:** `120`
- **Description:** Max requests per window

```bash
RATE_MAX=120
```

#### `AUTH_RATE_WINDOW_SEC`

- **Type:** `number`
- **Default:** `60`
- **Description:** Authentication rate limit window

```bash
AUTH_RATE_WINDOW_SEC=60
```

#### `AUTH_RATE_MAX`

- **Type:** `number`
- **Default:** `30`
- **Description:** Max auth requests per window

```bash
AUTH_RATE_MAX=30
```

**Protected Endpoints:**

- `/v1/auth/login`
- `/v1/auth/register`
- `/v1/auth/forgot-password`
- `/v1/auth/reset-password`

#### `TOKEN_RATE_WINDOW_SEC`

- **Type:** `number`
- **Default:** `60`
- **Description:** Token endpoint rate limit window

```bash
TOKEN_RATE_WINDOW_SEC=60
```

#### `TOKEN_RATE_MAX`

- **Type:** `number`
- **Default:** `30`
- **Description:** Max token requests per window

```bash
TOKEN_RATE_MAX=30
```

**Protected Endpoints:**

- `/oauth2/token`

## Environment-Specific Examples

### Development

```bash
# .env.development
NODE_ENV=development
PORT=4000
ISSUER_URL=http://localhost:4000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cerberus_iam?schema=public

ADMIN_WEB_ORIGIN=http://localhost:5173
ADMIN_WEB_INTERNAL_ORIGIN=http://localhost:5173

JWT_ALG=EdDSA
JWKS_ROTATE_DAYS=30
SECRET_ENCRYPTION_KEY=jcQ9C71Fqxj4E/n54rcu/87bXOQ4YN96lQu/LO449oY=

LOG_LEVEL=debug

SESSION_COOKIE_NAME=cerb_sid
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_DOMAIN=localhost

EMAIL_FROM=noreply@cerberus.local
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

RATE_MAX=1000
AUTH_RATE_MAX=100
TOKEN_RATE_MAX=100
```

### Production

```bash
# .env.production
NODE_ENV=production
PORT=4000
ISSUER_URL=https://auth.acme.com

DATABASE_URL=postgresql://cerberus:SECURE_PASSWORD@db-primary.internal:5432/cerberus_production?schema=public&sslmode=require&connection_limit=20

ADMIN_WEB_ORIGIN=https://admin.acme.com
ADMIN_WEB_INTERNAL_ORIGIN=http://admin-web:3000

JWT_ALG=EdDSA
JWKS_ROTATE_DAYS=30
SECRET_ENCRYPTION_KEY=PRODUCTION_SECRET_KEY_BASE64

SERVICE_NAME=cerberus-iam-api
LOG_LEVEL=info
LOG_REMOTE_URL=https://logs.acme.com/ingest
LOG_REMOTE_API_KEY=prod_log_api_key
LOG_REMOTE_BATCH_SIZE=100
LOG_REMOTE_FLUSH_INTERVAL_MS=10000

SESSION_COOKIE_NAME=cerb_sid
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_DOMAIN=.acme.com

EMAIL_FROM=noreply@acme.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SENDGRID_API_KEY

RATE_WINDOW_SEC=60
RATE_MAX=120
AUTH_RATE_WINDOW_SEC=60
AUTH_RATE_MAX=30
TOKEN_RATE_WINDOW_SEC=60
TOKEN_RATE_MAX=30
```

## Validation & Troubleshooting

### Configuration Validation

The application validates all environment variables at startup. If validation fails:

```bash
Invalid environment configuration:
{
  "DATABASE_URL": ["Required"],
  "ISSUER_URL": ["Invalid url"],
  "PORT": ["Expected number, received nan"],
  "SECRET_ENCRYPTION_KEY": ["SECRET_ENCRYPTION_KEY must be a base64-encoded 32-byte key"]
}
```

### Common Issues

#### Database Connection Fails

**Error:** `Can't reach database server`

**Solutions:**

1. Verify `DATABASE_URL` format
2. Check database is running
3. Test connection: `psql $DATABASE_URL`
4. Verify network connectivity
5. Check SSL requirements

#### Invalid Encryption Key

**Error:** `SECRET_ENCRYPTION_KEY must be a base64-encoded 32-byte key`

**Solution:**

```bash
node scripts/generate-secret-encryption-key.js
```

#### CORS Errors

**Error:** Origin not allowed by CORS policy

**Solutions:**

1. Set `ADMIN_WEB_ORIGIN` to exact client URL
2. Include protocol (http/https)
3. Include port if non-standard
4. Restart server after changes

## Security Best Practices

1. **Never Commit Secrets**

   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.production
   ```

2. **Use Different Keys Per Environment**

   ```bash
   # Development
   SECRET_ENCRYPTION_KEY=dev_key_here

   # Production
   SECRET_ENCRYPTION_KEY=prod_key_different
   ```

3. **Rotate Secrets Regularly**
   - `SECRET_ENCRYPTION_KEY` - Annually (requires migration)
   - `SMTP_PASS` - Quarterly
   - `LOG_REMOTE_API_KEY` - Quarterly

4. **Validate in CI/CD**
   ```yaml
   # GitHub Actions
   - name: Validate Config
     run: |
       cp .env.example .env
       npm run validate-config
   ```

## Next Steps

- [Configuration Guide](/guide/configuration) - Middleware and app configuration
- [Database Setup](/guide/database) - Database configuration and migrations
- [Production Deployment](/guide/production) - Production environment setup
