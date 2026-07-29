import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPostgresClient } from "@/db";
import { adminPasswordMatches } from "../domain/password-credential";
import {
  createSessionToken,
  credentialsMatch,
  readSessionToken,
} from "../domain/session-token";

const COOKIE_NAME = "marmitaria_admin_session";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;

  const databaseMatch = await databaseCredentialsMatch(email, password);
  const environmentMatch = environmentCredentialsMatch(email, password);
  if (!databaseMatch && !environmentMatch) return false;

  const cookieStore = await cookies();
  cookieStore.set(
    COOKIE_NAME,
    createSessionToken(
      {
        email: email.trim().toLocaleLowerCase(),
        expiresAt: Date.now() + SESSION_DURATION_MS,
      },
      secret,
    ),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DURATION_MS / 1000,
    },
  );
  return true;
}

async function databaseCredentialsMatch(email: string, password: string) {
  try {
    const sql = getPostgresClient();
    const rows = await sql.unsafe<
      Array<{
        password_hash: string | null;
        password_salt: string | null;
      }>
    >(
      `SELECT password_hash, password_salt
       FROM admin_users
       WHERE LOWER(email) = LOWER($1) AND active = TRUE
       LIMIT 1`,
      [email.trim()],
    );
    const credential = rows[0];
    return Boolean(
      credential?.password_hash &&
        credential.password_salt &&
        adminPasswordMatches(
          password,
          credential.password_salt,
          credential.password_hash,
        ),
    );
  } catch {
    return false;
  }
}

function environmentCredentialsMatch(email: string, password: string) {
  const configuredEmails = process.env.ADMIN_EMAILS?.trim();
  const configuredPassword = process.env.ADMIN_PASSWORD;
  return Boolean(
    configuredEmails &&
      configuredPassword &&
      credentialsMatch(
        email,
        password,
        configuredEmails,
        configuredPassword,
      ),
  );
}

export async function getAdminSession() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return token ? readSessionToken(token, secret) : null;
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
