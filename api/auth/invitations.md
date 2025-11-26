# Invitations

Accept invitations to join an organisation.

## Overview

The invitation acceptance flow allows users to join an organization when invited by an administrator. Cerberus provides public endpoints for:

1. **Validating** an invitation token (to pre-fill forms)
2. **Accepting** an invitation by providing credentials

These endpoints are unauthenticated (public) since the user doesn't have an account yet.

---

## Get Invitation Details

```
GET /v1/public/invitations/:token
```

### Description

Retrieve invitation details by token. This allows the UI to display the invited email address and organization name before the user submits their registration form.

### Authentication

**Required:** No (public endpoint)

### URL Parameters

| Parameter | Type   | Required | Description                         |
| --------- | ------ | -------- | ----------------------------------- |
| `token`   | string | Yes      | The invitation token from the email |

### Example Request

```bash
curl -X GET https://api.example.com/v1/public/invitations/inv_a1b2c3d4e5f6g7h8
```

### Success Response

**Status:** `200 OK`

```json
{
  "email": "newuser@example.com",
  "organisationName": "Acme Corporation",
  "expiresAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses

**404 Not Found** - Invitation not found, expired, or already used

```json
{
  "type": "https://api.cerberus-iam.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Invitation not found or has expired"
}
```

**429 Too Many Requests** - Rate limit exceeded

```json
{
  "type": "https://api.cerberus-iam.com/errors/rate-limit",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Try again later."
}
```

### Security

- **Rate Limited**: 10 requests per 15 minutes per IP
- **No Authentication Required**: Public endpoint

---

## Accept Invitation

```
POST /v1/public/invitations/:token/accept
```

### Description

Accept an invitation to join an organisation as a team member. The endpoint:

1. Validates the invitation token
2. Verifies the invitation hasn't expired
3. **Validates the email matches the invitation**
4. Creates a user account with the provided details
5. Associates the user with the specified role and teams
6. Marks the invitation as accepted

::: warning Email Must Match
The `email` field in the request body **must exactly match** the email address the invitation was sent to. This prevents unauthorized users from accepting invitations intended for others.
:::

### Authentication

**Required:** No (public endpoint, uses invitation token)

### Headers

| Header         | Required | Description                |
| -------------- | -------- | -------------------------- |
| `Content-Type` | Yes      | Must be `application/json` |

### URL Parameters

| Parameter | Type   | Required | Description                         |
| --------- | ------ | -------- | ----------------------------------- |
| `token`   | string | Yes      | The invitation token from the email |

### Request Body

| Field       | Type   | Required | Description       | Constraints                                           |
| ----------- | ------ | -------- | ----------------- | ----------------------------------------------------- |
| `email`     | string | Yes      | User's email      | Must match invitation email exactly                   |
| `firstName` | string | Yes      | User's first name | Minimum 1 character                                   |
| `lastName`  | string | Yes      | User's last name  | Minimum 1 character                                   |
| `password`  | string | Yes      | User's password   | Minimum 8 characters, must meet strength requirements |

### Password Requirements

The password must meet **all** of the following criteria:

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&\*(),.?":{}|<>)

### Example Request

```bash
curl -X POST https://api.example.com/v1/public/invitations/inv_a1b2c3d4e5f6g7h8/accept \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "password": "SecurePass123!"
  }'
```

### Success Response

**Status Code:** `201 Created`

```json
{
  "message": "Invitation accepted successfully",
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
      "path": ["firstName"],
      "message": "Required"
    }
  ]
}
```

**Email mismatch:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Email does not match invitation"
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
    "Password must contain at least one number",
    "Password must contain at least one special character"
  ]
}
```

**Invalid or expired token:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid or expired invitation token"
}
```

**Invitation already accepted:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invitation has already been accepted"
}
```

**Invitation cancelled:**

```json
{
  "type": "https://api.cerberus-iam.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invitation has been cancelled"
}
```

#### 404 Not Found

```json
{
  "type": "https://api.cerberus-iam.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Invitation not found or has expired"
}
```

