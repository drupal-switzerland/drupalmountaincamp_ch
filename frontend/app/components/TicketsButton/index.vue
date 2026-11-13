<template>
  <VuepalLink
    v-if="ticketsLink"
    :to="ticketsLink.href"
    :target="ticketsLink.target"
    :aria-current="route.path === ticketsLink.href ? 'page' : undefined"
  >
    <slot :label="ticketsLink.label" />
    <span v-if="ticketsLink.opensNewTab" class="sr-only">
      ({{ $texts('newTabHint', 'opens in a new tab') }})
    </span>
  </VuepalLink>
</template>

<script lang="ts" setup>
const route = useRoute()
const { $texts } = useEasyTexts()
const ticketsLink = await useTicketsLink()
</script>
