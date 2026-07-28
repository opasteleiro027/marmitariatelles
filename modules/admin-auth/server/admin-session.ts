import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
  const configuredEmails = process.env.ADMIN_EMAILS?.trim();
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!configuredEmails || !configuredPassword || !secret) return false;
  if (
    !credentialsMatch(
      email,
      password,
      configuredEmails,
      configuredPassword,
    )
  ) {
    return false;
  }

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
