# Audit Logs

Query and retrieve audit logs for security and compliance monitoring.

## Endpoints

### Query Audit Logs

```
GET /v1/admin/audit-logs
```

### Get Single Audit Log

```
GET /v1/admin/audit-logs/:id
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `audit:read`

## Security

- CSRF protection enabled (requires valid CSRF token)
- Tenant isolation enforced (only audit logs from the authenticated user's organisation)
- Requires admin-level permissions with audit:read capability

## Query Audit Logs

### Headers

| Header         | Required | Description                       |
| -------------- | -------- | --------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerb_sid`)       |
| `X-CSRF-Token` | Yes      | CSRF token for request validation |

### Query Parameters

| Parameter       | Type    | Required | Description                                                               |
| --------------- | ------- | -------- | ------------------------------------------------------------------------- |
| `userId`        | string  | No       | Filter by user ID                                                         |
| `clientId`      | string  | No       | Filter by OAuth2 client ID                                                |
| `eventType`     | string  | No       | Filter by specific event type                                             |
| `eventCategory` | enum    | No       | Filter by category: `auth`, `user`, `client`, `permission`, `system`      |
| `action`        | enum    | No       | Filter by action: `create`, `read`, `update`, `delete`, `login`, `logout` |
| `resourceType`  | string  | No       | Filter by resource type (e.g., `user`, `role`, `client`)                  |
| `resourceId`    | string  | No       | Filter by specific resource ID                                            |
| `success`       | boolean | No       | Filter by success/failure (`true` or `false`)                             |
| `startDate`     | string  | No       | ISO 8601 datetime - filter logs after this date                           |
| `endDate`       | string  | No       | ISO 8601 datetime - filter logs before this date                          |
| `limit`         | number  | No       | Maximum number of results to return                                       |
| `offset`        | number  | No       | Number of results to skip (for pagination)                                |

### Example Request

```bash
GET /v1/admin/audit-logs?eventCategory=auth&action=login&startDate=2025-10-01T00:00:00Z&limit=50
```

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "aud_01h2xz9k3m4n5p6q7r8s9t0v1w",
      "organisationId": "org_01h2xz9k3m4n5p6q7r8s9t0v1x",
      "userId": "usr_01h2xz9k3m4n5p6q7r8s9t0v1y",
      "clientId": "cli_01h2xz9k3m4n5p6q7r8s9t0v1z",
      "eventType": "user.login.success",
      "eventCategory": "auth",
      "action": "login",
      "resourceType": "user",
      "resourceId": "usr_01h2xz9k3m4n5p6q7r8s9t0v1y",
      "success": true,
      "metadata": {
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "mfaUsed": true
      },
      "createdAt": "2025-10-26T10:30:00.000Z"
    },
    {
      "id": "aud_01h2xz9k3m4n5p6q7r8s9t0v2a",
      "organisationId": "org_01h2xz9k3m4n5p6q7r8s9t0v1x",
      "userId": "usr_01h2xz9k3m4n5p6q7r8s9t0v2b",
      "clientId": null,
      "eventType": "user.login.failed",
      "eventCategory": "auth",
      "action": "login",
      "resourceType": "user",
      "resourceId": "usr_01h2xz9k3m4n5p6q7r8s9t0v2b",
      "success": false,
      "metadata": {
        "ipAddress": "10.0.0.50",
        "userAgent": "Mozilla/5.0...",
        "reason": "Invalid password"
      },
      "createdAt": "2025-10-26T10:25:00.000Z"
    },
    {
      "id": "aud_01h2xz9k3m4n5p6q7r8s9t0v3c",
      "organisationId": "org_01h2xz9k3m4n5p6q7r8s9t0v1x",
      "userId": "usr_01h2xz9k3m4n5p6q7r8s9t0v1y",
      "clientId": null,
      "eventType": "user.update",
      "eventCategory": "user",
      "action": "update",
      "resourceType": "user",
      "resourceId": "usr_01h2xz9k3m4n5p6q7r8s9t0v2b",
      "success": true,
      "metadata": {
        "changes": {
          "email": "newemail@example.com",
          "firstName": "UpdatedName"
        }
      },
      "createdAt": "2025-10-26T09:15:00.000Z"
    }
  ],
  "total": 3,
  "limit": 50,
  "offset": 0
}
```

### Response Fields

| Field                   | Type           | Description                                                               |
| ----------------------- | -------------- | ------------------------------------------------------------------------- |
| `data`                  | array          | Array of audit log objects                                                |
| `total`                 | number         | Total count of audit logs matching filters                                |
| `limit`                 | number         | Maximum results returned                                                  |
| `offset`                | number         | Number of results skipped                                                 |
| `data[].id`             | string         | Unique audit log identifier                                               |
| `data[].organisationId` | string         | Organisation ID                                                           |
| `data[].userId`         | string \| null | User who performed the action                                             |
| `data[].clientId`       | string \| null | OAuth2 client involved (if applicable)                                    |
| `data[].eventType`      | string         | Specific event type (e.g., `user.login.success`)                          |
| `data[].eventCategory`  | string         | High-level category: `auth`, `user`, `client`, `permission`, `system`     |
| `data[].action`         | string         | Action performed: `create`, `read`, `update`, `delete`, `login`, `logout` |
| `data[].resourceType`   | string         | Type of resource affected                                                 |
| `data[].resourceId`     | string \| null | ID of the resource affected                                               |
| `data[].success`        | boolean        | Whether the action succeeded                                              |
| `data[].metadata`       | object         | Additional context and details                                            |
| `data[].createdAt`      | string         | ISO 8601 timestamp of the event                                           |

## Get Single Audit Log

### Headers

| Header         | Required | Description                       |
| -------------- | -------- | --------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerb_sid`)       |
| `X-CSRF-Token` | Yes      | CSRF token for request validation |

