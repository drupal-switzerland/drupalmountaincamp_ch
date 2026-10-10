import {
  CANONICAL_HOST,
  PRODUCTION_ENVIRONMENT_TYPE,
  PRODUCTION_HOSTS,
} from '../../config/publicHosts'

const HTTPS_PORT = '443'

function normaliseHost(forwardedHost: string | undefined): string {
  // A proxy chain can send "a, b"; the first entry is the client-facing host.
  const first = forwardedHost?.split(',')[0] ?? ''
  return first.trim().toLowerCase().replace(/:\d+$/, '')
}

/**
 * Drupal builds absolute URLs (canonical, og:url, image derivatives) from the
 * forwarded host and caches them for every host. On production only the
 * site's own hosts are passed on; any other host, such as Lagoon's internal
 * route, is replaced by the canonical host. Other environments are unchanged.
 */
export function withTrustedForwardedHost(
  headers: Record<string, string>,
  environmentType: string | undefined,
): Record<string, string> {
  if (environmentType !== PRODUCTION_ENVIRONMENT_TYPE) {
    return headers
  }
  const host = normaliseHost(headers['x-forwarded-host'])
  if ((PRODUCTION_HOSTS as readonly string[]).includes(host)) {
    return headers
  }
  return {
    ...headers,
    'x-forwarded-host': CANONICAL_HOST,
    'x-forwarded-proto': 'https',
    'x-forwarded-port': HTTPS_PORT,
  }
}
