<template>
  <div
    class="2xl:!w-[70%] 2xl:!max-w-[1920px] container relative w-4/5 transition sm:w-full xl:w-[theme(screens.xl)]"
    data-allow-mismatch
    :class="{
      'opacity-0': !isLoaded,
    }"
  >
    <!-- A pseudo-element spans the whole strip the carousel root clips to, so
         a press beside the active slide lands on the container and starts a
         swipe. The container's own box stays the slide's width: the slide
         animation measures it (Animation.ts). -->
    <Swiper
      v-bind="options"
      class="before:absolute before:inset-x-[-100vw] before:inset-y-0 before:content-['']"
      @swiper="getRef"
      @after-init="exposeActiveSlideOnly"
      @active-index-change="exposeActiveSlideOnly"
    >
      <SwiperSlide v-for="(slide, i) in slidesToRender" :key="'first_' + i">
        <!-- The field is in proxy mode, so blökkli does not render the items
             and they get their parent and position here. Every copy of a
             slide carries the position of the slide it repeats. -->
        <BlokkliItem
          v-bind="slide"
          :parent-type="PARENT_BUNDLE"
          :index="i % slides.length"
        />
      </SwiperSlide>
    </Swiper>
    <div class="mt-6 grid grid-cols-12 gap-3">
      <div class="col-span-7">
        <div class="flex gap-4 md:justify-end">
          <button type="button" @click="goPrev">
            <SpriteSymbol name="arrow-left" class="size-7 text-primary-500" />
            <span class="sr-only">{{ $texts('slides.prev', 'Previous') }}</span>
          </button>
          <button type="button" @click="goNext">
            <SpriteSymbol name="arrow-right" class="size-7 text-primary-500" />
            <span class="sr-only">{{ $texts('slides.next', 'Next') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Swiper as SwiperClass } from 'swiper/types'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import { Parallax } from './Animation'
import type { FieldListItemTyped } from '#blokkli-build/generated-types'

const props = defineProps<{
  slides: FieldListItemTyped[]
}>()

const PARENT_BUNDLE = 'carousel'

const isLoaded = ref(false)
const { $texts } = useEasyTexts()

const slidesToRender = computed(() => {
  // If no slides are provided, return empty array
  if (!props.slides.length) {
    return []
  }

  // Calculate how many times we need to repeat the slides
  const repetitionsNeeded = Math.ceil(6 / props.slides.length)

  // Create a new array with repeated slides
  return Array(repetitionsNeeded).fill(props.slides).flat()
})

const swiper = ref<SwiperClass | null>(null)

function getRef(swiperInstance: SwiperClass) {
  swiper.value = swiperInstance
}

// The loop needs every slide several times over. Only the active one is left
// to the keyboard and to assistive technology. An inert slide takes no
// pointer either, which is why touches go to the container (see options).
function exposeActiveSlideOnly(swiperInstance: SwiperClass) {
  const active = swiperInstance.slides[swiperInstance.activeIndex]
  swiperInstance.slides.forEach((slide) => {
    // Without a known active slide nothing is hidden: better every copy
    // reachable than none.
    slide.toggleAttribute('inert', !!active && slide !== active)
  })
}

function goNext() {
  if (swiper.value) {
    swiper.value.slideNext()
  }
}
function goPrev() {
  if (swiper.value) {
    swiper.value.slidePrev()
  }
}

type SwiperProps = InstanceType<typeof Swiper>['$props']

const options = computed<SwiperProps>(() => {
  return {
    speed: 600,
    modules: [Parallax],
    touchEventsTarget: 'container',
    initialSlide: props.slides.length - 0,
    slidesPerView: 1,
    spaceBetween: 0,
    loopAdditionalSlides: 2,
    loop: true,
  }
})

onMounted(() => {
  if (swiper.value) {
    isLoaded.value = true
  }
})
</script>

<style lang="postcss">
.swiper-button-prev {
  @apply size-7 bg-primary-500;
}
</style>
