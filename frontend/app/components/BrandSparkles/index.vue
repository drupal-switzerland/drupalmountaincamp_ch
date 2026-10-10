<template>
  <svg viewBox="0 0 104 64" aria-hidden="true" focusable="false">
    <g fill="currentColor">
      <path
        v-for="[x, y] in positions"
        :key="`${x}-${y}`"
        :d="`M${x - 2} ${y - 7} h4 v5 h5 v4 h-5 v5 h-4 v-5 h-5 v-4 h5 z`"
      />
    </g>
  </svg>
</template>

<script lang="ts" setup>
// Cluster of Swiss-cross "+" marks from the style guide's slide deck.
const positions: [number, number][] = [
  [14, 30],
  [34, 12],
  [48, 38],
  [70, 20],
  [88, 44],
  [30, 54],
]
</script>

<style lang="postcss">
/* The box for the marks beside a hero title. With large text the title needs
   the row; the box then gets what is left, the marks shrink with it, and
   below 32px they disappear instead of showing as a sliver. A percentage
   max-width resolves against the box, so the product is either 0 or far more
   than the box is wide. */
.page-marks-box {
  min-width: 0;
  flex-shrink: 1;

  & > * {
    max-width: max(0px, calc((100% - 32px) * 9999));
  }
}
</style>
