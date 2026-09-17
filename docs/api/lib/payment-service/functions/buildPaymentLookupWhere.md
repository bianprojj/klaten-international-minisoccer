[**minisoccer v0.1.0**](../../../README.md)

***

[minisoccer](../../../modules.md) / [lib/payment-service](../README.md) / buildPaymentLookupWhere

# Function: buildPaymentLookupWhere()

> **buildPaymentLookupWhere**(`identifier`): `Record`\<`string`, `string`\>[]

Builds Prisma where conditions for payment lookup by identifier
Supports transactionId, midtransOrderId, and bookingId (if UUID)

## Parameters

### identifier

`string`

Payment identifier (transactionId, midtransOrderId, or bookingId)

## Returns

`Record`\<`string`, `string`\>[]

Array of Prisma where conditions for OR query
