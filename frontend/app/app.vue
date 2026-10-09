<template>
  <div class="bk-main-canvas relative">
    <ClientOnly>
      <div
        v-if="drupalUser.accessToolbar && !isEditing"
        class="hidden border-b border-b-gray-100 bg-white lg:block"
      >
        <VuepalAdminToolbar :key="language" />
        <div class="flex">
          <div class="mx-auto w-auto bg-white py-8 xl:min-w-[1174px]">
            <VuepalLocalTasks />
          </div>
        </div>
      </div>
    </ClientOnly>
    <NuxtLayout>
      <NuxtPage :page-key="pageKey" />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import type { RouteLocationNormalizedLoaded } from 'vue-router'

const route = useRoute()

// Keyed by the page's own route: `route` only updates after a page has
// resolved, so as a key it never changed.
const pageKey = (pageRoute: RouteLocationNormalizedLoaded) => pageRoute.path
const drupalUser = useDrupalUser()
const language = useCurrentLanguage()

const isEditing = computed(
  () =>
    !!(route.query.blokkliEditing || route.query.blokkliPreview) &&
    drupalUser.value.accessToolbar,
)

useHead({
  htmlAttrs: {
    lang: language.value,
  },
})
</script>
