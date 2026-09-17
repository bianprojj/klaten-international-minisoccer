[**minisoccer v0.1.0**](../../../README.md)

***

[minisoccer](../../../modules.md) / [lib/payment-service](../README.md) / createPaymentTransaction

# Function: createPaymentTransaction()

> **createPaymentTransaction**(`input`): `Promise`\<\{ `amount`: `number`; `existing`: `boolean`; `expiresAt`: `string`; `paymentMethod`: [`PaymentMethod`](../../payment-provider/type-aliases/PaymentMethod.md); `providerName`: `string`; `snapToken`: `string` \| `null`; `snapUrl`: `string` \| `null`; `status`: `string`; `transactionId`: `string`; \}\>

## Parameters

### input

[`PaymentTransactionInput`](../../payment-provider/interfaces/PaymentTransactionInput.md) & `object`

## Returns

`Promise`\<\{ `amount`: `number`; `existing`: `boolean`; `expiresAt`: `string`; `paymentMethod`: [`PaymentMethod`](../../payment-provider/type-aliases/PaymentMethod.md); `providerName`: `string`; `snapToken`: `string` \| `null`; `snapUrl`: `string` \| `null`; `status`: `string`; `transactionId`: `string`; \}\>
