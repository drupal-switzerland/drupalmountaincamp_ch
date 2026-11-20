import { describe, expect, it } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import Breadcrumb from '../components/Breadcrumb/index.vue'

mockNuxtImport('useEasyTexts', () => () => ({
  $texts: (_key: string, fallback: string) => fallback,
}))

const home = { title: 'Home', url: { path: '/' } }
const news = { title: 'News', url: { path: '/news' } }
const unlinked = { title: 'Archive', url: {} }

type Props = InstanceType<typeof Breadcrumb>['$props']

async function listItems(props: Props) {
  const wrapper = await mountSuspended(Breadcrumb, { props })
  return wrapper.findAll('[itemprop="itemListElement"]').map((item) => ({
    name: item.get('[itemprop="name"]').text(),
    position: item.get('meta[itemprop="position"]').attributes('content'),
    item: item.findAll('[itemprop="item"]')[0]?.attributes('href'),
  }))
}

describe('breadcrumb structured data', () => {
  it('numbers the trail from 1, the current page last', async () => {
    expect(
      await listItems({ links: [home, news], currentTitle: 'Keynotes' }),
    ).toEqual([
      { name: 'Home', position: '1', item: '/' },
      { name: 'News', position: '2', item: '/news' },
      { name: 'Keynotes', position: '3', item: undefined },
    ])
  })

  it('names an item without a link, but gives it no URL', async () => {
    const wrapper = await mountSuspended(Breadcrumb, {
      props: { links: [home, unlinked] },
    })

    expect(wrapper.findAll('[itemprop="item"]')).toHaveLength(1)
    expect(await listItems({ links: [home, unlinked] })).toEqual([
      { name: 'Home', position: '1', item: '/' },
      { name: 'Archive', position: '2', item: undefined },
    ])
  })
})
