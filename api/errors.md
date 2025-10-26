# Error Responses

Cerberus IAM API uses [RFC 7807 Problem Details for HTTP APIs](https://tools.ietf.org/html/rfc7807) format for all error responses.

## Error Response Format

All errors return a JSON object with the following structure:

```json
{
  "type": "https://cerberus.local/errors/error-type",
  "title": "Human-Readable Error Title",
  "status": 400,
  "detail": "Detailed description of what went wrong",
  "instance": "/v1/resource/id"
}
```

### Fields

| Field      | Type         | Required | Description                                       |
| ---------- | ------------ | -------- | ------------------------------------------------- |
| `type`     | string (URI) | Yes      | URI identifying the error type                    |
| `title`    | string       | Yes      | Short, human-readable summary                     |
| `status`   | integer      | Yes      | HTTP status code                                  |
| `detail`   | string       | Yes      | Explanation specific to this occurrence           |
| `instance` | string (URI) | No       | URI reference identifying the specific occurrence |

Additional fields may be included depending on the error type.

## HTTP Status Codes

### 400 Bad Request

Invalid input, malformed request, or validation errors.

**Error type:** `https://cerberus.local/errors/bad-request`

**Common causes:**

- Missing required fields
- Invalid data types
- Malformed JSON
- Invalid parameter values
- Validation failures

**Example:**

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
      "received": "number",
      "path": ["email"],
      "message": "Expected string, received number"
    }
  ]
}
```

### 401 Unauthorized

Authentication is required or has failed.

**Error type:** `https://cerberus.local/errors/unauthorized`

**Common causes:**

- Missing authentication credentials
- Invalid or expired token
- Invalid username/password
- Session expired
- MFA required but not provided

**Example:**

```json
{
  "type": "https://cerberus.local/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid email or password"
}
```

**With MFA requirement:**

```json
{
  "type": "https://cerberus.local/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Multi-factor authentication required",
  "requiresMfa": true
}
```

**With MFA enrollment requirement:**

```json
{
  "type": "https://cerberus.local/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "MFA enrollment required before logging in",
  "requiresEnrollment": true
}
```

### 403 Forbidden

Authenticated but insufficient permissions.

**Error type:** `https://cerberus.local/errors/forbidden`

**Common causes:**

- Insufficient role/permissions
- Resource belongs to different organisation
- Account suspended or blocked
- Feature not available for current plan

**Example:**

```json
{
  "type": "https://cerberus.local/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "You do not have permission to access this resource"
}
```

### 404 Not Found

Requested resource does not exist.

**Error type:** `https://cerberus.local/errors/not-found`

**Common causes:**

- Resource ID doesn't exist
- Resource was deleted
- Wrong organisation context
- Invalid endpoint path

**Example:**

```json
{
  "type": "https://cerberus.local/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "The requested resource was not found"
}
```

### 409 Conflict

Request conflicts with current server state.

**Error type:** `https://cerberus.local/errors/conflict`

**Common causes:**

- Duplicate email address
- Duplicate organisation slug
- Resource already exists
- Conflicting state transition

**Example:**

```json
{
  "type": "https://cerberus.local/errors/conflict",
  "title": "Conflict",
  "status": 409,
  "detail": "Email already registered"
}
```

### 422 Unprocessable Entity

Request is well-formed but contains semantic errors.

**Error type:** `https://cerberus.local/errors/unprocessable-entity`

**Common causes:**

- Business rule violations
- Password too weak
- Invalid state transitions
- Constraint violations

**Example - Password too weak:**

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

### 429 Too Many Requests

Rate limit exceeded.

**Error type:** `https://cerberus.local/errors/rate-limit-exceeded`

**Example:**

```json
{
  "type": "https://cerberus.local/errors/rate-limit-exceeded",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Please try again later.",
  "retryAfter": 30
}
```

**Response headers:**

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1638360030
Retry-After: 30
```

### 500 Internal Server Error

Unexpected server error.

**Error type:** `https://cerberus.local/errors/internal-server-error`

**Common causes:**

- Unhandled exceptions
- Database connection failures
- External service failures

**Example:**

```json
{
  "type": "https://cerberus.local/errors/internal-server-error",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred"
}
```

**Note:** In production, error details are intentionally vague to avoid leaking sensitive information. Check server logs for detailed error information.

## OAuth2-Specific Errors

OAuth2 endpoints return errors in OAuth2-compliant format (RFC 6749):

```json
{
  "error": "invalid_request",
  "error_description": "Missing required parameter: redirect_uri"
}
```

### OAuth2 Error Codes

