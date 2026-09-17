[**minisoccer v0.1.0**](../../../README.md)

***

[minisoccer](../../../modules.md) / [lib/invoice-pdf](../README.md) / generateInvoicePdfBufferAuto

# Function: generateInvoicePdfBufferAuto()

> **generateInvoicePdfBufferAuto**(`invoice`): `Promise`\<\{ `buffer`: `Buffer`; `engine`: `"classic"` \| `"legacy"`; \}\>

Classic (HTML/Puppeteer) first, legacy fallback on failure.
Used by live download route + email attachment.

## Parameters

### invoice

[`InvoicePdfInput`](../interfaces/InvoicePdfInput.md)

## Returns

`Promise`\<\{ `buffer`: `Buffer`; `engine`: `"classic"` \| `"legacy"`; \}\>
