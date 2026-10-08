<template>
  <div>
    <PageHeaderEventStrip />
    <PageHeader
      @menu:open="menuOpen"
      @menu:close:start="menuCloseStart"
      @menu:close:finished="menuCloseFinish"
    />

    <div
      :inert="isMainMenuOpen || undefined"
      :class="{
        'pt-[100px]': (isMenuOpen || !hasMenuFinishedClosing) && isLessThanLg,
      }"
    >
      <NuxtPageDependency>
        <Breadcrumb v-if="showBreadcrumb" :links="breadcrumb" />
      </NuxtPageDependency>

      <main id="main-content" class="page-content">
        <ClientOnly>
          <DrupalMessages v-if="!isEditing" />
        </ClientOnly>

        <slot />
      </main>
    </div>
    <PageFooter :inert="isMainMenuOpen || undefined" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const drupalUser = useDrupalUser()
const language = useCurrentLanguage()
const breadcrumb = useDisplayedBreadcrumbLinks()
const { isLessThanLg } = useViewport()

const isEditing = computed(
  () =>
    !!(route.query.blokkliEditing || route.query.blokkliPreview) &&
    drupalUser.value.accessToolbar,
)

const pageHasHero = useDisplayedPageHasHero()
const isMainMenuOpen = useMainMenuOpen()
const showBreadcrumb = computed(
  () => !route.meta.hideBreadcrumb && !pageHasHero.value,
)

useHead({
  htmlAttrs: {
    lang: language.value,
  },
})

const isMenuOpen = ref(false)
const hasMenuFinishedClosing = ref(true)

function menuOpen() {
  window.document.body.classList.add('overflow-y-hidden')
  isMenuOpen.value = true
}

function menuCloseStart() {
  if (isLessThanLg) {
    isMenuOpen.value = false
    hasMenuFinishedClosing.value = false
  }
}

function menuCloseFinish() {
  if (isLessThanLg) {
    window.document.body.classList.remove('overflow-y-hidden')
    hasMenuFinishedClosing.value = true
  }
}
</script>