| Error Code               | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `invalid_request`        | Missing or invalid parameters                       |
| `invalid_client`         | Client authentication failed                        |
| `invalid_grant`          | Invalid authorization code or refresh token         |
| `unauthorized_client`    | Client not authorized for this grant type           |
| `unsupported_grant_type` | Grant type not supported                            |
| `invalid_scope`          | Requested scope is invalid or exceeds granted scope |

**Example:**

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid or expired authorization code"
}
```

## Validation Errors

Validation errors include detailed information about each validation failure:

```json
{
  "type": "https://cerberus.local/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid input",
  "errors": [
    {
      "code": "invalid_string",
      "validation": "email",
      "path": ["email"],
      "message": "Invalid email"
    },
    {
      "code": "too_small",
      "minimum": 8,
      "path": ["password"],
      "message": "String must contain at least 8 character(s)"
    },
    {
      "code": "invalid_string",
      "validation": "regex",
      "path": ["organisationSlug"],
      "message": "Invalid"
    }
  ]
}
```

### Validation Error Fields

| Field        | Description                                   |
| ------------ | --------------------------------------------- |
| `code`       | Validation error code (from Zod)              |
| `path`       | Array indicating the field path               |
| `message`    | Human-readable error message                  |
| `validation` | Validation type (e.g., "email", "regex")      |
| `minimum`    | Minimum value (for length/number validations) |
| `maximum`    | Maximum value (for length/number validations) |

## Error Handling Best Practices

### Client Implementation

```typescript
async function apiRequest(url: string, options: RequestInit) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const problem = await response.json();

    // Handle specific error types
    switch (problem.status) {
      case 400:
        // Show validation errors to user
        if (problem.errors) {
          displayValidationErrors(problem.errors);
        }
        break;

      case 401:
        // Redirect to login or show MFA prompt
        if (problem.requiresMfa) {
          showMfaPrompt();
        } else if (problem.requiresEnrollment) {
          redirectToMfaEnrollment();
        } else {
          redirectToLogin();
        }
        break;

      case 403:
        // Show permission denied message
        showError('You do not have permission for this action');
        break;

      case 409:
        // Handle conflict (e.g., duplicate email)
        showError(problem.detail);
        break;

      case 429:
        // Rate limited - show retry message
        const retryAfter = problem.retryAfter || 60;
        showError(`Too many requests. Please try again in ${retryAfter} seconds.`);
        break;

      case 500:
        // Server error - show generic message
        showError('An unexpected error occurred. Please try again later.');
        break;

      default:
        showError(problem.detail || 'An error occurred');
    }

    throw new ApiError(problem);
  }

  return response.json();
}
```

### Error Logging

All errors include an `X-Request-Id` header that can be used for debugging:

```typescript
const requestId = response.headers.get('X-Request-Id');
console.error(`API error (Request ID: ${requestId}):`, problem);
```

Include this request ID when reporting issues to support.

## Common Error Scenarios

### Registration

| Error                    | Status | Cause                                       |
| ------------------------ | ------ | ------------------------------------------- |
| Email already registered | 409    | Email address already in use                |
| Organisation slug taken  | 409    | Organisation slug not unique                |
| Password too weak        | 400    | Password doesn't meet strength requirements |
| Invalid email format     | 400    | Email validation failed                     |

### Login

| Error                   | Status | Cause                                           |
| ----------------------- | ------ | ----------------------------------------------- |
| Invalid credentials     | 401    | Wrong email or password                         |
| Account blocked         | 401    | User account is blocked                         |
| MFA required            | 401    | MFA token not provided                          |
| Invalid MFA token       | 401    | MFA token is wrong or expired                   |
| MFA enrollment required | 401    | Organisation requires MFA but user not enrolled |

### Token Exchange

| Error                      | Status | Cause                                           |
| -------------------------- | ------ | ----------------------------------------------- |
| Invalid authorization code | 400    | Code expired, revoked, or doesn't exist         |
| Invalid client credentials | 401    | Client authentication failed                    |
| Code validation failed     | 400    | Code doesn't belong to this client/redirect URI |
| Invalid PKCE verifier      | 400    | code_verifier doesn't match code_challenge      |

### Token Refresh

| Error                 | Status | Cause                                       |
| --------------------- | ------ | ------------------------------------------- |
| Invalid refresh token | 400    | Token expired, revoked, or doesn't exist    |
| Token reuse detected  | 400    | Refresh token already used (family revoked) |
| Invalid client        | 401    | Client doesn't match original token         |

## Additional Resources

- [RFC 7807: Problem Details for HTTP APIs](https://tools.ietf.org/html/rfc7807)
- [RFC 6749: OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [API Overview](./overview.md)
