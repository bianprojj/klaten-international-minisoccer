[**minisoccer v0.1.0**](../../../README.md)

***

[minisoccer](../../../modules.md) / [lib/timezone](../README.md) / parseDateOnlyInTimeZone

# Function: parseDateOnlyInTimeZone()

> **parseDateOnlyInTimeZone**(`dateValue`, `timezone?`): `Date`

Parses a date string/value and returns a Date normalized to the specified timezone
Handles both YYYY-MM-DD strings and ISO date strings

## Parameters

### dateValue

`string` \| `Date`

Date string or Date object

### timezone?

`string` = `DEFAULT_TIMEZONE`

IANA timezone identifier (default: Asia/Jakarta)

## Returns

`Date`

Date object normalized to the timezone, or invalid Date if parsing fails
