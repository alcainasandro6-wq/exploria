// DeepL adapter for automatic translation of activity listings.
// Reads DEEPL_API_KEY from env — if absent, callers get a clear
// "not configured" result instead of a crash, so the admin UI can still render.

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate'

// DeepL locale codes differ slightly from ours (e.g. 'en' -> 'EN-GB').
const DEEPL_TARGET_LANG: Record<string, string> = {
  en: 'EN-GB',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
  pl: 'PL',
  ru: 'RU',
}

export function isTranslationConfigured(): boolean {
  return !!process.env.DEEPL_API_KEY
}

export interface TranslateResult {
  success: boolean
  text?: string
  error?: string
}

export async function translateText(text: string, targetLocale: string): Promise<TranslateResult> {
  const apiKey = process.env.DEEPL_API_KEY
  if (!apiKey) {
    return { success: false, error: 'DeepL no está configurado (falta DEEPL_API_KEY)' }
  }
  const targetLang = DEEPL_TARGET_LANG[targetLocale]
  if (!targetLang) return { success: false, error: `Idioma no soportado: ${targetLocale}` }
  if (!text.trim()) return { success: true, text: '' }

  try {
    const res = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ text, target_lang: targetLang }),
    })
    if (!res.ok) return { success: false, error: `DeepL respondió ${res.status}` }
    const data = await res.json()
    return { success: true, text: data.translations?.[0]?.text ?? '' }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export interface ActivityTranslatable {
  title: string
  short_description: string | null
  description: string
}

export async function translateActivityFields(
  fields: ActivityTranslatable,
  targetLocale: string
): Promise<{ success: boolean; error?: string; title?: string; short_description?: string; description?: string }> {
  const [title, shortDesc, description] = await Promise.all([
    translateText(fields.title, targetLocale),
    translateText(fields.short_description ?? '', targetLocale),
    translateText(fields.description, targetLocale),
  ])

  if (!title.success) return { success: false, error: title.error }
  if (!description.success) return { success: false, error: description.error }

  return {
    success: true,
    title: title.text,
    short_description: shortDesc.text,
    description: description.text,
  }
}
