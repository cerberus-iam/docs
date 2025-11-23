# Railway Postgres 17 SSL/TLS Configuration Guide

## Overview

This document explains how to properly configure Cerberus IAM API to connect to Railway's Postgres 17 database, avoiding common SSL/TLS handshake errors caused by ALPN protocol negotiation mismatches.

## The Problem

Railway's `postgres-ssl` image with Postgres 17 implements stricter TLS requirements including ALPN (Application-Layer Protocol Negotiation). When connecting incorrectly, you may see errors like:

```
could not receive data from client: Connection reset by peer
received direct SSL connection request without ALPN protocol negotiation extension
could not accept SSL connection: unsupported protocol
could not accept SSL connection: no application protocol
could not accept SSL connection: no shared cipher
could not accept SSL connection: bad key share
```

These errors occur when:

1. The client attempts SSL negotiation incorrectly
2. A proxy/tunnel intercepts the connection without proper ALPN support
3. The SSL mode doesn't match the server's certificate configuration (self-signed on Railway)

## The Solution

### Environment Variable: `DB_SSL_MODE`

The API now supports three SSL modes via the `DB_SSL_MODE` environment variable:

| Mode          | Use Case                                 | Description                                                                                                            |
| ------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `disable`     | **Railway internal** (same project)      | No SSL encryption. Use when API and Postgres are in the same Railway project connected via private network.            |
| `require`     | **Railway external** (public connection) | SSL required but doesn't verify CA certificates. Tolerates self-signed certificates from Railway's postgres-ssl image. |
| `verify-full` | **Production** (valid certificates)      | Full SSL verification including CA certificate validation. Use only with proper SSL certificates.                      |

### Configuration Steps

#### For Railway Deployments (Same Project) - **RECOMMENDED**

When your API and Postgres services are in the **same Railway project**:

1. Use Railway's **internal** `DATABASE_URL` (provided by Railway automatically)
2. Set `DB_SSL_MODE=disable`

```bash
# Railway Environment Variables
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Railway's internal connection string
DB_SSL_MODE=disable
```

**Why this works:**

- Railway's internal network doesn't require SSL encryption
- Reduces connection overhead
- Avoids TLS/ALPN issues entirely
- This is the fastest and most reliable option

#### For External Connections (Different Project/Location)

When connecting from **outside the Railway project**:

1. Use Railway's **public** connection string (from Postgres service settings)
2. Set `DB_SSL_MODE=require`

```bash
# Railway Environment Variables
DATABASE_URL=postgresql://postgres:password@hostname.railway.app:5432/railway
DB_SSL_MODE=require
```

**Why this works:**

- `require` mode enforces SSL but doesn't verify the certificate
- Tolerates Railway's self-signed certificates (`CN=localhost`)
- Prisma properly negotiates ALPN with the `postgresql` protocol

### How It Works

The implementation in `src/db/prisma.ts`:

1. Reads `DB_SSL_MODE` from config (via `src/config/index.ts`)
2. Parses the `DATABASE_URL`
3. Appends appropriate `?sslmode=` parameter to the connection string
4. Passes the modified URL to PrismaClient via `datasourceUrl` option

This ensures Prisma's underlying PostgreSQL driver (node-postgres) connects with the correct SSL configuration.

## Testing Database Connectivity

### Health Check Endpoints

The API provides two health check endpoints:

```bash
# Basic health check
curl http://localhost:4000/health

# Database connectivity check
curl http://localhost:4000/health/db
```

The `/health/db` endpoint:

- Executes `SELECT 1` query
- Returns connection status and query duration
- Returns 503 error if database is unreachable
- Logs detailed error messages for debugging

Example success response:

```json
{
  "status": "ok",
  "database": "connected",
  "queryDurationMs": 45,
  "timestamp": "2024-11-23T10:30:00.000Z"
}
```

Example error response:

```json
{
  "status": "error",
  "database": "disconnected",
  "error": "Connection reset by peer",
  "timestamp": "2024-11-23T10:30:00.000Z"
}
```

### Local Testing

1. Start local Postgres (via Docker Compose):

   ```bash
   docker-compose up -d
   ```

2. Verify `.env` configuration:

   ```bash
   DATABASE_URL=postgresql://postgres:mysecretpassword@localhost:5432/cerberus
   DB_SSL_MODE=disable
   ```

