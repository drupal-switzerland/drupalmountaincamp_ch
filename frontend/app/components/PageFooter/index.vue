<template>
  <footer class="z-10 mt-14 bg-primary-500 py-8 text-center text-white">
    <Container>
      <p class="text-sm">{{ copyright }}</p>
      <p class="mt-2 text-sm">
        Hosting powered by
        <a
          href="https://www.amazee.io"
          class="underline hover:text-accent-300"
          rel="noopener"
          >amazee.io</a
        >
      </p>
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
  </footer>
</template>

<script lang="ts" setup>
const data = await useInitData()
const footerMenuLinks = data.value.footerMenuLinks

// Fixed legal line — the Drupal-side easy_texts value still carries the Liip
// starter default ("@year Liip AG"), so don't source this from translations.
const copyright =
  '© Drupal Events Switzerland. Drupal is a registered trademark of Dries Buytaert.'
</script>
