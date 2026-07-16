<template>
  <div class="container mb-[30px] h-6 pt-20">
    <section v-if="links.length" class="relative mobile-only:overflow-hidden">
      <nav class="breadcrumb" aria-label="breadcrumbs">
        <ol
          ref="list"
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
        </ol>
      </nav>
    </section>
  </div>
</template>

<script lang="ts" setup>
import type { BreadcrumbFragment } from '#graphql-operations'
import type { Langcode } from '#nuxt-language-negotiation/config'
import { NuxtLink } from '#components'

const props = defineProps<{
  links: BreadcrumbFragment[]
  language?: Langcode
}>()

const list = ref<HTMLOListElement | null>(null)

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

watch(linksComputed, () => {
  nextTick(() => {
    if (list.value && window.innerWidth < 768) {
      list.value.querySelector('li:last-child')?.scrollIntoView()
    }
  })
})
</script>

<style lang="postcss">
.breadcrumb {
  li {
    @apply h-6 text-gray-900/60;
    &:not(:first-child):before {
      content: '›';
      @apply me-4 ms-4 text-2xl;
      line-height: 0;
    }
  }

  a {
    @apply text-gray-900/60 hover:text-gray-700;
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
