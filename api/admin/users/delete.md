# Delete User

Soft-delete a user from the organisation. The user's data is retained but marked as deleted.

## Endpoint

```
DELETE /v1/admin/users/:id
```

## Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `users:delete`

## Security

- CSRF protection enabled (requires valid CSRF token)
- Tenant isolation enforced (can only delete users in the same organisation)
- Soft delete - data is retained for audit and recovery purposes

## Request

### Headers

| Header         | Required | Description                       |
| -------------- | -------- | --------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerb_sid`)       |
| `X-CSRF-Token` | Yes      | CSRF token for request validation |

### Path Parameters

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `id`      | string | Yes      | User identifier |

### Query Parameters

None

### Request Body

None

## Response

### Success Response (204 No Content)

Empty response body. User has been successfully soft-deleted.

## Error Responses

### 401 Unauthorized

User is not authenticated.

```json
{
  "type": "https://cerberus-iam.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required",
  "instance": "/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w"
}
```

### 403 Forbidden

User lacks the required permission or CSRF token is invalid.

```json
{
  "type": "https://cerberus-iam.dev/problems/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Missing required permission: users:delete",
  "instance": "/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w"
}
```

### 404 Not Found

User does not exist or does not belong to the same organisation.

```json
{
  "type": "https://cerberus-iam.dev/problems/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "User not found",
  "instance": "/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w"
}
```

## Example Usage

### cURL

```bash
curl -X DELETE https://api.cerberus-iam.dev/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w \
  -H "Cookie: cerb_sid=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

### JavaScript (fetch)

```javascript
const userId = 'usr_01h2xz9k3m4n5p6q7r8s9t0v1w';

const response = await fetch(`https://api.cerberus-iam.dev/v1/admin/users/${userId}`, {
  method: 'DELETE',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
  },
});

if (response.ok) {
  console.log('User deleted successfully');
} else {
  const error = await response.json();
  console.error('Failed to delete user:', error.detail);
}
```

### Python (requests)

```python
import requests

user_id = 'usr_01h2xz9k3m4n5p6q7r8s9t0v1w'

response = requests.delete(
    f'https://api.cerberus-iam.dev/v1/admin/users/{user_id}',
    cookies={'cerb_sid': 'abc123...'},
    headers={'X-CSRF-Token': 'xyz789...'}
)

if response.status_code == 204:
    print('User deleted successfully')
else:
    error = response.json()
    print(f"Error: {error['detail']}")
```

## Notes

- This is a **soft delete** operation - the user record is marked as deleted but retained in the database
- Soft-deleted users will not appear in list or get operations
- All active sessions for the user are terminated upon deletion
- The user's email address remains reserved and cannot be reused for new accounts
- An audit log entry is created for this action with the deleter's information
- Tenant isolation ensures users can only delete users within their organisation
- The deleter's user ID, IP address, and user agent are recorded in the audit log
- Consider blocking users instead of deleting if temporary suspension is desired
- Hard deletion (permanent data removal) requires direct database access and is not exposed via the API
- Related data (sessions, tokens, audit logs) may be handled according to the service's data retention policy
