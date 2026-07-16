<template>
  <nav
    class="relative pb-8 transition-all duration-250 ease-in-out md:pb-0 md:pl-10 [&_.router-link-active]:text-accent-500"
  >
    <ul
      class="flex h-full flex-col gap-4 pt-24 text-2xl md:flex-row md:justify-end md:gap-2 md:pt-0 md:text-base md:font-medium"
    >
      <li
        v-for="(link, i) in menuLinks"
        :key="`global_${i}`"
        class="flex items-stretch px-8 md:px-0"
      >
        <div
          v-if="link.subtree.length > 0"
          class="min-w-[60px] transition-all duration-250 ease-in-out md:relative"
        >
          <PageHeaderGlobalMenuLinkGroup :link-index="i" />
        </div>

        <div
          v-else
          class="flex h-10 min-w-[60px] items-center hover:text-accent-500 md:h-20 lg:justify-between"
        >
          <VuepalLink
            :to="link.link?.url?.path"
            class="flex h-[50px] w-full items-center px-4 pl-2 transition-all duration-250 ease-in-out md:size-auto md:px-3"
          >
            {{ link.link.label }}
          </VuepalLink>
        </div>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts" setup>
const data = await useInitData()
const menuLinks = data.value.mainMenuLinks
</script>
