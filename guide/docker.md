# Docker Deployment

Deploy Cerberus IAM using Docker and Docker Compose.

## Quick Start

```bash
# Clone repository
git clone https://github.com/cerberus-iam/api.git
cd api

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec api npm run db:migrate

# View logs
docker-compose logs -f api
```

## Docker Compose

### Services

The `docker-compose.yml` includes:

- **postgres** - PostgreSQL 14 database
- **mailhog** - SMTP server and web UI (development)
- **api** - Cerberus IAM API

### Configuration

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: cerberus
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: cerberus_iam
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U cerberus']
      interval: 10s
      timeout: 5s
      retries: 5

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - '1025:1025' # SMTP
      - '8025:8025' # Web UI

  api:
    build: .
    ports:
      - '4000:4000'
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:4000/health']
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  postgres_data:
```

### Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f [service]

# Execute command in container
docker-compose exec api npm run db:migrate

# Rebuild images
docker-compose build

# Restart service
docker-compose restart api
```

## Dockerfile

The multi-stage Dockerfile optimizes for production:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci && npx prisma generate

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --production

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init openssl
RUN addgroup -g 1001 -S nodejs
RUN adduser -S cerberus -u 1001
WORKDIR /app

COPY --from=builder --chown=cerberus:nodejs /app/dist ./dist
COPY --from=builder --chown=cerberus:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=cerberus:nodejs /app/prisma ./prisma
COPY --from=builder --chown=cerberus:nodejs /app/package.json ./

USER cerberus
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

**Features:**

- Multi-stage build (smaller image)
- Non-root user (security)
- dumb-init (proper signal handling)
- Health check
- Production dependencies only

## Building Images

### Local Build

```bash
docker build -t cerberus-iam:latest .
```

### With Build Args

```bash
docker build \
  --build-arg NODE_ENV=production \
  -t cerberus-iam:v1.0.0 \
  .
```

### Multi-Platform

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t cerberus-iam:latest \
  --push \
  .
```

## Running Containers

### Development

```bash
docker run -d \
  --name cerberus-iam-dev \
  -p 4000:4000 \
  --env-file .env.development \
  -v $(pwd)/src:/app/src \
  cerberus-iam:latest \
  npm run dev
```

### Production

```bash
docker run -d \
  --name cerberus-iam \
  -p 4000:4000 \
  --env-file .env.production \
  --restart unless-stopped \
  --health-cmd="curl -f http://localhost:4000/health || exit 1" \
  --health-interval=30s \
  cerberus-iam:latest
```

## Environment Variables

Mount `.env` file or pass variables:

```bash
docker run -d \
  -e DATABASE_URL="postgresql://..." \
  -e SECRET_ENCRYPTION_KEY="..." \
  -e NODE_ENV=production \
  cerberus-iam:latest
```

Or use env file:

```bash
docker run -d --env-file .env cerberus-iam:latest
```

## Database Migrations

### Using Docker Compose

```bash
docker-compose exec api npm run db:migrate
```

### Using Docker Run

```bash
docker run --rm \
  --env-file .env \
  --network cerberus-network \
  cerberus-iam:latest \
  npm run db:migrate
```

## Networking

### Bridge Network

```bash
docker network create cerberus-network

docker run -d \
  --name postgres \
  --network cerberus-network \
  -e POSTGRES_PASSWORD=secret \
  postgres:14-alpine

docker run -d \
  --name cerberus-iam \
  --network cerberus-network \
  -p 4000:4000 \
  -e DATABASE_URL="postgresql://postgres:secret@postgres:5432/cerberus" \
  cerberus-iam:latest
```

## Volumes

### Database Persistence

```bash
docker volume create cerberus-postgres-data

docker run -d \
  -v cerberus-postgres-data:/var/lib/postgresql/data \
  postgres:14-alpine
```

### Application Logs

```bash
docker volume create cerberus-logs

docker run -d \
  -v cerberus-logs:/app/logs \
  cerberus-iam:latest
```

## Health Checks

Monitor container health:

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' cerberus-iam

# View health check logs
docker inspect --format='{{json .State.Health}}' cerberus-iam | jq
```

## Logging

### View Logs

```bash
# Follow logs
docker logs -f cerberus-iam

# Last 100 lines
docker logs --tail 100 cerberus-iam

# Since timestamp
docker logs --since 2024-01-15T10:00:00 cerberus-iam
```

### Log Drivers

Configure log driver:

```bash
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  cerberus-iam:latest
```

## Production Deployment

### Docker Swarm

```yaml
version: '3.8'

services:
  api:
    image: cerberus-iam:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    ports:
      - '4000:4000'
    secrets:
      - database_url
      - encryption_key
    networks:
      - cerberus

secrets:
  database_url:
    external: true
  encryption_key:
    external: true

networks:
  cerberus:
    driver: overlay
```

Deploy:

```bash
docker stack deploy -c docker-compose.prod.yml cerberus
```

### Kubernetes

See [Production Guide](/guide/production) for Kubernetes manifests.

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs cerberus-iam

# Check health
docker inspect cerberus-iam

# Check environment
docker exec cerberus-iam env
```

### Database connection error

```bash
# Test connectivity
docker exec cerberus-iam ping postgres

# Check DATABASE_URL
docker exec cerberus-iam printenv DATABASE_URL
```

### Permission denied

```bash
# Check user
docker exec cerberus-iam whoami

# Check file ownership
docker exec cerberus-iam ls -la /app
```

## Best Practices

1. **Use specific tags** (not `latest`) in production
2. **Run as non-root user** (already configured)
3. **Set resource limits**
4. **Use health checks**
5. **Configure log rotation**
6. **Use secrets management**
7. **Scan images for vulnerabilities**
8. **Keep base images updated**

## Next Steps

- [Production Checklist](/guide/production) - Production deployment
- [Monitoring](/guide/monitoring) - Logging and observability
- [Configuration](/guide/configuration) - Environment configuration
