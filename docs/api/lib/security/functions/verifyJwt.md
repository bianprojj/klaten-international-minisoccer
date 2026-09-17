[**minisoccer v0.1.0**](../../../README.md)

***

[minisoccer](../../../modules.md) / [lib/security](../README.md) / verifyJwt

# Function: verifyJwt()

> **verifyJwt**(`token`, `secret?`): `any`

Verifies a JWT token and returns the payload if valid

## Parameters

### token

`string`

JWT token string to verify

### secret?

`string` = `...`

Optional secret override (defaults to JWT_SECRET env)

## Returns

`any`

Decoded payload if valid, null if invalid/expired
