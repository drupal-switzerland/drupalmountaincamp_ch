/**
 * This composable is used to get the hostname of the request.
 * Because we only have a single nuxt instance and a reverse proxy in front of it,
 * we can't rely on the `host` header to get the hostname.
 */
export function useHostName(): string {
  const url = useRequestURL()
  let host: string = url.hostname

  if (import.meta.server) {
    // eslint-disable-next-line sonarjs/no-duplicate-string
    const headers = useRequestHeaders(['x-forwarded-host'])

    if (headers['x-forwarded-host']) {
      const value = headers['x-forwarded-host']
      host = Array.isArray(value) ? value[0] : value
    }
    // Pick the first value of the comma separated string
    // if multiple values are provided.
    if (host.includes(',')) {
      host = host.split(',')[0] ?? host
    }
  }

  return host
}
