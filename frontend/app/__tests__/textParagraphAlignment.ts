import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import TextParagraph from '../components/Paragraph/Text/index.vue'

const { block } = vi.hoisted(() => ({
  block: { alignment: 'left', parentType: undefined as string | undefined },
}))

mockNuxtImport('defineBlokkli', () => () => ({
  options: ref({
    width: 'text',
    background: 'none',
    alignment: block.alignment,
    spacing: 'none',
  }),
  parentType: ref(block.parentType),
}))

// Table handling is not under test and needs document.fonts.
mockNuxtImport('useScrollableTables', () => () => {})

async function contentClasses(alignment: string, parentType?: string) {
  block.alignment = alignment
  block.parentType = parentType
  const wrapper = await mountSuspended(TextParagraph, {
    props: { text: '<h2>Title</h2><p>Text</p>' },
  })
  return wrapper.get('.ck-content').classes()
}

// ck-content.css centres the line-length-capped paragraphs on this class.
describe('text paragraph alignment', () => {
  it('marks centred text so its capped paragraphs centre too', async () => {
    expect(await contentClasses('center')).toEqual(
      expect.arrayContaining(['is-centered', 'text-center']),
    )
  })

  it('leaves left-aligned text unmarked', async () => {
    const classes = await contentClasses('left')

    expect(classes).not.toContain('is-centered')
    expect(classes).not.toContain('text-center')
  })

  it('ignores the alignment of a nested paragraph', async () => {
    expect(await contentClasses('center', 'accordeon')).not.toContain(
      'is-centered',
    )
  })
})
