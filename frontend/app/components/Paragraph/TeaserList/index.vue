<template>
  <div class="my-7 overflow-hidden md:mb-12 lg:mb-20">
    <Container class="mx-auto">
      <h2 class="col-span-12 mb-10 text-3xl md:text-4xl lg:mb-14">
        {{ title }}
      </h2>
    </Container>
    <div
      ref="container"
      class="paragraph-teaser-list container relative mx-auto"
      :class="{
        'is-slider-mobile': options.sliderStyle === 'sliderMobile',
        'is-slider-desktop': options.teaserStyle === 'sliderDesktop',
        'is-staggered': options.teaserStyle === 'staggered',
      }"
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

    <nav v-if="isSliderDesktop" class="container mx-auto mt-6 hidden md:block">
      <div class="flex justify-end">
        <button :aria-label="$texts('slides.prev', 'Vorherige')" @click="prev">
          <SpriteSymbol name="arrow-left" class="size-7 text-primary-500" />
        </button>

        <button :aria-label="$texts('slides.next', 'Nächste')" @click="next">
          <SpriteSymbol name="arrow-right" class="size-7 text-primary-500" />
        </button>
      </div>
    </nav>
  </div>
</template>

<script lang="ts" setup>
import type { ParagraphTeaserListFragment } from '#graphql-operations'
import Swiper from 'swiper'
import 'swiper/css'

defineProps<{
  title?: string
  paragraphs?: ParagraphTeaserListFragment['paragraphs']
}>()

const { options, isEditing } = defineBlokkli({
  bundle: 'teaser_list',
  propsFieldMapping: {
    paragraphs: { type: 'field', name: 'field_paragraphs_teaser' },
  },
  options: {
    teaserStyle: {
      type: 'radios',
      label: 'Darstellung',
      default: 'grid',
      displayAs: 'icons',
      options: {
        grid: { label: 'grid', icon: 'bk_mdi_grid_view' },
        staggered: {
          label: 'Versetzt',
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
      label: 'Slider Darstellung',
      default: 'stack',
      displayAs: 'icons',
      options: {
        stack: { label: 'Stapel', icon: 'bk_mdi_view_agenda' },
        sliderMobile: {
          label: 'Slider mobile',
          icon: 'bk_mdi_swipe',
        },
      },
    },
  },
  editor: {
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

const shouldMountSwiper = computed(() => {
  return (
    container.value && isSliderDesktop.value && isSmUpwards.value && !isEditing
  )
})

watch(shouldMountSwiper, function (shouldMount) {
  if (swiperInstance) {
    swiperInstance.destroy()
  }
  if (shouldMount) {
    initSwiper()
  }
})

function initSwiper() {
  if (shouldMountSwiper.value && container.value) {
    swiperInstance = new Swiper(container.value, {
      slidesPerView: isMdUpwards.value ? 3 : 2,
    })
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

onMounted(() => {
  initSwiper()
})

onBeforeUnmount(() => {
  if (swiperInstance) {
    swiperInstance.destroy()
  }
})
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
