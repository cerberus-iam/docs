# User Role Management

Assign and unassign roles to/from users.

## Endpoints

- [Assign Role](#assign-role)
- [Unassign Role](#unassign-role)

---

## Assign Role

Assign a role to a user.

### Endpoint

```
POST /v1/admin/users/:id/roles
```

### Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `users:update`

### Security

- CSRF protection enabled (requires valid CSRF token)
- Tenant isolation enforced (can only assign roles to users in the same organisation)
- Role must belong to the same organisation

### Request

#### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerberus_session`) |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |
| `Content-Type` | Yes      | Must be `application/json`          |

#### Path Parameters

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `id`      | string | Yes      | User identifier |

#### Request Body

```json
{
  "roleId": "rol_01h2xz9k3m4n5p6q7r8s9t0v1y"
}
```

| Field    | Type   | Required | Description               |
| -------- | ------ | -------- | ------------------------- |
| `roleId` | string | Yes      | Role identifier to assign |

### Success Response (200 OK)

```json
{
  "message": "Role assigned successfully"
}
```

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "type": "https://cerberus-iam.dev/problems/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid input",
  "instance": "/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w/roles"
}
```

#### 401 Unauthorized

```json
{
  "type": "https://cerberus-iam.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required",
  "instance": "/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w/roles"
}
```

#### 403 Forbidden

```json
{
  "type": "https://cerberus-iam.dev/problems/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Missing required permission: users:update",
  "instance": "/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w/roles"
}
```

### Example Usage

#### cURL

```bash
curl -X POST https://api.cerberus-iam.dev/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w/roles \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "rol_01h2xz9k3m4n5p6q7r8s9t0v1y"
  }'
```

#### JavaScript (fetch)

```javascript
const userId = 'usr_01h2xz9k3m4n5p6q7r8s9t0v1w';
const roleId = 'rol_01h2xz9k3m4n5p6q7r8s9t0v1y';

const response = await fetch(`https://api.cerberus-iam.dev/v1/admin/users/${userId}/roles`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ roleId }),
});

const result = await response.json();
console.log(result.message);
```

#### Python (requests)

```python
import requests

user_id = 'usr_01h2xz9k3m4n5p6q7r8s9t0v1w'
role_id = 'rol_01h2xz9k3m4n5p6q7r8s9t0v1y'

response = requests.post(
    f'https://api.cerberus-iam.dev/v1/admin/users/{user_id}/roles',
    cookies={'cerberus_session': 'abc123...'},
    headers={
        'X-CSRF-Token': 'xyz789...',
        'Content-Type': 'application/json'
    },
    json={'roleId': role_id}
)

result = response.json()
print(result['message'])
```

---

## Unassign Role

Remove a role from a user.

### Endpoint

```
DELETE /v1/admin/users/:id/roles
```

### Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Required Permission**: `users:update`

### Security

- CSRF protection enabled (requires valid CSRF token)
- Tenant isolation enforced (can only unassign roles from users in the same organisation)

### Request

#### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerberus_session`) |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |
| `Content-Type` | Yes      | Must be `application/json`          |

#### Path Parameters

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `id`      | string | Yes      | User identifier |

#### Request Body

```json
{
  "roleId": "rol_01h2xz9k3m4n5p6q7r8s9t0v1y"
}
```

| Field    | Type   | Required | Description                 |
| -------- | ------ | -------- | --------------------------- |
| `roleId` | string | Yes      | Role identifier to unassign |

### Success Response (200 OK)

```json
{
  "message": "Role unassigned successfully"
}
```

### Error Responses

#### 400 Bad Request - Validation Error

```json
{
  "type": "https://cerberus-iam.dev/problems/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid input",
  "instance": "/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w/roles"
}
```

#### 401 Unauthorized

```json
{
  "type": "https://cerberus-iam.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required",
  "instance": "/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w/roles"
}
```

#### 403 Forbidden

```json
{
  "type": "https://cerberus-iam.dev/problems/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Missing required permission: users:update",
  "instance": "/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w/roles"
}
```

### Example Usage

#### cURL

```bash
curl -X DELETE https://api.cerberus-iam.dev/v1/admin/users/usr_01h2xz9k3m4n5p6q7r8s9t0v1w/roles \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "rol_01h2xz9k3m4n5p6q7r8s9t0v1y"
  }'
```

#### JavaScript (fetch)

```javascript
const userId = 'usr_01h2xz9k3m4n5p6q7r8s9t0v1w';
const roleId = 'rol_01h2xz9k3m4n5p6q7r8s9t0v1y';

const response = await fetch(`https://api.cerberus-iam.dev/v1/admin/users/${userId}/roles`, {
  method: 'DELETE',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ roleId }),
});

const result = await response.json();
console.log(result.message);
```

#### Python (requests)

```python
import requests

user_id = 'usr_01h2xz9k3m4n5p6q7r8s9t0v1w'
role_id = 'rol_01h2xz9k3m4n5p6q7r8s9t0v1y'

response = requests.delete(
    f'https://api.cerberus-iam.dev/v1/admin/users/{user_id}/roles',
    cookies={'cerberus_session': 'abc123...'},
    headers={
        'X-CSRF-Token': 'xyz789...',
        'Content-Type': 'application/json'
    },
    json={'roleId': role_id}
)

result = response.json()
print(result['message'])
```

## Notes

- Users can have multiple roles assigned simultaneously
- Assigning a role that's already assigned is idempotent (succeeds without error)
- Unassigning a role that's not assigned is idempotent (succeeds without error)
- The effective permissions for a user are the union of all permissions from all assigned roles
- Be cautious when removing roles - users may lose access to critical functionality
- Consider the impact on active sessions when modifying user roles
- Role changes take effect immediately for new requests
- Existing JWT tokens may retain old permissions until they expire
- An audit log entry may be created for role assignment/unassignment operations
