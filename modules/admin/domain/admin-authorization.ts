export function isAuthorizedAdmin(email: string): boolean {
  const configuredEmails = process.env.ADMIN_EMAILS;
  if (!configuredEmails) return false;

  const allowlist = configuredEmails
    .split(",")
    .map((value) => value.trim().toLocaleLowerCase())
    .filter(Boolean);

  return allowlist.includes(email.trim().toLocaleLowerCase());
}
