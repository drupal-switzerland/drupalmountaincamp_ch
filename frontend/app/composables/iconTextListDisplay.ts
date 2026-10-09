import type { ComputedRef, InjectionKey } from 'vue'

export type IconTextListDisplay = 'list' | 'dayCards' | 'infoCards' | 'timeline'

/** Provided by the Icon Text List paragraph to its items. */
export const ICON_TEXT_LIST_DISPLAY: InjectionKey<
  ComputedRef<IconTextListDisplay>
> = Symbol('iconTextListDisplay')
