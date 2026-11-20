// Drupal names its session cookie "SESS" (plain HTTP) or "SSESS" (HTTPS)
// followed by a hash (core's SessionConfiguration::getName). Matched as a
// cookie name, at the start of the header or after a ";", and loosely on the
// hash: a false "has session" only costs a cache miss, a false "no session"
// could cache a logged-in response.
const SESSION_COOKIE_NAME = /(?:^|;)\s*S?SESS[0-9a-z]+\s*=/i

/** Whether a Cookie request header carries a Drupal session cookie. */
export function hasDrupalSessionCookie(
  cookieHeader: string | string[] | undefined | null,
): boolean {
  const header = Array.isArray(cookieHeader)
    ? cookieHeader.join('; ')
    : cookieHeader
  return !!header && SESSION_COOKIE_NAME.test(header)
}
