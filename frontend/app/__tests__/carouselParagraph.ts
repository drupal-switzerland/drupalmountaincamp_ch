import { describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import Carousel from '../components/Paragraph/Carousel/index.vue'

mockNuxtImport('defineBlokkli', () => () => ({}))

async function headings(title: string | undefined) {
  const wrapper = await mountSuspended(Carousel, {
    props: { title, slides: [] } as never,
    global: { stubs: { BlokkliField: true } },
  })
  return wrapper.findAll('h2').map((heading) => heading.text())
}

describe('carousel paragraph', () => {
  it('has a heading only when it has a title', async () => {
    expect(await headings('Impressions')).toEqual(['Impressions'])
    expect(await headings('')).toEqual([])
    expect(await headings('  \n')).toEqual([])
    expect(await headings(undefined)).toEqual([])
  })
})
