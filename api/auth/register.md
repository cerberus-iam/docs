# Register (Accept Invitation)

Accept an invitation to join an existing organisation.

## Endpoint

```
POST /v1/auth/register
```

## Description

Accepts an invitation to join an existing organisation. This endpoint creates a new user account based on an invitation sent by an organisation administrator. The endpoint:

1. Validates the invitation token
2. Verifies the invitation hasn't expired or been accepted
3. Confirms the provided email matches the invitation
4. Creates a user account with the provided details
5. Associates the user with the specified role and teams
6. Marks the invitation as accepted
7. Auto-verifies the user's email address

**Note:** This endpoint was previously used for creating new organisations. It now exclusively handles invitation-based registration. Users created through this endpoint join existing organisations rather than creating new ones.

## Authentication

**Required:** No (uses invitation token)

## Headers

| Header         | Required | Description                |
| -------------- | -------- | -------------------------- |
| `Content-Type` | Yes      | Must be `application/json` |

## Request Body

| Field       | Type   | Required | Description                            | Constraints                                           |
| ----------- | ------ | -------- | -------------------------------------- | ----------------------------------------------------- |
| `token`     | string | Yes      | Invitation token from invitation email | Minimum 1 character                                   |
| `email`     | string | Yes      | Email address (must match invitation)  | Valid email format                                    |
| `firstName` | string | Yes      | User's first name                      | Minimum 1 character                                   |
| `lastName`  | string | Yes      | User's last name                       | Minimum 1 character                                   |
| `password`  | string | Yes      | User's password                        | Minimum 8 characters, must meet strength requirements |

### Password Strength Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (recommended but may not be enforced)

### Example Request

```json
{
  "token": "inv_a1b2c3d4e5f6g7h8",
  "email": "jane.smith@acme.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "password": "SecurePass123!"
}
```

## Response

### Success Response

**Status Code:** `201 Created`

```json
{
  "message": "Account created successfully",
  "organisation": {
    "id": "org_a1b2c3d4e5f6",
    "slug": "acme-corporation",
    "name": "Acme Corporation"
  },
  "user": {
    "id": "usr_x1y2z3a4b5c6",
    "email": "jane.smith@acme.com",
    "name": "Jane Smith"
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid Input

**Missing required field:**

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
      "path": ["email"],
      "message": "Required"
    }
  ]
}
```

**Invalid invitation token:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid invitation token"
}
```

**Invitation expired:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invitation has expired"
}
```

**Password too weak:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Password too weak",
  "errors": [
    "Password must be at least 8 characters",
    "Password must contain at least one uppercase letter",
    "Password must contain at least one number"
  ]
}
```

#### 409 Conflict - Resource Already Exists

**Email already registered:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "Email already registered"
}
```

**Invitation already accepted:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "Invitation has already been accepted"
}
```

**Email mismatch:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "Email is not associated with this invitation"
}
```

#### 429 Too Many Requests

**Rate limit exceeded:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/rate-limit",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Please try again later."
}
```

**Rate limits:** 30 requests per 60 seconds (authentication endpoint limit)

#### 500 Internal Server Error

**Registration failed:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Failed to create account"
}
```

## Invitation Token Details

### Token Source

Invitation tokens are created by organisation administrators through:

- **POST /v1/admin/invitations** - Create invitation (admin only)

### Token Delivery

The invitation email is sent to the invited user containing:

- A link to accept the invitation: `{ISSUER_URL}/auth/accept-invitation?token={token}`
- Organisation name
- Expiration date (default: 7 days)

### Token Properties

- **Length:** 64 characters (32-byte secure random string, hex-encoded)
- **Expiration:** Configurable per invitation (default: 7 days)
- **One-time use:** Token is marked as accepted after successful registration

## Side Effects

On successful registration:

1. **User account created** with:
   - Email from invitation
   - Name from request
   - Password hashed using Argon2id
   - Identity provider: `local`
   - Email automatically verified (no verification step required)
   - Associated with invitation's organisation

2. **Role assigned:**
   - User gets the role specified in the invitation

3. **Teams assigned:**
   - User joins any teams specified in the invitation (if provided)

4. **Invitation marked accepted:**
   - `acceptedAt` timestamp set to current time
   - Token cannot be reused

5. **Audit log entry created:** Registration event logged with organisation context

## Next Steps

After successful registration:

1. **Login:** Use the created credentials to login (see [login.md](./login.md))
2. **Access organisation resources:** User has immediate access based on assigned role
3. **No email verification required:** Email is auto-verified for invited users

## Code Examples

### cURL

```bash
curl -X POST http://localhost:4000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "token": "inv_a1b2c3d4e5f6g7h8",
    "email": "jane.smith@acme.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "password": "SecurePass123!"
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:4000/v1/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: 'inv_a1b2c3d4e5f6g7h8',
    email: 'jane.smith@acme.com',
    firstName: 'Jane',
    lastName: 'Smith',
    password: 'SecurePass123!',
  }),
});

if (!response.ok) {
  const error = await response.json();
  console.error('Registration failed:', error);
  throw new Error(error.detail);
}

const data = await response.json();
console.log('Registration successful:', data);
```

### TypeScript (with error handling)

```typescript
interface RegisterRequest {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface RegisterResponse {
  message: string;
  organisation: {
    id: string;
    slug: string;
    name: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  errors?: any[];
}

async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await fetch('http://localhost:4000/v1/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const problem: ProblemDetails = await response.json();

    // Handle specific errors
    if (problem.status === 409) {
      throw new Error('This email is already registered or invitation already accepted');
    }

    if (problem.status === 400 && problem.errors) {
      // Handle validation errors
      const errorMessages = problem.errors.map((e) => e.message).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    throw new Error(problem.detail || 'Registration failed');
  }

  return response.json();
}

// Usage (typically called from invitation link click)
try {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    throw new Error('No invitation token provided');
  }

  const result = await register({
    token,
    email: 'jane.smith@acme.com',
    firstName: 'Jane',
    lastName: 'Smith',
    password: 'SecurePass123!',
  });

  console.log('Success:', result);
  // Redirect to login page
  window.location.href = '/login';
} catch (error) {
  console.error('Registration failed:', error.message);
  // Show error to user
}
```

## Security Considerations

1. **Password Hashing:** Passwords are hashed using Argon2id before storage
2. **Rate Limiting:** Endpoint is rate-limited to prevent abuse (30 requests per 60 seconds)
3. **Token Validation:** Invitation tokens are validated for:
   - Existence and format
   - Expiration (default: 7 days)
   - Single-use (cannot be reused after acceptance)
   - Email match (provided email must match invitation)
4. **Email Auto-verification:** Users created via invitation have verified emails automatically
5. **Input Validation:** All inputs are validated using Zod schemas
6. **SQL Injection Protection:** Prisma ORM prevents SQL injection
7. **HTTPS Required:** Always use HTTPS in production

## Related Endpoints

- [POST /v1/auth/login](./login.md) - Login with credentials
- [POST /v1/auth/invitations/accept](./invitations.md) - Alternative invitation acceptance endpoint
- [POST /v1/admin/invitations](../admin/invitations.md) - Create invitations (admin only)
