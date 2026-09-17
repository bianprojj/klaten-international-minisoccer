[**minisoccer v0.1.0**](../../../../../../../README.md)

***

[minisoccer](../../../../../../../modules.md) / [app/api/admin/bookings/\[id\]/route](../README.md) / GET

# Function: GET()

> **GET**(`request`, `__namedParameters`): `Promise`\<`NextResponse`\<\{ `message`: `string`; `success`: `boolean`; \}\> \| `NextResponse`\<\{ `data`: \{ `bookingDate`: `Date`; `createdAt`: `Date`; `customerEmail`: `string` \| `null`; `customerName`: `string`; `customerPhone`: `string`; `durationHours`: `number`; `endTime`: `string`; `fieldName`: `string`; `id`: `string`; `notes`: `string` \| `null`; `payments`: `GetResult`\<\{ \}, `unknown`\> & `object`[]; `startTime`: `string`; `status`: `string`; `totalPrice`: `number`; `updatedAt`: `Date`; \}; `success`: `boolean`; \}\>\>

## Parameters

### request

`Request`

### \_\_namedParameters

#### params

`Promise`\<\{ `id`: `string`; \}\>

## Returns

`Promise`\<`NextResponse`\<\{ `message`: `string`; `success`: `boolean`; \}\> \| `NextResponse`\<\{ `data`: \{ `bookingDate`: `Date`; `createdAt`: `Date`; `customerEmail`: `string` \| `null`; `customerName`: `string`; `customerPhone`: `string`; `durationHours`: `number`; `endTime`: `string`; `fieldName`: `string`; `id`: `string`; `notes`: `string` \| `null`; `payments`: `GetResult`\<\{ \}, `unknown`\> & `object`[]; `startTime`: `string`; `status`: `string`; `totalPrice`: `number`; `updatedAt`: `Date`; \}; `success`: `boolean`; \}\>\>
