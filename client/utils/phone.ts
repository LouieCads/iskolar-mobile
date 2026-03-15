export function isValidPhone(val: string): boolean {
  const phoneDigits = val.replace(/\D/g, '');
  return (
    (phoneDigits.length === 11 && phoneDigits.startsWith('09'))
  );
}
