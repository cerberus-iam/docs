# Refactor Notes

## Auth login layering

- Extracted the `/v1/auth/login` flow into a dedicated `AuthController` and `AuthService`, isolating HTTP responsibilities from business rules.
- Added thorough unit coverage for the new controller and service to protect password, MFA, and session handling behavior.
- Updated the route to rely on the controller and converted imports to the `@/` alias for consistency with the project guidelines.
- Brought the session-authentication unit tests in line with the actual cookie policy (they now assert the `sameSite: 'lax'` behavior that accompanies non-secure cookies).
