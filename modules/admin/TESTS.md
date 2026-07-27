# Test scenarios

- Denies every account when `ADMIN_EMAILS` is absent.
- Matches configured e-mail addresses without case sensitivity.
- Rejects authenticated accounts outside the allowlist.
- Redirects anonymous users to the platform sign-in route.
- Keeps the dashboard usable on narrow screens.
