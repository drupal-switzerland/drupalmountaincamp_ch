export const META_DESCRIPTION_MAX_LENGTH = 155

const ELLIPSIS = '…'

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[\da-f]+|#\d+|[a-z]+);/gi,
    (entity, code: string) => {
      if (code.startsWith('#')) {
        const isHex = code[1]?.toLowerCase() === 'x'
        const point = Number.parseInt(
          code.slice(isHex ? 2 : 1),
          isHex ? 16 : 10,
        )
        return Number.isInteger(point) && point >= 0 && point <= 0x10ffff
          ? String.fromCodePoint(point)
          : entity
      }
      return NAMED_ENTITIES[code.toLowerCase()] ?? entity
    },
  )
}

const TRAILING_PUNCTUATION = new Set([' ', ',', ';', ':', '.', '!', '?', '-'])

function stripTags(html: string): string {
  let text = ''
  let inTag = false
  for (const char of html) {
    if (char === '<') {
      inTag = true
    } else if (char === '>' && inTag) {
      inTag = false
      text += ' '
    } else if (!inTag) {
      text += char
    }
  }
  return text
}

function trimTrailingPunctuation(text: string): string {
  let end = text.length
  while (end > 0 && TRAILING_PUNCTUATION.has(text.charAt(end - 1))) {
    end--
  }
  return text.slice(0, end)
}

/** Plain text of a rich text field, with whitespace collapsed. */
export function htmlToPlainText(html: string): string {
  return decodeEntities(stripTags(html)).replace(/\s+/g, ' ').trim()
}

/** Cuts text to the maximum length at a word boundary, marking the cut. */
export function truncateAtWord(
  text: string,
  maxLength = META_DESCRIPTION_MAX_LENGTH,
): string {
  if (text.length <= maxLength) {
    return text
  }
  const cut = text.slice(0, maxLength - ELLIPSIS.length)
  const lastSpace = cut.lastIndexOf(' ')
  const words = lastSpace > 0 ? cut.slice(0, lastSpace) : cut
  return trimTrailingPunctuation(words) + ELLIPSIS
}

type ParagraphLike = { props?: object | null }

const textOf = (props: object | null | undefined): string | undefined =>
  props && 'text' in props && typeof props.text === 'string'
    ? props.text
    : undefined

/**
 * A meta description from the first paragraph with text, for articles whose
 * Drupal metatags have none.
 */
export function descriptionFromParagraphs(
  paragraphs: ParagraphLike[] | null | undefined,
): string | undefined {
  for (const paragraph of paragraphs ?? []) {
    const html = textOf(paragraph.props)
    const text = html ? htmlToPlainText(html) : ''
    if (text) {
      return truncateAtWord(text)
    }
  }
  return undefined
}

export function hasMetaDescription(meta: object[] | undefined): boolean {
  return (meta ?? []).some(
    (tag) =>
      'name' in tag &&
      tag.name === 'description' &&
      'content' in tag &&
      typeof tag.content === 'string' &&
      !!tag.content.trim(),
  )
}
