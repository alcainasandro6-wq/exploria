// Providers paste a raw shortcode/iframe snippet from Bokun/TuriTop/Civitatis/
// GetYourGuide/ClickAndBoat. We never render that HTML directly (stored XSS risk) —
// instead we extract just the iframe `src` URL and render it ourselves inside a
// sandboxed iframe we control.

const ALLOWED_EMBED_HOSTS = [
  'bokun.io',
  'widgets.bokun.io',
  'turitop.com',
  'booking.turitop.com',
  'civitatis.com',
  'getyourguide.com',
  'widget.getyourguide.com',
  'clickandboat.com',
]

export function extractEmbedSrc(rawEmbedCode: string | null | undefined): string | null {
  if (!rawEmbedCode) return null

  const trimmed = rawEmbedCode.trim()

  // Accept either a bare URL or a pasted <iframe src="..."> snippet.
  const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i)
  const candidate = srcMatch?.[1] ?? (trimmed.startsWith('http') ? trimmed : null)
  if (!candidate) return null

  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:') return null
    const isAllowed = ALLOWED_EMBED_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
    )
    return isAllowed ? url.toString() : null
  } catch {
    return null
  }
}
