# Production Checklist

Essential steps for deploying Cerberus IAM to production.

## Pre-Deployment Checklist

### Security

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `SECRET_ENCRYPTION_KEY` (32 random bytes, base64-encoded)
- [ ] Use `SESSION_COOKIE_SECURE=true` (HTTPS only)
- [ ] Configure CORS with specific origins (no wildcards)
- [ ] Set appropriate rate limits for your traffic
- [ ] Enable MFA for admin accounts
- [ ] Review and configure password policies
- [ ] Set up SSL/TLS certificates
- [ ] Configure security headers (Helmet already included)
- [ ] Disable SMTP auth for unauthorized servers

### Database

- [ ] Use managed PostgreSQL service (RDS, Cloud SQL, etc.)
- [ ] Enable automated backups
- [ ] Configure connection pooling
- [ ] Set up read replicas (if needed)
- [ ] Enable SSL/TLS for database connections
- [ ] Run migrations before deployment
- [ ] Test rollback procedures
- [ ] Monitor connection pool usage

### Application

- [ ] Build production bundle (`npm run build`)
- [ ] Remove development dependencies
- [ ] Set appropriate log level (`info` or `warn`)
- [ ] Configure remote log export (SIEM)
- [ ] Set up health check monitoring
- [ ] Configure graceful shutdown
- [ ] Test error handling
- [ ] Verify email delivery

### Infrastructure

- [ ] Set up load balancer
- [ ] Configure auto-scaling (if applicable)
- [ ] Set up CDN for static assets
- [ ] Configure DNS records
- [ ] Set up monitoring and alerting
- [ ] Create runbooks for common issues
- [ ] Document disaster recovery procedures
- [ ] Test backup restoration

### Compliance

- [ ] Review audit logging configuration
- [ ] Set up log retention policies
- [ ] Configure data retention schedules
- [ ] Document GDPR compliance measures
- [ ] Review and sign BAA (if handling PHI)
- [ ] Conduct security audit
- [ ] Perform penetration testing

## Environment Configuration

### Required Variables

```env
NODE_ENV=production
PORT=4000
ISSUER_URL=https://auth.yourdomain.com

DATABASE_URL=postgresql://user:password@db.internal:5432/cerberus_iam

SECRET_ENCRYPTION_KEY=<base64-encoded-32-bytes>
JWT_ALG=EdDSA
JWKS_ROTATE_DAYS=30

SESSION_COOKIE_SECURE=true
SESSION_COOKIE_DOMAIN=.yourdomain.com

ADMIN_WEB_ORIGIN=https://admin.yourdomain.com

EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>

LOG_LEVEL=info
LOG_REMOTE_URL=https://logs.yourdomain.com/ingest
LOG_REMOTE_API_KEY=<your-api-key>

RATE_MAX=100
AUTH_RATE_MAX=20
TOKEN_RATE_MAX=20
```

### Secrets Management

Use a secrets manager:

**AWS Secrets Manager:**

```bash
aws secretsmanager create-secret \
  --name cerberus-iam/production \
  --secret-string file://.env.production
```

**Kubernetes Secrets:**

```bash
kubectl create secret generic cerberus-env \
  --from-env-file=.env.production
```

**HashiCorp Vault:**

```bash
vault kv put secret/cerberus-iam @.env.production
```

## Deployment Strategies

### Blue-Green Deployment

1. Deploy new version (green) alongside current (blue)
2. Run health checks on green
3. Switch traffic to green
4. Keep blue running for quick rollback
5. After validation, decommission blue

### Rolling Deployment

1. Update instances one at a time
2. Health check each instance before proceeding
3. Automatic rollback on failure

### Canary Deployment

1. Deploy to small percentage of traffic (5-10%)
2. Monitor metrics and errors
3. Gradually increase traffic
4. Full rollout or rollback based on metrics

## Infrastructure Patterns

### Load Balancer Configuration

**AWS ALB:**

```yaml
TargetGroup:
  HealthCheckPath: /health
  HealthCheckInterval: 30
  HealthCheckTimeout: 5
  HealthyThresholdCount: 2
  UnhealthyThresholdCount: 3
  Matcher: 200

LoadBalancer:
  Scheme: internet-facing
  SecurityGroups: [sg-xxx]
  Subnets: [subnet-xxx, subnet-yyy]
```

**NGINX:**

```nginx
upstream cerberus_iam {
    least_conn;
    server app1:4000 max_fails=3 fail_timeout=30s;
    server app2:4000 max_fails=3 fail_timeout=30s;
    server app3:4000 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name auth.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://cerberus_iam;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://cerberus_iam/health;
        access_log off;
    }
}
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cerberus-iam
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: cerberus-iam
  template:
    metadata:
      labels:
        app: cerberus-iam
    spec:
      containers:
        - name: api
          image: cerberus-iam:v1.0.0
          ports:
            - containerPort: 4000
          envFrom:
            - secretRef:
                name: cerberus-env
          resources:
            requests:
              memory: '512Mi'
              cpu: '500m'
            limits:
              memory: '2Gi'
              cpu: '2000m'
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
---
apiVersion: v1
kind: Service
metadata:
  name: cerberus-iam
  namespace: production
spec:
  selector:
    app: cerberus-iam
  ports:
    - port: 80
      targetPort: 4000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cerberus-iam
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: '100'
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - auth.yourdomain.com
      secretName: cerberus-tls
  rules:
    - host: auth.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: cerberus-iam
                port:
                  number: 80
```

## Database Setup

### PostgreSQL Configuration

