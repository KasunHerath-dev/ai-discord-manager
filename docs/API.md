# Local API

Public routes:

- `GET /api/health`
- `GET /api/status`
- `POST /api/setup/test-gemini`
- `POST /api/setup/test-discord`
- `POST /api/setup/complete`
- `POST /api/auth/unlock`

Authenticated routes use `Authorization: Bearer <local-session-token>`:

- `POST /api/auth/logout`
- `GET /api/server/snapshot`
- `GET /api/plans`
- `POST /api/plans`
- `GET /api/plans/:id`
- `POST /api/plans/:id/execute`
- `POST /api/plans/:id/cancel`
- `GET /api/audit`
- `GET /api/backups`

The service binds to `127.0.0.1` by default. Do not expose it to a public interface without adding TLS, persistent multi-user authentication, CSRF protection, and network access controls.
