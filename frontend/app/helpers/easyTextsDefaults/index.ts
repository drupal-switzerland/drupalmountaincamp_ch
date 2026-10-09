const DEFAULT_MARKER = 'default: "'
const LINE_END = '")'

/**
 * The English default of every easy text, read from the generated
 * translations query (one `context__key: getText(..., default: "Text")` line
 * per text). The build strips defaults from $texts() calls, so this is what
 * renders when Drupal's texts can't be loaded (e.g. Drupal is down).
 */
export function parseDefaultTexts(query: string): Record<string, string> {
  const texts: Record<string, string> = {}
  for (const line of query.split('\n')) {
    const text = line.trim()
    const start = text.indexOf(DEFAULT_MARKER)
    if (!text.includes(': getText(') || start < 0 || !text.endsWith(LINE_END)) {
      continue
    }
    const alias = text.slice(0, text.indexOf(':'))
    const value = text.slice(start + DEFAULT_MARKER.length, -LINE_END.length)
    texts[alias.replace('__', '.')] = JSON.parse(`"${value}"`)
  }
  return texts
}
