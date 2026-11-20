import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { NodeSponsorFragment } from '#graphql-operations'
import { useAllSponsors, useCurrentSponsors } from '../composables/useSponsors'
import { SPONSOR_YEAR } from '../helpers/sponsors'

const { queryItems, query } = vi.hoisted(() => {
  const queryItems = { value: [] as unknown[] }
  return {
    queryItems,
    query: vi.fn((_name: string, _variables?: Record<string, unknown>) =>
      Promise.resolve({ data: { entityQuery: { items: queryItems.value } } }),
    ),
  }
})
mockNuxtImport('useGraphqlQuery', () => query)

const sponsor = (
  uuid: string,
  year: number,
  tier?: string,
): NodeSponsorFragment => ({ uuid, title: uuid, year, tier })

beforeEach(() => {
  clearNuxtData()
  query.mockClear()
})

describe('useCurrentSponsors', () => {
  it('asks Drupal for the current edition only', async () => {
    queryItems.value = []

    await useCurrentSponsors()

    expect(query).toHaveBeenCalledTimes(1)
    expect(query).toHaveBeenCalledWith('sponsorsOfYear', {
      year: String(SPONSOR_YEAR),
    })
  })

  it('groups the sponsors by tier and skips those without one', async () => {
    const platinumA = sponsor('platinum-a', SPONSOR_YEAR, 'platinum')
    const platinumB = sponsor('platinum-b', SPONSOR_YEAR, 'platinum')
    const silver = sponsor('silver', SPONSOR_YEAR, 'silver')
    queryItems.value = [
      platinumA,
      null,
      {},
      silver,
      sponsor('no-tier', SPONSOR_YEAR),
      platinumB,
    ]

    const { currentByTier } = await useCurrentSponsors()

    expect(currentByTier.value).toEqual({
      platinum: [platinumA, platinumB],
      silver: [silver],
    })
  })

  it('leaves out another edition even when Drupal returns it', async () => {
    const current = sponsor('current', SPONSOR_YEAR, 'gold')
    queryItems.value = [sponsor('past', SPONSOR_YEAR - 1, 'gold'), current]

    const { currentByTier } = await useCurrentSponsors()

    expect(currentByTier.value).toEqual({ gold: [current] })
  })

  it('is empty when the query returns no sponsors', async () => {
    queryItems.value = []

    const { currentByTier } = await useCurrentSponsors()

    expect(currentByTier.value).toEqual({})
  })
})

describe('useAllSponsors', () => {
  it('asks for every year and keeps only sponsor nodes, in query order', async () => {
    const gold = sponsor('gold', SPONSOR_YEAR, 'gold')
    const past = sponsor('past', SPONSOR_YEAR - 1, 'gold')
    queryItems.value = [gold, null, {}, past]

    const { sponsors } = await useAllSponsors()

    expect(query).toHaveBeenCalledWith('sponsorList')
    expect(sponsors.value).toEqual([gold, past])
  })
})
