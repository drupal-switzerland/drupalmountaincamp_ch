import { describe, expect, it } from 'vitest'
import { createHead as createServerHead, renderSSRHead } from 'unhead/server'
import { createHead as createClientHead, renderDOMHead } from 'unhead/client'
import type { ResolvableHead as HeadInput } from 'unhead/types'
import { registerShareTags } from '../helpers/shareTags'
import { SHARE_IMAGE_ALT, SHARE_IMAGE_PATH } from '../helpers/site'

// unhead's real head, hook and renderers: an upgrade that renames the hook,
// drops dedupeKey or stops reading a tag's _d fails here.
const DESCRIPTION = 'Page description'
const count = (html: string, attribute: string) =>
  html.split(attribute).length - 1

function renderOnServer(input: HeadInput) {
  const head = createServerHead()
  registerShareTags(head)
  head.push(input)
  return renderSSRHead(head).headTags
}

describe('share tags in a real head, rendered on the server', () => {
  it('adds og:description from the description when none is set', () => {
    const html = renderOnServer({
      meta: [{ name: 'description', content: DESCRIPTION }],
    })

    expect(count(html, 'property="og:description"')).toBe(1)
    expect(html).toContain(
      `<meta property="og:description" content="${DESCRIPTION}">`,
    )
  })

  it('keeps an og:description that is already set, still exactly one', () => {
    const html = renderOnServer({
      meta: [
        { name: 'description', content: DESCRIPTION },
        { property: 'og:description', content: 'From Drupal' },
      ],
    })

    expect(count(html, 'property="og:description"')).toBe(1)
    expect(html).toContain('content="From Drupal"')
  })

  it('describes the default share image, once', () => {
    const html = renderOnServer({
      meta: [
        { name: 'description', content: DESCRIPTION },
        {
          property: 'og:image',
          content: `https://drupalmountaincamp.ch${SHARE_IMAGE_PATH}`,
        },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    })

    expect(count(html, 'property="og:image:alt"')).toBe(1)
    expect(count(html, 'name="twitter:image:alt"')).toBe(1)
    expect(html).toContain(SHARE_IMAGE_ALT.slice(0, 40))
  })

  it("adds no alt next to a page's own image", () => {
    const html = renderOnServer({
      meta: [
        { property: 'og:image', content: 'https://example.org/own.jpg' },
        {
          property: 'og:image',
          content: `https://drupalmountaincamp.ch${SHARE_IMAGE_PATH}`,
        },
      ],
    })

    expect(count(html, 'og:image:alt')).toBe(0)
  })
})

describe('share tags in the browser, over server-rendered markup', () => {
  const inDom = (selector: string) =>
    document.head.querySelectorAll(selector).length

  it('reuses the server-rendered tags and drops them when a page changes', () => {
    const input: HeadInput = {
      meta: [
        { name: 'description', content: DESCRIPTION },
        { property: 'og:image', content: SHARE_IMAGE_PATH },
      ],
    }
    document.head.innerHTML = renderOnServer(input)
    expect(inDom('meta[property="og:description"]')).toBe(1)
    expect(inDom('meta[property="og:image:alt"]')).toBe(1)

    const head = createClientHead()
    registerShareTags(head)
    const entry = head.push(input)
    renderDOMHead(head)

    // Hydration: no second copy of either tag.
    expect(inDom('meta[property="og:description"]')).toBe(1)
    expect(inDom('meta[property="og:image:alt"]')).toBe(1)

    // The next page has its own og:description and no share image.
    entry.patch({
      meta: [
        { name: 'description', content: 'Other page' },
        { property: 'og:description', content: 'From Drupal' },
      ],
    })
    renderDOMHead(head)

    expect(inDom('meta[property="og:description"]')).toBe(1)
    expect(
      document.head
        .querySelector('meta[property="og:description"]')
        ?.getAttribute('content'),
    ).toBe('From Drupal')
    expect(inDom('meta[property="og:image:alt"]')).toBe(0)
  })
})
