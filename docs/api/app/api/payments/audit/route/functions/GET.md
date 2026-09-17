[**minisoccer v0.1.0**](../../../../../../README.md)

***

[minisoccer](../../../../../../modules.md) / [app/api/payments/audit/route](../README.md) / GET

# Function: GET()

> **GET**(`request`): `Promise`\<`NextResponse`\<\{ `error`: `string`; `success`: `boolean`; \}\> \| `NextResponse`\<\{ `audit`: \{ `booking`: \{ `bookingDate`: `Date`; `createdAt`: `Date`; `customerEmail`: `string` \| `null`; `customerName`: `string`; `customerPhone`: `string`; `endTime`: `string`; `id`: `string`; `startTime`: `string`; `status`: `string`; `totalPrice`: `number`; `updatedAt`: `Date`; \} \| `null`; `payment`: \{ `amount`: `number`; `bookingId`: `string`; `createdAt`: `Date`; `expiredAt`: `Date` \| `null`; `id`: `string`; `invoice`: \{ `createdAt`: `Date`; `id`: `string`; `invoiceNumber`: `string`; `paidAt`: `Date` \| `null`; `status`: `string`; `updatedAt`: `Date`; \} \| `null`; `paidAt`: `Date` \| `null`; `paymentMethod`: `string`; `provider`: `string`; `snapToken`: `string` \| `null`; `snapUrl`: `string` \| `null`; `status`: `string`; `transactionId`: `string`; `updatedAt`: `Date`; \} \| `null`; `summary`: \{ `dbSyncStatus`: \{ `lastBookingUpdate`: `Date` \| `undefined`; `lastPaymentUpdate`: `Date` \| `undefined`; `paymentStatusMatches`: `string`; `timeSinceLastUpdate`: `number` \| `null`; \}; `isBookingCancelled`: `boolean`; `isBookingConfirmed`: `boolean`; `isPaymentFailed`: `boolean`; `isPaymentPending`: `boolean`; `isPaymentSuccessful`: `boolean`; `slotIsBlocked`: `boolean`; \}; \}; `success`: `boolean`; \}\>\>

GET /api/payments/audit
Query payment audit trail by transactionId or bookingId

Usage:
- /api/payments/audit?transactionId=xxx → Shows complete payment and booking history
- /api/payments/audit?bookingId=xxx → Shows complete payment and booking history for booking

## Parameters

### request

`Request`

## Returns

`Promise`\<`NextResponse`\<\{ `error`: `string`; `success`: `boolean`; \}\> \| `NextResponse`\<\{ `audit`: \{ `booking`: \{ `bookingDate`: `Date`; `createdAt`: `Date`; `customerEmail`: `string` \| `null`; `customerName`: `string`; `customerPhone`: `string`; `endTime`: `string`; `id`: `string`; `startTime`: `string`; `status`: `string`; `totalPrice`: `number`; `updatedAt`: `Date`; \} \| `null`; `payment`: \{ `amount`: `number`; `bookingId`: `string`; `createdAt`: `Date`; `expiredAt`: `Date` \| `null`; `id`: `string`; `invoice`: \{ `createdAt`: `Date`; `id`: `string`; `invoiceNumber`: `string`; `paidAt`: `Date` \| `null`; `status`: `string`; `updatedAt`: `Date`; \} \| `null`; `paidAt`: `Date` \| `null`; `paymentMethod`: `string`; `provider`: `string`; `snapToken`: `string` \| `null`; `snapUrl`: `string` \| `null`; `status`: `string`; `transactionId`: `string`; `updatedAt`: `Date`; \} \| `null`; `summary`: \{ `dbSyncStatus`: \{ `lastBookingUpdate`: `Date` \| `undefined`; `lastPaymentUpdate`: `Date` \| `undefined`; `paymentStatusMatches`: `string`; `timeSinceLastUpdate`: `number` \| `null`; \}; `isBookingCancelled`: `boolean`; `isBookingConfirmed`: `boolean`; `isPaymentFailed`: `boolean`; `isPaymentPending`: `boolean`; `isPaymentSuccessful`: `boolean`; `slotIsBlocked`: `boolean`; \}; \}; `success`: `boolean`; \}\>\>
