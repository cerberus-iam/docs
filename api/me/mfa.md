# Multi-Factor Authentication (MFA)

Manage multi-factor authentication for the authenticated user. Enable, verify, check, disable TOTP-based MFA, and regenerate backup codes.

## Endpoints

- [Enable MFA](#enable-mfa)
- [Verify MFA](#verify-mfa)
- [Check MFA Token](#check-mfa-token)
- [Disable MFA](#disable-mfa)
- [Regenerate Backup Codes](#regenerate-backup-codes)

---

## Enable MFA

Initiate the MFA enrollment process by generating a TOTP secret and QR code for the user.

### Endpoint

```
POST /v1/me/mfa/enable
```

### Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Permissions**: None (users can enable MFA for themselves)

### Security

- CSRF protection enabled (requires valid CSRF token)
- Generates a temporary secret that must be verified before MFA is fully enabled

### Request

#### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerberus_session`) |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |
| `Content-Type` | Yes      | Must be `application/json`          |

#### Request Body

None

### Success Response (200 OK)

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUri": "otpauth://totp/Cerberus:john.doe@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Cerberus",
  "message": "Scan the QR code with your authenticator app and verify with a code"
}
```

#### Response Fields

| Field       | Type   | Description                                   |
| ----------- | ------ | --------------------------------------------- |
| `secret`    | string | Base32-encoded TOTP secret (for manual entry) |
| `qrCodeUri` | string | OTP Auth URI for generating QR code           |
| `message`   | string | Instructions for next steps                   |

### Error Responses

#### 400 Bad Request

```json
{
  "type": "https://cerberus-iam.dev/problems/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "MFA is already enabled",
  "instance": "/v1/me/mfa/enable"
}
```

#### 401 Unauthorized

```json
{
  "type": "https://cerberus-iam.dev/problems/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Authentication required",
  "instance": "/v1/me/mfa/enable"
}
```

### Example Usage

#### cURL

```bash
curl -X POST https://api.cerberus-iam.dev/v1/me/mfa/enable \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('https://api.cerberus-iam.dev/v1/me/mfa/enable', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
    'Content-Type': 'application/json',
  },
});

const { secret, qrCodeUri } = await response.json();
// Display QR code to user using qrCodeUri
```

---

## Verify MFA

Complete the MFA enrollment by verifying a TOTP code from the user's authenticator app. This activates MFA and generates backup codes.

### Endpoint

```
POST /v1/me/mfa/verify
```

### Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Permissions**: None (users can verify their own MFA)

### Security

- CSRF protection enabled
- Verifies the TOTP code matches the secret from the enable step
- Activates MFA only if verification succeeds

### Request

#### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerberus_session`) |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |
| `Content-Type` | Yes      | Must be `application/json`          |

#### Request Body

```json
{
  "token": "123456"
}
```

| Field   | Type   | Required | Description                              |
| ------- | ------ | -------- | ---------------------------------------- |
| `token` | string | Yes      | 6-digit TOTP code from authenticator app |

### Success Response (200 OK)

```json
{
  "message": "MFA enabled successfully",
  "backupCodes": ["ABC123DEF456", "GHI789JKL012", "MNO345PQR678", "STU901VWX234", "YZA567BCD890"],
  "warning": "Save these backup codes in a safe place. They can be used if you lose access to your authenticator."
}
```

#### Response Fields

| Field         | Type   | Description                         |
| ------------- | ------ | ----------------------------------- |
| `message`     | string | Success confirmation message        |
| `backupCodes` | array  | Array of one-time backup codes      |
| `warning`     | string | Important notice about backup codes |

### Error Responses

#### 400 Bad Request - Invalid Token

```json
{
  "type": "https://cerberus-iam.dev/problems/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid verification code",
  "instance": "/v1/me/mfa/verify"
}
```

#### 400 Bad Request - Validation Error

```json
{
  "type": "https://cerberus-iam.dev/problems/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid input",
  "errors": [
    {
      "code": "too_small",
      "path": ["token"],
      "message": "String must contain exactly 6 character(s)"
    }
  ],
  "instance": "/v1/me/mfa/verify"
}
```

### Example Usage

#### cURL

```bash
curl -X POST https://api.cerberus-iam.dev/v1/me/mfa/verify \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'
```

#### JavaScript (fetch)

```javascript
const response = await fetch('https://api.cerberus-iam.dev/v1/me/mfa/verify', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ token: '123456' }),
});

const { backupCodes } = await response.json();
// Display backup codes to user for safe storage
```

