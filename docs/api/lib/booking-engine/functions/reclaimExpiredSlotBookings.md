[**minisoccer v0.1.0**](../../../README.md)

***

[minisoccer](../../../modules.md) / [lib/booking-engine](../README.md) / reclaimExpiredSlotBookings

# Function: reclaimExpiredSlotBookings()

> **reclaimExpiredSlotBookings**(`bookingDate?`, `startTime?`): `Promise`\<`BatchPayload`\>

Deletes reclaimable bookings for a specific date/time slot
Used to free up slots that were expired/cancelled/refunded

## Parameters

### bookingDate?

`string` \| `Date`

Optional date to filter (defaults to all)

### startTime?

`string`

Optional start time to filter (defaults to all)

## Returns

`Promise`\<`BatchPayload`\>

Prisma deleteMany result with count of deleted bookings
