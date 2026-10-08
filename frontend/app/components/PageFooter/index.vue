<template>
  <footer class="z-10 mt-14">
    <section aria-labelledby="footer-partners-title" class="bg-primary-50">
      <div class="brand-strip" aria-hidden="true" />
      <Container
        class="flex flex-wrap items-end justify-between gap-x-12 gap-y-6 py-7"
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
            <li v-for="partner in group.partners" :key="partner.href">
              <a
                :href="partner.href"
                rel="nofollow noopener"
                target="_blank"
                :aria-describedby="newTabHintId"
                class="flex h-[72px] w-[200px] items-center justify-center rounded-xl border-2 border-primary-100 bg-white px-4"
              >
                <img
                  :src="partner.logo"
                  :alt="partner.name"
                  v-bind="logoSize(partner.width, partner.height)"
                  class="object-contain"
                />
              </a>
            </li>
          </ul>
        </div>
      </Container>
    </section>
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
const { $texts } = useEasyTexts()
const data = await useInitData()
const footerMenuLinks = data.value.footerMenuLinks
const newTabHintId = useId()

// Fixed legal line — the Drupal-side easy_texts value still carries the Liip
// starter default ("@year Liip AG"), so don't source this from translations.
const copyright =
  '© Drupal Events Switzerland. Drupal is a registered trademark of Dries Buytaert.'

// Logos get the same visual area whatever their shape, capped to the tile
// (200x72, 2px border, 16px side padding).
const LOGO_AREA = 7000
const LOGO_MAX_WIDTH = 168
const LOGO_MAX_HEIGHT = 64

function logoSize(width: number, height: number) {
  const ratio = width / height
  let w = Math.sqrt(LOGO_AREA * ratio)
  let h = w / ratio
  if (h > LOGO_MAX_HEIGHT) {
    h = LOGO_MAX_HEIGHT
    w = h * ratio
  }
  if (w > LOGO_MAX_WIDTH) {
    w = LOGO_MAX_WIDTH
    h = w / ratio
  }
  return { width: Math.round(w), height: Math.round(h) }
}

// ponytail: hardcoded like on the current prod site (a static block there) —
// move to Drupal content/menu if partners start changing per camp.
// width/height: the logo file's pixel size, used for its aspect ratio.
const partnerGroups = computed(() => [
  {
    key: 'media',
    label: $texts('partners.media', 'Media partners'),
    partners: [
      {
        name: 'The DropTimes',
        href: 'https://www.thedroptimes.com/',
        logo: '/images/logos/droptimes-logo.png',
        width: 1167,
        height: 505,
      },
      {
        name: 'The Weekly Drop',
        href: 'https://www.theweeklydrop.com/',
        logo: '/images/logos/weeklydrop-logo-mini.png',
        width: 594,
        height: 73,
      },
    ],
  },
  {
    key: 'hosting',
    label: $texts('partners.hosting', 'Hosting powered by'),
    partners: [
      {
        name: 'amazee.io',
        href: 'https://www.amazee.io',
        logo: '/images/logos/amazeeio.png',
        width: 66,
        height: 86,
      },
    ],
  },
])
</script>
