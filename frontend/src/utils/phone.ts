const INDIA_COUNTRY_CODE = '91';

export function sanitizeIndianPhoneInput(phone: string): string {
  return phone.replace(/\D/g, '').slice(0, 12);
}

export function isSupportedIndianPhoneInput(phone: string): boolean {
  const digits = sanitizeIndianPhoneInput(phone);

  return (
    digits.length === 10 ||
    (digits.length === 11 && digits.startsWith('0')) ||
    (digits.length === 12 && digits.startsWith(INDIA_COUNTRY_CODE))
  );
}

export function normalizeIndianPhone(phone: string): string {
  const digits = sanitizeIndianPhoneInput(phone);

  if (digits.length === 10) {
    return `+${INDIA_COUNTRY_CODE}${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    return `+${INDIA_COUNTRY_CODE}${digits.slice(1)}`;
  }

  if (digits.length === 12 && digits.startsWith(INDIA_COUNTRY_CODE)) {
    return `+${digits}`;
  }

  throw new Error('Please enter a valid Indian mobile number.');
}
