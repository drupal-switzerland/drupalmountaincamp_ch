<template>
  <div class="pointer-events-none" aria-hidden="true">
    <svg
      v-for="crop in crops"
      :key="crop.key"
      :viewBox="RIDGE_VIEWBOX"
      :preserveAspectRatio="crop.aspect"
      :class="crop.class"
      class="w-full"
      focusable="false"
    >
      <defs>
        <clipPath :id="refId(crop.key, 'outline')">
          <path :d="RIDGE_OUTLINE" />
        </clipPath>
        <linearGradient
          :id="refId(crop.key, 'body')"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="170"
          x2="0"
          y2="450"
        >
          <stop offset="0" :stop-color="RIDGE_COLORS.bodyTop" />
          <stop offset="1" :stop-color="RIDGE_COLORS.bodyBottom" />
        </linearGradient>
        <linearGradient
          :id="refId(crop.key, 'face')"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0" :stop-color="RIDGE_COLORS.face" />
          <stop offset=".4" :stop-color="RIDGE_COLORS.face" stop-opacity="0" />
        </linearGradient>
        <clipPath
          v-for="(cap, i) in RIDGE_CAPS"
          :id="refId(crop.key, `cap-${i}`)"
          :key="i"
        >
          <polygon :points="cap" />
        </clipPath>
      </defs>
      <g :transform="mirrored ? MIRROR : undefined">
        <path :d="RIDGE_OUTLINE" :fill="url(crop.key, 'body')" />
        <g :clip-path="url(crop.key, 'outline')">
          <polygon
            v-for="(face, i) in RIDGE_FACES"
            :key="`face-${i}`"
            :points="face"
            :fill="url(crop.key, 'face')"
          />
          <polygon
            v-for="(glint, i) in RIDGE_GLINTS"
            :key="`glint-${i}`"
            :points="glint"
            :fill="RIDGE_COLORS.snow"
            fill-opacity=".85"
          />
          <polygon
            v-for="(cap, i) in RIDGE_CAPS"
            :key="`cap-${i}`"
            :points="cap"
            :fill="RIDGE_COLORS.snow"
          />
          <polygon
            v-for="(shade, i) in RIDGE_CAP_SHADES"
            :key="`shade-${i}`"
            :points="shade"
            :clip-path="url(crop.key, `cap-${i}`)"
            :fill="RIDGE_COLORS.capShade"
          />
        </g>
        <path
          :d="RIDGE_OUTLINE"
          fill="none"
          :stroke="RIDGE_COLORS.snow"
          stroke-width="10"
          stroke-linejoin="round"
        />
      </g>
    </svg>
  </div>
</template>

<script lang="ts" setup>
import {
  RIDGE_CAPS,
  RIDGE_CAP_SHADES,
  RIDGE_COLORS,
  RIDGE_FACES,
  RIDGE_GLINTS,
  RIDGE_OUTLINE,
  RIDGE_VIEWBOX,
} from '~/helpers/ridge'

const props = defineProps<{
  /** Puts the tall peak on the right instead of the left. */
  mirrored?: boolean
}>()

const MIRROR = 'translate(1920,0) scale(-1,1)'
// SVG ids must be unique per instance and safe inside url(#…).
const uid = useId().replace(/[^a-zA-Z0-9-]/g, '-')

// Wide screens show the whole range; phones crop a taller slice around the
// tall peak so it doesn't shrink to a sliver.
const crops = computed(() => [
  {
    key: 'wide',
    aspect: 'xMidYMid meet',
    class: 'hidden h-auto xs:block',
  },
  {
    key: 'narrow',
    aspect: props.mirrored ? 'xMaxYMax slice' : 'xMinYMax slice',
    class: 'block h-[72px] xs:hidden',
  },
])

function refId(crop: string, part: string) {
  return `${uid}-${crop}-${part}`
}

function url(crop: string, part: string) {
  return `url(#${refId(crop, part)})`
}
</script>
