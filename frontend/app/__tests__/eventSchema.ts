// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { EVENT, SITE_URL, buildEventSchema } from '../helpers/eventSchema'
import { TICKET_SHOP_URL } from '../helpers/navigation'
import { SITE_DESCRIPTION } from '../helpers/site'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ABSOLUTE_URL = /^https:\/\/[^/]+\//

describe('buildEventSchema', () => {
  const schema = buildEventSchema()

  it('is a schema.org Event with the required properties', () => {
    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('Event')
    expect(schema.name).toBe('Drupal Mountain Camp 2027')
    expect(schema.startDate).toMatch(ISO_DATE)
    expect(schema.location['@type']).toBe('Place')
    expect(schema.location.name).toBe('Davos Congress Centre')
    expect(schema.location.address).toEqual({
      '@type': 'PostalAddress',
      addressLocality: 'Davos',
      addressCountry: 'CH',
    })
  })

  it('runs from March 2 to March 4, 2027, on site', () => {
    expect(schema.startDate).toBe('2027-03-02')
    expect(schema.endDate).toBe('2027-03-04')
    expect(schema.endDate >= schema.startDate).toBe(true)
    expect(schema.eventStatus).toBe('https://schema.org/EventScheduled')
    expect(schema.eventAttendanceMode).toBe(
      'https://schema.org/OfflineEventAttendanceMode',
    )
  })

  it('uses absolute URLs on the public site', () => {
    expect(schema.url).toBe(`${SITE_URL}/`)
    expect(schema.image).toEqual([
      `${SITE_URL}/images/mountain-camp-og-1200x630.jpg`,
    ])
    expect(schema.offers).toEqual({
      '@type': 'Offer',
      url: `${SITE_URL}/tickets`,
    })
    for (const url of [schema.url, ...schema.image, schema.offers.url]) {
      expect(url).toMatch(ABSOLUTE_URL)
    }
  })

  it('names the organizer from the footer', () => {
    expect(schema.organizer).toEqual({
      '@type': 'Organization',
      name: 'Drupal Events Switzerland',
      url: `${SITE_URL}/`,
    })
  })

  it('builds from other event facts and origins', () => {
    const other = buildEventSchema(
      { ...EVENT, name: 'Other', startDate: '2028-01-01' },
      'https://example.org',
    )
    expect(other.name).toBe('Other')
    expect(other.startDate).toBe('2028-01-01')
    expect(other.offers.url).toBe('https://example.org/tickets')
  })

  it('offers tickets at the ticket shop the button uses', () => {
    const shop = buildEventSchema(EVENT, SITE_URL, TICKET_SHOP_URL)
    expect(shop.offers.url).toBe(TICKET_SHOP_URL)
  })

  it('offers tickets at an internal page on the public site', () => {
    const page = buildEventSchema(EVENT, SITE_URL, '/register')
    expect(page.offers.url).toBe(`${SITE_URL}/register`)
  })

  it('describes the event with the 2027 theme', () => {
    expect(schema.description).toBe(SITE_DESCRIPTION)
  })

  it('serialises to JSON without loss', () => {
    expect(JSON.parse(JSON.stringify(schema))).toEqual(schema)
  })
})

describe('site description', () => {
  // Search results cut descriptions at about 160 characters.
  it('fits a search result', () => {
    expect(SITE_DESCRIPTION.length).toBeLessThanOrEqual(160)
  })

  it('is the meta description of pages without their own', () => {
    const config = readFileSync(join(process.cwd(), 'nuxt.config.ts'), 'utf8')
    expect(config).toMatch(/name: 'description',\s*content: SITE_DESCRIPTION,/)
  })
})
