# Accept Invitation

Accept an invitation to join an organisation.

## Endpoint

```
POST /v1/auth/invitations/accept
```

## Description

Accepts an invitation to join an organisation as a team member. The endpoint:

1. Validates the invitation token
2. Verifies the invitation hasn't expired
3. Creates a user account with the provided details
4. Associates the user with the specified role and teams
5. Marks the invitation as accepted

This is similar to registration, but the user is joining an existing organisation rather than creating a new one.

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
| `firstName` | string | Yes      | User's first name                      | Minimum 1 character                                   |
| `lastName`  | string | Yes      | User's last name                       | Minimum 1 character                                   |
| `password`  | string | Yes      | User's password                        | Minimum 8 characters, must meet strength requirements |

### Example Request

```json
{
  "token": "inv_a1b2c3d4e5f6g7h8",
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

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (recommended)

## Code Examples

### cURL

```bash
curl -X POST http://localhost:4000/v1/auth/invitations/accept \
  -H "Content-Type: application/json" \
  -d '{
    "token": "inv_a1b2c3d4e5f6g7h8",
    "firstName": "Jane",
    "lastName": "Smith",
    "password": "SecurePass123!"
  }'
```

### JavaScript (fetch)

```javascript
async function acceptInvitation(token, userData) {
  const response = await fetch('http://localhost:4000/v1/auth/invitations/accept', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      ...userData,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }

  return response.json();
}

// Usage
try {
  const result = await acceptInvitation('inv_a1b2c3d4e5f6g7h8', {
    firstName: 'Jane',
    lastName: 'Smith',
    password: 'SecurePass123!',
  });

  console.log('Success:', result);
  // Redirect to login
  window.location.href = '/login?invited=1';
} catch (error) {
  console.error('Failed to accept invitation:', error.message);
}
```

### TypeScript (React Component)

```typescript
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface AcceptInvitationRequest {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid invitation link');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:4000/v1/auth/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password
        })
      });

      if (!response.ok) {
        const problem = await response.json();

        // Handle specific errors
        if (problem.errors) {
          const errorMessages = Array.isArray(problem.errors)
            ? problem.errors.join(', ')
            : 'Validation failed';
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

  if (!token) {
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
      <p>Complete your profile to join the organisation.</p>

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

```
1. Admin creates invitation via POST /v1/admin/invitations
   ↓
2. Server sends invitation email with token link
   ↓
3. Invitee receives email and clicks invitation link
   ↓
4. Client extracts token from URL, shows acceptance form
   ↓
5. Invitee enters their name and password
   ↓
6. Client calls POST /v1/auth/invitations/accept
   ↓
7. Server validates token, creates user account
   ↓
8. Server assigns role and teams to user
   ↓
9. Server marks invitation as accepted
   ↓
10. Client redirects to login page
```

## Email Template Example

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
      href="https://app.cerberus.local/invitations/accept?token={{token}}"
      style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;"
    >
      Accept Invitation
    </a>

    <p>Or copy and paste this link into your browser:</p>
    <p>
      <a href="https://app.cerberus.local/invitations/accept?token={{token}}"
        >https://app.cerberus.local/invitations/accept?token={{token}}</a
      >
    </p>

    <p>This invitation will expire on {{expiresAt}}.</p>

    <p>If you didn't expect this invitation, you can safely ignore this email.</p>
  </body>
</html>
```

## Security Considerations

1. **Token Validation:** Tokens are validated for expiry and acceptance status
2. **One-Time Use:** Tokens can only be accepted once
3. **Password Hashing:** Passwords are hashed with Argon2id
4. **Rate Limiting:** Endpoint is rate-limited to prevent abuse
5. **Organisation Context:** User is automatically placed in the correct organisation
6. **Role Assignment:** User receives only the role specified in invitation
7. **HTTPS Required:** Invitation links should use HTTPS in production

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
- POST /v1/admin/invitations - Create invitation (admin only)
- GET /v1/admin/invitations - List invitations (admin only)
