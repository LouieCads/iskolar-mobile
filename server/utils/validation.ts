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

// Guard against obviously unsafe inputs 
export function isSafeInput(value: string): boolean {
  // Disallow common injection metacharacters and control chars
  const unsafePattern = /["'`;\\]|--|\/\*|\*\/|\r|\n|\t/;
  return !unsafePattern.test(value);
}



