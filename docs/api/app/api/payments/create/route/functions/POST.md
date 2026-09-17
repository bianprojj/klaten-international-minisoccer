[**minisoccer v0.1.0**](../../../../../../README.md)

***

[minisoccer](../../../../../../modules.md) / [app/api/payments/create/route](../README.md) / POST

# Function: POST()

> **POST**(`request`): `Promise`\<`NextResponse`\<\{ `message`: `string`; `success`: `boolean`; \}\> \| `NextResponse`\<\{ `snapToken`: `unknown`; `snapUrl`: `unknown`; `success`: `boolean`; `transaction`: \{ `amount`: `number`; `existing`: `boolean`; `expiresAt`: `string`; `paymentMethod`: [`PaymentMethod`](../../../../../../lib/payment-provider/type-aliases/PaymentMethod.md); `providerName`: `string`; `snapToken`: `string` \| `null`; `snapUrl`: `string` \| `null`; `status`: `string`; `transactionId`: `string`; \}; \}\>\>

## Parameters

### request

`Request`

## Returns

`Promise`\<`NextResponse`\<\{ `message`: `string`; `success`: `boolean`; \}\> \| `NextResponse`\<\{ `snapToken`: `unknown`; `snapUrl`: `unknown`; `success`: `boolean`; `transaction`: \{ `amount`: `number`; `existing`: `boolean`; `expiresAt`: `string`; `paymentMethod`: [`PaymentMethod`](../../../../../../lib/payment-provider/type-aliases/PaymentMethod.md); `providerName`: `string`; `snapToken`: `string` \| `null`; `snapUrl`: `string` \| `null`; `status`: `string`; `transactionId`: `string`; \}; \}\>\>
