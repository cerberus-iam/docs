# X-Org-Domain Header Reference

The `X-Org-Domain` header is a **required HTTP header** for most authenticated API requests in Cerberus IAM v2.0+. It specifies which organisation context the request should operate in.

## Quick Reference

| Header Name    | Value                      | Required For                                 |
| -------------- | -------------------------- | -------------------------------------------- |
| `X-Org-Domain` | Organisation slug (string) | All authenticated requests (with exceptions) |

## Why Is This Required?

Starting in v2.0, Cerberus supports **many-to-many organisation membership**, meaning:

- Users can belong to multiple organisations
- Each membership has independent roles and permissions
- The API needs to know which organisation context to use

Without this header, the API cannot determine:

- Which organisation's resources to access
- Which roles/permissions to apply
- Which organisation's settings to use (session lifetime, MFA requirements, etc.)

## When to Include This Header

### ✅ Always Required

- **Authentication endpoints** (`/v1/auth/*`)
  - Login
  - Logout
  - Register (invitation acceptance)
  - Password reset
  - Email verification

- **User profile endpoints** (`/v1/me/*`)
  - Get profile
  - Update profile
  - List sessions
  - MFA management

- **Admin endpoints** (`/v1/admin/*`)
  - User management
  - Role management
  - Team management
  - Client management
  - Organisation settings

- **OAuth2 flows**
  - Authorization endpoint (`/oauth2/authorize`)
  - Consent endpoint (`/oauth2/consent`)

### ❌ Not Required

- **Public endpoints**
  - Health checks (`/health`)
  - OpenID Discovery (`/.well-known/openid-configuration`)
  - JWKS endpoint (`/.well-known/jwks.json`)

- **Client credentials flow**
  - Token endpoint with `grant_type=client_credentials`
  - (Machine-to-machine, no user context)

## How to Use

### cURL Example

```bash
curl -X GET https://api.cerberus-iam.com/v1/users \
  -H "Authorization: Bearer your-token" \
  -H "X-Org-Domain: acme-corp" \
  -H "Content-Type: application/json"
```

### JavaScript/TypeScript Example

```typescript
// Using fetch
const response = await fetch('https://api.cerberus-iam.com/v1/users', {
  headers: {
    Authorization: `Bearer ${token}`,
    'X-Org-Domain': 'acme-corp',
    'Content-Type': 'application/json',
  },
});

// Using Axios (set globally)
axios.defaults.headers.common['X-Org-Domain'] = 'acme-corp';

// Or per-request
const response = await axios.get('https://api.cerberus-iam.com/v1/users', {
  headers: {
    'X-Org-Domain': 'acme-corp',
  },
});
```

### Python Example

```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'X-Org-Domain': 'acme-corp',
    'Content-Type': 'application/json',
}

response = requests.get('https://api.cerberus-iam.com/v1/users', headers=headers)
```

### PHP Example

```php
$client = new GuzzleHttp\Client();

$response = $client->get('https://api.cerberus-iam.com/v1/users', [
    'headers' => [
        'Authorization' => 'Bearer ' . $token,
        'X-Org-Domain' => 'acme-corp',
        'Content-Type' => 'application/json',
    ],
]);
```

## Finding Your Organisation Slug

You can find your organisation slug in several ways:

### 1. From the Dashboard

Navigate to **Settings > Organisation** and copy the "Organisation Slug" field.

### 2. Via API

```bash
# List all organisations the user belongs to
curl https://api.cerberus-iam.com/v1/me/organisations \
  -H "Authorization: Bearer $TOKEN"
```

Response:

```json
[
  {
    "id": "org-123",
    "name": "Acme Corporation",
    "slug": "acme-corp"
  },
  {
    "id": "org-456",
    "name": "Widgets Inc",
    "slug": "widgets-inc"
  }
]
```

### 3. From Organisation URL

If you're using the hosted admin panel, the slug is in the URL:

```
https://app.cerberus-iam.com/acme-corp/dashboard
                                  ^^^^^^^^^^
                                  This is your slug
```

## Error Responses

### Missing Header

**HTTP 400 Bad Request**

```json
{
  "type": "https://api.cerberus-iam.com/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "X-Org-Domain header is required. This header must contain the organisation slug."
}
```

### Organisation Not Found

**HTTP 404 Not Found**

