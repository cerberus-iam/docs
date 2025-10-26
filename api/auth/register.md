# Register

Create a new organisation and owner account.

## Endpoint

```
POST /api/v1/auth/register
```

## Description

Registers a new organisation with an owner account. This is the first step for new customers to onboard to Cerberus IAM. The endpoint creates:

1. A new organisation with the specified slug and name
2. An "Owner" role with full permissions
3. An owner user account with hashed password
4. Email verification token (sent via email)

The organisation is created with a "trial" status and default session settings.

## Authentication

**Required:** No (public endpoint)

## Headers

| Header         | Required | Description                |
| -------------- | -------- | -------------------------- |
| `Content-Type` | Yes      | Must be `application/json` |

**Note:** `X-Org-Slug` header is NOT required for registration (organisation doesn't exist yet).

## Request Body

| Field              | Type   | Required | Description                      | Constraints                                                |
| ------------------ | ------ | -------- | -------------------------------- | ---------------------------------------------------------- |
| `organisationName` | string | Yes      | Display name of the organisation | Minimum 1 character                                        |
| `organisationSlug` | string | Yes      | URL-safe unique identifier       | Lowercase alphanumeric and hyphens only (`/^[a-z0-9-]+$/`) |
| `email`            | string | Yes      | Owner's email address            | Valid email format                                         |
| `firstName`        | string | Yes      | Owner's first name               | Minimum 1 character                                        |
| `lastName`         | string | Yes      | Owner's last name                | Minimum 1 character                                        |
| `password`         | string | Yes      | Owner's password                 | Minimum 8 characters, must meet strength requirements      |

### Password Strength Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (recommended but may not be enforced)

### Example Request

```json
{
  "organisationName": "Acme Corporation",
  "organisationSlug": "acme-corp",
  "email": "admin@acme.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePass123!"
}
```

## Response

### Success Response

**Status Code:** `201 Created`

```json
{
  "message": "Organisation and owner account created successfully",
  "organisation": {
    "id": "org_a1b2c3d4e5f6",
    "slug": "acme-corp",
    "name": "Acme Corporation"
  },
  "user": {
    "id": "usr_x1y2z3a4b5c6",
    "email": "admin@acme.com",
    "name": "John Doe"
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid Input

**Missing required field:**

```json
{
  "type": "https://cerberus.local/errors/bad-request",
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

**Invalid organisation slug format:**

```json
{
  "type": "https://cerberus.local/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid input",
  "errors": [
    {
      "code": "invalid_string",
      "validation": "regex",
      "path": ["organisationSlug"],
      "message": "Invalid"
    }
  ]
}
```

**Password too weak:**

```json
{
  "type": "https://cerberus.local/errors/bad-request",
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
  "type": "https://cerberus.local/errors/conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "Email already registered"
}
```

**Organisation slug already taken:**

```json
{
  "type": "https://cerberus.local/errors/conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "Organisation slug already taken"
}
```

#### 429 Too Many Requests

**Rate limit exceeded:**

```json
{
  "type": "https://cerberus.local/errors/rate-limit-exceeded",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Please try again later.",
  "retryAfter": 30
}
```

**Rate limits:** 30 requests per 60 seconds (authentication endpoint limit)

#### 500 Internal Server Error

**Signup failed:**

```json
{
  "type": "https://cerberus.local/errors/signup-failed",
  "title": "Signup Failed",
  "status": 500,
  "detail": "Failed to create account"
}
```

## Side Effects

1. **Organisation created** with:
   - Status: `trial`
   - Session lifetime: 3600 seconds (1 hour)
   - Session idle timeout: 1800 seconds (30 minutes)
   - MFA requirement: `false` (optional by default)

2. **Owner role created** with:
   - Name: "Owner"
   - Slug: "owner"
   - All permissions granted

3. **User account created** with:
   - Password hashed using Argon2id
   - Identity provider: `local`
   - Email verification status: unverified

4. **Email verification token generated** and sent to the provided email address

5. **Audit log entry created** (if audit logging is enabled)

## Next Steps

After successful registration:

1. **Verify email:** Check email inbox for verification link
2. **Click verification link:** Completes email verification (see [verify-email.md](./verify-email.md))
3. **Login:** Use credentials to login (see [login.md](./login.md))

## Code Examples

### cURL

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organisationName": "Acme Corporation",
    "organisationSlug": "acme-corp",
    "email": "admin@acme.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "SecurePass123!"
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:4000/api/v1/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    organisationName: 'Acme Corporation',
    organisationSlug: 'acme-corp',
    email: 'admin@acme.com',
    firstName: 'John',
    lastName: 'Doe',
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
  organisationName: string;
  organisationSlug: string;
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
  const response = await fetch('http://localhost:4000/api/v1/auth/register', {
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
      if (problem.detail.includes('Email')) {
        throw new Error('This email is already registered');
      } else if (problem.detail.includes('slug')) {
        throw new Error('This organisation slug is already taken');
      }
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

// Usage
try {
  const result = await register({
    organisationName: 'Acme Corporation',
    organisationSlug: 'acme-corp',
    email: 'admin@acme.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'SecurePass123!',
  });

  console.log('Success:', result);
  // Redirect to email verification page or login
} catch (error) {
  console.error('Registration failed:', error.message);
  // Show error to user
}
```

## Security Considerations

1. **Password Hashing:** Passwords are hashed using Argon2id before storage
2. **Rate Limiting:** Endpoint is rate-limited to prevent abuse
3. **Email Verification:** Users must verify their email before full access
4. **Slug Uniqueness:** Organisation slugs must be globally unique
5. **Input Validation:** All inputs are validated using Zod schemas
6. **SQL Injection Protection:** Prisma ORM prevents SQL injection
7. **HTTPS Required:** Always use HTTPS in production

## Related Endpoints

- [POST /api/v1/auth/login](./login.md) - Login with credentials
- [GET /api/v1/auth/verify-email](./verify-email.md) - Verify email address
- [POST /api/v1/auth/forgot-password](./password-reset.md) - Request password reset
