import {
  createHmac,
  createHash,
  timingSafeEqual,
} from "node:crypto";

export type AdminSession = {
  email: string;
  expiresAt: number;
};

export function createSessionToken(
  session: AdminSession,
  secret: string,
): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function readSessionToken(
  token: string,
  secret: string,
  now = Date.now(),
): AdminSession | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload, secret);
  if (!safeEqual(signature, expected)) return null;

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as AdminSession;
    if (!session.email || session.expiresAt <= now) return null;
    return session;
  } catch {
    return null;
  }
}

export function credentialsMatch(
  email: string,
  password: string,
  configuredEmails: string,
  configuredPassword: string,
): boolean {
  const allowlist = configuredEmails
    .split(",")
    .map((value) => value.trim().toLocaleLowerCase())
    .filter(Boolean);
  const emailAllowed = allowlist.includes(email.trim().toLocaleLowerCase());
  const passwordMatches = safeEqual(
    digest(password),
    digest(configuredPassword),
  );
  return emailAllowed && passwordMatches;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
