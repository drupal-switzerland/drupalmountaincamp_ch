<template>
  <NuxtLayout>
    <div class="container flex flex-col items-start gap-5 py-16 lg:py-24">
      <p class="label">{{ $texts('error.code', 'Error') }} {{ statusCode }}</p>
      <h1 class="text-4xl md:text-6xl">{{ title }}</h1>
      <p class="max-w-2xl text-lg md:text-xl">{{ text }}</p>
      <a href="/" class="button is-filled" @click.prevent="goHome">
        {{ $texts('error.home', 'Go back home') }}
      </a>
    </div>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import type { NuxtError } from '#app'

// Error pages render outside <NuxtPage>, so the template opts into the layout
// itself; without <NuxtLayout> a 404 or 500 has no header, menu or footer.
const props = defineProps<{
  error: NuxtError
}>()

const { $texts } = useEasyTexts()

const statusCode = computed(() => props.error.statusCode || 500)
const isNotFound = computed(() => statusCode.value === 404)

// The error's own message can carry internals, so visitors get fixed copy.
const title = computed(() =>
  isNotFound.value
    ? $texts('error.notFoundTitle', 'Page not found')
    : $texts('error.title', 'Something went wrong'),
)
const text = computed(() =>
  isNotFound.value
    ? $texts(
        'error.notFoundText',
        'This page does not exist or has moved. The menu above and the homepage can help you find what you were looking for.',
      )
    : $texts(
        'error.text',
        'The page could not be loaded. Please try again in a moment.',
      ),
)

useHead({ title })

function goHome() {
  clearError({ redirect: '/' })
}
</script>
