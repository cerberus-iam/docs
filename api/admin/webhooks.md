# Webhooks Management

Configure webhooks to receive real-time event notifications from Cerberus IAM.

## Endpoints

- [List Webhooks](#list-webhooks)
- [Get Webhook](#get-webhook)
- [Create Webhook](#create-webhook)
- [Update Webhook](#update-webhook)
- [Delete Webhook](#delete-webhook)
- [Rotate Webhook Secret](#rotate-webhook-secret)
- [Test Webhook](#test-webhook)

---

## List Webhooks

Retrieve all webhooks configured for the organisation.

### Endpoint

```
GET /api/v1/admin/webhooks
```

### Authentication

- **Required**: Yes
- **Required Permission**: `webhooks:read`

### Response (200 OK)

```json
{
  "data": [
    {
      "id": "wh_01h2xz9k3m4n5p6q7r8s9t0v2h",
      "url": "https://api.example.com/webhooks/cerberus",
      "events": ["user.created", "user.updated", "user.deleted"],
      "clientId": null,
      "isActive": true,
      "createdAt": "2025-10-20T10:00:00.000Z",
      "updatedAt": "2025-10-26T08:30:00.000Z"
    }
  ],
  "total": 1
}
```

**Note**: The webhook `secret` is never exposed in responses.

---

## Get Webhook

Retrieve details of a specific webhook.

### Endpoint

```
GET /api/v1/admin/webhooks/:id
```

### Authentication

- **Required**: Yes
- **Required Permission**: `webhooks:read`

---

## Create Webhook

Create a new webhook endpoint.

### Endpoint

```
POST /api/v1/admin/webhooks
```

### Authentication

- **Required**: Yes
- **Required Permission**: `webhooks:create`

### Request Body

```json
{
  "url": "https://api.example.com/webhooks/cerberus",
  "events": ["user.created", "user.updated", "user.deleted", "role.created"],
  "clientId": "cli_01h2xz9k3m4n5p6q7r8s9t0v2d"
}
```

| Field      | Type   | Required | Description                            |
| ---------- | ------ | -------- | -------------------------------------- |
| `url`      | string | Yes      | Webhook endpoint URL (must be HTTPS)   |
| `events`   | array  | Yes      | Array of event types to subscribe to   |
| `clientId` | string | No       | Optional OAuth client ID for filtering |

### Available Events

- `user.created`, `user.updated`, `user.deleted`, `user.blocked`
- `role.created`, `role.updated`, `role.deleted`
- `team.created`, `team.updated`, `team.deleted`
- `client.created`, `client.updated`, `client.revoked`
- `session.created`, `session.revoked`
- `login.success`, `login.failed`
- `mfa.enabled`, `mfa.disabled`

### Response (201 Created)

```json
{
  "id": "wh_01h2xz9k3m4n5p6q7r8s9t0v2i",
  "url": "https://api.example.com/webhooks/cerberus",
  "secret": "whsec_abc123def456...",
  "events": ["user.created", "user.updated", "user.deleted"],
  "clientId": null,
  "isActive": true,
  "createdAt": "2025-10-26T12:00:00.000Z",
  "updatedAt": "2025-10-26T12:00:00.000Z"
}
```

**Important**: The `secret` is only returned on creation. Use it to verify webhook signatures.

---

## Update Webhook

Update webhook configuration.

### Endpoint

```
PATCH /api/v1/admin/webhooks/:id
```

### Authentication

- **Required**: Yes
- **Required Permission**: `webhooks:update`

### Request Body (all optional)

```json
{
  "url": "https://api.example.com/webhooks/cerberus-v2",
  "events": ["user.created", "user.deleted"],
  "isActive": false
}
```

---

## Delete Webhook

Delete a webhook endpoint.

### Endpoint

```
DELETE /api/v1/admin/webhooks/:id
```

### Authentication

- **Required**: Yes
- **Required Permission**: `webhooks:delete`

### Response (204 No Content)

---

## Rotate Webhook Secret

Generate a new signing secret for the webhook.

### Endpoint

```
POST /api/v1/admin/webhooks/:id/rotate-secret
```

### Authentication

- **Required**: Yes
- **Required Permission**: `webhooks:update`

### Response (200 OK)

```json
{
  "id": "wh_01h2xz9k3m4n5p6q7r8s9t0v2i",
  "url": "https://api.example.com/webhooks/cerberus",
  "secret": "whsec_new987zyx654...",
  "events": ["user.created", "user.updated"],
  "clientId": null,
  "isActive": true,
  "createdAt": "2025-10-26T12:00:00.000Z",
  "updatedAt": "2025-10-26T12:30:00.000Z"
}
```

**Note**: The new `secret` is returned. Update your webhook verification code.

---

## Test Webhook

Send a test event to verify webhook configuration.

### Endpoint

```
POST /api/v1/admin/webhooks/:id/test
```

### Authentication

- **Required**: Yes
- **Required Permission**: `webhooks:update`

### Response (200 OK)

```json
{
  "message": "Test webhook sent"
}
```

The test event payload:

```json
{
  "id": "evt_test_123",
  "type": "webhook.test",
  "createdAt": "2025-10-26T12:00:00.000Z",
  "data": {
    "message": "This is a test webhook event",
    "webhookId": "wh_01h2xz9k3m4n5p6q7r8s9t0v2i"
  }
}
```

## Webhook Payload Format

All webhooks receive payloads in this format:

```json
{
  "id": "evt_01h2xz9k3m4n5p6q7r8s9t0v2j",
  "type": "user.created",
  "createdAt": "2025-10-26T12:00:00.000Z",
  "organisationId": "org_01h2xz9k3m4n5p6q7r8s9t0v1x",
  "data": {
    "user": {
      "id": "usr_01h2xz9k3m4n5p6q7r8s9t0v3x",
      "email": "new.user@example.com",
      "name": "New User"
    }
  }
}
```

## Verifying Webhook Signatures

Cerberus signs webhooks with HMAC SHA-256. Verify signatures:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Express.js example
app.post('/webhooks/cerberus', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-cerberus-signature'];
  const payload = req.body.toString();

  if (!verifyWebhook(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(payload);
  // Process event...

  res.status(200).send('OK');
});
```

## Headers Sent

| Header                 | Description                           |
| ---------------------- | ------------------------------------- |
| `X-Cerberus-Signature` | HMAC SHA-256 signature of the payload |
| `X-Cerberus-Event`     | Event type (e.g., `user.created`)     |
| `X-Cerberus-Delivery`  | Unique delivery ID                    |
| `Content-Type`         | `application/json`                    |
| `User-Agent`           | `Cerberus-Webhooks/1.0`               |

## Retry Behavior

- Failed webhooks are retried with exponential backoff
- Retry schedule: 1m, 5m, 15m, 1h, 6h, 24h
- After 6 failed attempts, the webhook is marked as failed
- Monitor webhook health via delivery logs (future feature)

## Best Practices

1. **Verify signatures**: Always validate the `X-Cerberus-Signature` header
2. **Respond quickly**: Return 200 status within 5 seconds to avoid retries
3. **Process asynchronously**: Queue events for background processing
4. **Use HTTPS**: Webhook URLs must use HTTPS
5. **Rotate secrets**: Regularly rotate webhook secrets for security
6. **Handle duplicates**: Implement idempotency using the event `id`
7. **Monitor failures**: Set up alerting for webhook delivery failures

## Notes

- Webhooks are delivered in near real-time (typically < 1 second)
- The `clientId` field filters events for a specific OAuth client
- Inactive webhooks (`isActive: false`) do not receive events
- Deleted webhooks cannot be recovered
- Use the test endpoint to validate your integration
