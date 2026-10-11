// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ogDescriptionFallback, shareImageAltTags } from '../helpers/shareTags'

const meta = (props: Record<string, string>) => ({ tag: 'meta', props })
const description = meta({ name: 'description', content: 'Page description' })
const ogTitle = meta({ property: 'og:title', content: 'Title' })

describe('ogDescriptionFallback', () => {
  it('gives the page description when Drupal sent no og:description', () => {
    expect(ogDescriptionFallback([ogTitle, description])).toEqual(
      meta({ property: 'og:description', content: 'Page description' }),
    )
  })

  it('gives nothing when an og:description is already there', () => {
    const fromDrupal = meta({
      property: 'og:description',
      content: 'From Drupal',
    })
    expect(ogDescriptionFallback([description, fromDrupal])).toBeUndefined()
  })

  it('leaves the head with exactly one og:description either way', () => {
    const count = (tags: { props: Record<string, string> }[]) =>
      tags.filter((tag) => tag.props.property === 'og:description').length
    const fromDrupal = meta({ property: 'og:description', content: 'Drupal' })

    for (const tags of [[description], [description, fromDrupal]]) {
      const fallback = ogDescriptionFallback(tags)
      expect(count(fallback ? [...tags, fallback] : tags)).toBe(1)
    }
  })

  it.each([
    ['no description at all', [ogTitle]],
    ['an empty description', [meta({ name: 'description', content: '' })]],
    ['a blank description', [meta({ name: 'description', content: '  ' })]],
  ])('gives nothing with %s', (_label, tags) => {
    expect(ogDescriptionFallback(tags)).toBeUndefined()
  })

  it('ignores other tags that carry a name or property', () => {
    const tags = [
      { tag: 'link', props: { name: 'description', content: 'not meta' } },
      meta({ name: 'twitter:description', content: 'other' }),
    ]
    expect(ogDescriptionFallback(tags)).toBeUndefined()
  })
})

describe('shareImageAltTags', () => {
  const PATH = '/images/share.jpg'
  const ALT = 'What the default share image shows'
  const image = (url: string) => meta({ property: 'og:image', content: url })
  const twitterCard = meta({
    name: 'twitter:card',
    content: 'summary_large_image',
  })
  const ogAlt = meta({ property: 'og:image:alt', content: ALT })
  const twitterAlt = meta({ name: 'twitter:image:alt', content: ALT })
  const alts = (tags: { tag: string; props: Record<string, string> }[]) =>
    shareImageAltTags(tags, PATH, ALT)

  it('describes the default share image, whatever host its URL has', () => {
    expect(alts([image(`https://drupalmountaincamp.ch${PATH}`)])).toEqual([
      ogAlt,
    ])
    expect(alts([image(`https://internal.example${PATH}?v=2`)])).toEqual([
      ogAlt,
    ])
    expect(alts([image(PATH)])).toEqual([ogAlt])
  })

  it('adds the Twitter alt only when the page sends Twitter tags', () => {
    expect(alts([image(PATH), twitterCard])).toEqual([ogAlt, twitterAlt])
  })

  it("gives nothing for a page's own image", () => {
    expect(
      alts([image('https://drupalmountaincamp.ch/files/own.jpg'), twitterCard]),
    ).toEqual([])
  })

  it('gives nothing when an own image comes with the default as a second one', () => {
    expect(
      alts([
        image('https://drupalmountaincamp.ch/files/own.jpg'),
        image(`https://drupalmountaincamp.ch${PATH}`),
      ]),
    ).toEqual([])
  })

  it('gives nothing without an og:image', () => {
    expect(alts([twitterCard])).toEqual([])
  })

  it('keeps alts that are already there, so each stays single', () => {
    const drupalAlt = meta({ property: 'og:image:alt', content: 'Drupal' })
    expect(alts([image(PATH), drupalAlt, twitterCard])).toEqual([twitterAlt])
    expect(alts([image(PATH), ogAlt, twitterCard, twitterAlt])).toEqual([])
  })

  it('leaves exactly one og:image:alt in the head', () => {
    const tags = [image(PATH), twitterCard]
    const all = [...tags, ...alts(tags)]
    expect(
      all.filter((tag) => tag.props.property === 'og:image:alt'),
    ).toHaveLength(1)
    expect(alts(all)).toEqual([])
  })
})
