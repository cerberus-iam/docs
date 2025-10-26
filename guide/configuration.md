# Configuration

This guide covers the application configuration, middleware pipeline, and security settings for the Cerberus IAM API.

## Configuration Architecture

Cerberus uses a centralized, type-safe configuration system built with Zod for validation and environment variable management.

### Configuration Loading

Configuration is loaded and validated at startup in `/src/config/index.ts`:

```typescript
import { config } from './config';

// All configuration is available via the exported config object
console.log(config.PORT); // 4000
console.log(config.NODE_ENV); // 'development'
console.log(config.DATABASE_URL); // 'postgresql://...'
```

### Configuration Schema

The configuration schema validates environment variables and provides defaults:

- **Type Safety**: All variables are type-checked
- **Validation**: Invalid configurations cause immediate process exit
- **Defaults**: Sensible defaults for optional variables
- **Coercion**: Automatic type conversion (e.g., string to number)

## Middleware Pipeline

The application middleware is configured in `/src/app.ts` using the `createApp()` factory function. Middleware executes in the following order:

### 1. Request ID Middleware

Assigns a unique ID to each request for tracing and logging.

```typescript
import { requestIdMiddleware } from './middleware/requestId';

app.use(requestIdMiddleware);
```

**Features:**

- Generates UUIDs for each request
- Available as `req.id` throughout the request lifecycle
- Included in all log entries for correlation

### 2. Security Headers (Helmet)

Applies security-focused HTTP headers.

```typescript
import helmet from 'helmet';

app.use(helmet());
```

**Headers Applied:**

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (in production)

### 3. HTTP Logging

Structured HTTP request/response logging with Pino.

```typescript
import { httpLogger } from './logger';

app.use(httpLogger);
```

**Logged Information:**

- Request ID, method, URL
- Response status code, duration
- IP address, user agent
- Redacts sensitive headers (Authorization, Cookie)

### 4. CORS

Cross-Origin Resource Sharing configuration for admin web integration.

```typescript
const buildCorsOptions = (): CorsOptions => {
  const allowList = new Set<string>([
    'http://localhost:3000',
    'https://localhost:3000',
    'http://localhost:5173',
    'https://localhost:5173',
    config.ADMIN_WEB_ORIGIN,
    config.ADMIN_WEB_INTERNAL_ORIGIN,
  ]);

  return {
    origin: (origin, callback) => {
      if (!origin || allowList.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
  };
};

app.use(cors(buildCorsOptions()));
```

**Features:**

- Allow-list based origin checking
- Credentials support for cookies
- Environment-specific origins
- Localhost defaults for development

### 5. Body Parsing

JSON and URL-encoded body parsing.

```typescript
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

### 6. Cookie Parsing

Parses cookies from request headers.

```typescript
import cookieParser from 'cookie-parser';

app.use(cookieParser());
```

**Used For:**

- Session cookie extraction
- CSRF token validation
- Admin UI authentication

### 7. Route Registration

Routes are organized by domain and version:

```typescript
// Health check (no prefix)
app.use('/health', healthRouter);

// OIDC Discovery
app.use('/.well-known', wellKnownRouter);

// OAuth2/OIDC endpoints
app.use('/oauth2', oauth2Router);

// REST API
app.use('/v1', apiRouter);
```

**Route Organization:**

- `/health` - Health check endpoint
- `/.well-known` - OIDC discovery metadata
- `/oauth2` - OAuth2/OIDC protocol endpoints
- `/v1` - Versioned REST API

### 8. Error Handlers

#### 404 Handler

```typescript
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
```

#### Global Error Handler

```typescript
app.use((err: Error, req, res, next) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ message: 'Internal server error' });
});
```

## Security Configuration

### Rate Limiting

Cerberus implements multiple rate limiters for different endpoints:

```typescript
import { defaultRateLimiter, authRateLimiter, tokenRateLimiter } from './middleware/rateLimit';

