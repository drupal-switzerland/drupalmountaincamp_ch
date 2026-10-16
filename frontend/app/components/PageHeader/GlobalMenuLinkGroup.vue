<template>
  <!-- display: contents keeps the original layout; the wrapper only groups
       focus, Escape and click-away handling for the row and its submenu. -->
  <div
    ref="group"
    v-click-away="clickAway"
    class="contents"
    @keydown.esc="closeAndFocusToggle"
    @focusout="onFocusOut"
  >
    <div
      :inert="coversRow || undefined"
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
      ref="submenu"
      :inert="!subtreeOpen || undefined"
      :class="{
        'pointer-events-none -translate-x-full md:translate-x-0 md:scale-y-0 md:overflow-hidden':
          !subtreeOpen,
        // Open, the panel takes the taps across its full width, so nothing
        // it covers is reachable.
        'pointer-events-auto h-full translate-x-0 md:scale-y-100': subtreeOpen,
      }"
      class="absolute left-0 top-0 z-[100] size-full bg-gray-50 transition-all duration-500 ease-in-out md:pointer-events-auto md:top-20 md:h-auto md:w-[calc(100%+50px)] md:origin-top md:border md:border-gray-300"
      @mouseenter="menuHoverOpen"
      @mouseleave="menuHoverClose"
    >
      <button
        v-if="subtreeOpen && isLessThanMd"
        ref="backButton"
        type="button"
        class="pointer-events-auto block px-4 py-2"
        :aria-label="$texts('menu.back', 'Back')"
        @click="closeAndFocusToggle"
      >
        <SpriteSymbol name="arrow-left" class="size-7 text-primary-500" />
      </button>
      <ul
        v-if="link.subtree"
        class="pointer-events-auto ml-10 h-full pt-9 md:ml-0 md:pt-0"
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
import { useEventListener } from '@vueuse/core'
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
// With keyboard focus inside, the pointer leaving would make the panel inert
// under it and drop focus to the body; it closes when focus leaves instead.
const menuHoverClose = function () {
  if (!isLessThanMd.value && !group.value?.contains(document.activeElement)) {
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
const group = ref<HTMLElement | null>(null)
const submenu = ref<HTMLElement | null>(null)
const toggleButton = ref<HTMLButtonElement | null>(null)
const backButton = ref<HTMLButtonElement | null>(null)

watch(() => route.path, clickAway)

// A submenu open on one side of the breakpoint is a different thing on the
// other: a dropdown under its link, or a panel over the whole phone menu.
// The watcher runs before the DOM changes, while focus is still where it was.
const menuToggleFocusRequests = useMainMenuToggleFocusRequests()
watch(isLessThanMd, (isPhone) => {
  if (!subtreeOpen.value) {
    return
  }
  const focusIsInPanel = !!submenu.value?.contains(document.activeElement)
  if (isPhone && focusIsInPanel) {
    // On phones the menu is hidden until it is opened, and this group's
    // toggle with it, so focus goes to the button that opens the menu.
    subtreeOpen.value = false
    menuToggleFocusRequests.value++
    return
  }
  closeSubtree(focusIsInPanel)
})

// On phones the open submenu covers this row and the other menu items.
const phoneSubmenuOpen = usePhoneSubmenuOpen()
const coversRow = computed(() => subtreeOpen.value && isLessThanMd.value)
watch(
  coversRow,
  (covers) => {
    if (covers) {
      phoneSubmenuOpen.value = props.linkIndex
    } else if (phoneSubmenuOpen.value === props.linkIndex) {
      phoneSubmenuOpen.value = null
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  if (phoneSubmenuOpen.value === props.linkIndex) {
    phoneSubmenuOpen.value = null
  }
})

async function toggleSubtree() {
  subtreeOpen.value = !subtreeOpen.value
  // On phones the submenu covers the menu, so focus moves onto it.
  if (subtreeOpen.value && isLessThanMd.value) {
    await nextTick()
    backButton.value?.focus()
  }
}

async function closeAndFocusToggle(event: Event) {
  if (!subtreeOpen.value) {
    return
  }
  // Escape closes only the submenu, not the whole mobile menu.
  event.stopPropagation()
  // Focus has to leave a panel that is about to become inert. On desktop,
  // Escape pressed on the parent link or the toggle leaves focus where it is.
  await closeSubtree(
    isLessThanMd.value ||
      !!submenu.value?.contains(event.target as Node | null),
  )
}

async function closeSubtree(focusNeedsNewHome: boolean) {
  subtreeOpen.value = false
  if (!focusNeedsNewHome) {
    return
  }
  // The toggle is inert while a phone submenu covers it.
  await nextTick()
  toggleButton.value?.focus()
}

// WCAG 1.4.13: a submenu opened by hover has to be dismissible without moving
// the pointer. Escape pressed inside the group stops at closeAndFocusToggle,
// so this only sees it when focus is elsewhere.
useEventListener(
  () => (subtreeOpen.value ? window : null),
  'keydown',
  (event: KeyboardEvent) => {
    if (event.key !== 'Escape') {
      return
    }
    if (isLessThanMd.value) {
      closeAndFocusToggle(event)
    } else {
      subtreeOpen.value = false
    }
  },
)

// Only focus moving to another element closes the submenu. A tap on the
// panel's empty area blurs to nothing, and click-away handles real clicks
// outside.
function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  const group = event.currentTarget as HTMLElement
  if (next && !group.contains(next)) {
    clickAway()
  }
}
</script>
