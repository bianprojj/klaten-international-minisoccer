[**minisoccer v0.1.0**](../../../../../../README.md)

***

[minisoccer](../../../../../../modules.md) / [app/api/midtrans/create-transaction/route](../README.md) / POST

# Function: POST()

> **POST**(`request`): `Promise`\<`NextResponse`\<\{ `error`: `string`; `success`: `boolean`; \}\> \| `NextResponse`\<\{ `snapToken`: `string` \| `null`; `snapUrl`: `string` \| `null`; `success`: `boolean`; `transaction`: \{ `amount`: `number`; `existing`: `boolean`; `expiresAt`: `string`; `paymentMethod`: [`PaymentMethod`](../../../../../../lib/payment-provider/type-aliases/PaymentMethod.md); `providerName`: `string`; `snapToken`: `string` \| `null`; `snapUrl`: `string` \| `null`; `status`: `string`; `transactionId`: `string`; \}; \}\>\>

## Parameters

### request

`Request`

## Returns

`Promise`\<`NextResponse`\<\{ `error`: `string`; `success`: `boolean`; \}\> \| `NextResponse`\<\{ `snapToken`: `string` \| `null`; `snapUrl`: `string` \| `null`; `success`: `boolean`; `transaction`: \{ `amount`: `number`; `existing`: `boolean`; `expiresAt`: `string`; `paymentMethod`: [`PaymentMethod`](../../../../../../lib/payment-provider/type-aliases/PaymentMethod.md); `providerName`: `string`; `snapToken`: `string` \| `null`; `snapUrl`: `string` \| `null`; `status`: `string`; `transactionId`: `string`; \}; \}\>\>
