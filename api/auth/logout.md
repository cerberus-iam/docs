# Logout

End the current user session.

## Endpoint

```
POST /api/v1/auth/logout
```

## Description

Terminates the current user session by:

1. Deleting the session record from the database
2. Clearing the session cookie from the client

This endpoint requires both session authentication and a valid CSRF token to prevent Cross-Site Request Forgery attacks.

## Authentication

**Required:** Yes (Session cookie)

**CSRF Protection:** Yes (X-CSRF-Token header required)

## Headers

| Header         | Required | Description                              |
| -------------- | -------- | ---------------------------------------- |
| `Content-Type` | Yes      | Must be `application/json`               |
| `Cookie`       | Yes      | Must include session cookie (`cerb_sid`) |
| `X-CSRF-Token` | Yes      | Valid CSRF token for the session         |

## Request Body

**Empty** - No request body required.

## Response

### Success Response

**Status Code:** `200 OK`

**Headers:**

```
Set-Cookie: cerb_sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

**Body:**

```json
{
  "message": "Logged out successfully"
}
```

### Error Responses

#### 401 Unauthorized - Not Authenticated

**No session cookie provided:**

```json
{
  "type": "https://cerberus.local/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required"
}
```

**Invalid or expired session:**

```json
{
  "type": "https://cerberus.local/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid or expired session"
}
```

#### 403 Forbidden - CSRF Token Missing or Invalid

**Missing CSRF token:**

```json
{
  "type": "https://cerberus.local/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "CSRF token required"
}
```

**Invalid CSRF token:**

```json
{
  "type": "https://cerberus.local/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Invalid CSRF token"
}
```

## Side Effects

1. **Session deleted** from database (by session token hash)
2. **Session cookie cleared** from client browser
3. **Audit log entry created** (if audit logging is enabled)

**Note:** If no session token is found in cookies, the endpoint still succeeds (returns 200) but no database operation is performed.

## CSRF Token

### How to Obtain CSRF Token

CSRF tokens are typically obtained from one of these sources:

1. **Login response:** Included in response or response headers
2. **Session initialization endpoint:** Call a dedicated endpoint to get CSRF token
3. **HTML meta tag:** Embedded in server-rendered pages
4. **Cookie:** Some implementations use a separate CSRF cookie

### Example CSRF Token Flow

```javascript
// 1. Login and store CSRF token
const loginResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

// 2. Extract CSRF token (example - check actual implementation)
const csrfToken = loginResponse.headers.get('X-CSRF-Token');

// 3. Use CSRF token for logout
const logoutResponse = await fetch('/api/v1/auth/logout', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
});
```

## Code Examples

### cURL

```bash
# Logout with session cookie and CSRF token
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: your-csrf-token-here" \
  -b cookies.txt # Load session cookie from file
```

### JavaScript (fetch)

```javascript
async function logout(csrfToken) {
  const response = await fetch('http://localhost:4000/api/v1/auth/logout', {
    method: 'POST',
    credentials: 'include', // Include session cookie
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }

  const data = await response.json();
  console.log(data.message); // "Logged out successfully"

  // Redirect to login page
  window.location.href = '/login';
}

// Usage
try {
  const csrfToken = getCsrfToken(); // Get from storage or meta tag
  await logout(csrfToken);
} catch (error) {
  console.error('Logout failed:', error.message);
}
```

### TypeScript

```typescript
interface LogoutResponse {
  message: string;
}

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
}

class AuthService {
  private baseUrl = 'http://localhost:4000';
  private csrfToken: string | null = null;

  setCsrfToken(token: string): void {
    this.csrfToken = token;
  }

  async logout(): Promise<void> {
    if (!this.csrfToken) {
      throw new Error('CSRF token not available');
    }

    const response = await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfToken,
      },
    });

    if (!response.ok) {
      const problem: ProblemDetails = await response.json();

      if (problem.status === 403) {
        throw new Error('CSRF_TOKEN_INVALID');
      }

      throw new Error(problem.detail || 'Logout failed');
    }

    const data: LogoutResponse = await response.json();

    // Clear local state
    this.csrfToken = null;
    localStorage.clear();
    sessionStorage.clear();

    return;
  }
}

// Usage
const authService = new AuthService();

// Set CSRF token (from login or stored value)
authService.setCsrfToken(storedCsrfToken);

try {
  await authService.logout();
  console.log('Logged out successfully');

  // Redirect to login
  window.location.href = '/login';
} catch (error) {
  if (error.message === 'CSRF_TOKEN_INVALID') {
    // CSRF token expired, clear session and redirect
    window.location.href = '/login?session_expired=1';
  } else {
    console.error('Logout failed:', error.message);
  }
}
```

### React Hook Example

```typescript
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseLogoutResult {
  logout: () => Promise<void>;
  isLoggingOut: boolean;
  error: string | null;
}

export function useLogout(csrfToken: string): UseLogoutResult {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:4000/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        }
      });

      if (!response.ok) {
        const problem = await response.json();
        throw new Error(problem.detail);
      }

      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to login
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setIsLoggingOut(false);
    }
  }, [csrfToken, navigate]);

  return { logout, isLoggingOut, error };
}

// Usage in component
function LogoutButton() {
  const csrfToken = useCsrfToken(); // Custom hook to get CSRF token
  const { logout, isLoggingOut, error } = useLogout(csrfToken);

  return (
    <>
      <button onClick={logout} disabled={isLoggingOut}>
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
      {error && <div className="error">{error}</div>}
    </>
  );
}
```

## Security Considerations

1. **Session Authentication Required:** Ensures only authenticated users can logout
2. **CSRF Protection:** Prevents malicious sites from logging users out
3. **HttpOnly Cookies:** Session cookie cannot be accessed by JavaScript
4. **Cookie Clearing:** Ensures session token is removed from client
5. **Database Cleanup:** Session is immediately invalidated in database
6. **POST Method:** Logout uses POST (not GET) to prevent accidental logout via link clicks
7. **Audit Logging:** Logout events are logged for security monitoring

## Common Issues

### CSRF Token Mismatch

**Problem:** CSRF token becomes invalid between login and logout.

**Causes:**

- Token expired
- Session was invalidated
- Token was not properly stored
- Multiple tabs/windows (some implementations)

**Solutions:**

- Refresh CSRF token periodically
- Handle 403 errors by redirecting to login
- Store token securely in memory or sessionStorage

### Session Already Expired

**Problem:** Session expired before logout is called.

**Solution:** Logout endpoint is idempotent - it succeeds even if session doesn't exist. Simply redirect to login page.

### Multiple Sessions

**Problem:** User has multiple active sessions (different browsers/devices).

**Note:** This endpoint only logs out the current session. To logout all sessions, use a dedicated "Logout All Sessions" endpoint (if available).

## Best Practices

1. **Clear Client-Side State:** Remove all user data from localStorage/sessionStorage
2. **Redirect After Logout:** Always redirect to login page or home page
3. **Show Confirmation:** Consider showing a "logged out successfully" message
4. **Handle Errors Gracefully:** Even if logout fails, clear client state and redirect
5. **Prevent Back Button Issues:** Clear cache and prevent cached page access
6. **Single Logout Button:** Disable button during logout to prevent double-submission

## Related Endpoints

- [POST /api/v1/auth/login](./login.md) - Create new session
- [GET /api/v1/me/sessions](../me/sessions.md) - View all active sessions
- [DELETE /api/v1/me/sessions](../me/sessions.md) - Logout all sessions
