# Monitoring & Logging

Comprehensive observability for Cerberus IAM.

## Overview

Cerberus IAM provides structured logging, audit trails, and health check endpoints for complete observability.

## Logging

### Structured Logging

Cerberus IAM uses **Pino** for high-performance, structured JSON logging.

**Log Format:**

```json
{
  "level": 30,
  "time": 1704564290000,
  "pid": 12345,
  "hostname": "api-server-1",
  "reqId": "req-abc123",
  "req": {
    "method": "POST",
    "url": "/v1/auth/login",
    "headers": {
      "user-agent": "Mozilla/5.0...",
      "X-Org-Domain": "acme-corp"
    }
  },
  "res": {
    "statusCode": 200
  },
  "responseTime": 145,
  "msg": "request completed"
}
```

### Log Levels

Configure via `LOG_LEVEL` environment variable:

| Level | Code | Usage                                               |
| ----- | ---- | --------------------------------------------------- |
| fatal | 60   | Application is unusable                             |
| error | 50   | Error events that might still allow app to continue |
| warn  | 40   | Potentially harmful situations                      |
| info  | 30   | Informational messages (default)                    |
| debug | 20   | Detailed information for debugging                  |
| trace | 10   | Very detailed information                           |

**Production:** Use `info` or `warn`
**Development:** Use `debug`
**Troubleshooting:** Use `trace` temporarily

### Request Logging

All HTTP requests are logged with:

```json
{
  "req": {
    "id": "req-abc123",
    "method": "GET",
    "url": "/v1/me/profile",
    "headers": { ... },
    "remoteAddress": "192.168.1.100",
    "remotePort": 54321
  },
  "res": {
    "statusCode": 200,
    "headers": { ... }
  },
  "responseTime": 42,
  "msg": "request completed"
}
```

**Redacted fields:**

- `authorization` header
- `cookie` header
- `password` fields
- `clientSecret` fields

### Error Logging

Errors are logged with stack traces (in non-production):

```json
{
  "level": 50,
  "err": {
    "type": "Error",
    "message": "Database connection failed",
    "stack": "Error: Database connection failed\\n  at..."
  },
  "msg": "request error"
}
```

### Remote Log Export

Export logs to external systems (SIEM, log aggregation):

```env
LOG_REMOTE_URL=https://logs.example.com/ingest
LOG_REMOTE_API_KEY=your-api-key
LOG_REMOTE_BATCH_SIZE=50
LOG_REMOTE_FLUSH_INTERVAL_MS=5000
```

**Supported targets:**

- Elasticsearch
- Splunk
- Datadog
- New Relic
- CloudWatch Logs
- Google Cloud Logging
- Custom HTTP endpoints

**Implementation:**

```typescript
import pino from 'pino';

const logger = pino({
  level: config.logLevel,
  transport: config.logRemoteUrl
    ? {
        target: 'pino-http-send',
        options: {
          url: config.logRemoteUrl,
          headers: {
            Authorization: `Bearer ${config.logRemoteApiKey}`,
          },
          batchSize: config.logRemoteBatchSize,
          interval: config.logRemoteFlushIntervalMs,
        },
      }
    : undefined,
});
```

## Audit Logging

### Audit Events

Comprehensive audit trail for security-relevant events:

**Event Categories:**

- `auth` - Authentication events (login, logout, MFA)
- `user` - User lifecycle (create, update, delete)
- `client` - OAuth client management
- `permission` - Role and permission changes
- `system` - System events

**Event Types:**

```
user.login
user.logout
user.login.failed
user.create
user.update
user.delete
user.mfa.enrolled
user.mfa.verified
user.password.reset

token.issued
token.refreshed
token.revoked
token.introspected

client.create
client.update
client.revoke

role.create
role.update
role.permission.added
```

### Audit Log Schema

```typescript
{
  id: string;
  organisationId: string;
  userId?: string;
  clientId?: string;
  eventType: string;
  eventCategory: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout';
  resourceType?: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

### Query Audit Logs

**Endpoint:** `GET /v1/admin/audit-logs`

```bash
curl "https://auth.example.com/v1/admin/audit-logs?eventType=user.login&startDate=2024-01-01&limit=100" \
  -H "X-Org-Domain: acme-corp" \
  -H "Cookie: cerb_sid=..."