### URL Parameters

| Parameter | Type   | Required | Description  |
| --------- | ------ | -------- | ------------ |
| `id`      | string | Yes      | Audit log ID |

### Example Request

```bash
GET /v1/admin/audit-logs/aud_01h2xz9k3m4n5p6q7r8s9t0v1w
```

### Success Response (200 OK)

```json
{
  "id": "aud_01h2xz9k3m4n5p6q7r8s9t0v1w",
  "organisationId": "org_01h2xz9k3m4n5p6q7r8s9t0v1x",
  "userId": "usr_01h2xz9k3m4n5p6q7r8s9t0v1y",
  "clientId": "cli_01h2xz9k3m4n5p6q7r8s9t0v1z",
  "eventType": "user.login.success",
  "eventCategory": "auth",
  "action": "login",
  "resourceType": "user",
  "resourceId": "usr_01h2xz9k3m4n5p6q7r8s9t0v1y",
  "success": true,
  "metadata": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "mfaUsed": true,
    "sessionId": "ses_01h2xz9k3m4n5p6q7r8s9t0v4d"
  },
  "createdAt": "2025-10-26T10:30:00.000Z"
}
```

## Event Categories and Types

### Authentication Events (`auth`)

- `user.login.success` - Successful user login
- `user.login.failed` - Failed login attempt
- `user.logout` - User logout
- `user.password_reset` - Password reset
- `user.mfa.enabled` - MFA enabled
- `user.mfa.disabled` - MFA disabled
- `oauth2.authorize` - OAuth2 authorization
- `oauth2.token_issued` - Access token issued
- `oauth2.token_refreshed` - Token refreshed

### User Events (`user`)

- `user.created` - User account created
- `user.updated` - User details updated
- `user.deleted` - User account deleted
- `user.blocked` - User account blocked
- `user.unblocked` - User account unblocked
- `user.email_verified` - Email verification completed
- `user.role_assigned` - Role assigned to user
- `user.role_removed` - Role removed from user

### Client Events (`client`)

- `client.created` - OAuth2 client created
- `client.updated` - OAuth2 client updated
- `client.revoked` - OAuth2 client revoked
- `client.secret_regenerated` - Client secret regenerated

### Permission Events (`permission`)

- `role.created` - Role created
- `role.updated` - Role updated
- `role.deleted` - Role deleted
- `permission.granted` - Permission granted
- `permission.revoked` - Permission revoked

### System Events (`system`)

- `system.config_changed` - System configuration changed
- `system.backup_created` - Backup created
- `system.maintenance_started` - Maintenance mode started

## Error Responses

### 401 Unauthorized

User is not authenticated.

```json
{
  "type": "https://cerberus-iam.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required",
  "instance": "/v1/admin/audit-logs"
}
```

### 403 Forbidden

User lacks the required permission.

```json
{
  "type": "https://cerberus-iam.dev/problems/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Missing required permission: audit:read",
  "instance": "/v1/admin/audit-logs"
}
```

### 404 Not Found

Audit log with specified ID not found.

```json
{
  "type": "https://cerberus-iam.dev/problems/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Audit log not found",
  "instance": "/v1/admin/audit-logs/aud_invalid"
}
```

### 400 Bad Request

Invalid query parameters.

```json
{
  "type": "https://cerberus-iam.dev/problems/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid query parameters",
  "errors": [
    {
      "path": ["startDate"],
      "message": "Invalid datetime format"
    }
  ],
  "instance": "/v1/admin/audit-logs"
}
```

