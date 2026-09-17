[**minisoccer v0.1.0**](../../../README.md)

***

[minisoccer](../../../modules.md) / [lib/midtrans](../README.md) / MidtransCreatePayload

# Interface: MidtransCreatePayload

## Properties

### callbacks?

> `optional` **callbacks?**: `object`

#### error?

> `optional` **error?**: `string`

#### finish?

> `optional` **finish?**: `string`

#### pending?

> `optional` **pending?**: `string`

***

### customer\_details?

> `optional` **customer\_details?**: `object`

#### email?

> `optional` **email?**: `string`

#### first\_name?

> `optional` **first\_name?**: `string`

#### phone?

> `optional` **phone?**: `string`

***

### expiry?

> `optional` **expiry?**: `object`

#### duration?

> `optional` **duration?**: `number`

#### unit?

> `optional` **unit?**: `string`

***

### item\_details?

> `optional` **item\_details?**: `object`[]

#### id

> **id**: `string`

#### name

> **name**: `string`

#### price

> **price**: `number`

#### quantity

> **quantity**: `number`

***

### notification\_url?

> `optional` **notification\_url?**: `string`

***

### transaction\_details

> **transaction\_details**: `object`

#### gross\_amount

> **gross\_amount**: `number`

#### order\_id

> **order\_id**: `string`
