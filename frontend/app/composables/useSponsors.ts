import type { NodeSponsorFragment } from '#graphql-operations'
import { SPONSOR_YEAR, groupByTier } from '~/helpers/sponsors'

/** All published sponsors; the footer, homepage card and Sponsor List share one request. */
export async function useSponsors() {
  const { data } = await useAsyncData('sponsor-list', () =>
    useGraphqlQuery('sponsorList').then((v) => v.data),
  )

  const sponsors = computed(() =>
    (data.value?.entityQuery.items ?? []).filter(
      (item): item is NodeSponsorFragment => !!item && 'title' in item,
    ),
  )

  const currentByTier = computed(() =>
    groupByTier(sponsors.value.filter((s) => s.year === SPONSOR_YEAR)),
  )

  return { sponsors, currentByTier }
}