#### 429 Too Many Requests

```json
{
  "type": "https://api.cerberus-iam.com/errors/rate-limit",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Please try again later."
}
```

**Rate limits:** 30 requests per 60 seconds

## Invitation Token Details

### Token Format

- **Prefix:** `inv_` (invitation token)
- **Length:** Variable (secure random string)
- **Expiration:** Configurable per invitation (default: 7 days)
- **One-time use:** Token is consumed/marked as accepted

### Token Generation

Invitations are created by organisation administrators through the admin API:

- **POST /v1/admin/invitations** - Create invitation (admin only)

## Side Effects

On successful invitation acceptance:

1. **User account created** with:
   - Email from invitation
   - Name from request
   - Password hashed with Argon2id
   - Identity provider: `local`
   - Associated with invitation's organisation

2. **Role assigned:**
   - User gets the role specified in the invitation

3. **Teams assigned:**
   - User joins any teams specified in the invitation

4. **Invitation marked accepted:**
   - `acceptedAt` timestamp set
   - `acceptedById` set to new user's ID

5. **Email sent:** Welcome email (if configured)

6. **Audit log entry created:** Invitation acceptance logged

## Password Strength Requirements

The password must meet **all** of the following criteria:

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&\*(),.?":{}|<>)

## Code Examples

### cURL

```bash
# First, get invitation details
curl -X GET http://localhost:4000/v1/public/invitations/inv_a1b2c3d4e5f6g7h8

# Then accept the invitation
curl -X POST http://localhost:4000/v1/public/invitations/inv_a1b2c3d4e5f6g7h8/accept \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.smith@acme.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "password": "SecurePass123!"
  }'
```

### JavaScript (fetch)

```javascript
async function getInvitationDetails(token) {
  const response = await fetch(`http://localhost:4000/v1/public/invitations/${token}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }

  return response.json();
}

async function acceptInvitation(token, userData) {
  const response = await fetch(`http://localhost:4000/v1/public/invitations/${token}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }

  return response.json();
}

// Usage
try {
  // Get invitation details to pre-fill email
  const invitation = await getInvitationDetails('inv_a1b2c3d4e5f6g7h8');
  console.log('Invited email:', invitation.email);

  // Accept the invitation
  const result = await acceptInvitation('inv_a1b2c3d4e5f6g7h8', {
    email: invitation.email,
    firstName: 'Jane',
    lastName: 'Smith',
    password: 'SecurePass123!',
  });

  console.log('Success:', result);
  // Redirect to login
  window.location.href = '/login?invited=1';
} catch (error) {
  console.error('Failed:', error.message);
}
```

### TypeScript (React Component)

```typescript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface InvitationDetails {
  email: string;
  organisationName: string;
  expiresAt: string;
}

interface AcceptInvitationResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch invitation details on mount
  useEffect(() => {
    async function fetchInvitation() {
      if (!token) return;
      try {
        const response = await fetch(`http://localhost:4000/v1/public/invitations/${token}`);
        if (!response.ok) {
          throw new Error('Invalid or expired invitation');
        }
        const data = await response.json();
        setInvitation(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invitation');
      } finally {
        setLoading(false);
      }
    }
    fetchInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token || !invitation) {
      setError('Invalid invitation link');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:4000/v1/public/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: invitation.email, // Must match invitation email
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const problem = await response.json();

        // Handle specific errors
        if (problem.errors) {
          const errorMessages = Array.isArray(problem.errors) ? problem.errors.join(', ') : 'Validation failed';
          throw new Error(errorMessages);
        }

        throw new Error(problem.detail);
      }

      const result: AcceptInvitationResponse = await response.json();

      // Show success and redirect
      console.log('Invitation accepted:', result);
      navigate('/login?message=invitation_accepted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading invitation...</div>;
  }

  if (!token || !invitation) {
    return (
      <div className="error-page">
        <h2>Invalid Invitation</h2>
        <p>The invitation link is invalid or has expired.</p>
      </div>
    );
  }

  return (
    <div className="accept-invitation-page">
      <h2>Accept Invitation</h2>
      <p>
        You've been invited to join <strong>{invitation.organisationName}</strong>.
      </p>
      <p>
        Email: <strong>{invitation.email}</strong>
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength={8}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
          minLength={8}
        />

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Accepting...' : 'Accept Invitation'}
        </button>
      </form>
    </div>
  );
}
```

## Invitation Flow

```text
1. Admin creates invitation via POST /v1/admin/invitations
   ↓
