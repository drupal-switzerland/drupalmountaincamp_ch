import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Collapsible from '../components/Collapsible/index.vue'

const durations: number[] = []

function mockMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({ matches: reduce && query.includes('reduce') }) as MediaQueryList,
  )
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => cb(0))
  HTMLElement.prototype.animate = function (_keyframes, options) {
    durations.push((options as KeyframeAnimationOptions).duration as number)
    const animation = { cancel: () => {} } as Animation
    // Finish on the next tick, after the component assigns onfinish.
    setTimeout(() => animation.onfinish?.({} as AnimationPlaybackEvent))
    return animation
  }
}

async function mountCollapsible() {
  return mountSuspended(Collapsible, {
    props: { detailsClassList: '', summaryClassList: '', forceOpen: false },
    slots: { summary: () => 'Summary', details: () => 'Details' },
  })
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve))
}

describe('collapsible', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    durations.length = 0
  })

  it.each([
    [false, 250],
    [true, 0],
  ])(
    'opens and closes with reduced motion %s in %i ms',
    async (reduce, duration) => {
      mockMotion(reduce)
      const wrapper = await mountCollapsible()
      const details = wrapper.get('details').element as HTMLDetailsElement

      await wrapper.get('summary').trigger('click')
      await settle()
      expect(details.open).toBe(true)

      await wrapper.get('summary').trigger('click')
      await settle()
      expect(details.open).toBe(false)

      expect(durations).toEqual([duration, duration])
    },
  )
})
