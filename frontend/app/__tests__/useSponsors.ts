import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { NodeSponsorFragment } from '#graphql-operations'
import { useSponsors } from '../composables/useSponsors'
import { SPONSOR_YEAR } from '../helpers/sponsors'

const { queryItems } = vi.hoisted(() => ({
  queryItems: { value: [] as unknown[] },
}))
mockNuxtImport(
  'useGraphqlQuery',
  () => () =>
    Promise.resolve({ data: { entityQuery: { items: queryItems.value } } }),
)

const sponsor = (
  uuid: string,
  year: number,
  tier?: string,
): NodeSponsorFragment => ({ uuid, title: uuid, year, tier })

describe('useSponsors', () => {
  beforeEach(() => {
    clearNuxtData('sponsor-list')
  })

  it('keeps only sponsor nodes, in query order', async () => {
    const gold = sponsor('gold', SPONSOR_YEAR, 'gold')
    const past = sponsor('past', SPONSOR_YEAR - 1, 'gold')
    queryItems.value = [gold, null, {}, past]

    const { sponsors } = await useSponsors()

    expect(sponsors.value).toEqual([gold, past])
  })

  it('groups the current year sponsors by tier', async () => {
    const platinumA = sponsor('platinum-a', SPONSOR_YEAR, 'platinum')
    const platinumB = sponsor('platinum-b', SPONSOR_YEAR, 'platinum')
    const silver = sponsor('silver', SPONSOR_YEAR, 'silver')
    queryItems.value = [
      platinumA,
      sponsor('old-platinum', SPONSOR_YEAR - 1, 'platinum'),
      sponsor('next-silver', SPONSOR_YEAR + 1, 'silver'),
      silver,
      sponsor('no-tier', SPONSOR_YEAR),
      platinumB,
    ]

    const { currentByTier } = await useSponsors()

    expect(currentByTier.value).toEqual({
      platinum: [platinumA, platinumB],
      silver: [silver],
    })
  })

  it('is empty when the query returns no sponsors', async () => {
    queryItems.value = []

    const { sponsors, currentByTier } = await useSponsors()

    expect(sponsors.value).toEqual([])
    expect(currentByTier.value).toEqual({})
  })
})
