import { useWindowSize, useMediaQuery } from '@vueuse/core'
import { SCREENS } from '~/tailwind/screens'

export default function () {
  const { width } = useWindowSize()
  const isLessThanLg = computed(() => {
    return import.meta.server || width.value < SCREENS.lg
  })

  const isLessThanMd = computed(() => {
    return import.meta.server || width.value < SCREENS.md
  })

  const isMdUpwards = computed(() => {
    return import.meta.server || width.value >= SCREENS.md
  })

  const isSmUpwards = computed(() => {
    return import.meta.server || width.value >= SCREENS.sm
  })

  const isPrint = useMediaQuery('print')

  return { isLessThanLg, isLessThanMd, isMdUpwards, isPrint, isSmUpwards }
}
