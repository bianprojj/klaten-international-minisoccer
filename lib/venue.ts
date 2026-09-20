export const DEFAULT_FIELD_ID = "field-1";
export const DEFAULT_FIELD_NAME = "Lapangan Klaten International";
export const DEFAULT_FIELD_PRICE = 110000;

export const DEFAULT_FIELD = {
  id: DEFAULT_FIELD_ID,
  name: DEFAULT_FIELD_NAME,
  price: DEFAULT_FIELD_PRICE,
};

export function getDefaultFieldPrice() {
  return DEFAULT_FIELD_PRICE;
}

export function normalizeFieldId(fieldId: string) {
  return fieldId.trim().toLowerCase().replace(/\s+/g, "-");
}

export function isSupportedFieldId(fieldId: string) {
  return fieldId === normalizeFieldId(DEFAULT_FIELD_ID);
}

export const PRICE_RANGE_TEXT = "Rp 214.000 - Rp 750.000";
export const PRICE_RANGE_SHORT = "Rp 214.000 - 750.000";
export const PRICE_DISCOUNT_NOTE = "Mungkin ada diskon, pantengin sosial media kami.";