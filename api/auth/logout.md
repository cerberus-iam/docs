# Logout

End the current user session.

## Endpoint

```
POST /v1/auth/logout
```

## Description

Terminates the current user session by:

1. Deleting the session record from the database
2. Clearing the session cookie from the client

This endpoint requires a valid authenticated session. A CSRF token is **not** required because the
route only invalidates the caller's own session.

## Authentication

**Required:** Yes (Session cookie)

**CSRF Protection:** No (intentionally exempt)

## Headers

| Header         | Required | Description                              |
| -------------- | -------- | ---------------------------------------- |
| `Content-Type` | Yes      | Must be `application/json`               |
| `Cookie`       | Yes      | Must include session cookie (`cerb_sid`) |

## Request Body

**Empty** - No request body required.

## Response

### Success Response

**Status Code:** `200 OK`

**Headers:**

```
Set-Cookie: cerb_sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
Set-Cookie: cerb_csrf=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
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
  "type": "https://api.cerberus-iam.com/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required"
}
```

**Invalid or expired session:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid or expired session"
}
```

#### 403 Forbidden - CSRF Token Missing or Invalid

No longer applicable. The endpoint is exempt from CSRF validation.

## Side Effects

1. **Session deleted** from database (by session token hash)
2. **Session cookie cleared** from client browser
3. **Audit log entry created** (if audit logging is enabled)

**Note:** If no session token is found in cookies, the endpoint still succeeds (returns 200) but no database operation is performed.

## Session Revocation Variants

Logout can be executed via two endpoints:

1. `POST /v1/auth/logout` (legacy semantics, JSON response)
2. `DELETE /v1/auth/session` (idempotent REST resource with `204 No Content`)

Both routes clear the session and CSRF cookies and audit the logout event. Prefer the `DELETE`
variant for new integrations because it gracefully handles already-expired sessions.

## Code Examples

### cURL

```bash
# Logout with session cookie
curl -X POST http://localhost:4000/v1/auth/logout \
  -H "Content-Type: application/json" \
  -b cookies.txt # Load session cookie from file
```

### JavaScript (fetch)

```javascript
async function logout() {
  const response = await fetch('http://localhost:4000/v1/auth/logout', {
    method: 'POST',
    credentials: 'include', // Include session cookie
    headers: {
      'Content-Type': 'application/json',
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
  await logout();
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

  async logout(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const problem: ProblemDetails = await response.json();

      throw new Error(problem.detail || 'Logout failed');
    }

    const data: LogoutResponse = await response.json();

    // Clear local state
    localStorage.clear();
    sessionStorage.clear();

    return;
  }
}

// Usage
const authService = new AuthService();

try {
  await authService.logout();
  console.log('Logged out successfully');

  // Redirect to login
  window.location.href = '/login';
} catch (error) {
  console.error('Logout failed:', error.message);
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

export function useLogout(): UseLogoutResult {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:4000/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
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
  }, [navigate]);

  return { logout, isLoggingOut, error };
}

// Usage in component
function LogoutButton() {
  const { logout, isLoggingOut, error } = useLogout();

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
2. **Central CSRF Policy:** Logout is exempt but all other unsafe routes remain protected
3. **HttpOnly Cookies:** Session cookie cannot be accessed by JavaScript
4. **Cookie Clearing:** Ensures session token is removed from client
5. **Database Cleanup:** Session is immediately invalidated in database
6. **POST/DELETE Methods:** Logout uses POST and DELETE (not GET) to prevent accidental logout via link clicks
7. **Audit Logging:** Logout events are logged for security monitoring

## Common Issues

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

- [POST /v1/auth/login](./login.md) - Create new session
- [DELETE /v1/auth/session](./session.md) - Idempotent session revocation
- [GET /v1/me/sessions](../me/sessions.md) - View all active sessions
- [DELETE /v1/me/sessions](../me/sessions.md) - Logout all sessions
