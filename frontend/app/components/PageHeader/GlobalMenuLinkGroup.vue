<template>
  <vuepal-link
    v-click-away="clickAway"
    :to="link.link.url?.path"
    class="flex h-10 w-full cursor-pointer items-center p-2 transition-all duration-250 ease-in-out hover:text-accent-500 md:h-20 lg:justify-between"
    @mouseenter="menuHoverOpen"
    @mouseleave="menuHoverClose"
  >
    {{ link.link.label }}
    <div class="my-2 w-[100px] md:w-auto" @click="subtreeOpen = !subtreeOpen">
      <SpriteSymbol
        name="chevron-down-menu"
        class="ml-2 size-4 -rotate-90 transition-all duration-250 ease-in-out md:rotate-0"
        :class="{
          'md:rotate-180': subtreeOpen,
        }"
      />
    </div>
  </vuepal-link>
  <div
    v-if="link.subtree"
    :class="{
      '-translate-x-full md:translate-x-0 md:scale-y-0 md:overflow-hidden':
        !subtreeOpen,
      'h-full translate-x-0 md:scale-y-100': subtreeOpen,
    }"
    class="pointer-events-none absolute left-0 top-0 z-[100] size-full bg-gray-50 transition-all duration-500 ease-in-out md:pointer-events-auto md:top-20 md:h-auto md:w-[calc(100%+50px)] md:origin-top md:border md:border-gray-300"
    @mouseenter="menuHoverOpen"
    @mouseleave="menuHoverClose"
  >
    <div
      v-if="subtreeOpen && isLessThanMd"
      class="-mt-10 cursor-pointer px-4 py-2"
      @click="subtreeOpen = !subtreeOpen"
    >
      <SpriteSymbol
        name="arrow-left"
        class="pointer-events-auto size-7 text-primary-500"
      />
    </div>
    <ul
      v-if="link.subtree"
      class="pointer-events-auto ml-10 h-full pt-20 md:ml-0 md:pt-0"
    >
      <li
        v-for="(subLink, j) in link.subtree"
        :key="`subLink_${j}`"
        class="flex w-auto grow items-stretch md:max-w-[175px]"
      >
        <VuepalLink
          :to="subLink.link?.url?.path"
          class="flex h-[50px] w-full items-center px-4 py-2 pl-2 transition-all duration-250 ease-in-out hover:text-accent-500 md:size-auto md:px-3"
        >
          {{ subLink.link.label }}
        </VuepalLink>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  linkIndex: number
}>()

const data = await useInitData()
const menuLinks = data.value.mainMenuLinks
const link = menuLinks[props.linkIndex]

const { isLessThanMd } = useViewport()

const menuHoverOpen = function () {
  if (!isLessThanMd.value) {
    subtreeOpen.value = true
  }
}
const menuHoverClose = function () {
  if (!isLessThanMd.value) {
    subtreeOpen.value = false
  }
}

const subtreeOpen = ref(false)
const clickAway = () => {
  if (subtreeOpen.value) {
    subtreeOpen.value = false
  }
}
</script>
