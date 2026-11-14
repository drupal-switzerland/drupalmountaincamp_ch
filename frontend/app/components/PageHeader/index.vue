<template>
  <header
    ref="container"
    class="on-dark top-0 z-10 border-b-2 border-b-primary-500 bg-primary-500 text-white transition-all duration-250 ease-in-out md:h-[var(--page-header-height)]"
    :class="{
      '-translate-y-10 md:translate-y-[-50px]':
        isHeaderShiftedUp && !isMenuOpen,
      'h-[var(--page-header-height)] md:max-h-screen': !isMenuOpen,
      'h-screen overflow-y-auto': isMenuOpen,
      'fixed w-full': isGlobalSticky,
      sticky: !isGlobalSticky,
    }"
  >
    <div class="page-header-grid container mx-auto grid max-w-none">
      <div class="grid-area-logo h-10 md:h-20">
        <div
          class="flex h-full items-center pr-1 pt-2 transition-all duration-250 ease-in-out md:pt-0"
          :class="{
            'sticky top-0': isGlobalSticky,
          }"
        >
          <nuxt-link :to="{ name: 'home' }" class="page-header-logo flex">
            <img
              src="/images/logo-mountain-camp-white.webp"
              alt="Mountain Camp 2027"
              width="417"
              height="168"
              class="h-8 w-auto md:h-14"
            />
          </nuxt-link>
        </div>
      </div>
      <div
        class="grid-area-hamburger flex items-center justify-between pl-2 pt-2 transition-all duration-250 ease-in-out md:px-0 md:pt-0 md:text-lg"
      >
        <TicketsButton
          v-if="!isMenuOpen"
          v-slot="{ label }"
          class="button is-on-navy mr-1 px-4 py-2 text-sm md:hidden"
        >
          {{ label }}
        </TicketsButton>
        <button
          ref="menuToggle"
          type="button"
          class="flex size-11 items-center justify-center gap-3 leading-none [--focus-ring-offset:calc(var(--focus-ring-width)_*_-1)] md:hidden"
          :aria-label="$texts('menu', 'Menu')"
          :aria-expanded="isMenuOpen"
          aria-controls="global-menu"
          @click.prevent="toggleMenu"
        >
          <PageHeaderMenuIcon :is-in-closable-state="isMenuOpen" />
        </button>
      </div>

      <PageHeaderGlobalMenu
        v-show="isMenuOpen"
        id="global-menu"
        ref="globalMenu"
        class="grid-area-global md:!block"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { checkIfRefIsNotNull } from '~/helpers/checkIfRefIsNotNull'

const route = useRoute()
const menuToggle = ref<HTMLButtonElement | null>(null)
const isHeaderShiftedUp = ref(false)
const container = ref<HTMLElement | null>(null)
const isGlobalSticky = ref(false)
const isMenuOpen = useMainMenuOpen()
const { $texts } = useEasyTexts()

let timeout: number | null = null

watch(() => route.path, closeMenu)

onMounted(() => {
  const mq = window.matchMedia('(min-width: 1024px)')
  const handler = (e: MediaQueryListEvent) => {
    if (e.matches) {
      closeMenu()
    }
  }
  mq.addEventListener('change', handler)
  onBeforeUnmount(() => mq.removeEventListener('change', handler))
})

function toggleMenu() {
  if (isMenuOpen.value) {
    closeMenu()
  } else {
    openMenu()
  }
}

function closeMenu() {
  if (timeout) {
    clearTimeout(timeout)
  }
  isMenuOpen.value = false
  if (checkIfRefIsNotNull<HTMLElement>(container)) {
    // We need to manually reset the scroll position inside the menu container,
    // so it doesn't
    container.value.scrollTop = 0
  }

  timeout = window.setTimeout(() => {
    isGlobalSticky.value = false
  }, 250)
}

function closeMenuAndFocusToggle() {
  if (!isMenuOpen.value) {
    return
  }
  closeMenu()
  menuToggle.value?.focus()
}

// On window: with the page behind the menu inert, focus can leave the header
// for the browser's own controls. An open phone submenu takes Escape first.
const phoneSubmenuOpen = usePhoneSubmenuOpen()
useEventListener(
  () => (isMenuOpen.value ? window : null),
  'keydown',
  (event: KeyboardEvent) => {
    if (event.key === 'Escape' && phoneSubmenuOpen.value === null) {
      closeMenuAndFocusToggle()
    }
  },
)

// After the DOM update, so a submenu that asked while closing is closed.
watch(useMainMenuToggleFocusRequests(), () => menuToggle.value?.focus(), {
  flush: 'post',
})

function openMenu() {
  isMenuOpen.value = true
  isGlobalSticky.value = true
  isHeaderShiftedUp.value = false
}
</script>

<style lang="postcss">
.page-header-grid {
  grid-template:
    'logo hamburger' theme(space.10)
    'global global' 1fr
    'language language' auto
    / 1fr auto;

  @screen md {
    grid-template: 'logo global language' auto / auto 1fr auto;
  }
}

.grid-area-logo {
  grid-area: logo;
}

.grid-area-hamburger {
  grid-area: hamburger;
}

.grid-area-global {
  grid-area: global;
}

.grid-area-language {
  grid-area: language;
}

.grid-area-logo img {
  @apply max-h-full w-auto;
}
</style>
