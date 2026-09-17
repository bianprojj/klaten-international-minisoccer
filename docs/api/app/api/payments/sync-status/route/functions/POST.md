[**minisoccer v0.1.0**](../../../../../../README.md)

***

[minisoccer](../../../../../../modules.md) / [app/api/payments/sync-status/route](../README.md) / POST

# Function: POST()

> **POST**(`request`): `Promise`\<`NextResponse`\<\{ `error`: `string`; `success`: `boolean`; \}\> \| `NextResponse`\<\{ `result`: \{ `bookingId`: `string`; `bookingStatusChanged`: `boolean`; `currentBookingStatus`: `string` \| `undefined`; `currentStatus`: `string` \| `undefined`; `details`: \{ `booking`: \{ `status`: `string`; `updatedAt`: `Date`; \} \| `null`; `payment`: \{ `expiredAt`: `Date` \| `null`; `paidAt`: `Date` \| `null`; `status`: `string`; `updatedAt`: `Date`; \} \| `null`; \}; `message`: `string`; `paymentId`: `string`; `previousBookingStatus`: `string`; `previousStatus`: `string`; `reconciledStatus`: `string` \| `null`; `statusChanged`: `boolean`; `success`: `boolean`; `timestamp`: `string`; `transactionId`: `string`; \}; `success`: `boolean`; \}\>\>

POST /api/payments/sync-status

Manually sync payment status from Midtrans to database
This is a failover endpoint in case webhooks are missed

Usage:
- POST with { transactionId: "xxx" } → Fetches status from Midtrans and updates DB

Returns audit trail showing what was updated

## Parameters

### request

`Request`

## Returns

`Promise`\<`NextResponse`\<\{ `error`: `string`; `success`: `boolean`; \}\> \| `NextResponse`\<\{ `result`: \{ `bookingId`: `string`; `bookingStatusChanged`: `boolean`; `currentBookingStatus`: `string` \| `undefined`; `currentStatus`: `string` \| `undefined`; `details`: \{ `booking`: \{ `status`: `string`; `updatedAt`: `Date`; \} \| `null`; `payment`: \{ `expiredAt`: `Date` \| `null`; `paidAt`: `Date` \| `null`; `status`: `string`; `updatedAt`: `Date`; \} \| `null`; \}; `message`: `string`; `paymentId`: `string`; `previousBookingStatus`: `string`; `previousStatus`: `string`; `reconciledStatus`: `string` \| `null`; `statusChanged`: `boolean`; `success`: `boolean`; `timestamp`: `string`; `transactionId`: `string`; \}; `success`: `boolean`; \}\>\>
