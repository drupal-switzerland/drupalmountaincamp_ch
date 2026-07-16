<template>
  <BlokkliProvider v-slot="{ entity }" v-bind="blokkliProps" :entity="props">
    <Container>
      <h1 v-blokkli-editable:title class="pb-3 text-4xl lg:pb-6 lg:text-7xl">
        {{ entity?.title || title }}
      </h1>
    </Container>
    <div v-if="lead" class="grid-container">
      <div class="grid-container-8 pb-10">
        <div
          v-blokkli-editable:field_lead
          class="text-xl md:text-2xl"
          v-html="entity?.lead || lead"
        />
      </div>
    </div>
    <div>
      <BlokkliField :list="paragraphs" name="field_paragraphs" />
    </div>
  </BlokkliProvider>
</template>

<script lang="ts" setup>
import type { NodePageFragment } from '#graphql-operations'

const props = defineProps<{
  uuid: string
  title?: string
  lead?: string
  paragraphs?: NodePageFragment['paragraphs']
  body?: string
  blokkliProps: NodePageFragment['blokkliProps']
}>()
</script>
