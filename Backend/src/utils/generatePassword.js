import crypto from 'crypto';

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*';
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

function randomChar(charset) {
  return charset[crypto.randomInt(charset.length)];
}

// Guarantees at least one char from each class, then shuffles (Fisher-Yates
// with crypto.randomInt) so the required chars aren't always in fixed slots.
export function generateTempPassword(length = 12) {
  const required = [randomChar(UPPER), randomChar(LOWER), randomChar(DIGITS), randomChar(SYMBOLS)];
  const rest = Array.from({ length: Math.max(length - required.length, 0) }, () => randomChar(ALL));
  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export default generateTempPassword;
