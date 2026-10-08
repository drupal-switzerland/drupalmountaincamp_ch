<template>
  <footer class="z-10 mt-14">
    <div class="bg-primary-50">
      <div class="brand-strip" aria-hidden="true" />
      <Container class="flex flex-col gap-7 py-7">
        <section
          :aria-labelledby="sponsorsTitleId"
          class="flex flex-col gap-4 rounded-xl border-2 border-primary-100 bg-white p-5 md:p-6"
        >
          <div
            class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2"
          >
            <h2 :id="sponsorsTitleId" class="label">
              {{ $texts('sponsors.label', 'Sponsors 2027') }}
            </h2>
            <VuepalLink :to="SPONSORSHIP_PATH" class="link font-bold">
              {{ $texts('sponsors.cta', 'Become a sponsor') }}
            </VuepalLink>
          </div>
          <div
            v-for="tier in sponsorTiers"
            :key="tier.key"
            class="flex flex-col gap-2"
          >
            <h3 class="label text-primary-500">{{ tier.label }}</h3>
            <ul class="flex flex-wrap gap-4">
              <li v-for="sponsor in tier.sponsors" :key="sponsor.uuid">
                <SponsorTile
                  :sponsor
                  :box="tier.box"
                  :tile-class="tier.tileClass"
                  :described-by="newTabHintId"
                />
              </li>
            </ul>
          </div>
        </section>
        <section
          v-if="partnerGroups.length"
          aria-labelledby="footer-partners-title"
          class="flex flex-wrap items-end justify-between gap-x-12 gap-y-6"
        >
          <h2 id="footer-partners-title" class="sr-only">
            {{ $texts('partners.title', 'Partners') }}
          </h2>
          <div
            v-for="group in partnerGroups"
            :key="group.key"
            class="flex flex-col gap-3"
          >
            <h3 class="label">{{ group.label }}</h3>
            <ul class="flex flex-wrap gap-4">
              <li v-for="sponsor in group.sponsors" :key="sponsor.uuid">
                <SponsorTile
                  :sponsor
                  :box="LOGO_BOXES.standard"
                  :tile-class="STANDARD_TILE"
                  :described-by="newTabHintId"
                />
              </li>
            </ul>
          </div>
        </section>
      </Container>
    </div>
    <div class="on-dark bg-primary-500 text-white">
      <Container class="flex flex-col gap-4 py-9">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <p class="font-heading text-xl font-bold uppercase tracking-wide">
            Mountain Camp <span class="text-primary-300">2027</span>
          </p>
          <nav
            v-if="footerMenuLinks.length"
            :aria-label="$texts('footer.navigation', 'Footer')"
          >
            <ul class="flex flex-wrap gap-x-5 gap-y-1">
              <li v-for="(link, i) in footerMenuLinks" :key="`footer_${i}`">
                <VuepalLink
                  :to="link.link?.url?.path"
                  class="inline-block py-3 underline-offset-4 hover:underline"
                >
                  {{ link.link.label }}
                </VuepalLink>
              </li>
            </ul>
          </nav>
        </div>
        <p class="text-sm text-primary-100">{{ copyright }}</p>
      </Container>
    </div>
    <span :id="newTabHintId" hidden>
      {{ $texts('newTabHint', 'opens in a new tab') }}
    </span>
  </footer>
</template>

<script lang="ts" setup>
import { LOGO_BOXES, SPONSORSHIP_PATH } from '~/helpers/sponsors'

const { $texts } = useEasyTexts()
const data = await useInitData()
const footerMenuLinks = data.value.footerMenuLinks
const newTabHintId = useId()

// Fixed legal line — the Drupal-side easy_texts value still carries the Liip
// starter default ("@year Liip AG"), so don't source this from translations.
const copyright =
  '© Drupal Events Switzerland. Drupal is a registered trademark of Dries Buytaert.'

const sponsorsTitleId = useId()
const { currentByTier } = await useSponsors()

const STANDARD_TILE = 'h-[72px] w-[200px]'

// Platinum, Gold and Silver as one panel; Silver tiles match the partner tiles.
const sponsorTiers = computed(() =>
  [
    {
      key: 'platinum',
      label: $texts('sponsors.platinum', 'Platinum'),
      box: LOGO_BOXES.large,
      tileClass: 'h-[100px] w-[280px]',
    },
    {
      key: 'gold',
      label: $texts('sponsors.gold', 'Gold'),
      box: LOGO_BOXES.medium,
      tileClass: 'h-[88px] w-[240px]',
    },
    {
      key: 'silver',
      label: $texts('sponsors.silver', 'Silver'),
      box: LOGO_BOXES.standard,
      tileClass: STANDARD_TILE,
    },
  ]
    .map((tier) => ({ ...tier, sponsors: currentByTier.value[tier.key] ?? [] }))
    .filter((tier) => tier.sponsors.length),
)

const partnerGroups = computed(() =>
  [
    { key: 'media', label: $texts('partners.media', 'Media partners') },
    { key: 'hosting', label: $texts('partners.hosting', 'Hosting powered by') },
  ]
    .map((group) => ({
      ...group,
      sponsors: currentByTier.value[group.key] ?? [],
    }))
    .filter((group) => group.sponsors.length),
)
</script>
