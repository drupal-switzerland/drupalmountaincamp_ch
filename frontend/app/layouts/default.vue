<template>
  <div>
    <!-- Hidden while the phone menu is open: main is inert then. -->
    <a
      v-if="!isMainMenuOpen"
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-white focus:px-6 focus:py-3 focus:font-bold focus:text-primary-500 focus:shadow-lg"
    >
      {{ $texts('layout.skipToContent', 'Skip to content') }}
    </a>
    <!-- The homepage hero bar shows the same dates and venue. -->
    <PageHeaderEventStrip v-if="route.name !== 'home'" />
    <PageHeader />

    <div :inert="isMainMenuOpen || undefined">
      <PageDependency>
        <Breadcrumb v-if="showBreadcrumb" :links="breadcrumb" />
      </PageDependency>

      <!-- tabindex lets the skip link move focus here, not only scroll. -->
      <main id="main-content" tabindex="-1" class="page-content outline-none">
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
const { $texts } = useEasyTexts()
const drupalUser = useDrupalUser()
const language = useCurrentLanguage()
const breadcrumb = useDisplayedBreadcrumbLinks()

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

// The open phone menu covers the page, which is inert behind it. Without the
// lock a wheel or swipe over the menu scrolls the page away from where the
// reader was.
useHead({
  htmlAttrs: {
    lang: language.value,
    class: computed(() => (isMainMenuOpen.value ? 'overflow-hidden' : '')),
  },
})
</script>
