/** Human folio and public tracking token. */

const FOLIO_PREFIX = "BP-";
const TOKEN_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const PUBLIC_TOKEN_LENGTH = 32;

export function formatFolio(orderNumber: number): string {
  if (!Number.isSafeInteger(orderNumber) || orderNumber < 1) {
    throw new RangeError(`Invalid order number: ${orderNumber}`);
  }
  return `${FOLIO_PREFIX}${String(orderNumber).padStart(6, "0")}`;
}

export function parseFolio(folio: string): number | null {
  const match = /^BP-(\d{6,})$/i.exec(folio.trim());
  return match ? Number(match[1]) : null;
}

/**
 * Random, unguessable token for the public status page. Unrelated to the folio
 * so nobody can walk through orders by incrementing numbers.
 */
export function generatePublicToken(
  randomBytes: (size: number) => Uint8Array = (size) =>
    crypto.getRandomValues(new Uint8Array(size)),
): string {
  const bytes = randomBytes(PUBLIC_TOKEN_LENGTH);
  let token = "";
  for (const byte of bytes) token += TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length];
  return token;
}

export function isValidPublicToken(token: string): boolean {
  return token.length === PUBLIC_TOKEN_LENGTH && [...token].every((c) => TOKEN_ALPHABET.includes(c));
}
