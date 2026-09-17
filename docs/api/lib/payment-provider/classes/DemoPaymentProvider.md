[**minisoccer v0.1.0**](../../../README.md)

***

[minisoccer](../../../modules.md) / [lib/payment-provider](../README.md) / DemoPaymentProvider

# Class: DemoPaymentProvider

## Implements

- [`PaymentProvider`](../interfaces/PaymentProvider.md)

## Constructors

### Constructor

> **new DemoPaymentProvider**(): `DemoPaymentProvider`

#### Returns

`DemoPaymentProvider`

## Methods

### createTransaction()

> **createTransaction**(`input`): `Promise`\<\{ `amount`: `number`; `expiresAt`: `string`; `paymentMethod`: [`PaymentMethod`](../type-aliases/PaymentMethod.md); `providerName`: `string`; `status`: [`PaymentStatus`](../type-aliases/PaymentStatus.md); `transactionId`: `string`; \}\>

#### Parameters

##### input

[`PaymentTransactionInput`](../interfaces/PaymentTransactionInput.md)

#### Returns

`Promise`\<\{ `amount`: `number`; `expiresAt`: `string`; `paymentMethod`: [`PaymentMethod`](../type-aliases/PaymentMethod.md); `providerName`: `string`; `status`: [`PaymentStatus`](../type-aliases/PaymentStatus.md); `transactionId`: `string`; \}\>

#### Implementation of

[`PaymentProvider`](../interfaces/PaymentProvider.md).[`createTransaction`](../interfaces/PaymentProvider.md#createtransaction)

***

### getSimulationDetails()

> **getSimulationDetails**(`method`): [`PaymentSimulationDetails`](../interfaces/PaymentSimulationDetails.md)

#### Parameters

##### method

[`PaymentMethod`](../type-aliases/PaymentMethod.md)

#### Returns

[`PaymentSimulationDetails`](../interfaces/PaymentSimulationDetails.md)

#### Implementation of

[`PaymentProvider`](../interfaces/PaymentProvider.md).[`getSimulationDetails`](../interfaces/PaymentProvider.md#getsimulationdetails)
