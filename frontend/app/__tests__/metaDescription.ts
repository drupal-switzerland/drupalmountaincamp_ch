// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  META_DESCRIPTION_MAX_LENGTH,
  descriptionFromParagraphs,
  hasMetaDescription,
  htmlToPlainText,
  truncateAtWord,
} from '../helpers/metaDescription'
import { SITE_DESCRIPTION } from '../helpers/site'

const text = (html: string) => ({ props: { text: html } })
const LONG_BODY = `<p>${'Mountain Camp gathered the Swiss Drupal community in Davos. '.repeat(5)}</p>`

describe('htmlToPlainText', () => {
  it('drops tags, decodes entities and collapses whitespace', () => {
    expect(
      htmlToPlainText(
        '<p>Fondue &amp; <strong>Drupal</strong></p>\n<p>in&nbsp;Davos &#8211; 2019</p>',
      ),
    ).toBe('Fondue & Drupal in Davos – 2019')
  })
})

describe('truncateAtWord', () => {
  it('keeps short text as it is', () => {
    expect(truncateAtWord('Short text.')).toBe('Short text.')
  })

  it('cuts long text at a word boundary within the limit', () => {
    const result = truncateAtWord(htmlToPlainText(LONG_BODY))
    expect(result.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX_LENGTH)
    expect(result).toMatch(/[a-z]…$/)
    expect(htmlToPlainText(LONG_BODY)).toContain(result.slice(0, -1))
  })
})

describe('descriptionFromParagraphs', () => {
  it('uses the first paragraph that has text', () => {
    expect(
      descriptionFromParagraphs([
        { props: {} },
        text('<p> </p>'),
        text('<p>First words.</p>'),
        text('<p>Later words.</p>'),
      ]),
    ).toBe('First words.')
  })

  it('gives nothing without text, never the site default', () => {
    expect(descriptionFromParagraphs([{ props: null }])).toBeUndefined()
    expect(descriptionFromParagraphs(undefined)).toBeUndefined()
    expect(descriptionFromParagraphs([text(LONG_BODY)])).not.toBe(
      SITE_DESCRIPTION,
    )
  })
})

describe('hasMetaDescription', () => {
  it('finds a description with content only', () => {
    expect(hasMetaDescription([{ name: 'description', content: 'Lead' }])).toBe(
      true,
    )
    expect(hasMetaDescription([{ name: 'description', content: ' ' }])).toBe(
      false,
    )
    expect(hasMetaDescription([{ property: 'og:title', content: 'T' }])).toBe(
      false,
    )
  })
})
