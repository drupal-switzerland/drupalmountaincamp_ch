import {
  CANONICAL_HOST,
  PRODUCTION_ENVIRONMENT_TYPE,
  PRODUCTION_HOSTS,
} from '../../../config/publicHosts'

export const SITE_TITLE = 'Mountain Camp 2027, Davos, Switzerland'

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
