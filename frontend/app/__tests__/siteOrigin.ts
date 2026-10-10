// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { shareMeta, siteOrigin } from '../helpers/site'

const CANONICAL = 'https://drupalmountaincamp.ch'

describe('siteOrigin', () => {
  it.each([
    'https://drupalmountaincamp.ch',
    'https://www.drupalmountaincamp.ch',
    'https://cfp.drupalmountaincamp.ch',
    'https://frontend.prod.drupalmountaincamp-ch.ch4.amazee.io',
    'https://frontend.internal:3000',
  ])('answers production requests on %s with the apex origin', (origin) => {
    expect(siteOrigin('production', origin)).toBe(CANONICAL)
  })

  it.each([undefined, 'development'])(
    'keeps the request origin when the environment type is %s',
    (environmentType) => {
      expect(
        siteOrigin(environmentType, 'https://mountaincamp.ddev.site'),
      ).toBe('https://mountaincamp.ddev.site')
      expect(siteOrigin(environmentType, 'https://localhost:3015')).toBe(
        'https://localhost:3015',
      )
    },
  )

  it('treats a production hostname as production without the environment type', () => {
    expect(siteOrigin(undefined, 'https://www.drupalmountaincamp.ch')).toBe(
      CANONICAL,
    )
    expect(
      siteOrigin(undefined, 'https://cfp.drupalmountaincamp.ch:8443'),
    ).toBe(CANONICAL)
  })

  it('does not match lookalike hosts', () => {
    expect(
      siteOrigin(undefined, 'https://drupalmountaincamp.ch.evil.example'),
    ).toBe('https://drupalmountaincamp.ch.evil.example')
  })
})

describe('shareMeta', () => {
  const meta = shareMeta({
    origin: CANONICAL,
    url: `${CANONICAL}/news?page=2`,
    title: 'News – Page 2',
    description: 'News and updates',
  })

  it('carries the Open Graph and Twitter card values Drupal sends for nodes', () => {
    expect(meta).toEqual({
      ogSiteName: 'Mountain Camp',
      ogType: 'website',
      ogUrl: `${CANONICAL}/news?page=2`,
      ogTitle: 'News – Page 2',
      ogDescription: 'News and updates',
      ogImage: `${CANONICAL}/images/mountain-camp-og-1200x630.jpg`,
      twitterCard: 'summary_large_image',
    })
  })

  it('builds the image on the given origin, never a request host', () => {
    const local = shareMeta({
      origin: 'https://mountaincamp.ddev.site',
      url: 'https://mountaincamp.ddev.site/news',
      title: 'News',
      description: '',
    })
    expect(local.ogImage).toBe(
      'https://mountaincamp.ddev.site/images/mountain-camp-og-1200x630.jpg',
    )
  })
})
