import type { NodeSponsorFragment } from '#graphql-operations'
import { SPONSOR_YEAR, groupByTier } from '~/helpers/sponsors'

function onlySponsors(items: unknown[] | undefined): NodeSponsorFragment[] {
  return (items ?? []).filter(
    (item): item is NodeSponsorFragment =>
      !!item && typeof item === 'object' && 'title' in item,
  )
}

/** Sponsors of the current edition by tier; the footer and homepage card share one request. */
export async function useCurrentSponsors() {
  const { data } = await useAsyncData(`sponsors-${SPONSOR_YEAR}`, () =>
    useGraphqlQuery('sponsorsOfYear', { year: String(SPONSOR_YEAR) }).then(
      (v) => v.data,
    ),
  )

  // Filtered again here: if Drupal ever ignores the year condition, the footer
  // must not show another edition's sponsors.
  const currentByTier = computed(() =>
    groupByTier(
      onlySponsors(data.value?.entityQuery.items).filter(
        (sponsor) => sponsor.year === SPONSOR_YEAR,
      ),
    ),
  )

  return { currentByTier }
}

/** All published sponsors of every year, for the Sponsor List paragraph. */
export async function useAllSponsors() {
  const { data } = await useAsyncData('sponsor-list', () =>
    useGraphqlQuery('sponsorList').then((v) => v.data),
  )

  const sponsors = computed(() => onlySponsors(data.value?.entityQuery.items))

  return { sponsors }
}
