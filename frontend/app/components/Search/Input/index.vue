<template>
  <label for="searchterm" class="sr-only">
    {{ $texts('search.searchFieldLabel', 'Suchbegriff') }}
  </label>
  <div v-click-away="clickAway" class="relative" role="search">
    <input
      id="searchInput"
      ref="input"
      v-model="searchTermInternal"
      type="search"
      autocomplete="off"
      name="searchterm"
      class="block w-full rounded-lg border-2 border-primary-300 bg-gray-50 p-5 pr-20 text-sm text-gray-900 focus:border-primary-400 focus:outline-none md:pr-40"
      spellcheck="false"
      role="searchbox"
      aria-owns="searchterm-suggestions"
      aria-label="Search input"
      :placeholder="
        $texts('search.searchFieldPlaceholder', 'Suchbegriff eingeben')
      "
      @focus="isFocused = true"
      @search="updateSearchTerm"
    />

    <button
      type="submit"
      class="button is-icon-only md:has-icon absolute bottom-[7px] right-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 focus:bg-primary-600 focus:outline-none active:text-white"
      aria-label="Search"
      @click.prevent="updateSearchTerm"
    >
      <SpriteSymbol name="magnifyingglass" />
      <span class="sr-only md:not-sr-only">
        {{ $texts('search.ctaButton', 'Suchen') }}
      </span>
    </button>
  </div>
</template>

<script lang="ts" setup>
type SearchResult = {
  id: string
  title: string
  url: string
}

const props = defineProps<{
  modelValue?: string | null
  results?: SearchResult[]
  disableSuggestions?: boolean
  getSuggestions?: (term: string) => Promise<string[]>
}>()

const searchTermInternal = ref('')
const isFocused = ref(false)
const input = ref<HTMLInputElement | null>(null)
const { $texts } = useNuxtApp()

const emit = defineEmits(['update:modelValue'])

watch(
  () => props.modelValue,
  function (newValue) {
    searchTermInternal.value = newValue || ''
  },
)

function updateSearchTerm() {
  emit('update:modelValue', searchTermInternal.value)
}

function clickAway() {
  isFocused.value = false
}

onMounted(() => {
  searchTermInternal.value = props.modelValue || ''
})
</script>
