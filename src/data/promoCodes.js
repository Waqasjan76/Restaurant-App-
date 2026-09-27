// Mock promo codes: code -> discount percent.
export const PROMO_CODES = {
  WELCOME10: 10,
  FEAST20: 20,
  STUDENT15: 15,
};

export const normalizePromo = (code) => code.trim().toUpperCase();

export const lookupPromo = (code) => PROMO_CODES[normalizePromo(code)];
