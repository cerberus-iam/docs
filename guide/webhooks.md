# Webhooks

This guide covers webhook setup, event types, signature validation, and retry logic in Cerberus IAM.

## Overview

Webhooks provide real-time event notifications for:

- User lifecycle events (created, updated, deleted)
- Authentication events (login, logout, MFA)
- OAuth2 events (token issued, consent granted)
- Administrative actions (role changes, client updates)

**Features:**

- Event-based notifications
- HMAC-SHA256 signature validation
- Automatic retry with exponential backoff
- Failure tracking and auto-disable
- Organization-scoped

## Webhook Model

```prisma
model WebhookEndpoint {
  id              String    @id
  organisationId  String
  clientId        String?
  url             String
  secretEncrypted String
  events          Json
  isActive        Boolean   @default(true)
  lastTriggeredAt DateTime?
  failureCount    Int       @default(0)
  createdAt       DateTime
  updatedAt       DateTime
}
```

## Create Webhook

### Request

```typescript
// POST /v1/admin/webhooks
{
  "url": "https://api.yourapp.com/webhooks/cerberus",
  "events": [
    "user.created",
    "user.updated",
    "user.deleted",
    "auth.login"
  ],
  "clientId": "client_abc123"  // Optional: scope to specific client
}
```

### Response

```json
{
  "webhook": {
    "id": "wh_abc123",
    "organisationId": "org_xyz789",
    "url": "https://api.yourapp.com/webhooks/cerberus",
    "events": ["user.created", "user.updated", "user.deleted", "auth.login"],
    "isActive": true,
    "failureCount": 0,
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "secret": "whsec_k8jKXv3M9nP2qR5tV8yB1cE4fG7iL0oS"
}
```

**Important:** The `secret` is only shown once. Store it securely for signature validation.

## Event Types

### User Events

| Event          | Description       | Payload                |
| -------------- | ----------------- | ---------------------- |
| `user.created` | New user created  | User object            |
| `user.updated` | User updated      | User object + changes  |
| `user.deleted` | User soft-deleted | User ID                |
| `user.login`   | User logged in    | User ID, IP, timestamp |
| `user.logout`  | User logged out   | User ID, session ID    |

### Authentication Events

| Event                 | Description              | Payload              |
| --------------------- | ------------------------ | -------------------- |
| `auth.login`          | Successful login         | User, IP, user agent |
| `auth.login.failed`   | Failed login attempt     | Email, reason, IP    |
| `auth.logout`         | User logged out          | User, session        |
| `auth.password_reset` | Password reset completed | User                 |
| `auth.email_verified` | Email verified           | User                 |

### OAuth2 Events

| Event                    | Description          | Payload              |
| ------------------------ | -------------------- | -------------------- |
| `oauth2.token.issued`    | Access token issued  | Client, user, scopes |
| `oauth2.token.revoked`   | Token revoked        | Token ID             |
| `oauth2.consent.granted` | User granted consent | Client, user, scopes |
| `oauth2.consent.revoked` | Consent revoked      | Client, user         |

### Client Events

| Event            | Description          | Payload          |
| ---------------- | -------------------- | ---------------- |
| `client.created` | OAuth client created | Client object    |
| `client.updated` | Client updated       | Client + changes |
| `client.deleted` | Client deleted       | Client ID        |

### Permission Events

| Event                | Description            | Payload               |
| -------------------- | ---------------------- | --------------------- |
| `role.assigned`      | Role assigned to user  | User, role            |
| `role.unassigned`    | Role removed from user | User, role            |
| `permission.granted` | Permission granted     | User/role, permission |

## Webhook Payload Format

### Standard Format

