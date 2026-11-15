const UPPERCASE_OR_ESCAPE = /%[0-9A-Fa-f]{2}|[A-Z]+/g

/** Lower-cases the letters of a path, leaving percent-escapes such as %C3 as they are. */
export function lowercasePath(path: string): string {
  return path.replace(UPPERCASE_OR_ESCAPE, (match) =>
    match.startsWith('%') ? match : match.toLowerCase(),
  )
}

/**
 * The router and Drupal's alias lookup both ignore case, so /News would render
 * /news under a second URL with its own canonical. Redirect to the lowercase
 * path; the target has no uppercase letters, so it never redirects again.
 */
export default defineNuxtRouteMiddleware((to) => {
  const path = lowercasePath(to.path)
  if (path !== to.path) {
    return navigateTo(
      { path, query: to.query, hash: to.hash },
      { redirectCode: 301 },
    )
  }
})