---

## Check MFA Token

Verify if a TOTP token is valid without enabling or disabling MFA. Useful for testing authenticator app setup.

### Endpoint

```
POST /v1/me/mfa/check
```

### Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Permissions**: None

### Request

#### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerberus_session`) |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |
| `Content-Type` | Yes      | Must be `application/json`          |

#### Request Body

```json
{
  "token": "123456"
}
```

### Success Response (200 OK)

```json
{
  "valid": true
}
```

### Example Usage

#### cURL

```bash
curl -X POST https://api.cerberus-iam.dev/v1/me/mfa/check \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'
```

---

## Disable MFA

Disable multi-factor authentication for the user account after verifying a TOTP code.

### Endpoint

```
POST /v1/me/mfa/disable
```

### Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Permissions**: None (users can disable their own MFA)

### Security

- Requires valid TOTP code to prevent unauthorized MFA removal
- CSRF protection enabled

### Request

#### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerberus_session`) |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |
| `Content-Type` | Yes      | Must be `application/json`          |

#### Request Body

```json
{
  "token": "123456"
}
```

| Field   | Type   | Required | Description                              |
| ------- | ------ | -------- | ---------------------------------------- |
| `token` | string | Yes      | 6-digit TOTP code from authenticator app |

### Success Response (200 OK)

```json
{
  "message": "MFA disabled successfully"
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "type": "https://cerberus-iam.dev/problems/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid verification code",
  "instance": "/v1/me/mfa/disable"
}
```

### Example Usage

#### cURL

```bash
curl -X POST https://api.cerberus-iam.dev/v1/me/mfa/disable \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'
```

#### JavaScript (fetch)

```javascript
const response = await fetch('https://api.cerberus-iam.dev/v1/me/mfa/disable', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ token: '123456' }),
});

const result = await response.json();
console.log(result.message);
```

---

## Regenerate Backup Codes

Generate a new set of backup codes. Requires verification with a TOTP code. Old backup codes are invalidated.

### Endpoint

```
POST /v1/me/mfa/backup-codes
```

### Authentication

- **Required**: Yes
- **Type**: Session-based authentication
- **Permissions**: None

### Security

- Requires valid TOTP code to prevent unauthorized regeneration
- CSRF protection enabled
- Old backup codes are invalidated

### Request

#### Headers

| Header         | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `Cookie`       | Yes      | Session cookie (`cerberus_session`) |
| `X-CSRF-Token` | Yes      | CSRF token for request validation   |
| `Content-Type` | Yes      | Must be `application/json`          |

#### Request Body

```json
{
  "token": "123456"
}
```

| Field   | Type   | Required | Description                              |
| ------- | ------ | -------- | ---------------------------------------- |
| `token` | string | Yes      | 6-digit TOTP code from authenticator app |

### Success Response (200 OK)

```json
{
  "backupCodes": ["NEW123ABC456", "DEF789GHI012", "JKL345MNO678", "PQR901STU234", "VWX567YZA890"],
  "message": "Backup codes regenerated successfully"
}
```

#### Response Fields

| Field         | Type   | Description                        |
| ------------- | ------ | ---------------------------------- |
| `backupCodes` | array  | Array of new one-time backup codes |
| `message`     | string | Success confirmation message       |

### Error Responses

#### 400 Bad Request

```json
{
  "type": "https://cerberus-iam.dev/problems/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid verification code",
  "instance": "/v1/me/mfa/backup-codes"
}
```

### Example Usage

#### cURL

```bash
curl -X POST https://api.cerberus-iam.dev/v1/me/mfa/backup-codes \
  -H "Cookie: cerberus_session=abc123..." \
  -H "X-CSRF-Token: xyz789..." \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'
```

#### JavaScript (fetch)

```javascript
const response = await fetch('https://api.cerberus-iam.dev/v1/me/mfa/backup-codes', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'X-CSRF-Token': getCsrfToken(),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ token: '123456' }),
});

const { backupCodes } = await response.json();
// Display new backup codes to user for safe storage
```

## Notes

- MFA uses TOTP (Time-based One-Time Password) algorithm compatible with Google Authenticator, Authy, 1Password, etc.
- The QR code URI follows the [OTP Auth URI format](https://github.com/google/google-authenticator/wiki/Key-Uri-Format)
- Backup codes are one-time use and should be stored securely
- Users should regenerate backup codes periodically or after use
- TOTP codes are 6 digits and valid for 30 seconds
- The secret is Base32-encoded for compatibility with authenticator apps
