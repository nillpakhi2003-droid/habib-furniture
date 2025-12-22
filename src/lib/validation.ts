// Input validation utilities for production safety

export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential XSS characters
}

export function validatePhone(phone: string): boolean {
  // Bangladesh phone number validation (11 digits starting with 01)
  const cleaned = phone.replace(/\D/g, '');
  return /^01[0-9]{9}$/.test(cleaned);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function sanitizePrice(price: unknown): number {
  const num = Number(price);
  if (!Number.isFinite(num) || num < 0 || num > 99999999) {
    throw new Error('Invalid price');
  }
  return Math.round(num * 100) / 100; // Round to 2 decimal places
}

export function sanitizeQuantity(quantity: unknown): number {
  const num = Number(quantity);
  if (!Number.isFinite(num) || num < 1 || num > 1000) {
    throw new Error('Invalid quantity');
  }
  return Math.floor(num);
}

export function validateAddress(address: string): boolean {
  const trimmed = address.trim();
  return trimmed.length >= 10 && trimmed.length <= 500;
}

export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}
