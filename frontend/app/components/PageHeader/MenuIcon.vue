<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="size-6 overflow-visible text-primary-500"
    aria-hidden
  >
    <rect
      width="22"
      height="2"
      rx="2"
      x="2"
      y="4"
      fill="currentColor"
      stroke-width="0"
      transform-origin="12.5 5"
      :class="{
        'close-icon-top-forwards': isInClosableState,
        'close-icon-top-backwards': !isInClosableState,
      }"
    />
    <rect
      width="22"
      height="2"
      rx="2"
      x="2"
      y="11"
      fill="currentColor"
      stroke-width="0"
      transform-origin="12.5 12"
      :class="{
        'close-icon-center-forwards': isInClosableState,
        'close-icon-center-backwards': !isInClosableState,
      }"
    />
    <rect
      width="22"
      height="2"
      rx="2"
      x="2"
      y="18"
      fill="currentColor"
      stroke-width="0"
      transform-origin="12.5 19"
      :class="{
        'close-icon-bottom-forwards': isInClosableState,
        'close-icon-bottom-backwards': !isInClosableState,
      }"
    />
  </svg>
</template>

<script lang="ts" setup>
defineProps<{
  isInClosableState: boolean
}>()
</script>

<style lang="postcss">
@keyframes closeIconTop {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(0, 7px) rotate(0deg);
  }
  100% {
    transform: translate(0, 7px) rotate(45deg);
  }
}

@keyframes closeIconCenter {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes closeIconBottom {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  50% {
    transform: translate(0, -7px) rotate(0deg);
  }
  100% {
    transform: translate(0, -7px) rotate(-45deg);
  }
}

@keyframes closeIconTopReverse {
  0% {
    transform: translate(0, 7px) rotate(45deg);
  }
  50% {
    transform: translate(0, 7px) rotate(0deg);
  }
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
}

@keyframes closeIconCenterReverse {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes closeIconBottomReverse {
  0% {
    transform: translate(0, -7px) rotate(-45deg);
  }
  50% {
    transform: translate(0, -7px) rotate(0deg);
  }
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
}

.close-icon-top-forwards {
  animation-name: closeIconTop;
  animation-fill-mode: forwards;
  animation-duration: 250ms;
}

.close-icon-top-backwards {
  transform: translate(0, 0) rotate(0deg);
  animation-name: closeIconTopReverse;
  animation-fill-mode: forwards;
  animation-duration: 250ms;
}

.close-icon-bottom-forwards {
  animation-name: closeIconBottom;
  animation-fill-mode: forwards;
  animation-duration: 250ms;
}

.close-icon-bottom-backwards {
  transform: translate(0, 0) rotate(0deg);
  animation-name: closeIconBottomReverse;
  animation-fill-mode: forwards;
  animation-duration: 250ms;
}

.close-icon-center-forwards {
  animation-name: closeIconCenter;
  animation-fill-mode: forwards;
  animation-duration: 250ms;
}

.close-icon-center-backwards {
  opacity: 1;
  animation-name: closeIconCenterReverse;
  animation-fill-mode: forwards;
  animation-duration: 250ms;
}
</style>
