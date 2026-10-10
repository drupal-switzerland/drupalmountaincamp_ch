<template>
  <div class="my-7 md:mb-12 lg:mb-20">
    <Container>
      <h2 v-if="title" class="mb-10 text-3xl md:text-4xl lg:mb-14">
        {{ title }}
      </h2>
      <p v-else-if="isEditing && !groups.length" class="text-gray-600">
        No published sponsors{{ year ? ` for ${year}` : '' }} yet.
      </p>
      <section v-for="group in groups" :key="group.key" class="mb-12">
        <h3 class="mb-6 text-sm uppercase tracking-wide text-gray-600">
          {{ group.label }}
        </h3>
        <ul class="flex flex-wrap gap-4">
          <li v-for="sponsor in group.sponsors" :key="sponsor.uuid">
            <SponsorTile
              :sponsor
              :box="LOGO_BOXES.standard"
              tile-class="h-[72px] w-[200px]"
              :described-by="newTabHintId"
            />
          </li>
        </ul>
      </section>
    </Container>
    <span :id="newTabHintId" hidden>
      {{ $texts('newTabHint', 'opens in a new tab') }}
    </span>
  </div>
</template>

<script lang="ts" setup>
import type {
  NodeSponsorFragment,
  ParagraphSponsorListFragment,
} from '#graphql-operations'
import { LOGO_BOXES } from '~/helpers/sponsors'

const props = defineProps<{
  title?: ParagraphSponsorListFragment['title']
  year?: ParagraphSponsorListFragment['year']
}>()

defineBlokkli({
  bundle: 'sponsor_list',
  editor: {
    editTitle: (el) => el.querySelector('h2')?.innerText,
  },
})

const isEditing = import.meta.blokkliEditing
const { $texts } = useEasyTexts()
const newTabHintId = useId()

// Display order and labels of the field_sponsor_tier allowed values.
const TIERS: Record<string, string> = {
  diamond: 'Diamond',
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
  social: 'Social Event Sponsor',
  contribution: 'Contribution Sponsor',
  media: 'Media partner',
  hosting: 'Hosting partner',
  individual: 'Individual Sponsor',
}
const TIER_ORDER = Object.keys(TIERS)

const { sponsors: allSponsors } = await useSponsors()

const groups = computed(() => {
  const sponsors = allSponsors.value.filter(
    (item) => !props.year || item.year === props.year,
  )
  const byKey = new Map<string, NodeSponsorFragment[]>()
  for (const s of sponsors) {
    const key = `${s.year}:${s.tier}`
    byKey.set(key, [...(byKey.get(key) ?? []), s])
  }
  return [...byKey.entries()]
    .sort(([a], [b]) => {
      const [ya, ta] = a.split(':')
      const [yb, tb] = b.split(':')
      return (
        Number(yb) - Number(ya) ||
        TIER_ORDER.indexOf(ta!) - TIER_ORDER.indexOf(tb!)
      )
    })
    .map(([key, list]) => {
      const [y, tier] = key.split(':')
      const label = TIERS[tier!] ?? tier
      return {
        key,
        // The year is only part of the heading when several years are shown.
        label: props.year ? label : `${label} ${y}`,
        sponsors: list,
      }
    })
})
</script>
