import type { ComputedRef, InjectionKey } from 'vue'

export type SpeakerCardHeading = 'h2' | 'h3'

/** Provided by the Speaker List paragraph: the heading element of its cards. */
export const SPEAKER_CARD_HEADING: InjectionKey<
  ComputedRef<SpeakerCardHeading>
> = Symbol('speakerCardHeading')
