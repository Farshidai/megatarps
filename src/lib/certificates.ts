// Resale-certificate helpers shared by /apply/submit and the settings re-upload route.
export const CERT_BUCKET = 'resale-certificates'

/** `<userId>/<timestamp>-<safe file name>` — the first folder must be the owner's id (Storage RLS). */
export function certificateObjectPath(userId: string, fileName: string): string {
  const safe = fileName.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '').slice(-80) || 'certificate'
  return `${userId}/${Date.now()}-${safe}`
}

/** Checks magic bytes so a renamed file can't pass as a PDF/JPG/PNG. */
export function sniffCertificate(b: Uint8Array, mime: string): boolean {
  const starts = (sig: number[]) => sig.every((x, i) => b[i] === x)
  if (mime === 'application/pdf') return starts([0x25, 0x50, 0x44, 0x46]) // %PDF
  if (mime === 'image/png') return starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (mime === 'image/jpeg') return starts([0xff, 0xd8, 0xff])
  return false
}
