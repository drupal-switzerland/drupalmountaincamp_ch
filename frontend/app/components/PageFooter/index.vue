<template>
  <footer class="z-10 mt-14">
    <div class="bg-gray-100 py-8 text-center">
      <Container>
        <div class="flex flex-wrap items-end justify-center gap-x-16 gap-y-8">
          <div>
            <p class="mb-4 text-sm">Media partners</p>
            <div class="flex items-center justify-center gap-8">
              <a
                v-for="partner in mediaPartners"
                :key="partner.href"
                :href="partner.href"
                rel="nofollow noopener"
                target="_blank"
              >
                <img :src="partner.logo" :alt="partner.name" class="h-16" />
              </a>
            </div>
          </div>
          <div>
            <p class="mb-4 text-sm">Hosting powered by</p>
            <a
              href="https://www.amazee.io"
              rel="nofollow noopener"
              target="_blank"
            >
              <img
                src="/images/logos/amazeeio.png"
                alt="amazee.io"
                class="mx-auto h-16"
              />
            </a>
          </div>
        </div>
      </Container>
    </div>
    <div class="bg-primary-500 py-8 text-center text-white">
      <Container>
        <p class="text-sm">{{ copyright }}</p>
        <ul
          v-if="footerMenuLinks.length"
          class="mt-6 flex flex-wrap items-center justify-center gap-x-2 text-sm"
        >
          <li
            v-for="(link, i) in footerMenuLinks"
            :key="`footer_${i}`"
            class="flex items-center gap-2"
          >
            <span v-if="i > 0" aria-hidden="true">&ndash;</span>
            <VuepalLink
              :to="link.link?.url?.path"
              class="hover:text-accent-300 hover:underline"
            >
              {{ link.link.label }}
            </VuepalLink>
          </li>
        </ul>
      </Container>
    </div>
  </footer>
</template>

<script lang="ts" setup>
const data = await useInitData()
const footerMenuLinks = data.value.footerMenuLinks

// Fixed legal line — the Drupal-side easy_texts value still carries the Liip
// starter default ("@year Liip AG"), so don't source this from translations.
const copyright =
  '© Drupal Events Switzerland. Drupal is a registered trademark of Dries Buytaert.'

// ponytail: hardcoded like on the current prod site (a static block there) —
// move to Drupal content/menu if partners start changing per camp.
const mediaPartners = [
  {
    name: 'The DropTimes',
    href: 'https://www.thedroptimes.com/',
    logo: '/images/logos/droptimes-logo.png',
  },
  {
    name: 'The Weekly Drop',
    href: 'https://www.theweeklydrop.com/',
    logo: '/images/logos/weeklydrop-logo-mini.png',
  },
]
</script>
