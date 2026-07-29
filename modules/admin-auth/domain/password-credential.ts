import { scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function adminPasswordMatches(
  password: string,
  salt: string,
  expectedHash: string,
): boolean {
  if (!password || !salt || !expectedHash) return false;

  try {
    const actual = scryptSync(password, salt, KEY_LENGTH);
    const expected = Buffer.from(expectedHash, "hex");
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
