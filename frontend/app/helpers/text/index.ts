/**
 * Whether a plain-text field has something to show. A title of only spaces
 * would otherwise render an empty heading.
 */
export function hasText(value: string | null | undefined): boolean {
  return !!value?.trim()
}
