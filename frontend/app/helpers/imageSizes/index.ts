import { SCREENS } from '~/tailwind/screens'

export type ImageSizesRule = {
  /** Viewport width in px from which the rule applies. */
  minWidth: number
  /** Width of the image there, as a CSS length. */
  width: string
}

/**
 * The `sizes` attribute of an image that spans the viewport below its
 * narrowest rule. The widths must not be smaller than the image is rendered:
 * the browser picks the file from them before layout.
 */
export function buildImageSizes(rules: ImageSizesRule[]): string {
  return [...rules]
    .sort((a, b) => b.minWidth - a.minWidth)
    .map((rule) => `(min-width: ${rule.minWidth}px) ${rule.width}`)
    .concat('100vw')
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
