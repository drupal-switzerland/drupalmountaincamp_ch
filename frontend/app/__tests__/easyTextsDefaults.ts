// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseDefaultTexts } from '../helpers/easyTextsDefaults'

const translationsQuery = readFileSync(
  new URL('../queries/translations.graphql', import.meta.url),
  'utf8',
)

describe('parseDefaultTexts', () => {
  it('reads keys with and without a context, and escaped quotes', () => {
    const query = `fragment easyTexts on TextsLoader {
  edition__title: getText(key: "title", context: "edition", default: "Join us")
  menu: getText(key: "menu", default: "Menu")
  quote__text: getText(key: "text", context: "quote", default: "Say \\"hi\\"")
}`
    expect(parseDefaultTexts(query)).toEqual({
      'edition.title': 'Join us',
      menu: 'Menu',
      'quote.text': 'Say "hi"',
    })
  })

  it('finds every text in the generated translations query', () => {
    const lines = translationsQuery.match(/getText\(/g)?.length ?? 0
    const texts = parseDefaultTexts(translationsQuery)

    expect(Object.keys(texts)).toHaveLength(lines)
    expect(texts['error.title']).toBe('Something went wrong')
  })
})
