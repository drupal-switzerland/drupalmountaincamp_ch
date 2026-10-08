<template>
  <div :class="{ 'container mb-[30px] h-6 pt-20': variant !== 'hero' }">
    <section
      v-if="links.length || currentTitle"
      ref="scroller"
      class="relative mobile-only:overflow-hidden"
    >
      <nav
        class="breadcrumb"
        :class="{ 'is-hero': variant === 'hero' }"
        aria-label="breadcrumbs"
      >
        <ol
          itemscope
          itemtype="http://schema.org/BreadcrumbList"
          class="flex items-center whitespace-nowrap"
        >
          <li
            v-for="(link, index) in linksComputed"
            :key="index"
            itemprop="itemListElement"
            itemscope
            itemtype="http://schema.org/ListItem"
          >
            <component :is="link.tag" v-bind="link.props" itemprop="item">
              <span itemprop="name">
                {{ link.title }}
              </span>
            </component>
            <meta itemprop="position" :content="`${index + 2}`" />
          </li>
          <li
            v-if="currentTitle"
            itemprop="itemListElement"
            itemscope
            itemtype="http://schema.org/ListItem"
          >
            <span itemprop="name" aria-current="page">{{ currentTitle }}</span>
            <meta
              itemprop="position"
              :content="`${linksComputed.length + 2}`"
            />
          </li>
        </ol>
      </nav>
    </section>
  </div>
</template>

<script lang="ts" setup>
import type { BreadcrumbFragment } from '#graphql-operations'
import type { Langcode } from '#nuxt-language-negotiation/config'
import { NuxtLink } from '#components'
import { SCREENS } from '~/tailwind/screens'

const props = defineProps<{
  links: BreadcrumbFragment[]
  language?: Langcode
  /** "hero": inside the navy page hero, without the layout spacing. */
  variant?: 'default' | 'hero'
  /** Drupal's breadcrumb ends before the current page; this adds it. */
  currentTitle?: string
}>()

const scroller = ref<HTMLElement | null>(null)

const linksComputed = computed(() => {
  return props.links.map((link) => {
    const { title, url } = link
    const to = url?.path
    return {
      tag: to ? NuxtLink : 'span',
      props: to ? { to } : {},
      title,
    }
  })
})

// On narrow screens long trails overflow; keep the end in view. Only the
// trail scrolls sideways, never the window (scrollIntoView would).
function scrollToLastItem() {
  nextTick(() => {
    const el = scroller.value
    if (el && window.innerWidth < SCREENS.sm) {
      el.scrollLeft = el.scrollWidth - el.clientWidth
    }
  })
}

onMounted(scrollToLastItem)
watch([linksComputed, () => props.currentTitle], scrollToLastItem)
</script>

<style lang="postcss">
.breadcrumb {
  li {
    @apply h-6 text-gray-600;
    &:not(:first-child):before {
      content: '›';
      @apply me-4 ms-4 text-2xl;
      line-height: 0;
    }
  }

  a {
    @apply text-gray-600 hover:text-gray-900;
  }

  &.is-hero {
    li,
    a {
      @apply text-primary-100;
    }

    a {
      @apply underline-offset-4 hover:text-white hover:underline;
    }
  }
}
.breadcrumb-slide-enter-active,
.breadcrumb-slide-leave-active {
  transition: all 0.4s;
}
.breadcrumb-slide-enter-from,
.breadcrumb-slide-leave-to {
  opacity: 0;
  transform: translateY(-90%);
}
</style>
