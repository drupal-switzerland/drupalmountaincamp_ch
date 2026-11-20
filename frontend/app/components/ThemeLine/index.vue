<template>
  <p class="theme-line">
    <span class="sr-only">{{ $texts('theme.label', '2027 theme') }}: </span>
    {{ $texts('theme.name', 'Humans with AI in the Loop') }}
  </p>
</template>

<script lang="ts" setup>
const { $texts } = useEasyTexts()
</script>
