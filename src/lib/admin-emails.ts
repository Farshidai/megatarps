// Edge/proxy-safe admin email helpers (no server-only imports).
// ADMIN_EMAILS: comma-separated list. ADMIN_EMAIL: single address (legacy). Both are honored.
export function getAdminEmails(): string[] {
  const list = [process.env.ADMIN_EMAILS ?? '', process.env.ADMIN_EMAIL ?? '']
    .join(',')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return Array.from(new Set(list))
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.trim().toLowerCase())
}
