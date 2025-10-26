# Installation

This guide provides detailed instructions for installing and setting up Cerberus IAM in various environments.

## System Requirements

### Minimum Requirements

- **Node.js**: 18.x or 20.x LTS
- **PostgreSQL**: 14.x or higher
- **RAM**: 512 MB minimum, 2 GB recommended
- **Storage**: 500 MB for application + database space
- **OS**: Linux, macOS, or Windows with WSL2

### Recommended Production Requirements

- **Node.js**: 20.x LTS
- **PostgreSQL**: 15.x or 16.x with replication
- **RAM**: 4 GB or more
- **CPU**: 2+ cores
- **Storage**: SSD with 10 GB+ available space
- **OS**: Linux (Ubuntu 22.04 LTS, Debian 11+, or RHEL 9+)

## Installation Methods

Choose the installation method that best fits your needs:

- [**Local Development**](#local-development) - For development and testing
- [**Docker**](#docker-installation) - Containerized deployment
- [**Production Deployment**](#production-deployment) - For production environments

## Local Development

### Step 1: Install Prerequisites

#### Node.js

Install Node.js 18.x or 20.x:

**Using nvm (recommended):**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

**Using package manager:**

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node@20

# Windows
# Download from https://nodejs.org
```

Verify installation:

```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

#### PostgreSQL

Install PostgreSQL 14 or higher:

**Ubuntu/Debian:**

```bash
sudo apt-get update
sudo apt-get install postgresql-14 postgresql-client-14
```

**macOS:**

```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**

Download from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)

**Docker (recommended for development):**

```bash
docker run -d \
  --name cerberus-postgres \
  -e POSTGRES_USER=cerberus \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=cerberus_iam \
  -p 5432:5432 \
  postgres:14-alpine
```

### Step 2: Clone the Repository

```bash
git clone https://github.com/cerberus-iam/api.git
cd api
```

Or if you have SSH configured:

```bash
git clone git@github.com:cerberus-iam/api.git
cd api
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install all production and development dependencies defined in `package.json`.

### Step 4: Configure Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and configure the required variables. See [Environment Variables](/guide/environment) for details.

**Minimum configuration:**

```env
# Database
DATABASE_URL="postgresql://cerberus:secret@localhost:5432/cerberus_iam"

# Application
NODE_ENV="development"
PORT=4000
ISSUER_URL="http://localhost:4000"

# Security (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
SECRET_ENCRYPTION_KEY="your-generated-key-here"

# JWT
JWT_ALG="EdDSA"

# CORS
ADMIN_WEB_ORIGIN="http://localhost:3000"

# Email
EMAIL_FROM="noreply@cerberus.local"
SMTP_HOST="localhost"
SMTP_PORT=1025
```

::: tip
Use strong, random values for `SECRET_ENCRYPTION_KEY` in all environments. Never commit `.env` to version control.
:::

### Step 5: Generate Prisma Client

```bash
npx prisma generate
```

This generates the TypeScript types for your database schema.

### Step 6: Run Database Migrations

```bash
npm run db:migrate
```

This applies all database migrations to create the schema.

### Step 7: (Optional) Seed Database

Populate with sample data for development:

```bash
npm run db:seed
```

This creates:

- Organization: "Acme Corp" (slug: `acme-corp`)
- Admin user: `admin@acme.local` / `password123`
- Default roles: Admin, User, Guest
- Sample permissions

### Step 8: Start Development Server

```bash
npm run dev
```

The server will start with hot-reload enabled. Access it at [http://localhost:4000](http://localhost:4000).

### Step 9: Verify Installation

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

## Docker Installation

### Step 1: Install Docker

Install Docker and Docker Compose:

- **Linux**: [docs.docker.com/engine/install](https://docs.docker.com/engine/install/)
- **macOS**: [docs.docker.com/desktop/install/mac-install](https://docs.docker.com/desktop/install/mac-install/)
- **Windows**: [docs.docker.com/desktop/install/windows-install](https://docs.docker.com/desktop/install/windows-install/)

Verify installation:

```bash
docker --version
docker-compose --version
```

### Step 2: Clone and Configure

```bash
git clone https://github.com/cerberus-iam/api.git
cd api
cp .env.example .env
```

Edit `.env` to configure environment variables. For Docker, use these database settings:

```env
DATABASE_URL="postgresql://cerberus:secret@postgres:5432/cerberus_iam"
```

### Step 3: Start Services

```bash
docker-compose up -d
```

This starts:

- PostgreSQL database
- Mailhog (email testing)
- Cerberus IAM API

View logs:

```bash
docker-compose logs -f api
```

### Step 4: Run Migrations

```bash
docker-compose exec api npm run db:migrate
```

### Step 5: (Optional) Seed Database

```bash
docker-compose exec api npm run db:seed
```

### Step 6: Verify

```bash
curl http://localhost:4000/health
```

Access Mailhog at [http://localhost:8025](http://localhost:8025) to view emails.

## Production Deployment

### Preparation

1. **Provision Infrastructure**
   - PostgreSQL database (managed service recommended)
   - Application server (VM, container platform, or serverless)
   - Load balancer (optional, for high availability)
   - Redis (optional, for distributed rate limiting)

2. **Domain and SSL**
   - Register a domain name
   - Obtain SSL/TLS certificate (Let's Encrypt, AWS ACM, etc.)
   - Configure DNS records

3. **Secrets Management**
   - Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Generate strong random values for all secrets
   - Never commit secrets to version control

### Environment Configuration

Create a production `.env` file with all required variables:

```env
NODE_ENV=production
PORT=4000
ISSUER_URL=https://auth.yourdomain.com

DATABASE_URL=postgresql://user:pass@db.internal:5432/cerberus_iam

SECRET_ENCRYPTION_KEY=base64-encoded-random-key
JWT_ALG=EdDSA
JWKS_ROTATE_DAYS=30

SESSION_COOKIE_SECURE=true
SESSION_COOKIE_DOMAIN=.yourdomain.com

ADMIN_WEB_ORIGIN=https://admin.yourdomain.com

EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=sendgrid-api-key

LOG_LEVEL=info
LOG_REMOTE_URL=https://logs.yourdomain.com/ingest
LOG_REMOTE_API_KEY=your-log-api-key

RATE_WINDOW_SEC=60
RATE_MAX=100
AUTH_RATE_MAX=20
TOKEN_RATE_MAX=20
```

### Build and Deploy

#### Option 1: Docker

Build the production image:

```bash
docker build -t cerberus-iam:latest .
```

Run the container:

```bash
docker run -d \
  --name cerberus-iam \
  --env-file .env \
  -p 4000:4000 \
  --health-cmd="curl -f http://localhost:4000/health || exit 1" \
  --health-interval=30s \
  --health-timeout=5s \
  --health-retries=3 \
  cerberus-iam:latest
```

#### Option 2: Node.js Process

Build the application:

```bash
npm ci --production=false
npm run build
```

Start with a process manager (PM2):

```bash
npm install -g pm2
pm2 start dist/server.js --name cerberus-iam -i max
pm2 save
pm2 startup
```

#### Option 3: Kubernetes

Create Kubernetes manifests:

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cerberus-iam
spec:
  replicas: 3
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
          image: cerberus-iam:latest
          ports:
            - containerPort: 4000
          envFrom:
            - secretRef:
                name: cerberus-env
          livenessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 5
            periodSeconds: 10
```

Deploy:

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
```

### Database Setup

Run migrations on production database:

```bash
# Using Docker
docker exec cerberus-iam npm run db:migrate

# Using kubectl
kubectl exec -it cerberus-iam-pod -- npm run db:migrate

# Using SSH
ssh user@server "cd /app && npm run db:migrate"
```

::: warning
Always backup your database before running migrations in production.
:::

### Post-Deployment Checklist

- [ ] Verify health endpoint: `curl https://auth.yourdomain.com/health`
- [ ] Test user registration and login
- [ ] Verify email delivery
- [ ] Test OAuth2 flow with a client application
- [ ] Check logs for errors
- [ ] Monitor resource usage (CPU, memory, database connections)
- [ ] Set up monitoring and alerting
- [ ] Configure database backups
- [ ] Document incident response procedures

## Upgrading

### From Previous Version

1. **Backup Database**

```bash
pg_dump -U cerberus -h localhost cerberus_iam > backup.sql
```

2. **Update Code**

```bash
git fetch origin
git checkout v1.x.x  # Replace with target version
npm install
```

3. **Run Migrations**

```bash
npm run db:migrate
```

4. **Restart Application**

```bash
# Docker
docker-compose restart api

# PM2
pm2 restart cerberus-iam

# Kubernetes
kubectl rollout restart deployment/cerberus-iam
```

5. **Verify**

Check health endpoint and test critical flows.

## Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server at ...`

**Solution**:

1. Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`
2. Check `DATABASE_URL` in `.env`
3. Verify network connectivity
4. Check PostgreSQL logs

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::4000`

**Solution**:

1. Change `PORT` in `.env`
2. Or kill the process using the port:

```bash
# Find process
lsof -i :4000

# Kill process
kill -9 <PID>
```

### Migration Errors

**Error**: `Migration failed to apply`

**Solution**:

1. Check database permissions
2. Verify Prisma schema is valid: `npx prisma validate`
3. Inspect migration files in `prisma/migrations/`
4. Reset database (development only): `npm run db:reset`

### Module Not Found

**Error**: `Cannot find module '@/...'`

**Solution**:

1. Ensure dependencies are installed: `npm install`
2. Generate Prisma client: `npx prisma generate`
3. Check `tsconfig.json` paths configuration

### Permission Denied

**Error**: `EACCES: permission denied`

**Solution**:

1. Check file/directory permissions
2. Use non-root user in production
3. Verify Docker volume mounts

## Next Steps

- [**Configuration**](/guide/configuration) - Configure application settings
- [**Environment Variables**](/guide/environment) - Complete environment reference
- [**Database Setup**](/guide/database) - Advanced database configuration
- [**Production Checklist**](/guide/production) - Production deployment best practices
