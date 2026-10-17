<template>
  <div class="my-7 overflow-hidden md:mb-12 lg:mb-20">
    <Container v-if="hasText(title)" class="mx-auto">
      <h2 class="col-span-12 mb-10 text-3xl md:text-4xl lg:mb-14">
        {{ title }}
      </h2>
    </Container>
    <div
      ref="container"
      class="paragraph-teaser-list container relative mx-auto"
      :class="{
        'is-slider-mobile': options.sliderStyle === 'sliderMobile',
        'is-slider-desktop': isSliderDesktop,
        // Until Swiper runs, and without it, the row scrolls natively.
        'is-swiper-running': isSliderActive,
        'is-staggered': options.teaserStyle === 'staggered',
      }"
      @focusin="showFocusedTeaser"
    >
      <BlokkliField
        v-if="options.teaserStyle === 'sliderDesktop'"
        v-slot="{ items }"
        name="field_paragraphs_teaser"
        :list="paragraphs"
        proxy-mode
        class="paragraph-teaser-list-list"
      >
        <div
          v-if="isSliderDesktop"
          ref="list"
          class="paragraph-teaser-list-list swiper-wrapper"
        >
          <div v-for="item in items" :key="item.uuid" class="swiper-slide">
            <BlokkliItem v-bind="item" />
          </div>
        </div>
      </BlokkliField>

      <BlokkliField
        v-else
        name="field_paragraphs_teaser"
        :list="paragraphs"
        class="paragraph-teaser-list-list"
      />
    </div>

    <!-- Only with a running slider: without one there is nothing to move. -->
    <div v-if="isSliderActive" class="container mx-auto mt-6">
      <div class="flex justify-end">
        <button
          type="button"
          :aria-label="$texts('slides.prev', 'Previous')"
          @click="prev"
        >
          <SpriteSymbol name="arrow-left" class="size-7 text-primary-500" />
        </button>

        <button
          type="button"
          :aria-label="$texts('slides.next', 'Next')"
          @click="next"
        >
          <SpriteSymbol name="arrow-right" class="size-7 text-primary-500" />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ParagraphTeaserListFragment } from '#graphql-operations'
import type Swiper from 'swiper'
// Slide layout styles stay static so slides don't shift while the JS loads.
import 'swiper/css'
import { loadSwiper } from '~/helpers/swiper'
import { hasText } from '~/helpers/text'
import { SCREENS } from '~/tailwind/screens'

const SLIDES_PER_VIEW = 2
const SLIDES_PER_VIEW_MD = 3

const props = defineProps<{
  title?: string
  paragraphs?: ParagraphTeaserListFragment['paragraphs']
}>()

const isEditing = import.meta.blokkliEditing
const { options } = defineBlokkli({
  bundle: 'teaser_list',
  propsFieldMapping: {
    // The title is rendered but not editable inline.
    title: null,
    paragraphs: { type: 'field', name: 'field_paragraphs_teaser' },
  },
  options: {
    teaserStyle: {
      type: 'radios',
      label: 'Display',
      default: 'grid',
      displayAs: 'icons',
      options: {
        grid: { label: 'Grid', icon: 'bk_mdi_grid_view' },
        staggered: {
          label: 'Staggered',
          icon: 'bk_mdi_dashboard',
        },
        sliderDesktop: {
          label: 'Slider desktop',
          icon: 'bk_mdi_view_carousel',
        },
      },
    },
    sliderStyle: {
      type: 'radios',
      label: 'Mobile display',
      default: 'stack',
      displayAs: 'icons',
      options: {
        stack: { label: 'Stack', icon: 'bk_mdi_view_agenda' },
        sliderMobile: {
          label: 'Slider mobile',
          icon: 'bk_mdi_swipe',
        },
      },
    },
  },
  editor: {
    noPreview: true,
    editTitle: (el) => el.querySelector('h2')?.innerText,
    addBehaviour: 'no-form',
  },
})

const container = ref<HTMLDivElement>()
const { isSmUpwards, isMdUpwards } = useViewport()
const { $texts } = useEasyTexts()

const isSliderDesktop = computed(
  () => options.value.teaserStyle === 'sliderDesktop',
)

let swiperInstance: Swiper | null = null
const isSliderActive = ref(false)
const list = ref<HTMLElement>()

// One view's worth of teasers is shown as the grid: there is nothing to slide.
const hasMoreThanOneView = computed(
  () =>
    (props.paragraphs?.length ?? 0) >
    (isMdUpwards.value ? SLIDES_PER_VIEW_MD : SLIDES_PER_VIEW),
)

const shouldMountSwiper = computed(() => {
  return (
    container.value &&
    isSliderDesktop.value &&
    isSmUpwards.value &&
    hasMoreThanOneView.value &&
    !isEditing
  )
})

