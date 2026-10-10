<template>
  <BlokkliProvider v-slot="{ entity }" v-bind="blokkliProps" :entity="props">
    <PageHero :title="entity?.title || title || ''">
      <template #title="{ titleClass }">
        <h1 v-blokkli-editable:title :class="titleClass">
          {{ entity?.title || title }}
        </h1>
      </template>
      <template v-if="lead" #lead>
        <div v-blokkli-editable:field_lead v-html="entity?.lead || lead" />
      </template>
    </PageHero>
    <div>
      <BlokkliField
        :list="paragraphs"
        name="field_paragraphs"
        :allowed-fragments="PAGE_FRAGMENTS"
        class="snow-blocks"
      />
    </div>
  </BlokkliProvider>
</template>

<script lang="ts" setup>
import type { NodePageFragment } from '#graphql-operations'
import { PAGE_FRAGMENTS } from '~/composables/pageFragments'

const props = defineProps<{
  uuid: string
  title?: string
  lead?: string
  paragraphs?: NodePageFragment['paragraphs']
  body?: string
  blokkliProps: NodePageFragment['blokkliProps']
}>()
</script>
