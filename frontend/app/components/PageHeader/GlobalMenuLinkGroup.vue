<template>
  <!-- display: contents keeps the original layout; the wrapper only groups
       focus, Escape and click-away handling for the row and its submenu. -->
  <div
    v-click-away="clickAway"
    class="contents"
    @keydown.esc="closeAndFocusToggle"
    @focusout="onFocusOut"
  >
    <div
      class="flex h-10 w-full items-center pr-2 transition-all duration-250 ease-in-out hover:text-primary-400 md:h-20 lg:justify-between"
      @mouseenter="menuHoverOpen"
      @mouseleave="menuHoverClose"
    >
      <VuepalLink
        :to="link.link.url?.path"
        :aria-current="route.path === link.link.url?.path ? 'page' : undefined"
        class="flex h-full items-center py-2 pl-2 decoration-primary-400 decoration-[3px] underline-offset-8"
        :class="{ underline: isGroupActive }"
      >
        {{ link.link.label }}
      </VuepalLink>
      <button
        ref="toggleButton"
        type="button"
        class="my-2 block w-[100px] text-left md:w-auto"
        :aria-label="`${link.link.label} ${$texts('menu.submenu', 'submenu')}`"
        :aria-expanded="subtreeOpen"
        :aria-controls="submenuId"
        @click="toggleSubtree"
      >
        <SpriteSymbol
          name="chevron-down-menu"
          class="ml-2 size-4 -rotate-90 transition-all duration-250 ease-in-out md:rotate-0"
          :class="{
            'md:rotate-180': subtreeOpen,
          }"
        />
      </button>
    </div>
    <div
      v-if="link.subtree"
      :id="submenuId"
      :inert="!subtreeOpen || undefined"
      :class="{
        '-translate-x-full md:translate-x-0 md:scale-y-0 md:overflow-hidden':
          !subtreeOpen,
        'h-full translate-x-0 md:scale-y-100': subtreeOpen,
      }"
      class="pointer-events-none absolute left-0 top-0 z-[100] size-full bg-gray-50 transition-all duration-500 ease-in-out md:pointer-events-auto md:top-20 md:h-auto md:w-[calc(100%+50px)] md:origin-top md:border md:border-gray-300"
      @mouseenter="menuHoverOpen"
      @mouseleave="menuHoverClose"
    >
      <button
        v-if="subtreeOpen && isLessThanMd"
        ref="backButton"
        type="button"
        class="pointer-events-auto -mt-10 block px-4 py-2"
        :aria-label="$texts('menu.back', 'Back')"
        @click="closeAndFocusToggle"
      >
        <SpriteSymbol name="arrow-left" class="size-7 text-primary-500" />
      </button>
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
            :aria-current="
              route.path === subLink.link?.url?.path ? 'page' : undefined
            "
            class="flex h-[50px] w-full items-center px-4 py-2 pl-2 decoration-primary-400 decoration-[3px] underline-offset-8 transition-all duration-250 ease-in-out hover:text-primary-400 md:size-auto md:px-3"
            :class="{
              underline: isActivePath(route.path, subLink.link?.url?.path),
            }"
          >
            {{ subLink.link.label }}
          </VuepalLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { isActivePath } from '~/helpers/navigation'

const props = defineProps<{
  linkIndex: number
}>()

const data = await useInitData()
const menuLinks = data.value.mainMenuLinks
const link = menuLinks[props.linkIndex]
const route = useRoute()

// The parent stays marked on its own page and on any of its sub-pages.
const isGroupActive = computed(
  () =>
    isActivePath(route.path, link?.link.url?.path) ||
    !!link?.subtree.some((sub) =>
      isActivePath(route.path, sub.link?.url?.path),
    ),
)

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

const { $texts } = useEasyTexts()
const submenuId = useId()
const toggleButton = ref<HTMLButtonElement | null>(null)
const backButton = ref<HTMLButtonElement | null>(null)

watch(() => route.path, clickAway)

async function toggleSubtree() {
  subtreeOpen.value = !subtreeOpen.value
  // On phones the submenu covers the menu, so focus moves onto it.
  if (subtreeOpen.value && isLessThanMd.value) {
    await nextTick()
    backButton.value?.focus()
  }
}

function closeAndFocusToggle(event: Event) {
  if (!subtreeOpen.value) {
    return
  }
  // Escape closes only the submenu, not the whole mobile menu.
  event.stopPropagation()
  subtreeOpen.value = false
  toggleButton.value?.focus()
}

function onFocusOut(event: FocusEvent) {
  const group = event.currentTarget as HTMLElement
  if (!group.contains(event.relatedTarget as Node | null)) {
    clickAway()
  }
}
</script>
