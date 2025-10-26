# Invitations Management

Invite users to join the organisation via email.

## Endpoints

- [List Invitations](#list-invitations)
- [Create Invitation](#create-invitation)
- [Resend Invitation](#resend-invitation)
- [Cancel Invitation](#cancel-invitation)

---

## List Invitations

Retrieve all pending and accepted invitations for the organisation.

### Endpoint

```
GET /v1/admin/invitations
```

### Authentication

- **Required**: Yes
- **Required Permission**: `invitations:read`

### Response (200 OK)

```json
{
  "data": [
    {
      "id": "inv_01h2xz9k3m4n5p6q7r8s9t0v2k",
      "email": "new.hire@example.com",
      "roleId": "rol_01h2xz9k3m4n5p6q7r8s9t0v1y",
      "teamIds": ["tem_01h2xz9k3m4n5p6q7r8s9t0v1z"],
      "status": "pending",
      "invitedById": "usr_01h2xz9k3m4n5p6q7r8s9t0v1w",
      "invitedBy": {
        "id": "usr_01h2xz9k3m4n5p6q7r8s9t0v1w",
        "email": "admin@example.com",
        "name": "Admin User"
      },
      "expiresAt": "2025-11-02T12:00:00.000Z",
      "acceptedAt": null,
      "createdAt": "2025-10-26T12:00:00.000Z",
      "updatedAt": "2025-10-26T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

### Response Fields

| Field        | Type           | Description                               |
| ------------ | -------------- | ----------------------------------------- |
| `status`     | string         | `"pending"`, `"accepted"`, or `"expired"` |
| `expiresAt`  | string         | ISO 8601 expiration timestamp             |
| `acceptedAt` | string \| null | When the invitation was accepted          |

---

## Create Invitation

Send an email invitation to join the organisation.

### Endpoint

```
POST /v1/admin/invitations
```

### Authentication

- **Required**: Yes
- **Required Permission**: `invitations:create`

### Request Body

```json
{
  "email": "new.hire@example.com",
  "roleId": "rol_01h2xz9k3m4n5p6q7r8s9t0v1y",
  "teamIds": ["tem_01h2xz9k3m4n5p6q7r8s9t0v1z"],
  "expiresInDays": 7
}
```

| Field           | Type   | Required | Description                                         |
| --------------- | ------ | -------- | --------------------------------------------------- |
| `email`         | string | Yes      | Email address to invite                             |
| `roleId`        | string | Yes      | Role to assign upon acceptance                      |
| `teamIds`       | array  | No       | Teams to add user to                                |
| `expiresInDays` | number | No       | Days until invitation expires (default: 7, max: 30) |

### Response (201 Created)

```json
{
  "id": "inv_01h2xz9k3m4n5p6q7r8s9t0v2l",
  "email": "new.hire@example.com",
  "roleId": "rol_01h2xz9k3m4n5p6q7r8s9t0v1y",
  "teamIds": ["tem_01h2xz9k3m4n5p6q7r8s9t0v1z"],
  "status": "pending",
  "invitedById": "usr_01h2xz9k3m4n5p6q7r8s9t0v1w",
  "expiresAt": "2025-11-02T12:00:00.000Z",
  "acceptedAt": null,
  "createdAt": "2025-10-26T12:00:00.000Z",
  "updatedAt": "2025-10-26T12:00:00.000Z"
}
```

**Note**: The invitation `token` is not returned in the response. It's sent via email to the recipient.

### Example

```bash
curl -X POST https://api.cerberus-iam.dev/v1/admin/invitations \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new.hire@example.com",
    "roleId": "rol_01h2xz9k3m4n5p6q7r8s9t0v1y",
    "expiresInDays": 7
  }'
```

### Errors

- **400 Bad Request**: User with this email already exists
- **400 Bad Request**: Pending invitation already exists for this email

---

## Resend Invitation

Resend an invitation email to a pending invitation.

### Endpoint

```
POST /v1/admin/invitations/:id/resend
```

### Authentication

- **Required**: Yes
- **Required Permission**: `invitations:create`

### Response (200 OK)

```json
{
  "message": "Invitation resent successfully",
  "invitation": {
    "id": "inv_01h2xz9k3m4n5p6q7r8s9t0v2l",
    "email": "new.hire@example.com",
    "status": "pending",
    "expiresAt": "2025-11-02T12:00:00.000Z"
  }
}
```

### Example

```bash
curl -X POST https://api.cerberus-iam.dev/v1/admin/invitations/inv_01h2xz9k3m4n5p6q7r8s9t0v2l/resend \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

### Notes

- Only pending invitations can be resent
- Resending generates a new token and invalidates the old one
- The expiration date is extended from the current time

---

## Cancel Invitation

Cancel a pending invitation.

### Endpoint

```
DELETE /v1/admin/invitations/:id
```

### Authentication

- **Required**: Yes
- **Required Permission**: `invitations:delete`

### Response (204 No Content)

Empty response on success.

### Example

```bash
curl -X DELETE https://api.cerberus-iam.dev/v1/admin/invitations/inv_01h2xz9k3m4n5p6q7r8s9t0v2l \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..."
```

### Notes

- Only pending invitations can be cancelled
- Accepted invitations cannot be cancelled (user already exists)
- Expired invitations are automatically marked as expired

## Invitation Acceptance Flow

Users accept invitations via the public endpoint (no authentication required):

```
POST /v1/auth/invitations/accept
```

**Request Body:**

```json
{
  "token": "inv_token_abc123...",
  "firstName": "Jane",
  "lastName": "Doe",
  "password": "SecureP@ssw0rd123"
}
```

**Response (201 Created):**

```json
{
  "message": "Invitation accepted successfully",
  "user": {
    "id": "usr_01h2xz9k3m4n5p6q7r8s9t0v3y",
    "email": "new.hire@example.com",
    "name": "Jane Doe"
  }
}
```

## Invitation Email Template

The invitation email includes:

- Organisation name
- Inviter's name
- Link to accept invitation (with embedded token)
- Expiration date
- Instructions for account setup

## Notes

- Invitations are tenant-scoped (organisation-specific)
- Multiple pending invitations for the same email are prevented
- Expired invitations cannot be accepted
- Accepting an invitation creates a new user account
- The user is automatically assigned the specified role and teams
- Invitation tokens are securely hashed in the database
- Default expiration: 7 days (configurable up to 30 days)
- An audit log entry is created when invitations are sent, accepted, or cancelled
