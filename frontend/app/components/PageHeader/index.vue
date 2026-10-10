<template>
  <header
    ref="container"
    class="top-0 z-10 border-b-2 border-b-primary-500 bg-white text-primary-500 transition-all duration-250 ease-in-out md:h-20"
    :class="{
      '-translate-y-10 md:translate-y-[-50px]':
        isHeaderShiftedUp && !isMenuOpen,
      'h-12 md:max-h-screen': !isMenuOpen,
      'h-screen overflow-y-auto': isMenuOpen,
      'fixed w-full': isGlobalSticky,
      sticky: !isGlobalSticky,
    }"
    @keydown.esc="closeMenuAndFocusToggle"
  >
    <div class="page-header-grid container mx-auto grid max-w-none">
      <div class="grid-area-logo h-7 md:h-20">
        <div
          class="flex h-full items-center pr-1 pt-5 transition-all duration-250 ease-in-out md:pt-0"
          :class="{
            'sticky top-0': isGlobalSticky,
          }"
        >
          <nuxt-link :to="{ name: 'home' }" class="flex items-center gap-2">
            <img
              src="/images/icon-mountain.png"
              alt=""
              width="128"
              height="128"
              class="size-7 xs:size-8 md:size-10"
            />
            <span
              class="font-heading text-base font-bold uppercase leading-none tracking-wide text-primary-500 xs:text-lg md:whitespace-nowrap lg:text-xl"
            >
              Mountain Camp <span class="text-primary-400">2027</span>
            </span>
          </nuxt-link>
        </div>
      </div>
      <div
        class="grid-area-hamburger flex items-center justify-between pl-2 pt-2 transition-all duration-250 ease-in-out md:px-0 md:pt-0 md:text-lg"
      >
        <VuepalLink
          v-if="ticketsLink && !isMenuOpen"
          :to="ticketsLink.link.url?.path"
          class="button is-filled mr-1 px-4 py-2 text-sm md:hidden"
        >
          {{ ticketsLink.link.label }}
        </VuepalLink>
        <button
          ref="menuToggle"
          type="button"
          class="flex size-11 items-center justify-center gap-3 leading-none md:hidden"
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
import { checkIfRefIsNotNull } from '~/helpers/checkIfRefIsNotNull'

const route = useRoute()
const ticketsLink = await useTicketsLink()
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
