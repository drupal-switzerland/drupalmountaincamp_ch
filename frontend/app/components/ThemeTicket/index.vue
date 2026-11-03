<template>
  <div class="theme-ticket-box">
    <p class="theme-ticket">
      <span class="theme-ticket-stub">
        {{ $texts('theme.label', '2027 theme') }}<span class="sr-only">: </span>
      </span>
      <span class="theme-ticket-name">
        {{ $texts('theme.name', 'Humans with AI in the Loop') }}
      </span>
    </p>
  </div>
</template>

<script lang="ts" setup>
const { $texts } = useEasyTexts()
</script>
