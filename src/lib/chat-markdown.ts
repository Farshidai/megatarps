// Tiny, safe markdown subset for chat replies (client + server safe, pure).
// Escape first, then: links ONLY to same-site paths ("/product/x", never "//host" or "/\host",
// which browsers treat as another site) or https:// URLs; bold; italics; line breaks.
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Same-site path or https URL; rejects protocol-relative ("//x"), backslash tricks and other schemes. */
export function isSafeChatHref(href: string): boolean {
  if (/[\s\\]/.test(href)) return false
  if (href.startsWith('/')) return !href.startsWith('//')
  return /^https:\/\/[^/]/i.test(href)
}

export function parseChatMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label: string, href: string) =>
      isSafeChatHref(href) ? `<a href="${href}" class="text-orange-600 underline hover:text-orange-700">${label}</a>` : label)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|\s)_([^_\n]+)_/g, '$1<em class="text-slate-500">$2</em>')
    .replace(/\n/g, '<br>')
}
