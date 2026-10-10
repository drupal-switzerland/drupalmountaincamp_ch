import type { H3Event } from 'h3'

// The module does not export its helper, so it is loaded from its build output.
const { NuxtMultiCacheCDNHelper } =
  await import('../../../node_modules/nuxt-multi-cache/dist/runtime/helpers/CDNHelper.js')

type Helper = InstanceType<typeof NuxtMultiCacheCDNHelper>
type CdnEvent = H3Event & { context: { cdn?: Helper } }

/**
 * useCDNHeaders with nuxt-multi-cache's real helper, kept per request and
 * written to the response as the module does on the server (its own
 * implementation is switched off in the build vitest runs). Not a recorder:
 * the helper has state (once private, it stays private), and the header it
 * writes is what the CDN reads.
 */
export function useRealCdnHeaders(
  configure: (helper: Helper) => void,
  event: H3Event,
) {
  const cdnEvent = event as CdnEvent
  cdnEvent.context.cdn ||= new NuxtMultiCacheCDNHelper(
    Math.floor(Date.now() / 1000),
    'CDN-Cache-Control',
    'Cache-Tag',
  )
  configure(cdnEvent.context.cdn)
  cdnEvent.context.cdn.applyToEvent(event)
}

/** A response that records the headers set on it, by lower-cased name. */
export function createResponseRecorder() {
  const headers = new Map<string, unknown>()
  const res = {
    statusCode: 200,
    getHeader: (name: string) => headers.get(name.toLowerCase()),
    setHeader: (name: string, value: unknown) =>
      headers.set(name.toLowerCase(), value),
  }
  return { res, headers }
}

/** The directives of the CDN-Cache-Control header a response carries. */
export function cdnDirectives(headers: Map<string, unknown>) {
  return String(headers.get('cdn-cache-control') ?? '')
    .split(',')
    .map((directive) => directive.trim())
    .filter(Boolean)
    .sort()
}