```json
{
  "event": "user.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "organisationId": "org_xyz789",
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "newuser@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Example: User Created

```json
{
  "event": "user.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "organisationId": "org_xyz789",
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "john@example.com",
      "name": "John Doe",
      "firstName": "John",
      "lastName": "Doe",
      "organisationId": "org_xyz789",
      "emailVerifiedAt": null,
      "mfaEnabled": false,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "actor": {
      "id": "user_admin",
      "name": "Admin User"
    }
  }
}
```

### Example: Auth Login

```json
{
  "event": "auth.login",
  "timestamp": "2024-01-15T14:22:00Z",
  "organisationId": "org_xyz789",
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "john@example.com",
      "name": "John Doe"
    },
    "session": {
      "id": "ses_xyz789",
      "ipAddress": "203.0.113.42",
      "userAgent": "Mozilla/5.0...",
      "expiresAt": "2024-01-15T15:22:00Z"
    }
  }
}
```

## Signature Validation

### How Signatures Work

Each webhook request includes a signature header:

```http
POST /webhooks/cerberus HTTP/1.1
Host: api.yourapp.com
Content-Type: application/json
X-Webhook-Signature: 8f3b4d2e1a7c9f6b5e8d4c2a1f9e7b6d5c3a2f1e9d8c7b6a5f4e3d2c1b0a9f8
X-Webhook-Event: user.created
User-Agent: Cerberus-IAM-Webhook/1.0

{payload}
```

The signature is an HMAC-SHA256 hash of the payload using the webhook secret.

### Validate Signature (Node.js)

```javascript
const crypto = require('crypto');

