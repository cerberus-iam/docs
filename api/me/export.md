# Export User Data

Export all personal data for the authenticated user in compliance with data portability requirements (e.g., GDPR Article 20).

## Endpoint

```
GET /v1/me/export
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Permissions**: None (users can export their own data)

## Security

- No CSRF protection (GET request)
- Session must be active and valid
- Only returns data for the authenticated user

## Request

### Headers

| Header   | Required | Description                 |
| -------- | -------- | --------------------------- |
| `Cookie` | Yes      | Session cookie (`cerb_sid`) |

### Query Parameters

None

### Request Body

None

## Response

### Success Response (200 OK)

```json
{
  "generatedAt": "2025-10-26T12:00:00.000Z",
  "data": {
    "user": {
      "id": "usr_01h2xz9k3m4n5p6q7r8s9t0v1w",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "name": "John Doe",
      "phone": "+1234567890",
      "emailVerified": true,
      "emailVerifiedAt": "2025-01-15T10:30:00.000Z",
      "mfaEnabled": true,
      "createdAt": "2025-01-10T08:00:00.000Z",
      "updatedAt": "2025-10-26T11:45:00.000Z"
    },
    "organisation": {
      "id": "org_01h2xz9k3m4n5p6q7r8s9t0v1x",
      "slug": "acme-corp",
      "name": "Acme Corporation",
      "email": "contact@acme-corp.com"
    },
    "roles": [
      {
        "id": "rol_01h2xz9k3m4n5p6q7r8s9t0v1y",
        "name": "Administrator",
        "slug": "admin",
        "description": "Full system administrator access"
      }
    ],
    "teams": [
      {
        "id": "tem_01h2xz9k3m4n5p6q7r8s9t0v1z",
        "name": "Engineering",
        "slug": "engineering",
        "description": "Engineering team"
      }
    ],
    "sessions": [
      {
        "id": "ses_01h2xz9k3m4n5p6q7r8s9t0v2a",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2025-10-26T10:00:00.000Z",
        "lastActivityAt": "2025-10-26T11:45:00.000Z",
        "expiresAt": "2025-11-02T10:00:00.000Z"
      }
    ],
    "auditLogs": [
      {
        "id": "aud_01h2xz9k3m4n5p6q7r8s9t0v2b",
        "eventType": "user.login",
        "eventCategory": "auth",
        "action": "login",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "success": true,
        "createdAt": "2025-10-26T10:00:00.000Z"
      }
    ],
    "consents": [
      {
        "id": "con_01h2xz9k3m4n5p6q7r8s9t0v2c",
        "clientId": "cli_01h2xz9k3m4n5p6q7r8s9t0v2d",
        "scopes": ["openid", "profile", "email"],
        "grantedAt": "2025-10-20T14:30:00.000Z"
      }
    ],
    "apiTokens": [
      {
        "id": "tok_01h2xz9k3m4n5p6q7r8s9t0v2e",
        "name": "CI/CD Pipeline Token",
        "scopes": ["read:users"],
        "lastUsedAt": "2025-10-26T08:00:00.000Z",
        "expiresAt": "2026-10-26T08:00:00.000Z",
        "createdAt": "2025-10-26T08:00:00.000Z"
      }
    ]
  }
}
```

### Response Fields

| Field               | Type   | Description                                  |
| ------------------- | ------ | -------------------------------------------- |
| `generatedAt`       | string | ISO 8601 timestamp when export was generated |
| `data`              | object | Container for all exported data              |
| `data.user`         | object | User profile information                     |
| `data.organisation` | object | Organisation the user belongs to             |
| `data.roles`        | array  | Roles assigned to the user                   |
| `data.teams`        | array  | Teams the user is a member of                |
| `data.sessions`     | array  | All active sessions for the user             |
| `data.auditLogs`    | array  | Audit trail of user activities               |
| `data.consents`     | array  | OAuth consent grants given by the user       |
| `data.apiTokens`    | array  | Personal API tokens created by the user      |

#### User Object Fields

| Field             | Type           | Description                               |
| ----------------- | -------------- | ----------------------------------------- |
| `id`              | string         | User identifier                           |
| `email`           | string         | Email address                             |
| `firstName`       | string         | First name                                |
| `lastName`        | string         | Last name                                 |
| `name`            | string         | Full name                                 |
| `phone`           | string \| null | Phone number                              |
| `emailVerified`   | boolean        | Email verification status                 |
| `emailVerifiedAt` | string \| null | ISO 8601 timestamp of email verification  |
| `mfaEnabled`      | boolean        | MFA enablement status                     |
| `createdAt`       | string         | ISO 8601 timestamp of account creation    |
| `updatedAt`       | string         | ISO 8601 timestamp of last profile update |

## Error Responses

### 401 Unauthorized

User is not authenticated or session is invalid.

```json
{
  "type": "https://cerberus-iam.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required",
  "instance": "/v1/me/export"
}
```

### 404 Not Found

User account not found (rare edge case).

```json
{
  "type": "https://cerberus-iam.dev/problems/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "User not found",
  "instance": "/v1/me/export"
}
```

## Example Usage

### cURL

```bash
curl -X GET https://api.cerberus-iam.dev/v1/me/export \
  -H "Cookie: cerb_sid=abc123..." \
  -o user-data-export.json
```

### JavaScript (fetch)

```javascript
const response = await fetch('https://api.cerberus-iam.dev/v1/me/export', {
  method: 'GET',
  credentials: 'include',
});

const exportData = await response.json();

// Download as JSON file
const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `cerberus-data-export-${new Date().toISOString()}.json`;
a.click();
```

### Python (requests)

```python
import requests
import json
from datetime import datetime

response = requests.get(
    'https://api.cerberus-iam.dev/v1/me/export',
    cookies={'cerb_sid': 'abc123...'}
)

export_data = response.json()

# Save to file
filename = f"cerberus-data-export-{datetime.now().isoformat()}.json"
with open(filename, 'w') as f:
    json.dump(export_data, f, indent=2)

print(f"Data exported to {filename}")
```

## Notes

- This endpoint complies with GDPR Article 20 (Right to Data Portability)
- The export includes all personal data stored in the system
- No sensitive credentials (passwords, API keys, MFA secrets) are included in the export
- The export is generated in real-time and includes current data
- Users should store the export securely as it contains sensitive information
- Audit logs may be filtered to a recent time period (e.g., last 90 days) to prevent excessively large exports
- The `generatedAt` timestamp indicates when the export was created
- This endpoint does not require CSRF protection as it's a read-only GET request
- Consider rate-limiting this endpoint to prevent abuse