**Recommended settings:**

```sql
-- Connection pooling
max_connections = 200
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 10MB

-- Performance
random_page_cost = 1.1  -- For SSD
effective_io_concurrency = 200

-- Logging
log_min_duration_statement = 1000  -- Log slow queries (>1s)
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

-- Replication (if using read replicas)
wal_level = replica
max_wal_senders = 3
```

### Migrations

Run migrations before deployment:

```bash
# Test migration (dry run)
npm run db:migrate -- --create-only

# Apply migration
npm run db:migrate

# Verify
npm run db:studio
```

### Backups

Automated backups:

```bash
# PostgreSQL dump
pg_dump -U cerberus -h db.internal cerberus_iam > backup.sql

# Compressed
pg_dump -U cerberus -h db.internal cerberus_iam | gzip > backup.sql.gz

# Point-in-time recovery (PITR)
# Enable in PostgreSQL configuration
```

## Monitoring

### Health Checks

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

**Load balancer configuration:**

- Path: `/health`
- Interval: 30 seconds
- Timeout: 5 seconds
- Healthy threshold: 2
- Unhealthy threshold: 3

### Metrics

Track key metrics:

- **Request metrics**: Rate, latency (p50, p95, p99), error rate
- **Database metrics**: Connection pool usage, query duration, deadlocks
- **Session metrics**: Active sessions, creation rate, expiration rate
- **Token metrics**: Token issuance rate, revocation rate, refresh rate
- **Auth metrics**: Login success/failure rate, MFA usage
- **System metrics**: CPU, memory, disk I/O, network

### Alerting

Configure alerts for:

- Health check failures
- High error rate (>1%)
- High latency (p95 >1s)
- Database connection pool exhaustion
- Disk space <20%
- Memory usage >90%
- Failed login rate spike
- Token revocation spike (potential breach)

## Security Hardening

### Application Security

1. **Secrets**: Never commit to version control
2. **Encryption**: Use `SECRET_ENCRYPTION_KEY` for all secrets
3. **HTTPS**: Enforce SSL/TLS everywhere
4. **CORS**: Whitelist specific origins only
5. **Rate Limiting**: Adjust for your traffic patterns
6. **CSRF**: Already enabled for session-based auth
7. **Headers**: Helmet middleware already configured

### Network Security

1. **Firewall**: Restrict ingress to load balancer only
2. **VPC**: Use private subnets for database
3. **Security Groups**: Minimum required permissions
4. **WAF**: Consider AWS WAF, Cloudflare, etc.
5. **DDoS Protection**: Use cloud provider DDoS protection

### Database Security

1. **Encryption at rest**: Enable on database
2. **Encryption in transit**: Use SSL/TLS connections
3. **Least privilege**: Dedicated database user with minimal permissions
4. **No public access**: Database in private subnet
5. **Audit logging**: Enable PostgreSQL audit logs

## Performance Optimization

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_org ON users(organisation_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_tokens_jti ON tokens(jti);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token_hash);

-- Analyze tables
ANALYZE users;
ANALYZE sessions;
ANALYZE tokens;
```

### Connection Pooling

```env
# Prisma connection pool
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10"
```

### Caching

Consider adding Redis for:

- Session storage (faster than database)
- Rate limiting (distributed)
- Permission caching

## Disaster Recovery

### Backup Strategy

1. **Daily automated backups**
2. **Retention**: 30 days
3. **Cross-region replication**
4. **Test restoration monthly**

### Recovery Procedures

**Database corruption:**

1. Stop application
2. Restore from latest backup
3. Apply WAL logs (point-in-time recovery)
4. Verify data integrity
5. Restart application

**Data breach:**

1. Revoke all refresh tokens
2. Force password reset for all users
3. Rotate JWT signing keys
4. Rotate encryption keys
5. Notify affected users
6. Conduct security audit

## Troubleshooting

### High CPU Usage

- Check for slow database queries
- Review request patterns
- Scale horizontally
- Optimize business logic

### Memory Leaks

- Monitor memory over time
- Check for unclosed connections
- Review event listeners
- Use heap snapshots for analysis

### Database Connection Exhaustion

- Increase connection pool size
- Reduce connection timeout
- Check for connection leaks
- Scale database

### High Latency

- Enable database query logging
- Add database indexes
- Implement caching
- Use CDN for static assets

## Rollback Procedures

### Application Rollback

```bash
# Kubernetes
kubectl rollout undo deployment/cerberus-iam

# Docker Swarm
docker service update --rollback cerberus-iam

# Manual
# Deploy previous version
```

### Database Rollback

```bash
# If migration is reversible
npm run db:migrate -- --rollback

# Otherwise, restore from backup
psql -U cerberus -h db.internal cerberus_iam < backup.sql
```

## Post-Deployment

- [ ] Verify health endpoint
- [ ] Test user login flow
- [ ] Verify email delivery
- [ ] Test OAuth2 flow
- [ ] Check logs for errors
- [ ] Monitor metrics dashboard
- [ ] Verify backups running
- [ ] Test rollback procedure
- [ ] Document deployment

## Support

For production issues:

1. Check health endpoint and logs
2. Review metrics and alerts
3. Check [GitHub Issues](https://github.com/cerberus-iam/api/issues)
4. Consult [troubleshooting guide](#troubleshooting)

## Next Steps

- [Monitoring Guide](/guide/monitoring) - Observability setup
- [Docker Deployment](/guide/docker) - Container deployment
- [Architecture](/architecture/overview) - System architecture
