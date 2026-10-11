import { SCREENS } from '~/tailwind/screens'

export type ImageSizesRule = {
  /** Viewport width in px from which the rule applies. */
  minWidth: number
  /** Width of the image there, as a CSS length. */
  width: string
}

const VIEWPORT_WIDTH = '100vw'

/**
 * The `sizes` attribute of an image: one width per breakpoint rule, and
 * `narrowWidth` below the narrowest rule. A width must be at least as wide as
 * the image is rendered there, and as close to it as the layout allows: the
 * browser picks the file from it before layout, and a width that is too large
 * makes it pick a larger file than the image needs.
 */
export function buildImageSizes(
  rules: ImageSizesRule[],
  narrowWidth: string = VIEWPORT_WIDTH,
): string {
  return [...rules]
    .sort((a, b) => b.minWidth - a.minWidth)
    .map((rule) => `(min-width: ${rule.minWidth}px) ${rule.width}`)
    .concat(narrowWidth)
    .join(', ')
}

/**
 * For an image whose layout is not known: as wide as the largest width it is
 * configured for (or the container), and the viewport below that.
 */
export function fallbackImageSizes(configuredWidths: number[]): string {
  const max = configuredWidths.length
    ? Math.max(...configuredWidths)
    : SCREENS.xl
  return buildImageSizes([{ minWidth: max, width: `${max}px` }])
}
