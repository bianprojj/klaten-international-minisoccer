[**minisoccer v0.1.0**](../../../README.md)

***

[minisoccer](../../../modules.md) / [lib/payment-provider](../README.md) / PaymentProvider

# Interface: PaymentProvider

## Methods

### createTransaction()

> **createTransaction**(`input`): `Promise`\<\{ `amount`: `number`; `expiresAt`: `string`; `paymentMethod`: [`PaymentMethod`](../type-aliases/PaymentMethod.md); `providerName`: `string`; `status`: [`PaymentStatus`](../type-aliases/PaymentStatus.md); `transactionId`: `string`; \}\>

#### Parameters

##### input

[`PaymentTransactionInput`](PaymentTransactionInput.md)

#### Returns

`Promise`\<\{ `amount`: `number`; `expiresAt`: `string`; `paymentMethod`: [`PaymentMethod`](../type-aliases/PaymentMethod.md); `providerName`: `string`; `status`: [`PaymentStatus`](../type-aliases/PaymentStatus.md); `transactionId`: `string`; \}\>

***

### getSimulationDetails()

> **getSimulationDetails**(`method`): [`PaymentSimulationDetails`](PaymentSimulationDetails.md)

#### Parameters

##### method

[`PaymentMethod`](../type-aliases/PaymentMethod.md)

#### Returns

[`PaymentSimulationDetails`](PaymentSimulationDetails.md)
