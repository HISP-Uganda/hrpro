# Authentication Milestone Notes

Date: 2026-02-21

## Implemented

- Login with username/password (`AuthService.Login`)
- Access token issuance (JWT, short-lived)
- Refresh token issuance and storage hashed in DB (`sha256` hash)
- Logout refresh token invalidation (`revoked_at` update)
- Access token validation
- Basic RBAC helper (`middleware.RequireRoles`)
- `GetMe` binding for current user info

## Wails Binding Surface

- `Login({ username, password }) -> { accessToken, refreshToken, user }`
- `Logout({ refreshToken }) -> void`
- `GetMe(accessToken) -> { user }`

## Security Notes

- Passwords use bcrypt hashing.
- JWT claims include:
  - `user_id`
  - `username`
  - `role`
  - `exp`
- Refresh tokens are never stored in plaintext in DB.
