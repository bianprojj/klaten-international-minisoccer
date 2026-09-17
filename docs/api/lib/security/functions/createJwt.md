[**minisoccer v0.1.0**](../../../README.md)

***

[minisoccer](../../../modules.md) / [lib/security](../README.md) / createJwt

# Function: createJwt()

> **createJwt**(`payload`, `secret?`): `string`

Creates a JWT token with HS256 algorithm

## Parameters

### payload

`Record`\<`string`, `unknown`\>

Payload to encode in the token

### secret?

`string` = `...`

Optional secret override (defaults to JWT_SECRET env)

## Returns

`string`

Signed JWT token string
