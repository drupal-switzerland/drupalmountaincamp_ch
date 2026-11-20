import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import Button from '../components/Paragraph/Button/index.vue'

const { paragraph } = vi.hoisted(() => ({
  paragraph: {
    buttonType: 'standard',
    parentType: undefined as string | undefined,
  },
}))

mockNuxtImport('defineBlokkli', () => () => ({
  parentType: ref(paragraph.parentType),
  options: ref({ buttonType: paragraph.buttonType }),
}))

async function mountButton() {
  return mountSuspended(Button, {
    props: { label: 'Get tickets', link: { uri: { path: '/tickets' } } },
  })
}

describe('Button paragraph', () => {
  beforeEach(() => {
    paragraph.buttonType = 'standard'
    paragraph.parentType = undefined
  })

  it('links the label to the target', async () => {
    const link = (await mountButton()).get('a')

    expect(link.text()).toBe('Get tickets')
    expect(link.attributes('href')).toBe('/tickets')
  })

  it.each([
    ['standard', ['button']],
    ['filled', ['button', 'is-filled']],
    ['textOnly', ['button', 'is-text-only']],
  ])('styles the %s type', async (buttonType, classes) => {
    paragraph.buttonType = buttonType
    const link = (await mountButton()).get('a')

    expect(
      link
        .classes()
        .filter((c) => c.startsWith('button') || c.startsWith('is-')),
    ).toEqual(classes)
  })

  it('sits in its own grid at the top level', async () => {
    expect((await mountButton()).classes()).toContain('grid-container')
  })

  it('uses the parent layout inside another paragraph', async () => {
    paragraph.parentType = 'section'

    expect((await mountButton()).classes()).not.toContain('grid-container')
  })
})
