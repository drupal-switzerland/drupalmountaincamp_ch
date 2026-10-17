import type { ComputedRef, InjectionKey } from 'vue'

export type SpeakerListVariant = 'keynote' | 'featured'

/** Provided by the Speaker List paragraph to its cards. */
export const SPEAKER_LIST_VARIANT: InjectionKey<
  ComputedRef<SpeakerListVariant>
> = Symbol('speakerListVariant')
