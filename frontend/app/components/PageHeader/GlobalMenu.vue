<template>
  <nav
    class="relative pb-8 transition-all duration-250 ease-in-out md:pb-0 md:pl-10"
  >
    <ul
      class="flex flex-col pt-4 text-xl font-medium md:h-full md:flex-row md:items-center md:justify-end md:gap-2 md:pt-0 md:text-base"
    >
      <li
        v-for="item in items"
        :key="`global_${item.index}`"
        class="flex items-stretch border-b border-primary-100 px-outer md:border-0 md:px-0"
      >
        <div
          v-if="item.link.subtree.length > 0"
          class="min-w-[60px] transition-all duration-250 ease-in-out md:relative"
        >
          <PageHeaderGlobalMenuLinkGroup :link-index="item.index" />
        </div>

        <VuepalLink
          v-else
          :to="item.path"
          :aria-current="item.isCurrent ? 'page' : undefined"
          class="flex min-h-14 w-full items-center decoration-primary-400 decoration-[3px] underline-offset-8 hover:text-primary-400 md:min-h-0 md:px-3 md:py-2"
          :class="{
            'border-l-4 border-primary-400 pl-3 md:border-l-0 md:underline':
              item.isActive,
          }"
        >
          {{ item.link.link.label }}
        </VuepalLink>
      </li>
      <li v-if="ticketsLink" class="mt-8 px-outer md:mt-0 md:pl-3 md:pr-0">
        <VuepalLink
          :to="ticketsLink.link.url?.path"
          :aria-current="
            route.path === ticketsLink.link.url?.path ? 'page' : undefined
          "
          class="button is-filled w-full justify-center md:w-auto md:px-6 md:py-2"
        >
          {{ ticketsLink.link.label }}
        </VuepalLink>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts" setup>
import { isActivePath } from '~/helpers/navigation'

const data = await useInitData()
const menuLinks = data.value.mainMenuLinks
const route = useRoute()

// Tickets is rendered as the call-to-action button at the end, wherever
// editors place it in the Drupal menu.
const ticketsLink = await useTicketsLink()

const items = computed(() =>
  menuLinks
    // index: position in the Drupal menu, used by GlobalMenuLinkGroup.
    .map((link, index) => {
      const path = link.link.url?.path
      return {
        link,
        index,
        path,
        isCurrent: !!path && route.path === path,
        isActive: isActivePath(route.path, path),
      }
    })
    .filter((item) => item.link !== ticketsLink.value),
)
</script>
