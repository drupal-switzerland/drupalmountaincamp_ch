import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import MediaImage from '../components/MediaImage/index.vue'
import { IMAGE_CREDIT_BELOW_IMAGE } from '../composables/imageCreditDisplay'

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (key: string) => key,
}))

const image = {
  alt: 'Photo',
  wide: {
    urlPath: '/sites/default/files/styles/wide/public/photo.jpg',
    width: 1090,
    height: 545,
  },
}

const copyright = 'Josef Kruckenberg'

const article = {
  global: { provide: { [IMAGE_CREDIT_BELOW_IMAGE as symbol]: true } },
}

function pointer(type: string, pointerType: string) {
  const event = new Event(type)
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  return event
}

async function mountWithCredit() {
  const wrapper = await mountSuspended(MediaImage, {
    props: { image, copyright },
  })
  const button = wrapper.get('button')
  const credit = wrapper.get(`[id="${button.attributes('aria-controls')}"]`)
  const hoverArea = wrapper.get('img').element.parentElement!
  const hover = async (type: string, pointerType = 'mouse') => {
    hoverArea.dispatchEvent(pointer(type, pointerType))
    await wrapper.vm.$nextTick()
  }
  const pressEscape = async () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
  }
  const isOpen = () =>
    button.attributes('aria-expanded') === 'true' &&
    !credit.classes().includes('hidden')
  return { wrapper, button, credit, hover, pressEscape, isOpen }
}

function keydownListeners(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls.filter((call) => call[0] === 'keydown').length
}

describe('MediaImage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('puts imgClass on the image, so rounding never clips the caption', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: { image, copyright, imgClass: 'rounded-[18px]' },
      ...article,
    })

    expect(wrapper.get('img').classes()).toContain('rounded-[18px]')
    expect(wrapper.get('figure').classes()).not.toContain('rounded-[18px]')
    expect(wrapper.get('figure').classes()).not.toContain('overflow-hidden')
  })

  it('renders no caption without caption or copyright', async () => {
    const wrapper = await mountSuspended(MediaImage, { props: { image } })

    expect(wrapper.find('figcaption').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('keeps the credit under the image in articles', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: { image, copyright },
      ...article,
    })

    expect(wrapper.get('figcaption').text()).toBe('© Josef Kruckenberg')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('moves the credit onto the image outside articles, closed by default', async () => {
    const { wrapper, button, credit, isOpen } = await mountWithCredit()

    expect(wrapper.find('figcaption').exists()).toBe(false)
    expect(button.attributes('aria-label')).toBe('imageCredit.toggle')
    expect(credit.text()).toBe(copyright)
    expect(isOpen()).toBe(false)
  })

  it('keeps the caption under the image when the credit is on it', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: { image, copyright, caption: 'The venue' },
    })

    expect(wrapper.get('figcaption').text()).toBe('The venue')
  })

  it('renders no credit at all with hideCaption', async () => {
    const wrapper = await mountSuspended(MediaImage, {
      props: { image, copyright, hideCaption: true },
    })

    expect(wrapper.find('figcaption').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('shows the credit while a mouse hovers the image', async () => {
    const { hover, isOpen } = await mountWithCredit()

    await hover('pointerenter')
    expect(isOpen()).toBe(true)

    await hover('pointerleave')
    expect(isOpen()).toBe(false)
  })

  it('does not open on a touch pointer, which never leaves', async () => {
    const { hover, isOpen } = await mountWithCredit()

    await hover('pointerenter', 'touch')
    expect(isOpen()).toBe(false)
  })

  it('toggles from the button for keyboard and touch', async () => {
    const { button, isOpen } = await mountWithCredit()

    await button.trigger('click')
    expect(isOpen()).toBe(true)

    await button.trigger('click')
    expect(isOpen()).toBe(false)
  })

  it('closes on Escape, hovered or toggled open, until the next hover', async () => {
    const { button, hover, pressEscape, isOpen } = await mountWithCredit()

    await button.trigger('click')
    await hover('pointerenter')
    await pressEscape()
    expect(isOpen()).toBe(false)

    await hover('pointerleave')
    await hover('pointerenter')
    expect(isOpen()).toBe(true)
  })

  it('adds no keydown listener for an image without a credit', async () => {
    const added = vi.spyOn(window, 'addEventListener')

    await mountSuspended(MediaImage, { props: { image } })
    await mountSuspended(MediaImage, {
      props: { image, copyright, hideCaption: true },
    })

    expect(keydownListeners(added)).toBe(0)
  })

  it('listens for Escape only while the credit is open', async () => {
    const added = vi.spyOn(window, 'addEventListener')
    const removed = vi.spyOn(window, 'removeEventListener')
    const { button } = await mountWithCredit()

    expect(keydownListeners(added)).toBe(0)

    await button.trigger('click')
    expect(keydownListeners(added)).toBe(1)
    expect(keydownListeners(removed)).toBe(0)

    await button.trigger('click')
    expect(keydownListeners(added)).toBe(1)
    expect(keydownListeners(removed)).toBe(1)
  })

  it('prints the credit as dark text under the image, without its background', async () => {
    const { button, credit } = await mountWithCredit()
    const chip = button.element.parentElement!

    expect(credit.element.parentElement).toBe(chip)
    expect([...chip.classList]).toEqual(
      expect.arrayContaining([
        'print:static',
        'print:bg-transparent',
        'print:text-gray-600',
      ]),
    )
    expect(credit.classes()).toContain('print:inline')
  })
})
