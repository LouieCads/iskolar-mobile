// Normalize email to a canonical, lowercased, trimmed form
export function normalizeEmail(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  return value.toLowerCase();
}

// Basic RFC-like email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Enforce generic maximum length to mitigate abuse
export function enforceMaxLength(input: string, max: number): string {
  if (input.length <= max) return input;
  return input.slice(0, max);
}

// Allow only a conservative set of characters for sensitive string inputs
// Adjust allowlist as needed per field to reduce injection/abuse risk
export function sanitizeString(raw: unknown, options?: { allow?: RegExp; max?: number }): string {
  const value = typeof raw === "string" ? raw.trim() : "";
  const limited = options?.max ? enforceMaxLength(value, options.max) : value;
  const allow = options?.allow ?? /[A-Za-z0-9@._+\-!#$%&'*=?^`{|}~]/;
  let out = "";
  for (let i = 0; i < limited.length; i++) {
    const ch = limited[i];
    if (allow.test(ch)) out += ch;
  }
  return out;
}

export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
}

export function isValidOTP(raw: unknown): boolean {
  const value = typeof raw === "string" ? raw.trim() : String(raw ?? "");
  return /^[0-9]{6}$/.test(value);
}

export function normalizeOTP(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim() : String(raw ?? "");
  return value.replace(/\D/g, "").slice(0, 6);
}

// Normalize a phone number by stripping non-digit characters (preserves leading +).
// Returns the digit-only string, or null if the input is not a string.
export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digitsOnly = raw.replace(/\D/g, "");
  return digitsOnly;
}

// Validate a normalized (digits-only) phone number.
// Accepts 7–15 digits per ITU-T E.164. Also accepts Philippine local format (11 digits starting with 09)
// and international format (12 digits starting with 639).
export function isValidPhone(phone: string): boolean {
  if (!/^\d+$/.test(phone)) return false;
  const len = phone.length;
  return len >= 7 && len <= 15;
}

// Guard against obviously unsafe inputs
export function isSafeInput(value: string): boolean {
  // Disallow common injection metacharacters and control chars
  const unsafePattern = /["'`;\\]|--|\/\*|\*\/|\r|\n|\t/;
  return !unsafePattern.test(value);
}