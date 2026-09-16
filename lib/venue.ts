export const DEFAULT_FIELD = {
  id: "klaten-field-1",
  name: "Lapangan Klaten International",
  location: "Klaten",
  description: "Lapangan mini soccer premium dengan fasilitas lengkap di Klaten.",
  price: 110000,
  type: "Mini Soccer",
  size: "5v5",
  rating: 4.9,
  imageUrl: "",
};

export const LEGACY_FIELD_IDS = ["1", "field-1", "klaten-field-1"] as const;
export const DEFAULT_FIELD_ID = DEFAULT_FIELD.id;
export const DEFAULT_FIELD_NAME = DEFAULT_FIELD.name;
export const DEFAULT_FIELD_PRICE = DEFAULT_FIELD.price;

export function normalizeFieldId(fieldId?: string | null) {
  const normalized = String(fieldId ?? "").trim();
  if (!normalized) {
    return DEFAULT_FIELD_ID;
  }

  if (normalized === DEFAULT_FIELD_ID || normalized === "field-1") {
    return DEFAULT_FIELD_ID;
  }

  if (normalized === "1") {
    return DEFAULT_FIELD_ID;
  }

  return normalized;
}

export function isSupportedFieldId(fieldId?: string | null) {
  const normalized = normalizeFieldId(fieldId);
  return normalized === DEFAULT_FIELD_ID || LEGACY_FIELD_IDS.includes(normalized as typeof LEGACY_FIELD_IDS[number]);
}

export const PRICE_RANGE_TEXT = "Rp 214.000 - Rp 750.000";
export const PRICE_RANGE_SHORT = "Rp 214.000 - 750.000";
export const PRICE_DISCOUNT_NOTE = "Mungkin ada diskon, pantengin sosial media kami.";

export function getDefaultFieldPrice() {
  return 214000;
}

export function isDefaultFieldId(fieldId?: string) {
  return !fieldId || normalizeFieldId(fieldId) === DEFAULT_FIELD_ID;
}
