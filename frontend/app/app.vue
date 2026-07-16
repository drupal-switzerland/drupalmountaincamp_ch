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
      <NuxtPage :page-key="route.path" />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
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