```

**Filters:**

- `userId` - Filter by user
- `clientId` - Filter by OAuth client
- `eventType` - Filter by event type
- `eventCategory` - Filter by category
- `action` - Filter by action
- `startDate` / `endDate` - Date range
- `success` - Filter by success/failure
- `limit` / `offset` - Pagination

**Response:**

```json
{
  "auditLogs": [
    {
      "id": "log-uuid",
      "eventType": "user.login",
      "eventCategory": "auth",
      "action": "login",
      "userId": "user-uuid",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "success": true,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 1250,
  "limit": 100,
  "offset": 0
}
```

## Health Checks

### Health Endpoint

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

**Status Codes:**

- `200` - Healthy
- `503` - Unhealthy (future: database checks, etc.)

### Load Balancer Configuration

```yaml
# AWS ALB Target Group
HealthCheck:
  Protocol: HTTP
  Path: /health
  Port: 4000
  Interval: 30
  Timeout: 5
  HealthyThreshold: 2
  UnhealthyThreshold: 3
  Matcher: 200
```

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 4000
  initialDelaySeconds: 30
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 4000
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 2
```

## Metrics

### Key Metrics to Track

**Request Metrics:**

- Request rate (requests/second)
- Request latency (p50, p95, p99)
- Error rate (4xx, 5xx)
- Status code distribution

**Authentication Metrics:**

- Login success/failure rate
- MFA verification rate
- Password reset requests
- Session creation rate
- Session expiration rate

**OAuth2 Metrics:**

- Token issuance rate
- Token refresh rate
- Token revocation rate
- Authorization code usage
- Client usage breakdown

**Database Metrics:**

- Connection pool usage
- Query duration
- Active connections
- Slow queries (>1s)
- Deadlocks

**System Metrics:**

- CPU usage
- Memory usage
- Disk I/O
- Network I/O
- Uptime

### Exporting Metrics

#### Prometheus (Future)

```typescript
import promClient from 'prom-client';

const register = new promClient.Registry();

// HTTP request duration
const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Active sessions
const activeSessions = new promClient.Gauge({
  name: 'cerberus_active_sessions',
  help: 'Number of active user sessions',
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

#### StatsD

```typescript
import StatsD from 'node-statsd';

const statsd = new StatsD({
  host: 'statsd.internal',
  port: 8125,
  prefix: 'cerberus.',
});

// Track login
statsd.increment('auth.login.success');
statsd.timing('auth.login.duration', responseTime);
```

## Monitoring Tools

### Datadog

```javascript
import tracer from 'dd-trace';

tracer.init({
  service: 'cerberus-iam',
  env: 'production',
  version: '1.0.0',
});
```

### New Relic

```javascript
require('newrelic');
```

### AWS CloudWatch

```typescript
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({ region: 'us-east-1' });

await cloudwatch.send(
  new PutMetricDataCommand({
    Namespace: 'CerberusIAM',
    MetricData: [
      {
        MetricName: 'LoginSuccess',
        Value: 1,
        Unit: 'Count',
        Timestamp: new Date(),
      },
    ],
  }),
);
```

## Alerting

### Alert Rules

**Critical:**

- Health check failures
- Error rate >5%
- Database connection failures
- Disk space <10%

**Warning:**

- Error rate >1%
- Latency p95 >1s
- Memory usage >80%
- Failed login rate spike

**Info:**

- Deployment events
- Database migration completion
- Key rotation events

### Alert Channels

- **Email** - For all alerts
- **Slack** - For critical alerts
- **PagerDuty** - For production incidents
- **SMS** - For critical after-hours

### Example Alert (Prometheus)

```yaml
groups:
  - name: cerberus_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: 'High error rate detected'
          description: 'Error rate is {{ $value }} (>5%)'

      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: 'High latency detected'
          description: 'P95 latency is {{ $value }}s (>1s)'
```

## Dashboards

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Cerberus IAM",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Latency (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds)"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      }
    ]
  }
}
```

### Key Visualizations

1. **Request Overview**
   - Request rate timeline
   - Status code distribution
   - Top endpoints by traffic

2. **Performance**
   - Latency percentiles (p50, p95, p99)
   - Response time heatmap
   - Slow endpoint list

3. **Errors**
   - Error rate timeline
   - Error type breakdown
   - Error traces

4. **Authentication**
   - Login success/failure rate
   - Active sessions
   - MFA usage

5. **Database**
   - Connection pool usage
   - Query duration
   - Slow queries

6. **System**
   - CPU and memory usage
   - Disk I/O
   - Network throughput

## Tracing (Future)

Distributed tracing with OpenTelemetry:

```typescript
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

const provider = new NodeTracerProvider();
provider.register();

registerInstrumentations({
  instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
});
```

## Log Analysis

### Common Queries

**Failed logins:**

```bash
cat logs.json | jq 'select(.msg == "login failed")'
```

**Slow requests:**

```bash
cat logs.json | jq 'select(.responseTime > 1000)'
```

**Errors:**

```bash
cat logs.json | jq 'select(.level == 50)'  # error level
```

**User activity:**

```bash
cat logs.json | jq 'select(.userId == "user-uuid")'
```

## Best Practices

1. **Use structured logging** - JSON logs are easier to parse
2. **Include correlation IDs** - Track requests across services
3. **Redact sensitive data** - Never log passwords, tokens, secrets
4. **Set appropriate log levels** - Avoid excessive logging
5. **Monitor key metrics** - Don't rely on logs alone
6. **Set up alerts** - Proactive monitoring beats reactive debugging
7. **Review logs regularly** - Identify patterns and anomalies
8. **Retain logs appropriately** - Balance compliance and storage costs
9. **Test monitoring** - Verify alerts fire correctly
10. **Document runbooks** - Response procedures for common issues

## Next Steps

- [Production Checklist](/guide/production) - Production deployment
- [Architecture](/architecture/overview) - System architecture
- [Security](/architecture/security) - Security architecture
