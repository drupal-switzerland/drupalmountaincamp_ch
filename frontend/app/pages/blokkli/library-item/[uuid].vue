<template>
  <BlokkliProvider
    v-if="data?.blokkliProps"
    v-slot="{ entity }"
    v-bind="data.blokkliProps"
    :entity="data"
  >
    <div class="container">
      <p>Administrative title</p>
      <h1 v-blokkli-editable:label>
        {{ (entity as any).libraryItemLabel || data.libraryItemLabel }}
      </h1>
    </div>
    <BlokkliField name="paragraphs" :list="data.paragraphs" />
  </BlokkliProvider>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'library',
})

const route = useRoute()

const uuid = computed<string>(() => {
  if (route.params.uuid && typeof route.params.uuid === 'string') {
    return route.params.uuid
  }

  return ''
})

const { data } = await useAsyncGraphqlQuery(
  'paragraphsLibraryItem',
  {
    id: uuid.value,
    uuid: uuid.value,
  },
  {
    transform: function (data) {
      if (data.data.byUuid && 'blokkliProps' in data.data.byUuid) {
        return data.data.byUuid
      } else if (data.data.byId && 'blokkliProps' in data.data.byId) {
        return data.data.byId
      }

      return null
    },
  },
)
await renderPageDependencies()
</script>
