<template>
  <footer class="z-10 mt-14">
    <!-- Same on every page: the event call to action under a night sky, the
         ridge, then every sponsor tier and the partners in the snow. -->
    <section
      :aria-labelledby="ctaTitleId"
      class="brand-hero on-dark overflow-hidden text-white"
    >
      <div
        class="container relative !my-0 flex flex-col items-start gap-4 pt-14 md:pt-20"
      >
        <BrandSparkles
          class="pointer-events-none absolute right-outer top-14 hidden w-24 text-white md:top-20 md:block lg:w-28"
        />
        <p class="label">
          {{ $texts('edition.label', '10th anniversary gathering') }}
        </p>
        <h2 :id="ctaTitleId" class="max-w-3xl text-4xl md:text-5xl">
          {{ $texts('edition.title', 'Join us for our 6th edition') }}
        </h2>
        <p class="text-lg text-primary-100 md:text-xl">
          {{ $texts('edition.dates', 'March 2–4, 2027') }}
          <span aria-hidden="true" class="mx-1">·</span>
          {{ $texts('edition.venue', 'Davos Congress Centre, Switzerland') }}
        </p>
        <VuepalLink
          v-if="ticketsLink"
          :to="ticketsLink.link.url?.path"
          class="ticket-button mt-2"
        >
          {{ $texts('edition.tickets', 'Get tickets') }}
          <span aria-hidden="true">→</span>
        </VuepalLink>
      </div>
      <BrandRidge class="mt-8 xs:mt-0" />
    </section>
    <div class="bg-primary-100">
      <Container
        class="relative !my-0 flex flex-col gap-8 pb-14 pt-2 xs:-mt-10"
      >
        <section :aria-labelledby="sponsorsTitleId" class="flex flex-col gap-5">
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
          class="flex flex-wrap items-end justify-between gap-x-12 gap-y-6 border-t border-primary-500 pt-7"
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
import type { NodeSponsorFragment } from '#graphql-operations'
import { LOGO_BOXES, SPONSORSHIP_PATH, SPONSOR_YEAR } from '~/helpers/sponsors'

const { $texts } = useEasyTexts()
const data = await useInitData()
const footerMenuLinks = data.value.footerMenuLinks
const newTabHintId = useId()

// Fixed legal line — the Drupal-side easy_texts value still carries the Liip
// starter default ("@year Liip AG"), so don't source this from translations.
const copyright =
  '© Drupal Events Switzerland. Drupal is a registered trademark of Dries Buytaert.'

const sponsorsTitleId = useId()
const ctaTitleId = useId()
const ticketsLink = await useTicketsLink()
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

function bundledPartner(
  title: string,
  href: string,
  src: string,
  width: number,
  height: number,
): NodeSponsorFragment {
  return {
    uuid: href,
    title,
    tier: 'media',
    year: SPONSOR_YEAR,
    link: { uri: { path: href } },
    logo: {
      first: { entity: { image: { wide: { urlPath: src, width, height } } } },
    },
  }
}

// Image uploads to Rokka currently fail, so media partners use bundled logos
// unless Media partner Sponsor entries exist.
const BUNDLED_MEDIA_PARTNERS = [
  bundledPartner(
    'The DropTimes',
    'https://www.thedroptimes.com/',
    '/images/logos/droptimes-logo.png',
    400,
    173,
  ),
  bundledPartner(
    'The Weekly Drop',
    'https://www.theweeklydrop.com/',
    '/images/logos/weeklydrop-logo-mini.png',
    594,
    73,
  ),
]

const partnerGroups = computed(() =>
  [
    {
      key: 'media',
      label: $texts('partners.media', 'Media partners'),
      sponsors: currentByTier.value.media ?? BUNDLED_MEDIA_PARTNERS,
    },
    {
      key: 'hosting',
      label: $texts('partners.hosting', 'Hosting powered by'),
      sponsors: currentByTier.value.hosting ?? [],
    },
  ].filter((group) => group.sponsors.length),
)
</script>
