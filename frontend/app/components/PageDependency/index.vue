<template>
  <NuxtPageDependency>
    <slot />
  </NuxtPageDependency>
</template>

<script lang="ts" setup>
// NuxtPageDependency's setup is async on the server only. Vue counts every
// async setup when it builds useId prefixes, so without a matching async step
// while hydrating, every useId after this component differs between server
// and client.
if (import.meta.client && useNuxtApp().isHydrating) {
  await Promise.resolve()
}
</script>