3. Run the API:

   ```bash
   npm run dev
   ```

4. Test DB connectivity:

   ```bash
   curl http://localhost:4000/health/db
   ```

### Railway Deployment Testing

After deploying to Railway:

1. Check Railway logs for connection errors
2. Test the health endpoint:

   ```bash
   curl https://your-api.up.railway.app/health/db
   ```

3. If you see SSL errors in logs:
   - Verify `DB_SSL_MODE` is set correctly
   - Check that `DATABASE_URL` doesn't already contain `?sslmode=` parameter
   - Confirm you're using Railway's internal URL (ends with `.railway.internal`) for same-project connections

## Common Issues and Solutions

### Issue: "Connection reset by peer"

**Cause:** Client attempting SSL when server expects plain TCP (or vice versa)

**Solution:**

- For internal Railway connections: Set `DB_SSL_MODE=disable`
- Ensure no proxy/tunnel is intercepting the connection

### Issue: "no application protocol" / "unsupported protocol"

**Cause:** ALPN protocol negotiation mismatch

**Solution:**

- Use `DB_SSL_MODE=require` (not `verify-full`) for self-signed certs
- Let Prisma handle the connection string with proper `sslmode` parameter
- Avoid manually adding SSL options to the connection string

### Issue: "certificate verify failed"

**Cause:** Attempting full certificate verification on Railway's self-signed cert

**Solution:**

- Use `DB_SSL_MODE=require` instead of `verify-full`
- Only use `verify-full` when you have proper CA-signed certificates

### Issue: Connection works locally but fails on Railway

**Cause:** Likely using wrong SSL mode or URL

**Solution:**

1. Confirm you're using Railway's **internal** connection string
2. Set `DB_SSL_MODE=disable` for internal connections
3. Check Railway logs for specific error messages

## Best Practices

1. **Use internal connections when possible**
   - Faster (no SSL overhead)
   - More reliable (avoids TLS issues)
   - More secure (private network isolation)

2. **Never use `verify-full` with Railway's self-signed certificates**
   - Will always fail certificate validation
   - Use `require` for external connections instead

3. **Monitor with health checks**
   - Set up automated health check monitoring
   - Alert on `/health/db` returning 503 errors

4. **Log connection details**
   - Check Railway logs during deployment
   - Prisma logs connection attempts in development mode

5. **Keep connection strings simple**
   - Let the API add `sslmode` parameter automatically
   - Don't manually add SSL options to `DATABASE_URL`

## Reference

### Environment Variables

| Variable       | Required | Default   | Description                                      |
| -------------- | -------- | --------- | ------------------------------------------------ |
| `DATABASE_URL` | Yes      | -         | PostgreSQL connection string                     |
| `DB_SSL_MODE`  | No       | `disable` | SSL mode: `disable`, `require`, or `verify-full` |

### Connection String Format

Basic format (let the API add sslmode):

```
postgresql://user:password@host:port/database
```

With explicit sslmode (overrides `DB_SSL_MODE`):

```
postgresql://user:password@host:port/database?sslmode=disable
```

### Railway Internal vs External URLs

**Internal** (same project):

```
postgresql://postgres:password@postgres.railway.internal:5432/railway
```

**External** (public):

```
postgresql://postgres:password@postgres.railway.app:5432/railway
```

## Troubleshooting Checklist

- [ ] Verify `DB_SSL_MODE` environment variable is set
- [ ] Check Railway logs for specific SSL error messages
- [ ] Confirm using internal URL for same-project deployments
- [ ] Test `/health/db` endpoint returns 200 status
- [ ] Ensure no proxy/tunnel is intercepting database connections
- [ ] Verify `DATABASE_URL` doesn't already contain `?sslmode=` parameter
- [ ] Check Prisma logs in development mode for connection details

## Additional Resources

- [Prisma PostgreSQL Connector Docs](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [Railway Postgres Documentation](https://docs.railway.app/databases/postgresql)
- [PostgreSQL SSL Support](https://www.postgresql.org/docs/current/ssl-tcp.html)
- [ALPN in PostgreSQL 17](https://www.postgresql.org/about/news/postgresql-17-released-2936/)