function validateWebhookSignature(payload, signature, secret) {
  // Compute expected signature
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  // Constant-time comparison
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// Express handler
app.post('/webhooks/cerberus', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body.toString('utf8');
  const secret = process.env.WEBHOOK_SECRET;

  if (!validateWebhookSignature(payload, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(payload);

  // Process event
  handleWebhookEvent(event);

  res.json({ received: true });
});
```

### Validate Signature (Python)

```python
import hmac
import hashlib

def validate_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)

# Flask handler
@app.route('/webhooks/cerberus', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    payload = request.get_data()
    secret = os.environ['WEBHOOK_SECRET']

    if not validate_webhook_signature(payload, signature, secret):
        return jsonify({'error': 'Invalid signature'}), 401

    event = request.get_json()

    # Process event
    handle_webhook_event(event)

    return jsonify({'received': True})
```

## Retry Logic

### Automatic Retries

Cerberus automatically retries failed webhook deliveries:

**Retry Schedule:**

- Attempt 1: Immediate
- Attempt 2: +2 seconds
- Attempt 3: +4 seconds

**Total attempts:** 3

### Retry Conditions

Webhooks are retried on:

- Network errors
- Timeouts (10 seconds)
- HTTP 5xx errors
- Connection refused

Webhooks are NOT retried on:

- HTTP 4xx errors (client errors)
- Invalid signatures
- Malformed responses

### Failure Tracking

```typescript
{
  "failureCount": 5,
  "isActive": true,
  "lastTriggeredAt": "2024-01-15T10:30:00Z"
}
```

**Auto-Disable:**

- After 10 consecutive failures, webhook is automatically disabled
- Set `isActive = false`
- Requires manual re-enabling

### Re-enable Webhook

```typescript
// PATCH /v1/admin/webhooks/:id
{
  "isActive": true
}
```

This resets `failureCount` to 0.

## Webhook Management

### List Webhooks

```typescript
// GET /v1/admin/webhooks
```

**Response:**

```json
{
  "data": [
    {
      "id": "wh_abc123",
      "url": "https://api.yourapp.com/webhooks/cerberus",
      "events": ["user.created", "user.updated"],
      "isActive": true,
      "failureCount": 0,
      "lastTriggeredAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ]
}
```

### Update Webhook

```typescript
// PATCH /v1/admin/webhooks/:id
{
  "url": "https://new-url.com/webhooks",
  "events": ["user.created", "auth.login"],
  "isActive": true
}
```

### Delete Webhook

```typescript
// DELETE /v1/admin/webhooks/:id
```

### Rotate Secret

```typescript
// POST /v1/admin/webhooks/:id/rotate-secret
```

**Response:**

```json
{
  "webhook": {
    "id": "wh_abc123",
    "url": "https://api.yourapp.com/webhooks/cerberus"
  },
  "secret": "whsec_NEW_SECRET_HERE"
}
```

**Important:** Update your webhook handler with the new secret immediately.

## Implementation Examples

### Express.js Handler

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();

// Use raw body for signature validation
app.post('/webhooks/cerberus', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body.toString('utf8');
  const secret = process.env.CERBERUS_WEBHOOK_SECRET;

  // Validate signature
  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  if (signature !== expectedSig) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse event
  const event = JSON.parse(payload);

  // Handle event
  switch (event.event) {
    case 'user.created':
      handleUserCreated(event.data);
      break;
    case 'user.updated':
      handleUserUpdated(event.data);
      break;
    case 'auth.login':
      handleAuthLogin(event.data);
      break;
    default:
      console.log('Unknown event:', event.event);
  }

  // Acknowledge receipt
  res.json({ received: true });
});

function handleUserCreated(data) {
  console.log('New user created:', data.user.email);
  // Sync to your database, send welcome email, etc.
}
```

### Next.js API Route

```typescript
// pages/api/webhooks/cerberus.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false, // Need raw body for signature
  },
};

async function getRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = req.headers['x-webhook-signature'] as string;
  const rawBody = await getRawBody(req);
  const secret = process.env.CERBERUS_WEBHOOK_SECRET!;

  // Validate signature
  const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  if (signature !== expectedSig) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(rawBody);

  // Handle event
  await handleWebhookEvent(event);

  res.json({ received: true });
}
```

## Testing Webhooks

### Local Testing with ngrok

```bash
# Start ngrok
ngrok http 3000

# Use ngrok URL in webhook
https://abc123.ngrok.io/webhooks/cerberus
```

### Manual Testing

```bash
# Trigger test event
curl -X POST https://api.cerberus.local/v1/admin/webhooks/test \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  -H "X-Org-Slug: acme" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookId": "wh_abc123",
    "event": "user.created"
  }'
```

### Webhook Logs

(Coming soon: Webhook delivery logs and replay)

## Best Practices

### 1. Validate Signatures

Always validate signatures:

```javascript
if (!validateSignature(payload, signature, secret)) {
  return res.status(401).send('Invalid signature');
}
```

### 2. Return 200 Quickly

Process webhooks asynchronously:

```javascript
app.post('/webhooks', async (req, res) => {
  // Validate signature
  validateSignature(req);

  // Acknowledge immediately
  res.json({ received: true });

  // Process asynchronously
  processWebhookAsync(req.body);
});
```

### 3. Handle Duplicates

Webhooks may be delivered multiple times. Use idempotency keys:

```javascript
const processedEvents = new Set();

function handleEvent(event) {
  const eventId = `${event.event}:${event.timestamp}:${event.data.user.id}`;

  if (processedEvents.has(eventId)) {
    console.log('Duplicate event, skipping');
    return;
  }

  processedEvents.add(eventId);

  // Process event
}
```

### 4. Monitor Failures

Set up alerting for webhook failures:

```javascript
if (failureCount > 5) {
  sendAlert('Webhook failures detected', { webhookId, url });
}
```

### 5. Secure Your Endpoint

- Use HTTPS
- Validate signatures
- Rate limit webhook endpoint
- Log suspicious activity

## Troubleshooting

### Webhooks Not Received

**Solutions:**

1. Check webhook URL is publicly accessible
2. Verify HTTPS certificate is valid
3. Check firewall rules
4. Test with ngrok for local development

### Invalid Signature Errors

**Solutions:**

1. Verify secret matches webhook creation
2. Use raw body for signature validation
3. Check no body parsing before validation
4. Verify HMAC-SHA256 algorithm

### Webhook Auto-Disabled

**Solutions:**

1. Check application logs for errors
2. Fix endpoint issues
3. Re-enable webhook
4. Monitor `failureCount`

## Next Steps

- [API Keys](/guide/api-keys) - Secure webhook consumers
- [Monitoring](/guide/monitoring) - Audit webhook deliveries
- [Production](/guide/production) - Production webhook setup