2. Server sends invitation email with token link
   ↓
3. Invitee receives email and clicks invitation link
   ↓
4. Client extracts token from URL path (e.g., /invite/:token)
   ↓
5. Client calls GET /v1/public/invitations/:token to get details
   ↓
6. Client displays form with pre-filled email (read-only)
   ↓
7. Invitee enters their name and password
   ↓
8. Client calls POST /v1/public/invitations/:token/accept
   ↓
9. Server validates token and email match, creates user account
   ↓
10. Server assigns role and teams to user
   ↓
11. Server marks invitation as accepted
   ↓
12. Client redirects to login page
```

## Email Template Example

The invitation email should link to your frontend application's invite page:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Invitation to Join Organisation</title>
  </head>
  <body>
    <h1>You've been invited!</h1>

    <p>{{inviterName}} has invited you to join {{organisationName}} on Cerberus IAM.</p>

    <p><strong>Email:</strong> {{inviteeEmail}}</p>
    <p><strong>Role:</strong> {{roleName}}</p>

    <p>Click the button below to accept the invitation and create your account:</p>

    <a
      href="{{ADMIN_WEB_ORIGIN}}/invite/{{token}}"
      style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;"
    >
      Accept Invitation
    </a>

    <p>Or copy and paste this link into your browser:</p>
    <p>
      <a href="{{ADMIN_WEB_ORIGIN}}/invite/{{token}}">{{ADMIN_WEB_ORIGIN}}/invite/{{token}}</a>
    </p>

    <p>This invitation will expire on {{expiresAt}}.</p>

    <p>If you didn't expect this invitation, you can safely ignore this email.</p>
  </body>
</html>
```

::: tip URL Format
The `ADMIN_WEB_ORIGIN` environment variable should point to your frontend application (e.g., `https://app.yourcompany.com`). The frontend then uses the token to call the public invitation API endpoints.
:::

## Security Considerations

1. **Token Validation:** Tokens are validated for expiry and acceptance status
2. **One-Time Use:** Tokens can only be accepted once
3. **Email Verification:** The email in the request must match the invitation email
4. **Password Hashing:** Passwords are hashed with Argon2id
5. **Rate Limiting:** Both endpoints are rate-limited (10 req/15min for GET, 30 req/60s for POST)
6. **CSRF Exempt:** Public invitation endpoints are exempt from CSRF protection by design (unauthenticated endpoints)
7. **Organisation Context:** User is automatically placed in the correct organisation
8. **Role Assignment:** User receives only the role specified in invitation
9. **HTTPS Required:** Invitation links should use HTTPS in production

## Common Issues

### Token Expired

**Problem:** User clicks invitation link after expiration date.

**Solution:** Admin must resend invitation or create new one.

### Email Already Registered

**Problem:** Invitation email matches existing user account.

**Solution:** Service may handle this differently:

- Reject and show error
- Add existing user to organisation
- Send different email to existing user

### Invitation Cancelled

**Problem:** Admin cancelled invitation before user accepted.

**Solution:** Return 400 error. User cannot accept cancelled invitations.

## Next Steps

After successful invitation acceptance:

1. **Login:** User can now login with their credentials
2. **Access Organisation:** User has access based on assigned role
3. **Join Teams:** User is automatically added to specified teams (if any)

## Related Endpoints

- [POST /v1/auth/login](./login.md) - Login after accepting invitation
- [POST /v1/admin/invitations](../admin/invitations.md) - Create invitation (admin only)
- [GET /v1/admin/invitations](../admin/invitations.md) - List invitations (admin only)
