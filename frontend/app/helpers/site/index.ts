import {
  CANONICAL_HOST,
  PRODUCTION_ENVIRONMENT_TYPE,
  PRODUCTION_HOSTS,
} from '../../../config/publicHosts'

export const SITE_TITLE = 'Mountain Camp 2027, Davos, Switzerland'
/** Same value as Drupal's site name, which its og:site_name uses. */
export const SITE_NAME = 'Mountain Camp'
/** Fallback share image, the one Drupal's metatag defaults point to. */
export const SHARE_IMAGE_PATH = '/images/mountain-camp-og-1200x630.jpg'
/** What the default share image shows, for og:image:alt. The owner's wording. */
export const SHARE_IMAGE_ALT =
  'Mountain Camp 10 year edition invites you to Davos on 2 to 4 March 2027. Memorable: survive a sledding night in the Swiss Alps. Transformative: an environment curated to spark transformative conversations. Gathering: a community of givers together at the top. Snowy mountain peaks on a blue background.'

/**
 * Origin for absolute URLs in the page head. Production always answers with
 * the canonical host, whichever host the request came in on (www, cfp or
 * Lagoon's internal route); other environments keep their own origin. The
 * environment type is only known on the server, so a production hostname
 * counts as production too.
 */
export function siteOrigin(
  environmentType: string | undefined,
  requestOrigin: string,
): string {
  const isProduction =
    environmentType === PRODUCTION_ENVIRONMENT_TYPE ||
    (PRODUCTION_HOSTS as readonly string[]).includes(
      new URL(requestOrigin).hostname,
    )
  return isProduction ? `https://${CANONICAL_HOST}` : requestOrigin
}

type ShareMetaInput = {
  /** From siteOrigin(), never the request host. */
  origin: string
  /** Absolute canonical URL of the page. */
  url: string
  title: string
  description: string
}

/**
 * Open Graph and Twitter card values for a page that has no Drupal metatags
 * of its own, matching what Drupal sends for nodes.
 */
export function shareMeta(input: ShareMetaInput) {
  return {
    ogSiteName: SITE_NAME,
    ogType: 'website' as const,
    ogUrl: input.url,
    ogTitle: input.title,
    ogDescription: input.description,
    ogImage: new URL(SHARE_IMAGE_PATH, input.origin).href,
    twitterCard: 'summary_large_image' as const,
  }
}
