# Onboard Organisation

Create a new organisation alongside the first owner user. This endpoint provisions core tenant resources, seeds default RBAC roles, and returns onboarding defaults for future invitations.

## Endpoint

```http
POST /v1/auth/onboard
```

## Description

The onboarding endpoint creates a new tenant and an owner account in a single transaction. It performs the following steps:

1. Validates the payload and password strength
2. Generates a unique organisation slug
3. Creates the organisation with baseline configuration values
4. Seeds the default RBAC roles configured in `config/roles-permissions-mapping.json`
5. Creates an owner user and assigns the Owner role
6. Marks the owner as the organisation proprietor (`ownerId`)
7. Issues an authenticated session and CSRF token for immediate access

## Authentication

**Required:** No (public endpoint)

## Headers

| Header         | Required | Description                |
| -------------- | -------- | -------------------------- |
| `Content-Type` | Yes      | Must be `application/json` |

## Request Body

| Field              | Type   | Required | Description                              | Constraints                                           |
| ------------------ | ------ | -------- | ---------------------------------------- | ----------------------------------------------------- |
| `organisationName` | string | Yes      | Display name for the new organisation    | Minimum 1 character                                   |
| `email`            | string | Yes      | Owner's email address                    | Valid email format, must be globally unique           |
| `firstName`        | string | Yes      | Owner's first name                       | Minimum 1 character                                   |
| `lastName`         | string | Yes      | Owner's last name                        | Minimum 1 character                                   |
| `password`         | string | Yes      | Owner's password                         | Minimum 8 characters, must meet strength requirements |
| `metadata`         | object | No       | Arbitrary organisation metadata (stored) | JSON object                                           |

### Password Strength Requirements

The password must meet **all** of the following criteria:

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&\*(),.?":{}|<>)

### Example Request

```json
{
  "organisationName": "Identity Workspace",
  "email": "owner@example.com",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "password": "SecurePassword123!"
}
```

## Response

### Success Response

**Status Code:** `201 Created`

```json
{
  "message": "Organisation onboarded successfully",
  "organisation": {
    "id": "org_a1b2c3d4e5f6",
    "slug": "identity-workspace",
    "name": "Identity Workspace",
    "configs": {
      "allowedCallbackUrls": [],
      "allowedLogoutUrls": [],
      "allowedOrigins": [],
      "sessionLifetime": 3600,
      "sessionIdleTimeout": 1800,
      "requireMfa": false,
      "allowedMfaMethods": [],
      "passwordPolicy": null,
      "tokenLifetimePolicy": null,
      "branding": null,
      "metadata": null
    }
  },
  "user": {
    "id": "usr_x1y2z3a4b5c6",
    "email": "owner@example.com",
    "name": "Ada Lovelace"
  },
  "roles": [
    {
      "id": "role_owner",
      "name": "Owner",
      "slug": "owner",
      "description": "Organization owner with limited administrative access",
      "isDefault": false,
      "createdAt": "2025-11-12T10:00:00.000Z",
      "updatedAt": "2025-11-12T10:00:00.000Z",
      "permissions": [
        { "id": "perm_manage_users", "slug": "users:update", "name": "Update Users" }
      ],
      "_count": { "users": 1 }
    }
  ],
  "invitationDefaults": {
    "roleId": "role_staff",
    "expiresInHours": 168,
    "maxUses": 1
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid Input

```json
{
  "type": "https://api.cerberus-iam.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid input",
  "errors": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["organisationName"],
      "message": "Required"
    }
  ]
}
```

#### 400 Bad Request - Password Too Weak

```json
{
  "type": "https://api.cerberus-iam.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Password too weak",
  "errors": [
    "Password must be at least 8 characters",
    "Password must contain at least one uppercase letter",
    "Password must contain at least one number",
    "Password must contain at least one special character"
  ]
}
```

#### 409 Conflict - Duplicate Organisation or User

```json
{
  "type": "https://api.cerberus-iam.com/errors/conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "An organisation with this name or email already exists"
}
```

## Side Effects

On successful onboarding:

1. **Organisation created** with generated slug, default session policies, and empty configuration arrays.
2. **Default roles provisioned** according to `roles-permissions-mapping.json` with `Staff` marked as the default invite role.
3. **Owner user created** with an Argon2id hashed password and email auto-verified.
4. **Owner assigned** to the organisation (`ownerId`), given the Owner role and logged in via session cookie.
5. **Session created** and returned as a secure cookie using the configured session lifetime.

## Next Steps

1. Use the returned session to call authenticated endpoints such as [`GET /v1/me/profile`](../me/profile.md).
2. Review or update organisation configuration via admin endpoints.
3. Send invitations using `POST /v1/admin/invitations` with the provided `invitationDefaults.roleId` if applicable.
4. Configure allowed origins, callback URLs, and MFA policies as needed.

## Security Considerations

- The endpoint is rate-limited with the authentication policy (`AUTH_RATE_MAX`/`AUTH_RATE_WINDOW_SEC`).
- Passwords are hashed with Argon2id; store only the hash.
- A session cookie (`cerb_sid`) is issued immediately after onboarding; handle it over HTTPS in production.
- Ensure the organisation slug is unique; the server generates suffixed slugs automatically.
