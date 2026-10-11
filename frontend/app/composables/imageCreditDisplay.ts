import type { InjectionKey } from 'vue'

/** Provided by article nodes, whose images keep the credit under the image. */
export const IMAGE_CREDIT_BELOW_IMAGE: InjectionKey<boolean> = Symbol(
  'imageCreditBelowImage',
)

export function useImageCreditOnImage(): boolean {
  return !inject(IMAGE_CREDIT_BELOW_IMAGE, false)
}