```json
{
  "type": "https://api.cerberus-iam.com/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Organisation 'invalid-slug' not found"
}
```

### User Not a Member

**HTTP 403 Forbidden**

```json
{
  "type": "https://api.cerberus-iam.com/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "You are not a member of this organisation"
}
```

## Multi-Organisation Users

If a user belongs to multiple organisations, they can switch between organisations by changing the `X-Org-Domain` header:

```typescript
// Login to Organisation A
const responseA = await fetch('https://api.cerberus-iam.com/v1/auth/login', {
  method: 'POST',
  headers: {
    'X-Org-Domain': 'company-a',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
});

const { token: tokenA } = await responseA.json();

// Use token for Organisation A
await fetch('https://api.cerberus-iam.com/v1/users', {
  headers: {
    Authorization: `Bearer ${tokenA}`,
    'X-Org-Domain': 'company-a',
  },
});

// Login to Organisation B (same user, different org)
const responseB = await fetch('https://api.cerberus-iam.com/v1/auth/login', {
  method: 'POST',
  headers: {
    'X-Org-Domain': 'company-b',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email, password }),
});

const { token: tokenB } = await responseB.json();

// Use token for Organisation B
await fetch('https://api.cerberus-iam.com/v1/users', {
  headers: {
    Authorization: `Bearer ${tokenB}`,
    'X-Org-Domain': 'company-b',
  },
});
```

::: warning Token Scope
Tokens are scoped to the organisation they were issued for. You must obtain a new token when switching organisations by logging in with the different `X-Org-Domain` header.
:::

## Best Practices

### 1. Set Header Globally

Configure your HTTP client to include the header on all requests:

```typescript
// Axios
const api = axios.create({
  baseURL: 'https://api.cerberus-iam.com',
  headers: {
    'X-Org-Domain': localStorage.getItem('currentOrgSlug'),
  },
});

// Fetch wrapper
const apiCall = async (url, options = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      'X-Org-Domain': localStorage.getItem('currentOrgSlug'),
      ...options.headers,
    },
  });
};
```

### 2. Store Organisation Selection

Persist the user's selected organisation:

```typescript
// When user selects organisation
const selectOrganisation = (orgSlug: string) => {
  localStorage.setItem('currentOrgSlug', orgSlug);
  // Update HTTP client headers
  updateApiHeaders({ 'X-Org-Domain': orgSlug });
};

// On app initialization
const currentOrg = localStorage.getItem('currentOrgSlug');
if (currentOrg) {
  updateApiHeaders({ 'X-Org-Domain': currentOrg });
}
```

### 3. Handle Organisation Switching

Provide UI for users to switch between organisations:

```typescript
const OrganisationSwitcher = () => {
  const [orgs, setOrgs] = useState([]);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    // Load user's organisations
    fetch('/v1/me/organisations', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setOrgs);
  }, []);

  const switchOrg = async (org) => {
    // Update local state
    setCurrent(org);
    selectOrganisation(org.slug);

    // Optionally: obtain new token for this org
    const { token } = await login(email, password, org.slug);
    updateToken(token);
  };

  return (
    <select onChange={(e) => switchOrg(JSON.parse(e.target.value))}>
      {orgs.map(org => (
        <option key={org.id} value={JSON.stringify(org)}>
          {org.name}
        </option>
      ))}
    </select>
  );
};
```

## Troubleshooting

### Issue: Requests work in Postman but fail in app

**Cause:** Postman may have the header set in collection/environment variables, but your app doesn't.

**Solution:** Verify your HTTP client includes the header:

```typescript
// Log all request headers
axios.interceptors.request.use((config) => {
  console.log('Request headers:', config.headers);
  return config;
});
```

### Issue: User can't access certain organisations

**Cause:** User is not a member of that organisation.

**Solution:**

1. Verify membership: `GET /v1/me/organisations`
2. Invite user to organisation if needed
3. Check for typos in organisation slug

### Issue: Token works in one org but not another

**Cause:** Tokens are scoped to the organisation they were issued for.

**Solution:** Obtain a new token by logging in with the target organisation's slug in the `X-Org-Domain` header.

## See Also

- [Migration Guide (v1 → v2)](/guide/migration-v2)
- [Multi-Tenancy & Organisations](/guide/multi-tenancy)
- [Authentication Guide](/guide/authentication)
- [API Error Codes](/api/errors)
