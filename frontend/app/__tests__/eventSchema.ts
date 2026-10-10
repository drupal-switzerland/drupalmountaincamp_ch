// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { EVENT, SITE_URL, buildEventSchema } from '../helpers/eventSchema'

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

  it('serialises to JSON without loss', () => {
    expect(JSON.parse(JSON.stringify(schema))).toEqual(schema)
  })
})
