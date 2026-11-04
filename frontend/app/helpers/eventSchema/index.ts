import { CANONICAL_HOST } from '../../../config/publicHosts'
import { TICKETS_PATH } from '~/helpers/navigation'
import { SITE_DESCRIPTION } from '~/helpers/site'

/** Public origin for structured data, independent of the requesting host. */
export const SITE_URL = `https://${CANONICAL_HOST}`

export type EventFacts = {
  name: string
  description: string
  startDate: string
  endDate: string
  venue: string
  locality: string
  country: string
  organizer: string
  imagePath: string
}

export const EVENT: Readonly<EventFacts> = {
  name: 'Drupal Mountain Camp 2027',
  description: SITE_DESCRIPTION,
  startDate: '2027-03-02',
  endDate: '2027-03-04',
  venue: 'Davos Congress Centre',
  locality: 'Davos',
  country: 'CH',
  organizer: 'Drupal Events Switzerland',
  imagePath: '/images/mountain-camp-og-1200x630.jpg',
}

/** schema.org Event for the homepage, serialised for a JSON-LD script. */
export function buildEventSchema(
  event: EventFacts = EVENT,
  siteUrl = SITE_URL,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.locality,
        addressCountry: event.country,
      },
    },
    url: `${siteUrl}/`,
    image: [`${siteUrl}${event.imagePath}`],
    organizer: {
      '@type': 'Organization',
      name: event.organizer,
      url: `${siteUrl}/`,
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}${TICKETS_PATH}`,
    },
  }
}
