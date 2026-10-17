import type { ComputedRef, InjectionKey } from 'vue'

export type SpeakerListVariant = 'keynote' | 'featured'

/** Provided by the Speaker List paragraph to its cards. */
export const SPEAKER_LIST_VARIANT: InjectionKey<
  ComputedRef<SpeakerListVariant>
> = Symbol('speakerListVariant')

export type SpeakerCardHeading = 'h2' | 'h3'

/** Provided by the Speaker List paragraph: the heading element of its cards. */
export const SPEAKER_CARD_HEADING: InjectionKey<
  ComputedRef<SpeakerCardHeading>
> = Symbol('speakerCardHeading')
