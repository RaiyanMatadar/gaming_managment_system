/**
 * Sanitizes and formats phone numbers to standardized international digits.
 * e.g., "98765 43210" -> "919876543210"
 * e.g., "+91-9876543210" -> "919876543210"
 *
 * @param {string} phone
 * @param {string} [defaultCountryCode='91']
 * @returns {string|null}
 */
export function formatPhoneNumber(phone, defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE || '91') {
  if (!phone || typeof phone !== 'string') return null;

  const clean = phone.replace(/\D/g, '');
  if (!clean || clean.length < 7) return null;

  if (clean.length === 10) {
    return `${defaultCountryCode}${clean}`;
  }

  return clean;
}