// Swiper does not follow keyboard focus: a teaser reached by Tab is moved
// into view, and the browser's own scrolling of the clipped container undone.
function showFocusedTeaser(event: FocusEvent) {
  if (!swiperInstance || !container.value) {
    return
  }
  const slide = (event.target as Element).closest('.swiper-slide')
  const index = swiperInstance.slides.findIndex((s) => s === slide)
  container.value.scrollLeft = 0
  if (index !== -1 && !swiperInstance.visibleSlidesIndexes?.includes(index)) {
    swiperInstance.slideTo(index)
  }
}

function destroySwiper() {
  swiperInstance?.destroy()
  swiperInstance = null
  isSliderActive.value = false
}

// Also starts the slider once the container is mounted. Across md the gap
// changes, so the slider starts again to measure it.
watch([shouldMountSwiper, isMdUpwards], function ([shouldMount]) {
  destroySwiper()
  if (shouldMount) {
    initSwiper()
  }
})

// The CSS gap of the natively scrolling row, which Swiper takes over.
function measureGap() {
  return list.value
    ? parseFloat(getComputedStyle(list.value).columnGap) || 0
    : 0
}

// Swiper's JS is only loaded when a list is actually shown as a slider.
async function initSwiper() {
  if (!shouldMountSwiper.value || !container.value) {
    return
  }
  try {
    const SwiperClass = await loadSwiper()
    // The option or viewport may have changed, or the list unmounted, meanwhile.
    if (!shouldMountSwiper.value || !container.value) {
      return
    }
    destroySwiper()
    await nextTick()
    const spaceBetween = measureGap()
    list.value?.scrollTo({ left: 0 })
    swiperInstance = new SwiperClass(container.value, {
      slidesPerView: SLIDES_PER_VIEW,
      spaceBetween,
      // Fills visibleSlidesIndexes, see showFocusedTeaser.
      watchSlidesProgress: true,
      // Keyed like useViewport, so a resize across md changes the view too.
      breakpoints: { [SCREENS.md]: { slidesPerView: SLIDES_PER_VIEW_MD } },
    })
    isSliderActive.value = true
  } catch (error) {
    // Without Swiper the row keeps scrolling natively.
    destroySwiper()
    console.error('The teaser slider could not be started.', error)
  }
}

function prev() {
  if (swiperInstance) {
    swiperInstance.slidePrev()
  }
}

function next() {
  if (swiperInstance) {
    swiperInstance.slideNext()
  }
}

onBeforeUnmount(destroySwiper)
</script>

<style lang="postcss">
.paragraph-teaser-list.is-staggered {
  @screen lg {
    @apply mb-28;
    .paragraph-teaser:not(:nth-child(3n + 2)) {
      @apply translate-y-28;
    }
  }
}

.paragraph-teaser-list {
  &.is-slider-mobile {
    @media (max-width: calc(theme('screens.sm') - 1px)) {
      @apply px-0;
      .paragraph-teaser-list-list {
        @apply overflow-auto;
        @apply flex gap-gap;

        > .paragraph-teaser,
        > .swiper-slide {
          flex: 0 0 80vw;
          max-width: 500px;

          &:first-child {
            @apply ml-outer;
          }

          &:last-child {
            @apply mr-outer;
          }
        }

        > .swiper-slide {
          height: auto;
          .paragraph-teaser {
            height: 100%;
          }
        }
      }
    }
  }
  &:not(.is-slider-mobile) {
    @media (max-width: calc(theme('screens.sm') - 1px)) {
      .paragraph-teaser-list-list {
        @apply grid gap-gap;
      }
    }
  }

  &.is-slider-desktop:not(.is-swiper-running) {
    .paragraph-teaser-list-list {
      @screen sm {
        @apply overflow-x-auto;
        scroll-snap-type: x mandatory;
        .swiper-slide {
          scroll-snap-align: start;
        }
      }
    }
  }

  &.is-slider-desktop {
    .paragraph-teaser-list-list {
      @screen sm {
        @apply flex gap-gap;
        --slides-per-view: 2;
        .swiper-slide {
          height: auto;
          flex: 0 0
            calc(
              (100% - (var(--slides-per-view) - 1) * var(--grid-gap)) /
                var(--slides-per-view)
            );

          .paragraph-teaser {
            height: 100%;
          }
        }
      }
      @screen md {
        --slides-per-view: 3;
      }
    }
  }

  /* Swiper sizes and spaces the slides itself (spaceBetween, inline width). */
  &.is-slider-desktop.is-swiper-running .paragraph-teaser-list-list {
    gap: 0;
    .swiper-slide {
      flex: 0 0 auto;
    }
  }

  &:not(.is-slider-desktop) {
    .paragraph-teaser-list-list {
      @screen sm {
        @apply grid grid-cols-2 gap-gap;
      }
      @screen md {
        @apply grid-cols-3;
      }
    }
  }
}
</style>