// Apply to routes
router.post('/login', authRateLimiter, loginHandler);
router.post('/oauth2/token', tokenRateLimiter, tokenHandler);
```

**Rate Limit Types:**

| Limiter              | Default      | Window | Use Case                            |
| -------------------- | ------------ | ------ | ----------------------------------- |
| `defaultRateLimiter` | 120 requests | 60s    | General API endpoints               |
| `authRateLimiter`    | 30 requests  | 60s    | Login, registration, password reset |
| `tokenRateLimiter`   | 30 requests  | 60s    | OAuth2 token endpoint               |

**Configuration:**

```bash
# Environment variables
RATE_WINDOW_SEC=60
RATE_MAX=120
AUTH_RATE_WINDOW_SEC=60
AUTH_RATE_MAX=30
TOKEN_RATE_WINDOW_SEC=60
TOKEN_RATE_MAX=30
```

**Response:**

```json
{
  "type": "https://cerberus.local/errors/rate-limit",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Please try again later."
}
```

### CSRF Protection

CSRF protection for state-changing operations (coming soon).

```typescript
import { csrfProtection } from './middleware/csrf';

// Apply to mutation endpoints
router.post('/admin/users', csrfProtection, createUserHandler);
```

### Content Security

**Disabled Headers:**

```typescript
app.disable('x-powered-by');
```

Prevents Express version disclosure.

## Advanced Configuration

### Custom Middleware

Add custom middleware between existing layers:

```typescript
// After security, before parsing
app.use(helmet());
app.use(myCustomMiddleware); // Your middleware here
app.use(httpLogger);
```

### Environment-Specific Behavior

```typescript
import { config } from './config';

if (config.NODE_ENV === 'production') {
  // Production-only middleware
  app.use(productionOnlyMiddleware);
}

if (config.NODE_ENV === 'development') {
  // Development-only middleware
  app.use(morgan('dev'));
}
```

### Error Handling Strategy

Extend the global error handler with custom error types:

```typescript
class UnauthorizedError extends Error {
  statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// In error handler
app.use((err: Error, req, res, next) => {
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      type: 'https://cerberus.local/errors/unauthorized',
      title: 'Unauthorized',
      status: 401,
      detail: err.message,
    });
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ message: 'Internal server error' });
});
```

## Configuration Best Practices

### 1. Never Hard-Code Secrets

```typescript
// Bad
const apiKey = 'sk_live_abc123';

// Good
const apiKey = config.API_KEY;
```

### 2. Validate Early

Configuration validation happens at startup. The application exits if invalid:

```bash
Invalid environment configuration:
{
  "DATABASE_URL": ["Required"],
  "ISSUER_URL": ["Invalid url"]
}
```

### 3. Use Type-Safe Access

```typescript
// TypeScript enforces valid configuration keys
const port = config.PORT; // ✓ Valid
const invalid = config.INVALID_KEY; // ✗ Compile error
```

### 4. Document Additions

When adding new configuration:

1. Update the Zod schema in `/src/config/index.ts`
2. Add to `.env.example`
3. Document in `/docs/guide/environment.md`
4. Update CI/CD workflows if needed

## Security Hardening Checklist

- [ ] Enable `SESSION_COOKIE_SECURE=true` in production
- [ ] Set `SESSION_COOKIE_DOMAIN` to your production domain
- [ ] Configure `ADMIN_WEB_ORIGIN` with production URLs only
- [ ] Use strong `SECRET_ENCRYPTION_KEY` (32 bytes, base64)
- [ ] Enable rate limiting (already configured)
- [ ] Review CORS allow-list regularly
- [ ] Monitor logs for security events
- [ ] Rotate JWT signing keys periodically

## Troubleshooting

### Configuration Validation Fails

**Problem:** Application exits with configuration errors

**Solution:**

1. Check `.env` file exists and is loaded
2. Compare with `.env.example` for required variables
3. Verify URL formats (must include protocol)
4. Check numeric values are valid integers

### CORS Errors

**Problem:** Browser blocks requests with CORS error

**Solution:**

1. Verify `ADMIN_WEB_ORIGIN` matches client URL exactly
2. Include protocol (http/https) and port
3. Check credentials flag is enabled
4. Verify client sends cookies

### Rate Limit Too Restrictive

**Problem:** Legitimate requests blocked

**Solution:**

1. Increase limits via environment variables
2. Consider per-user rate limiting
3. Implement rate limit exemptions for trusted IPs
4. Use exponential backoff on client side

## Next Steps

- [Environment Variables](/guide/environment) - Complete environment reference
- [Database Configuration](/guide/database) - Database setup and migrations
- [Security & Production](/guide/production) - Production deployment guide