## Example Usage

### cURL (Query with Filters)

```bash
curl -X GET "https://api.cerberus-iam.dev/v1/admin/audit-logs?eventCategory=auth&success=true&limit=20" \
  -H "Cookie: cerb_sid=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

### JavaScript (fetch)

```javascript
async function queryAuditLogs(filters) {
  const params = new URLSearchParams(filters);

  const response = await fetch(`https://api.cerberus-iam.dev/v1/admin/audit-logs?${params}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'X-CSRF-Token': getCsrfToken(),
    },
  });

  const { data: logs, total } = await response.json();
  console.log(`Found ${total} audit logs:`, logs);
  return { logs, total };
}

// Usage
const result = await queryAuditLogs({
  eventCategory: 'auth',
  action: 'login',
  startDate: '2025-10-01T00:00:00Z',
  limit: 50,
});
```

### TypeScript (with Type Safety)

```typescript
interface AuditLog {
  id: string;
  organisationId: string;
  userId: string | null;
  clientId: string | null;
  eventType: string;
  eventCategory: 'auth' | 'user' | 'client' | 'permission' | 'system';
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout';
  resourceType: string;
  resourceId: string | null;
  success: boolean;
  metadata: Record<string, any>;
  createdAt: string;
}

interface AuditLogFilters {
  userId?: string;
  clientId?: string;
  eventType?: string;
  eventCategory?: 'auth' | 'user' | 'client' | 'permission' | 'system';
  action?: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout';
  resourceType?: string;
  resourceId?: string;
  success?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

async function getAuditLogs(
  filters?: AuditLogFilters,
): Promise<{ data: AuditLog[]; total: number }> {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, String(value));
      }
    });
  }

  const response = await fetch(`https://api.cerberus-iam.dev/v1/admin/audit-logs?${params}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'X-CSRF-Token': getCsrfToken(),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch audit logs');
  }

  return response.json();
}

// Usage
const { data: logs, total } = await getAuditLogs({
  eventCategory: 'auth',
  success: false,
  startDate: '2025-10-01T00:00:00Z',
  limit: 100,
});
```

### Python (requests)

```python
import requests
from typing import Dict, List, Any, Optional
from datetime import datetime

class AuditLogClient:
    def __init__(self, base_url: str, session_cookie: str, csrf_token: str):
        self.base_url = base_url
        self.session_cookie = session_cookie
        self.csrf_token = csrf_token

    def query_audit_logs(
        self,
        event_category: Optional[str] = None,
        action: Optional[str] = None,
        success: Optional[bool] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Query audit logs with filters."""
        params = {
            'limit': limit,
            'offset': offset
        }

        if event_category:
            params['eventCategory'] = event_category
        if action:
            params['action'] = action
        if success is not None:
            params['success'] = str(success).lower()
        if start_date:
            params['startDate'] = start_date.isoformat()
        if end_date:
            params['endDate'] = end_date.isoformat()

        response = requests.get(
            f'{self.base_url}/v1/admin/audit-logs',
            params=params,
            cookies={'cerb_sid': self.session_cookie},
            headers={'X-CSRF-Token': self.csrf_token}
        )

        response.raise_for_status()
        return response.json()

    def get_audit_log(self, log_id: str) -> Dict[str, Any]:
        """Get a single audit log by ID."""
        response = requests.get(
            f'{self.base_url}/v1/admin/audit-logs/{log_id}',
            cookies={'cerb_sid': self.session_cookie},
            headers={'X-CSRF-Token': self.csrf_token}
        )

        response.raise_for_status()
        return response.json()

# Usage
client = AuditLogClient(
    base_url='https://api.cerberus-iam.dev',
    session_cookie='abc123...',
    csrf_token='xyz789...'
)

# Query failed login attempts
result = client.query_audit_logs(
    event_category='auth',
    action='login',
    success=False,
    start_date=datetime(2025, 10, 1),
    limit=50
)

print(f"Found {result['total']} failed login attempts")
for log in result['data']:
    print(f"- {log['createdAt']}: {log['metadata'].get('reason')}")
```

## Notes

- Audit logs are immutable and cannot be modified or deleted
- Logs are automatically filtered by the authenticated user's organisation (tenant isolation)
- All sensitive actions (login, password changes, permission changes) are automatically logged
- Metadata fields vary by event type and contain relevant contextual information
- Audit logs are retained according to your organisation's data retention policy
- IP addresses and user agents are captured for security monitoring
- Failed actions (success: false) include reason information in metadata

## Compliance and Retention

For information about audit log retention and compliance requirements, see:

- [Data Retention Policy](/legal/data-retention)
- [Compliance Workstream](/legal/compliance-workstream)
